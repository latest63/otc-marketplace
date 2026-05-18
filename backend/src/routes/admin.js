import { Router } from 'express';
import { pool } from '../db/pool.js';

export const router = Router();

// Simple key-based auth middleware
function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Invalid admin key' });
  }
  next();
}

// All admin routes require auth
router.use(adminAuth);

// ─── Stats ───
router.get('/stats', async (_req, res, next) => {
  try {
    const [statusCounts, totalVolume, catCounts] = await Promise.all([
      pool.query("SELECT status, COUNT(*)::int FROM listings GROUP BY status"),
      pool.query("SELECT COALESCE(SUM(price_amount), 0)::float AS total FROM listings WHERE status = 'sold'"),
      pool.query("SELECT c.label, COUNT(l.id)::int FROM categories c LEFT JOIN listings l ON l.category_slug = c.slug GROUP BY c.label, c.slug ORDER BY count DESC"),
    ]);

    const stats = { statuses: {}, total: 0 };
    for (const r of statusCounts.rows) {
      stats.statuses[r.status] = r.count;
      stats.total += r.count;
    }

    res.json({
      listCount: stats.total,
      byStatus: stats.statuses,
      volumeSold: totalVolume.rows[0].total,
      categories: catCounts.rows,
    });
  } catch (err) { next(err); }
});

// ─── All listings (admin view) ───
router.get('/listings', async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (status) { conditions.push(`l.status = $${idx++}`); params.push(status); }
    if (category) { conditions.push(`l.category_slug = $${idx++}`); params.push(category); }

    const sql = `
      SELECT l.id, l.seller_nametag, l.title, l.description,
             l.price_amount, l.price_coin, l.status, l.created_at, l.updated_at,
             c.label AS category
      FROM listings l
      JOIN categories c ON c.slug = l.category_slug
      ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
      ORDER BY l.created_at DESC
      LIMIT 100
    `;
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// ─── Admin-force delete listing ───
router.delete('/listings/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM listings WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─── Admin-force update listing status ───
router.patch('/listings/:id', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active','reserved','sold','cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    await pool.query("UPDATE listings SET status = $1, updated_at = now() WHERE id = $2", [status, req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─── Categories CRUD ───
router.get('/categories', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT slug, label FROM categories ORDER BY label');
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/categories', async (req, res, next) => {
  try {
    const { slug, label } = req.body;
    if (!slug || !label) return res.status(400).json({ error: 'slug and label required' });
    const { rows } = await pool.query('INSERT INTO categories (slug, label) VALUES ($1, $2) RETURNING *', [slug, label]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/categories/:slug', async (req, res, next) => {
  try {
    const { label } = req.body;
    const { rows } = await pool.query('UPDATE categories SET label = $1 WHERE slug = $2 RETURNING *', [label, req.params.slug]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/categories/:slug', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM categories WHERE slug = $1', [req.params.slug]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});
