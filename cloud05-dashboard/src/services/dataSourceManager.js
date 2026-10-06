/**
 * Central Data Source Classification Manager
 * 
 * Determines whether a service integration is REAL/LIVE, PROTOTYPE, or PENDING.
 * Prevents unintentional fabrication of experimental and cluster telemetry.
 */

import { SOURCE_TYPES } from '../data/dataSource';

export const SERVICE_SOURCES = {
  backend: {
    key: 'backend',
    label: 'Backend Microservice',
    status: SOURCE_TYPES.LIVE,
    endpoint: 'http://localhost:8080',
    isLive: true,
    description: 'Polled live every 5s from Node.js service running in cluster.'
  },
  kubernetes: {
    key: 'kubernetes',
    label: 'Kubernetes Cluster State',
    status: SOURCE_TYPES.PROTOTYPE,
    endpoint: 'kind-cloud05',
    isLive: false,
    description: 'Prototype model using standardized 3/3 replicas until direct K8s API client is wired.'
  },
  prometheus: {
    key: 'prometheus',
    label: 'Prometheus Telemetry',
    status: SOURCE_TYPES.PROTOTYPE,
    endpoint: 'http://localhost:9090',
    isLive: false,
    description: 'Prototype time-series data. Pending direct PromQL HTTP API query client.'
  },
  argoCD: {
    key: 'argoCD',
    label: 'Argo CD GitOps Engine',
    status: SOURCE_TYPES.PROTOTYPE,
    endpoint: 'http://localhost:8085',
    isLive: false,
    description: 'Prototype desired-state model. Pending live Argo CD REST API token integration.'
  },
  argoRollouts: {
    key: 'argoRollouts',
    label: 'Argo Rollouts Controller',
    status: SOURCE_TYPES.PROTOTYPE,
    endpoint: 'kubectl-argo-rollouts',
    isLive: false,
    description: 'Prototype canary pipeline state model. Pending Rollouts CRD live watch listener.'
  },
  experiments: {
    key: 'experiments',
    label: 'Capstone Empirical Experiments',
    status: SOURCE_TYPES.PENDING,
    endpoint: 'experiments/run-experiment.sh',
    isLive: false,
    description: 'Controlled comparative benchmark experiments. Execution & evidence collection pending.'
  }
};

export const getSourceStatus = (serviceKey) => {
  return SERVICE_SOURCES[serviceKey]?.status || SOURCE_TYPES.PROTOTYPE;
};

export const isServiceLive = (serviceKey) => {
  return Boolean(SERVICE_SOURCES[serviceKey]?.isLive);
};

export default {
  SERVICE_SOURCES,
  getSourceStatus,
  isServiceLive,
};
