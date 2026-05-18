#!/usr/bin/env node
/**
 * Standalone Sphere payment listener.
 * Run this on a VPS / Railway / Fly.io so the event-driven
 * onPaymentRequestResponse callback stays alive.
 *
 * Usage: node src/listener.js
 */

import 'dotenv/config';
import { Sphere } from '@unicitylabs/sphere-sdk';
import { createNodeProviders } from '@unicitylabs/sphere-sdk/impl/nodejs';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => console.error('PG pool error:', err.message));

async function main() {
  const mnemonic = process.env.SPHERE_MNEMONIC;
  if (!mnemonic) {
    console.error('SPHERE_MNEMONIC not set');
    process.exit(1);
  }

  const nametag = process.env.SPHERE_NAMETAG || '@otcmarket';
  const network = process.env.NETWORK || 'testnet';

  console.log(`[listener] Connecting Sphere wallet ${nametag} on ${network}...`);

  const { sphere } = await Sphere.init({
    ...createNodeProviders({ network }),
    mnemonic,
    nametag,
  });

  console.log(`[listener] ✅ Wallet ready: ${nametag}`);

  // Listen for payment responses
  sphere.payments.onPaymentRequestResponse(async (response) => {
    console.log(`[listener] Payment response: ${response.responseType}`, {
      requestId: response.requestId,
      from: response.from,
      amount: response.amount,
    });

    if (response.responseType !== 'paid') return;

    try {
      // Match invoice ID to listing
      const { rows } = await pool.query(
        "SELECT id, seller_nametag, title FROM listings WHERE escrow_id = $1 AND status = 'active'",
        [response.requestId]
      );

      if (!rows.length) {
        console.warn(`[listener] No active listing for invoice ${response.requestId}`);
        return;
      }

      const listing = rows[0];

      await pool.query(
        "UPDATE listings SET status = 'sold', updated_at = now() WHERE id = $1",
        [listing.id]
      );

      console.log(`[listener] ✅ Listing ${listing.id} ("${listing.title}") marked sold`);

      // DM the seller
      try {
        const peer = await sphere.resolve(listing.seller_nametag);
        await sphere.communications.sendDM(
          peer.transportPubkey,
          `🎉 Your listing "${listing.title}" has been sold on OTC Marketplace!`
        );
        console.log(`[listener] 📨 Seller ${listing.seller_nametag} notified via DM`);
      } catch (dmErr) {
        console.error(`[listener] Failed to DM seller: ${dmErr.message}`);
      }
    } catch (dbErr) {
      console.error(`[listener] DB error: ${dbErr.message}`);
    }
  });

  // Keep alive
  console.log('[listener] 👂 Listening for payments...');
}

main().catch((err) => {
  console.error('[listener] Fatal:', err);
  process.exit(1);
});
