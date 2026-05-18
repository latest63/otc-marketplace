import { Router } from 'express';
import { pool } from '../db/pool.js';
import { getSphere } from '../sphere.js';

export const router = Router();

// GET / — list active listings with optional filters
router.get('/', async (req, res, next) => {
  try {
    const { category, q, min, max, seller } = req.query;
    const conditions = ["l.status = 'active'"];
    const params = [];
    let idx = 1;

    if (category) {
      conditions.push(`l.category_slug = $${idx++}`);
      params.push(category);
    }
    if (seller) {
      conditions.push(`l.seller_nametag = $${idx++}`);
      params.push(seller);
    }
    if (q) {
      conditions.push(`(l.title ILIKE $${idx} OR l.description ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }
    if (min) {
      conditions.push(`l.price_amount >= $${idx++}`);
      params.push(min);
    }
    if (max) {
      conditions.push(`l.price_amount <= $${idx++}`);
      params.push(max);
    }

    const sql = `
      SELECT l.id, l.seller_nametag, l.title, l.description,
             l.price_amount, l.price_coin, l.created_at,
             c.label AS category
      FROM listings l
      JOIN categories c ON c.slug = l.category_slug
      WHERE ${conditions.join(' AND ')}
      ORDER BY l.created_at DESC
    `;

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /:id — single listing
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT l.*, c.label AS category
       FROM listings l
       JOIN categories c ON c.slug = l.category_slug
       WHERE l.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Listing not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST / — create listing (auto-resolve pubkey from nametag)
router.post('/', async (req, res, next) => {
  try {
    const { seller_nametag, title, description, category_slug, price_amount, price_coin } = req.body;
    if (!seller_nametag || !title || !category_slug || !price_amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Resolve nametag to get pubkey
    const sphere = getSphere();
    let seller_pubkey = '';

    if (sphere) {
      try {
        const peer = await sphere.resolve(seller_nametag);
        if (peer && peer.chainPubkey) {
          seller_pubkey = peer.chainPubkey;
        }
      } catch (resolveErr) {
        console.warn(`Could not resolve ${seller_nametag}:`, resolveErr.message);
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO listings (seller_nametag, seller_pubkey, category_slug, title, description, price_amount, price_coin)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [seller_nametag, seller_pubkey, category_slug, title, description || '', price_amount, price_coin || 'UCT']
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) { next(err); }
});

// PUT /:id — edit (owner verified via resolved pubkey)
router.put('/:id', async (req, res, next) => {
  try {
    const { seller_nametag, title, description, category_slug, price_amount, price_coin } = req.body;
    if (!seller_nametag) return res.status(400).json({ error: 'seller_nametag required' });

    const listing = await pool.query('SELECT seller_nametag FROM listings WHERE id=$1', [req.params.id]);
    if (!listing.rows.length) return res.status(404).json({ error: 'Not found' });

    if (listing.rows[0].seller_nametag !== seller_nametag) {
      return res.status(403).json({ error: 'Not your listing' });
    }

    await pool.query(
      `UPDATE listings SET title=COALESCE($1,title), description=COALESCE($2,description),
       category_slug=COALESCE($3,category_slug), price_amount=COALESCE($4,price_amount),
       price_coin=COALESCE($5,price_coin), updated_at=now() WHERE id=$6`,
      [title, description, category_slug, price_amount, price_coin, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// DELETE /:id — cancel listing (owner verified via nametag)
router.delete('/:id', async (req, res, next) => {
  try {
    const { seller_nametag } = req.body;
    if (!seller_nametag) return res.status(400).json({ error: 'seller_nametag required' });

    const listing = await pool.query('SELECT seller_nametag, status FROM listings WHERE id=$1', [req.params.id]);
    if (!listing.rows.length) return res.status(404).json({ error: 'Not found' });
    if (listing.rows[0].seller_nametag !== seller_nametag) {
      return res.status(403).json({ error: 'Not your listing' });
    }
    if (listing.rows[0].status !== 'active') {
      return res.status(400).json({ error: 'Can only cancel active listings' });
    }
    await pool.query("UPDATE listings SET status='cancelled', updated_at=now() WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// POST /:id/buy — initiate purchase via Sphere payment request
router.post('/:id/buy', async (req, res, next) => {
  try {
    const { buyer_nametag } = req.body;
    if (!buyer_nametag) return res.status(400).json({ error: 'buyer_nametag required' });

    const listing = await pool.query(
      'SELECT id, title, price_amount, price_coin, status FROM listings WHERE id=$1',
      [req.params.id]
    );
    if (!listing.rows.length) return res.status(404).json({ error: 'Not found' });
    const l = listing.rows[0];
    if (l.status !== 'active') return res.status(400).json({ error: 'Listing not available' });

    const sphere = getSphere();
    if (!sphere) {
      return res.status(503).json({ error: 'Payment system not configured (missing SPHERE_MNEMONIC)' });
    }

    const invoice = await sphere.payments.sendPaymentRequest(buyer_nametag, {
      amount: String(l.price_amount),
      coinId: l.price_coin,
      message: `OTC Purchase: ${l.title}`,
    });

    if (invoice.success === false) {
      return res.status(400).json({
        error: invoice.error || 'Failed to send payment request',
        detail: `Make sure "${buyer_nametag}" has published their Sphere identity on testnet`,
      });
    }

    const invoiceId = invoice.id || invoice.requestId || 'unknown';

    await pool.query(
      "UPDATE listings SET escrow_id = $1, updated_at = now() WHERE id = $2",
      [invoiceId, l.id]
    );

    res.json({
      message: `Payment request sent to ${buyer_nametag}`,
      listing_id: l.id,
      amount: `${l.price_amount} ${l.price_coin}`,
      invoice_id: invoiceId,
    });
  } catch (err) { next(err); }
});
