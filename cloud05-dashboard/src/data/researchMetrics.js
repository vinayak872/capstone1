/**
 * Capstone Research Metrics, DORA Metrics, Negative Tests, and Maturity Model
 * 
 * ACADEMIC HONESTY FRAMEWORK:
 * Formally defines research variables without fabricating benchmark measurements.
 */

export const RESEARCH_METRIC_DEFINITIONS = [
  {
    id: 'fault-exposure',
    name: 'Fault Exposure',
    symbol: 'FE',
    definition: 'Percentage of user traffic or client requests routed to the faulty release candidate prior to failure mitigation.',
    unit: 'Percentage (%) of total traffic',
    conventionalExpectation: '100% (Full blast-radius propagation)',
    progressiveTarget: 'Bounded by canary weight (e.g. 10%–25%)',
    measurementStatus: 'PENDING CONTROLLED EXPERIMENT'
  },
  {
    id: 'error-rate',
    name: 'Error Rate',
    symbol: 'ER',
    definition: 'Ratio of failed HTTP requests (HTTP 5xx status codes) to total inbound HTTP requests evaluated over a sliding evaluation window.',
    unit: 'Percentage (%)',
    conventionalExpectation: 'Unbounded spike across full cluster',
    progressiveTarget: 'Isolated to canary pod subset',
    measurementStatus: 'PENDING CONTROLLED EXPERIMENT'
  },
  {
    id: 'recovery-time',
    name: 'Recovery Time / MTTR',
    symbol: 'MTTR',
    definition: 'Elapsed duration from initial telemetry threshold breach detection until the stable release version is verified serving 100% healthy traffic.',
    unit: 'Seconds (s)',
    conventionalExpectation: 'Dependent on human on-call triage & manual redeploy',
    progressiveTarget: 'Autonomous controller restoration',
    measurementStatus: 'PENDING CONTROLLED EXPERIMENT'
  },
  {
    id: 'rollback-success',
    name: 'Rollback Success Rate',
    symbol: 'RSR',
    definition: 'Ratio of successful automated rollbacks returning cluster to a known-healthy revision without residual downtime or manual intervention.',
    unit: 'Percentage (%)',
    conventionalExpectation: 'Manual rollback subject to operator delay/error',
    progressiveTarget: 'Deterministic controller reconciliation',
    measurementStatus: 'PENDING CONTROLLED EXPERIMENT'
  },
  {
    id: 'p95-latency',
    name: 'P95 Latency',
    symbol: 'P95',
    definition: '95th percentile response latency in milliseconds observed across inbound API requests during release evaluation windows.',
    unit: 'Milliseconds (ms)',
    conventionalExpectation: 'Degraded across all user traffic if faulty version hangs',
    progressiveTarget: 'Bounded to canary traffic segment',
    measurementStatus: 'PENDING CONTROLLED EXPERIMENT'
  },
  {
    id: 'availability',
    name: 'Service Availability SLA',
    symbol: 'SLA',
    definition: 'Percentage of total requests successfully served without HTTP 5xx errors during the experimental evaluation period.',
    unit: 'Percentage (%)',
    conventionalExpectation: 'Severe outage during faulty release window',
    progressiveTarget: 'Minimal availability degradation',
    measurementStatus: 'PENDING CONTROLLED EXPERIMENT'
  }
];

export const DORA_METRICS = [
  {
    id: 'deployment-frequency',
    name: 'Deployment Frequency',
    description: 'How frequently code is successfully deployed to production or demo environments.',
    value: null,
    status: 'DATA COLLECTION PENDING',
    note: 'Requires historical deployment log mining'
  },
  {
    id: 'lead-time',
    name: 'Lead Time for Changes',
    description: 'Time from commit to code running in the cluster.',
    value: null,
    status: 'DATA COLLECTION PENDING',
    note: 'Pending CI/CD pipeline execution timestamp tracking'
  },
  {
    id: 'change-failure-rate',
    name: 'Change Failure Rate (CFR)',
    description: 'Percentage of deployments causing degraded service requiring remediation.',
    value: null,
    status: 'DATA COLLECTION PENDING',
    note: 'To be calculated across experimental matrix runs'
  },
  {
    id: 'time-to-restore',
    name: 'Time to Restore Service',
    description: 'Time required to recover from a production failure.',
    value: null,
    status: 'DATA COLLECTION PENDING',
    note: 'Primary dependent variable evaluated in Experiment 2 vs 3'
  }
];

export const NEGATIVE_TESTS = [
  {
    id: 'NT-1',
    name: 'Cluster Operational Overhead',
    hypothesis: 'Canary sidecars, controllers, and PromQL scrapers introduce measurable resource/CPU overhead.',
    status: 'PENDING',
    evidence: 'Pending resource profiling benchmark'
  },
  {
    id: 'NT-2',
    name: 'Canary Metric Selection Failure',
    hypothesis: 'Incorrect PromQL thresholds (too lenient or too strict) lead to false negatives or premature aborts.',
    status: 'PENDING',
    evidence: 'Pending sensitivity testing with varying error thresholds'
  },
  {
    id: 'NT-3',
    name: 'Rollback Correctness Failure',
    hypothesis: 'Stateful database schema drift or caching prevents clean rollback to previous stable code.',
    status: 'PENDING',
    evidence: 'Pending stateful migration compatibility check'
  },
  {
    id: 'NT-4',
    name: 'Desired vs Observed State Inconsistency',
    hypothesis: 'Kubernetes API network partition prevents Argo CD from detecting manual cluster drift.',
    status: 'PENDING',
    evidence: 'Pending partition fault injection'
  },
  {
    id: 'NT-5',
    name: 'Retry / Concurrency Duplication',
    hypothesis: 'Automated client retries during canary degradation amplify HTTP 500 error cascades.',
    status: 'PENDING',
    evidence: 'Pending load test retry storm simulation'
  }
];

export const EVIDENCE_VALIDATION_ITEMS = [
  { component: 'Backend Microservice Health', status: 'LIVE', detail: 'Real HTTP 200 responses verified on port 8080' },
  { component: 'Docker Container Build & Packaging', status: 'VERIFIED', detail: 'Local images v1.0.0, v2.0.0, v3.0.0 built and loaded into kind' },
  { component: 'Kubernetes Cluster Infrastructure', status: 'VERIFIED', detail: 'kind-cloud05 cluster running control-plane & service NodePorts' },
  { component: 'GitOps Declarative Manifests', status: 'PROTOTYPE', detail: 'Manifests defined in gitops/; pending live Argo CD API query client' },
  { component: 'Argo Rollouts Controller & CRDs', status: 'PROTOTYPE', detail: 'Rollout CRD created; status model consumed in dashboard' },
  { component: 'Prometheus Analysis Gate', status: 'PROTOTYPE', detail: 'AnalysisTemplate PromQL defined; pending live query_range hook' },
  { component: 'Autonomous Rollback Validation', status: 'PROTOTYPE', detail: 'Failure injection script available; pending automated execution run' },
  { component: 'Empirical Benchmark Experiments', status: 'PENDING', detail: 'Awaiting execution of matrix scripts to generate real CSV/JSON data' },
  { component: 'Capstone Negative-Test Coverage', status: 'PENDING', detail: 'Test harness NT-1 to NT-5 designed; awaiting execution' }
];

export const IMPLEMENTATION_MATURITY = [
  { id: 'O1', name: 'Problem & Research Formulation', status: 'COMPLETE', progress: 100 },
  { id: 'O2', name: 'GitOps Reference Architecture', status: 'IN PROGRESS', progress: 75 },
  { id: 'O3', name: 'Progressive Delivery Engine', status: 'IN PROGRESS', progress: 70 },
  { id: 'O4', name: 'Metrics & Telemetry Reliability', status: 'PENDING', progress: 35 },
  { id: 'O5', name: 'Acceptance, Evidence & Validation', status: 'PENDING', progress: 25 },
];
