import { Sphere } from '@unicitylabs/sphere-sdk';
import { createNodeProviders } from '@unicitylabs/sphere-sdk/impl/nodejs';
import { config } from './config.js';
import { pool } from './db/pool.js';

let sphere = null;

export async function initSphere() {
  if (!config.sphereMnemonic) {
    console.warn('SPHERE_MNEMONIC not set — payment features disabled');
    return null;
  }

  const result = await Sphere.init({
    ...createNodeProviders({ network: config.network }),
    mnemonic: config.sphereMnemonic,
    nametag: config.sphereNametag,
  });
  sphere = result.sphere;
  console.log(`Sphere wallet ready: ${config.sphereNametag}`);

  // Listen for payment responses
  sphere.payments.onPaymentRequestResponse(async (response) => {
    console.log('Payment response:', response.responseType, 'for request', response.requestId);

    if (response.responseType !== 'paid') return;

    // Find listing by invoice_id (stored in escrow_id)
    const { rows } = await pool.query(
      "SELECT id, seller_nametag, title FROM listings WHERE escrow_id = $1 AND status = 'active'",
      [response.requestId]
    );
    if (!rows.length) {
      console.warn('No active listing found for invoice', response.requestId);
      return;
    }

    const listing = rows[0];
    await pool.query(
      "UPDATE listings SET status = 'sold', updated_at = now() WHERE id = $1",
      [listing.id]
    );
    console.log(`Listing ${listing.id} marked sold`);

    // Notify seller via DM
    try {
      const sellerPeer = await sphere.resolve(listing.seller_nametag);
      await sphere.communications.sendDM(sellerPeer.transportPubkey, 
        `Your listing "${listing.title}" has been sold! 🎉`);
    } catch (dmErr) {
      console.error('Failed to DM seller:', dmErr.message);
    }
  });

  return sphere;
}

export function getSphere() {
  return sphere;
}
