import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { errorHandler } from './middleware/error.js';
import { router as categoriesRouter } from './routes/categories.js';
import { router as listingsRouter } from './routes/listings.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, nametag: config.sphereNametag }));

app.use('/api/categories', categoriesRouter);
app.use('/api/listings', listingsRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`OTC Marketplace API on :${config.port}`);
});
