import express from 'express';
import metricsService from '../services/metricsService.js';

const router = express.Router();

router.get('/current', async (req, res) => {
  const data = await metricsService.getCurrent();
  res.json(data);
});

router.get('/range', async (req, res) => {
  const minutes = parseInt(req.query.minutes) || 10;
  const step = req.query.step || '15s';
  const data = await metricsService.getRange(minutes, step);
  res.json(data);
});

router.get('/targets', async (req, res) => {
  const data = await metricsService.getTargets();
  res.json({ source: 'prometheus', targets: data });
});

router.get('/alerts', async (req, res) => {
  const data = await metricsService.getAlerts();
  res.json({ source: 'prometheus', alerts: data });
});

export default router;
