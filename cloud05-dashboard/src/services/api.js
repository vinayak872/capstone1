import axios from 'axios';

// Connect to Dashboard Integration Backend directly or via relative proxy
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: {
    'Accept': 'application/json',
  },
});

const proxyClient = axios.create({
  baseURL: '',
  timeout: 5000,
  headers: {
    'Accept': 'application/json',
  },
});

const executeWithFallback = async (path, method = 'get', body = null) => {
  try {
    const res = method === 'post'
      ? await apiClient.post(path, body)
      : await apiClient.get(path);
    return { data: res.data, status: res.status, error: null };
  } catch (directErr) {
    try {
      const proxyRes = method === 'post'
        ? await proxyClient.post(path, body)
        : await proxyClient.get(path);
      return { data: proxyRes.data, status: proxyRes.status, error: null };
    } catch (proxyErr) {
      return {
        data: null,
        status: proxyErr.response?.status || directErr.response?.status || 0,
        error: directErr.message || 'Connection failed',
      };
    }
  }
};

// 1. Infrastructure Integrations Health
export const getIntegrationsHealth = async () => executeWithFallback('/api/health/integrations');

// 2. Kubernetes Cluster
export const getClusterHealth = async () => executeWithFallback('/api/infrastructure/health');
export const getPods = async () => executeWithFallback('/api/infrastructure/pods');
export const getDeployments = async () => executeWithFallback('/api/infrastructure/deployments');
export const getServices = async () => executeWithFallback('/api/infrastructure/services');
export const getEvents = async () => executeWithFallback('/api/infrastructure/events');

// 3. Releases & Pod Container Images
export const getCurrentRelease = async () => executeWithFallback('/api/releases/current');
export const getReleaseHistory = async () => executeWithFallback('/api/releases/history');

// 4. GitOps & Argo CD
export const getGitOpsStatus = async () => executeWithFallback('/api/gitops/status');
export const getGitOpsDrift = async () => executeWithFallback('/api/gitops/drift');

// 5. Argo Rollouts
export const getRolloutStatus = async () => executeWithFallback('/api/rollout/status');
export const runRolloutDemo = async () => executeWithFallback('/api/rollout/demo', 'post');

// 6. Prometheus Telemetry
export const getMetricsCurrent = async () => executeWithFallback('/api/metrics/current');
export const getMetricsRange = async (minutes = 10, step = '15s') =>
  executeWithFallback(`/api/metrics/range?minutes=${minutes}&step=${step}`);

// 7. Empirical Experiments
export const getExperiments = async () => executeWithFallback('/api/experiments');

// Fallback legacy endpoints
export const getHealth = async () => executeWithFallback('/health');
export const getVersion = async () => executeWithFallback('/version');

export default {
  getIntegrationsHealth,
  getClusterHealth,
  getPods,
  getDeployments,
  getServices,
  getEvents,
  getCurrentRelease,
  getReleaseHistory,
  getGitOpsStatus,
  getGitOpsDrift,
  getRolloutStatus,
  runRolloutDemo,
  getMetricsCurrent,
  getMetricsRange,
  getExperiments,
  getHealth,
  getVersion,
};
