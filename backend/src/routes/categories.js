import { Router } from 'express';
import { pool } from '../db/pool.js';

export const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT slug, label FROM categories ORDER BY label');
    res.json(rows);
  } catch (err) { next(err); }
});
