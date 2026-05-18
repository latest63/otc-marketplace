import { Router } from 'express';
import { getChannelIds } from '../sphere.js';

export const router = Router();

router.get('/channels', (_req, res) => {
  const channels = getChannelIds();
  res.json(channels);
});
