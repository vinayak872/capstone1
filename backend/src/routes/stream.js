import express from 'express';
import clusterService from '../services/clusterService.js';
import releaseService from '../services/releaseService.js';
import argoCDIntegration from '../integrations/argocd.js';
import rolloutsIntegration from '../integrations/rollouts.js';
import metricsService from '../services/metricsService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  console.log('[SSE] Client connected to real-time telemetry stream');

  const sendUpdate = async () => {
    try {
      const [cluster, release, argo, rollout, metrics] = await Promise.all([
        clusterService.getClusterHealth(),
        releaseService.getCurrentRelease(),
        argoCDIntegration.getApplicationStatus(),
        rolloutsIntegration.getRolloutStatus(),
        metricsService.getCurrent(),
      ]);

      const payload = {
        timestamp: new Date().toISOString(),
        cluster,
        release,
        argo,
        rollout,
        metrics,
      };

      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (err) {
      console.error('[SSE] Error sending telemetry payload:', err.message);
    }
  };

  // Immediate send
  await sendUpdate();

  // Push every 5 seconds
  const interval = setInterval(sendUpdate, 5000);

  req.on('close', () => {
    console.log('[SSE] Client disconnected from telemetry stream');
    clearInterval(interval);
  });
});

export default router;
