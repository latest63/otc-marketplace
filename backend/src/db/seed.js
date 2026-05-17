import { pool } from './pool.js';

const categories = [
  { slug: 'nft',      label: 'NFTs' },
  { slug: 'domain',   label: 'Domains' },
  { slug: 'service',  label: 'Services' },
  { slug: 'token',    label: 'Tokens' },
  { slug: 'hardware', label: 'Hardware' },
  { slug: 'other',    label: 'Other' },
];

async function seed() {
  try {
    for (const cat of categories) {
      await pool.query(
        `INSERT INTO categories (slug, label) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [cat.slug, cat.label]
      );
    }
    console.log('Seed complete.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
