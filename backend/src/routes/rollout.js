import express from 'express';
import rolloutService from '../services/rolloutService.js';

const router = express.Router();

router.get('/status', async (req, res) => {
  const data = await rolloutService.getStatus();
  res.json(data);
});

router.post('/demo', async (req, res) => {
  const result = await rolloutService.runReleaseSafetyDemo();
  res.json(result);
});

export default router;
