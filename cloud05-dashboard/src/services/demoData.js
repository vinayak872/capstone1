/**
 * Centralized Prototype Demonstration Data Layer
 * 
 * ACADEMIC HONESTY NOTICE:
 * The data below represents research prototype data modeled after actual CLOUD-05 capstone
 * experimental configurations. It is used for demonstration during viva and development
 * until direct client connections to Prometheus API (port 9090), Argo CD API (port 8085),
 * and Argo Rollouts controller are linked.
 */

export const IS_PROTOTYPE_MODE = true;

// 1. Release History
export const demoReleaseHistory = [
  {
    version: 'v1.0.0',
    tag: '1.0.0',
    commit: 'a1f893e',
    status: 'STABLE',
    strategy: 'RollingUpdate',
    deployedAt: '2026-10-06 00:15 UTC',
    duration: '42s',
    errorRate: 0.1,
    availability: '99.98%',
    result: 'Successful',
    description: 'Initial production baseline microservice release.',
    metrics: { requests: 24500, errors: 24, p95Latency: 18 }
  },
  {
    version: 'v2.0.0',
    tag: '2.0.0',
    commit: 'c4e209b',
    status: 'STABLE',
    strategy: 'RollingUpdate',
    deployedAt: '2026-10-06 03:30 UTC',
    duration: '55s',
    errorRate: 0.2,
    availability: '99.95%',
    result: 'Successful',
    description: 'Feature addition with order processing enhancements.',
    metrics: { requests: 31200, errors: 62, p95Latency: 22 }
  },
  {
    version: 'v3.0.0',
    tag: '3.0.0',
    commit: 'f9d412c',
    status: 'ROLLED BACK',
    strategy: 'Canary (Argo Rollouts)',
    deployedAt: '2026-10-06 05:45 UTC',
    duration: '1m 18s',
    errorRate: 8.7,
    availability: '91.30%',
    result: 'Rolled Back',
    description: 'Simulated faulty release injecting 500 errors on orders route.',
    metrics: { requests: 5400, errors: 470, p95Latency: 185 },
    rollbackReason: 'Step-based Prometheus analysis failed: error-rate > 5% threshold reached on 25% canary traffic.',
    preservedVersion: 'v2.0.0'
  }
];

// 2. Progressive Rollout Pipeline Stages
export const demoRolloutData = {
  currentRelease: 'v3.0.0',
  targetVersion: 'v3.0.0',
  stableVersion: 'v2.0.0',
  rolloutState: 'ROLLED BACK',
  statusMessage: 'Automatic rollback triggered: Step analysis metric "error-rate" exceeded threshold (8.7% > 5.0%).',
  rollbackResult: 'SUCCESS',
  preservedVersion: 'v2.0.0',
  currentTraffic: {
    stablePercent: 100,
    canaryPercent: 0
  },
  activeStepIndex: 1, // failed at stage 2
  stages: [
    {
      step: 1,
      weight: 10,
      label: '10% Canary Weight',
      analysisStatus: 'PASSED',
      duration: '30s',
      errorRate: '0.4%',
      status: 'completed',
      detail: 'Preliminary blast radius isolation: 10% traffic allocated to v3.0.0.'
    },
    {
      step: 2,
      weight: 25,
      label: '25% Canary Weight',
      analysisStatus: 'FAILED',
      duration: '45s',
      errorRate: '8.7%',
      status: 'failed',
      detail: 'Prometheus PromQL error-rate check triggered failure limit (2 failed checks > 1 allowed).'
    },
    {
      step: 3,
      weight: 50,
      label: '50% Canary Weight',
      analysisStatus: 'SKIPPED',
      duration: '--',
      errorRate: '--',
      status: 'aborted',
      detail: 'Safely bypassed due to upstream analysis abort.'
    },
    {
      step: 4,
      weight: 100,
      label: '100% Production Promotion',
      analysisStatus: 'SKIPPED',
      duration: '--',
      errorRate: '--',
      status: 'aborted',
      detail: 'Blast radius contained; 0% faulty traffic propagated to general population.'
    }
  ]
};

// 3. Runtime Telemetry Metrics (Mimicking Prometheus PromQL scrapes)
export const demoMetricsData = {
  summary: {
    requestRate: '124 req/s',
    errorRate: 0.20,
    p95Latency: 120,
    availability: 99.8,
  },
  timeSeries: [
    { time: '11:00', requests: 110, errorRate: 0.1, latencyP95: 115, successRate: 99.9 },
    { time: '11:05', requests: 118, errorRate: 0.2, latencyP95: 118, successRate: 99.8 },
    { time: '11:10', requests: 125, errorRate: 0.1, latencyP95: 114, successRate: 99.9 },
    { time: '11:15', requests: 130, errorRate: 0.3, latencyP95: 122, successRate: 99.7 },
    { time: '11:20', requests: 145, errorRate: 7.8, latencyP95: 175, successRate: 92.2 }, // canary anomaly
    { time: '11:25', requests: 152, errorRate: 8.7, latencyP95: 190, successRate: 91.3 }, // canary anomaly detected
    { time: '11:30', requests: 135, errorRate: 1.2, latencyP95: 130, successRate: 98.8 }, // rollback initiated
    { time: '11:35', requests: 128, errorRate: 0.2, latencyP95: 120, successRate: 99.8 }, // back to stable
    { time: '11:40', requests: 124, errorRate: 0.2, latencyP95: 119, successRate: 99.8 },
  ]
};

// 4. GitOps Desired vs Observed State
export const demoGitOpsData = {
  repository: 'cloud05-gitops',
  repoUrl: 'https://github.com/cloud05/gitops-releases',
  branch: 'main',
  syncStatus: 'SYNCED',
  healthStatus: 'HEALTHY',
  revision: 'e39b710',
  reconciliationInterval: '3m',
  lastSyncTime: '2026-10-06 06:15:00 UTC',
  desired: {
    version: 'v2.0.0',
    replicas: 4,
    status: 'Healthy',
    image: 'cloud05-demo:2.0.0',
  },
  observed: {
    version: 'v2.0.0',
    replicas: 4,
    status: 'Healthy',
    image: 'cloud05-demo:2.0.0',
  },
  driftScenarios: [
    {
      title: 'Active Synchronization State',
      desiredReplicas: 4,
      observedReplicas: 4,
      driftDetected: false,
      status: 'SYNCED',
      note: 'Desired Git state perfectly matches Kubernetes live state.'
    },
    {
      title: 'Simulated Manual Tampering / Drift',
      desiredReplicas: 4,
      observedReplicas: 1,
      driftDetected: true,
      status: 'DRIFT DETECTED',
      note: 'Operator manually reduced replicas via kubectl scale; Argo CD triggers self-healing.'
    }
  ]
};

// 5. Research Experiment Comparison: Conventional Deployment vs Progressive Delivery
export const demoExperimentData = {
  comparisonTable: [
    {
      metric: 'Fault Exposure (Users)',
      conventional: '100% (Entire User Base)',
      progressive: 'Max 25% (Canary Isolation)',
      advantage: '75% blast radius reduction'
    },
    {
      metric: 'Fault Detection Mechanism',
      conventional: 'After full deployment (User reports)',
      progressive: 'During canary step (Prometheus PromQL)',
      advantage: 'Automated telemetry gates'
    },
    {
      metric: 'Rollback Trigger',
      conventional: 'Manual on-call engineer intervention',
      progressive: 'Automated Argo Rollouts controller',
      advantage: '0s human delay'
    },
    {
      metric: 'Mean Time to Recovery (MTTR)',
      conventional: '8 - 15 minutes',
      progressive: '< 45 seconds',
      advantage: '> 90% MTTR reduction'
    },
    {
      metric: 'Service Availability Impact',
      conventional: 'Catastrophic degradation',
      progressive: 'Localized minor ripple',
      advantage: 'High resilience'
    }
  ],
  quantitativeMetrics: [
    { name: 'Peak Error Rate (%)', conventional: 75.0, progressive: 8.7 },
    { name: 'Recovery Time (sec)', conventional: 540, progressive: 38 },
    { name: 'User Sessions Impacted (%)', conventional: 100, progressive: 25 },
    { name: 'Rollback Automation Rate (%)', conventional: 0, progressive: 100 }
  ]
};

export default {
  IS_PROTOTYPE_MODE,
  demoReleaseHistory,
  demoRolloutData,
  demoMetricsData,
  demoGitOpsData,
  demoExperimentData,
};
