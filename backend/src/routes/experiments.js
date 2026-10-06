import express from 'express';
import experimentService from '../services/experimentService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const data = await experimentService.getSummary();
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const data = await experimentService.getExperimentById(req.params.id);
  if (!data) return res.status(404).json({ error: 'Experiment not found' });
  res.json(data);
});

router.get('/:id/results', async (req, res) => {
  const data = await experimentService.getExperimentById(req.params.id);
  if (!data) return res.status(404).json({ error: 'Experiment results not found' });
  res.json({ experimentId: req.params.id, measuredResults: data });
});

export default router;
