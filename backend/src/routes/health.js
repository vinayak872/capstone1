import express from 'express';
import k8sClient from '../integrations/kubernetes.js';
import argoCDIntegration from '../integrations/argocd.js';
import prometheusIntegration from '../integrations/prometheus.js';
import rolloutsIntegration from '../integrations/rollouts.js';
import axios from 'axios';

const router = express.Router();
const BACKEND_APP_URL = process.env.BACKEND_APP_URL || 'http://localhost:8080';

router.get('/integrations', async (req, res) => {
  const [k8sConn, argoStatus, promConn, rolloutStatus, backendRes] = await Promise.all([
    k8sClient.checkConnection(),
    argoCDIntegration.getApplicationStatus(),
    prometheusIntegration.checkConnection(),
    rolloutsIntegration.getRolloutStatus(),
    axios.get(`${BACKEND_APP_URL}/health`, { timeout: 3000 }).catch(e => ({ status: 500, error: e.message })),
  ]);

  const isBackendHealthy = backendRes.status === 200 || backendRes.data?.alive === true;

  res.json({
    backend: isBackendHealthy,
    kubernetes: Boolean(k8sConn.connected),
    argocd: Boolean(argoStatus.connected),
    prometheus: Boolean(promConn.connected),
    rollouts: Boolean(rolloutStatus.connected),
    timestamp: new Date().toISOString(),
    details: {
      kubernetes: { context: k8sConn.context, error: k8sConn.error },
      argocd: { app: argoStatus.application, sync: argoStatus.syncStatus, health: argoStatus.healthStatus },
      prometheus: { version: promConn.version, error: promConn.error },
      rollouts: { phase: rolloutStatus.phase, target: rolloutStatus.targetVersion },
      backend: { endpoint: BACKEND_APP_URL, reachable: isBackendHealthy },
    }
  });
});

export default router;
