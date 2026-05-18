import { Sphere } from '@unicitylabs/sphere-sdk';
import { createNodeProviders } from '@unicitylabs/sphere-sdk/impl/nodejs';
import { config } from './config.js';
import { pool } from './db/pool.js';

let sphere = null;
let _channelIds = [];

const CHANNELS = [
  { name: 'General', slug: 'general', desc: 'General chat and discussion' },
  { name: 'NFTs', slug: 'nfts', desc: 'NFT listings and discussion' },
  { name: 'Domains', slug: 'domains', desc: 'Domain listings and discussion' },
  { name: 'Services', slug: 'services', desc: 'Service listings and discussion' },
  { name: 'Tokens', slug: 'tokens', desc: 'Token listings and discussion' },
  { name: 'Hardware', slug: 'hardware', desc: 'Hardware listings and discussion' },
  { name: 'Trade Feed', slug: 'trade-feed', desc: 'Automated trade notifications' },
];

export async function initSphere() {
  if (!config.sphereMnemonic) {
    console.warn('SPHERE_MNEMONIC not set — payment features disabled');
    return null;
  }

  const result = await Sphere.init({
    ...createNodeProviders({
      network: config.network,
      groupChat: true,
    }),
    mnemonic: config.sphereMnemonic,
    nametag: config.sphereNametag,
  });
  sphere = result.sphere;
  console.log(`Sphere wallet ready: ${config.sphereNametag}`);

  // Create marketplace channels
  await initChannels();

  // Listen for payment responses
  sphere.payments.onPaymentRequestResponse(async (response) => {
    console.log('Payment response:', response.responseType, 'for request', response.requestId);

    if (response.responseType !== 'paid') return;

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

    // Post to trade-feed channel
    await postToTradeFeed(`🚀 ${listing.title} just sold!`);

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

async function initChannels() {
  if (!sphere?.groupChat) return;
  const gc = sphere.groupChat;
  _channelIds = [];

  for (const ch of CHANNELS) {
    try {
      const group = await gc.createGroup({
        name: ch.name,
        description: ch.desc,
        visibility: 'PUBLIC',
      });
      if (group) {
        _channelIds.push({ id: group.id, ...ch });
        console.log(`Channel created: ${ch.name} (${group.id})`);
      }
    } catch (e) {
      // Channel might already exist — try to find it
      try {
        const available = await gc.fetchAvailableGroups();
        const existing = available.find(a => a.name === ch.name);
        if (existing) {
          _channelIds.push({ id: existing.id, ...ch });
        }
      } catch {}
    }
  }

  // Join trade-feed
  const tf = _channelIds.find(c => c.slug === 'trade-feed');
  if (tf) {
    await gc.joinGroup(tf.id).catch(() => {});
  }
}

async function postToTradeFeed(text) {
  if (!sphere?.groupChat) return;
  const tf = _channelIds.find(c => c.slug === 'trade-feed');
  if (!tf) return;
  try {
    await sphere.groupChat.sendMessage(tf.id, text);
  } catch (e) {
    console.error('Trade feed post failed:', e.message);
  }
}

export function getSphere() {
  return sphere;
}

export function getChannelIds() {
  return _channelIds;
}
