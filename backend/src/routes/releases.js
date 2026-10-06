import express from 'express';
import releaseService from '../services/releaseService.js';

const router = express.Router();

router.get('/current', async (req, res) => {
  const data = await releaseService.getCurrentRelease();
  res.json(data);
});

router.get('/history', async (req, res) => {
  const data = await releaseService.getReleaseHistory();
  res.json({ source: 'kubernetes', count: data.length, items: data });
});

export default router;
