import express from 'express';
import argoCDIntegration from '../integrations/argocd.js';
import clusterService from '../services/clusterService.js';
import gitIntegration from '../integrations/git.js';

const router = express.Router();

router.get('/status', async (req, res) => {
  const [argoStatus, gitMeta] = await Promise.all([
    argoCDIntegration.getApplicationStatus(),
    gitIntegration.getMetadata(),
  ]);

  res.json({
    ...argoStatus,
    git: gitMeta,
  });
});

router.get('/drift', async (req, res) => {
  const [argoStatus, clusterHealth] = await Promise.all([
    argoCDIntegration.getApplicationStatus(),
    clusterService.getClusterHealth(),
  ]);

  const desired = clusterHealth.pods.desired || 3;
  const observed = clusterHealth.pods.ready;
  const driftDetected = desired !== observed;

  res.json({
    source: 'argocd_reconciliation',
    desiredReplicas: desired,
    observedReplicas: observed,
    driftDetected,
    status: driftDetected ? 'DRIFT_DETECTED' : 'MATCH',
    reconciliationMode: argoStatus.autoHeal ? 'AUTOMATED_SELF_HEALING' : 'MANUAL',
    argoSyncStatus: argoStatus.syncStatus,
    timestamp: new Date().toISOString(),
  });
});

export default router;
