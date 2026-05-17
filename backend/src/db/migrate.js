import fs from 'fs';
import { pool } from './pool.js';

const schema = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf-8');

async function migrate() {
  try {
    await pool.query(schema);
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
