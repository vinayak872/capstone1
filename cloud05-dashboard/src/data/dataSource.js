/**
 * Data Source Classification Constants & Helpers
 * 
 * ACADEMIC HONESTY FRAMEWORK:
 * Distinguishes between live cluster telemetry, prototype mock data,
 * and pending research experiment measurements.
 */

export const SOURCE_TYPES = {
  REAL: 'REAL',
  LIVE: 'LIVE',
  PROTOTYPE: 'PROTOTYPE',
  PENDING: 'PENDING',
  ILLUSTRATIVE: 'ILLUSTRATIVE',
  VERIFIED: 'VERIFIED',
};

export const DATA_SOURCE_CONFIG = {
  backend: {
    name: 'Backend Microservice API (port 8080)',
    type: SOURCE_TYPES.LIVE,
    description: 'Polled live every 5s from http://localhost:8080 (/health, /version, /api/status)',
  },
  kubernetes: {
    name: 'Kubernetes Cluster (kind-cloud05)',
    type: SOURCE_TYPES.PROTOTYPE,
    description: 'Standardized 3/3 replica prototype model until direct K8s API client is wired',
  },
  argocd: {
    name: 'Argo CD Engine (port 8085)',
    type: SOURCE_TYPES.PROTOTYPE,
    description: 'Declarative GitOps sync model; pending direct REST client integration with Argo CD server',
  },
  argoRollouts: {
    name: 'Argo Rollouts Controller',
    type: SOURCE_TYPES.PROTOTYPE,
    description: 'Canary pipeline state machine; modeled after AnalysisRun CRD behavior',
  },
  prometheus: {
    name: 'Prometheus TSDB (port 9090)',
    type: SOURCE_TYPES.PROTOTYPE,
    description: 'Prototype telemetry visualization; pending direct PromQL HTTP API integration',
  },
  experiments: {
    name: 'Capstone Empirical Experiments',
    type: SOURCE_TYPES.PENDING,
    description: 'Controlled comparative benchmark experiments; measurements pending execution',
  },
};
