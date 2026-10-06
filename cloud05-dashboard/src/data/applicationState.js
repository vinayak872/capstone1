/**
 * Centralized Application State Machine & Release State Model
 * 
 * Enforces absolute data consistency across all pages.
 * Replaces fragmented, hard-coded version numbers across Dashboard, Rollout, Releases, and GitOps.
 */

export const RELEASE_STATES = {
  // STATE 1 — INITIAL BASELINE
  STATE_1_INITIAL: {
    id: 1,
    name: 'INITIAL_BASELINE',
    label: 'State 1: Initial Baseline Release (v1.0.0)',
    currentVersion: 'v1.0.0',
    stableVersion: 'v1.0.0',
    targetVersion: null,
    rolloutStatus: 'STABLE',
    canaryWeight: 0,
    rollbackStatus: 'READY',
    replicasDesired: 3,
    replicasReady: 3,
    activeStepIndex: 0,
    statusMessage: 'Baseline production release v1.0.0 active across 100% traffic.',
    traffic: { stablePercent: 100, canaryPercent: 0 }
  },

  // STATE 2 — HEALTHY V2 RELEASE
  STATE_2_HEALTHY_V2: {
    id: 2,
    name: 'HEALTHY_V2_PROMOTED',
    label: 'State 2: Healthy v2.0.0 Promoted',
    currentVersion: 'v2.0.0',
    stableVersion: 'v2.0.0',
    targetVersion: null,
    rolloutStatus: 'STABLE',
    canaryWeight: 0,
    rollbackStatus: 'READY',
    replicasDesired: 3,
    replicasReady: 3,
    activeStepIndex: 4,
    statusMessage: 'Healthy v2.0.0 successfully completed progressive canary gates and fully promoted.',
    traffic: { stablePercent: 100, canaryPercent: 0 }
  },

  // STATE 3 — V3 CANARY STARTED
  STATE_3_V3_CANARY_10: {
    id: 3,
    name: 'V3_CANARY_STARTED',
    label: 'State 3: v3.0.0 Canary Started (10%)',
    currentVersion: 'v2.0.0',
    stableVersion: 'v2.0.0',
    targetVersion: 'v3.0.0',
    rolloutStatus: 'CANARY_IN_PROGRESS',
    canaryWeight: 10,
    rollbackStatus: 'READY',
    replicasDesired: 3,
    replicasReady: 3,
    activeStepIndex: 1,
    statusMessage: 'Canary weight set to 10% for preliminary blast-radius restriction.',
    traffic: { stablePercent: 90, canaryPercent: 10 }
  },

  // STATE 4 — CANARY PROMOTED TO 25% (ANALYSIS)
  STATE_4_CANARY_25: {
    id: 4,
    name: 'V3_CANARY_ANALYSIS',
    label: 'State 4: v3.0.0 Canary Promoted to 25% (Analysis Phase)',
    currentVersion: 'v2.0.0',
    stableVersion: 'v2.0.0',
    targetVersion: 'v3.0.0',
    rolloutStatus: 'ANALYSIS',
    canaryWeight: 25,
    rollbackStatus: 'READY',
    replicasDesired: 3,
    replicasReady: 3,
    activeStepIndex: 2,
    statusMessage: 'Canary weight promoted to 25%. Prometheus PromQL analysis active.',
    traffic: { stablePercent: 75, canaryPercent: 25 }
  },

  // STATE 5 — CANARY FAILURE
  STATE_5_CANARY_FAILURE: {
    id: 5,
    name: 'CANARY_FAILURE',
    label: 'State 5: Canary Analysis Breach (Failure Detected)',
    currentVersion: 'v2.0.0',
    stableVersion: 'v2.0.0',
    targetVersion: 'v3.0.0',
    rolloutStatus: 'ANALYSIS_FAILED',
    canaryWeight: 25,
    rollbackStatus: 'TRIGGERED',
    replicasDesired: 3,
    replicasReady: 3,
    activeStepIndex: 2,
    statusMessage: 'Prometheus AnalysisRun breached: error rate exceeded threshold. Autonomous rollback triggered.',
    traffic: { stablePercent: 75, canaryPercent: 25 }
  },

  // STATE 6 — ROLLBACK COMPLETED (PRIMARY CAPSTONE OUTCOME)
  STATE_6_ROLLBACK_COMPLETED: {
    id: 6,
    name: 'ROLLBACK_COMPLETED',
    label: 'State 6: Autonomous Rollback Completed (Preserved v2.0.0)',
    currentVersion: 'v2.0.0',
    stableVersion: 'v2.0.0',
    targetVersion: null,
    rolloutStatus: 'ROLLED_BACK',
    canaryWeight: 0,
    rollbackStatus: 'SUCCESS',
    replicasDesired: 3,
    replicasReady: 3,
    activeStepIndex: 2,
    statusMessage: 'Autonomous rollback completed: Faulty v3.0.0 traffic halted (0%). Stable v2.0.0 preserved at 100%.',
    traffic: { stablePercent: 100, canaryPercent: 0 }
  }
};

// Default prototype state: State 6 (Demonstrates the primary research mechanism: failed v3.0.0 rolled back to v2.0.0)
export const DEFAULT_RELEASE_STATE = RELEASE_STATES.STATE_6_ROLLBACK_COMPLETED;
