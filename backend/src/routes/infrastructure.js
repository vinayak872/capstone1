import express from 'express';
import clusterService from '../services/clusterService.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  const data = await clusterService.getClusterHealth();
  res.json(data);
});

router.get('/cluster', async (req, res) => {
  const data = await clusterService.getClusterHealth();
  res.json(data);
});

router.get('/pods', async (req, res) => {
  try {
    const pods = await clusterService.getPods();
    res.json({ source: 'kubernetes', count: pods.length, items: pods });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/deployments', async (req, res) => {
  try {
    const deployments = await clusterService.getDeployments();
    res.json({ source: 'kubernetes', count: deployments.length, items: deployments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/services', async (req, res) => {
  try {
    const services = await clusterService.getServices();
    res.json({ source: 'kubernetes', count: services.length, items: services });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/events', async (req, res) => {
  try {
    const events = await clusterService.getEvents();
    res.json({ source: 'kubernetes', count: events.length, items: events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
