import test from 'node:test';
import assert from 'node:assert/strict';
import k8sClient from '../src/integrations/kubernetes.js';
import prometheusIntegration from '../src/integrations/prometheus.js';
import argoCDIntegration from '../src/integrations/argocd.js';
import rolloutsIntegration from '../src/integrations/rollouts.js';
import clusterService from '../src/services/clusterService.js';
import releaseService from '../src/services/releaseService.js';
import metricsService from '../src/services/metricsService.js';

test('Integration 1: Kubernetes Client Initialization and Connection', async () => {
  const conn = await k8sClient.checkConnection();
  assert.equal(conn.connected, true, 'Kubernetes should connect to kind-cloud05 cluster');
  assert.ok(conn.namespaces.length > 0, 'Cluster should return namespaces');
});

test('Integration 2: Prometheus HTTP API Connection and Current Metrics', async () => {
  const conn = await prometheusIntegration.checkConnection();
  assert.equal(conn.connected, true, 'Prometheus should be reachable on port 9090');

  const metrics = await metricsService.getCurrent();
  assert.equal(metrics.source, 'prometheus');
  assert.ok(typeof metrics.requestRate === 'number');
  assert.ok(typeof metrics.errorRate === 'number');
});

test('Integration 3: Argo CD Application CRD Query', async () => {
  const argoStatus = await argoCDIntegration.getApplicationStatus();
  assert.ok(argoStatus.connected !== undefined);
  assert.ok(argoStatus.application);
});

test('Integration 4: Argo Rollouts Custom Resource Query', async () => {
  const rollout = await rolloutsIntegration.getRolloutStatus();
  assert.equal(rollout.source, 'argo_rollouts');
  assert.ok(rollout.rolloutName);
  assert.ok(rollout.stages.length > 0);
});

test('Integration 5: Cluster Health and Pod Aggregation', async () => {
  const health = await clusterService.getClusterHealth();
  assert.equal(health.connected, true);
  assert.ok(health.pods.ready > 0);
});

test('Integration 6: Current Release and Pod Extraction', async () => {
  const release = await releaseService.getCurrentRelease();
  assert.equal(release.connected, true);
  assert.ok(release.currentVersion);
  assert.ok(release.pods.length > 0);
});
