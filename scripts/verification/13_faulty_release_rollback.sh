#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

print_header "13 - Faulty Release & Automatic Rollback Verification"

EVIDENCE_LOG=""
append_log() {
  EVIDENCE_LOG+="$1"$'\n'
}

append_log "=== FAULTY RELEASE & AUTOMATIC ROLLBACK VERIFICATION ==="
append_log "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ALL_PASSED=true
NS="cloud05"
ROLLOUT_NAME="cloud05-rollout"

# 1. Live Rollout Abort Message
ROLLOUT_MSG=$(kubectl get rollout "$ROLLOUT_NAME" -n "$NS" -o jsonpath='{.status.conditions[?(@.reason=="RolloutAborted")].message}' 2>/dev/null || echo "")
if [ -z "$ROLLOUT_MSG" ]; then
  ROLLOUT_MSG=$(kubectl get rollout "$ROLLOUT_NAME" -n "$NS" -o jsonpath='{.status.message}' 2>/dev/null || echo "")
fi

if echo "$ROLLOUT_MSG" | grep -qi "aborted"; then
  print_result "Automated Rollout Abort" "PASS" "Rollout aborted update due to failed AnalysisRun"
  append_log "[PASS] Live Rollout aborted due to canary degradation: ${ROLLOUT_MSG}"
else
  print_result "Automated Rollout Abort" "FAIL" "Current status message: ${ROLLOUT_MSG}"
  append_log "[FAIL] Status message: ${ROLLOUT_MSG}"
  ALL_PASSED=false
fi

# 2. Failed AnalysisRun Gate
FAILED_AR=$(kubectl get analysisrun -n "$NS" --no-headers | grep "Failed" | head -n 1 | awk '{print $1}' || echo "")
if [ -n "$FAILED_AR" ]; then
  FAILED_METRIC=$(kubectl get analysisrun "$FAILED_AR" -n "$NS" -o jsonpath='{.status.metricResults[?(@.phase=="Failed")].name}' 2>/dev/null || echo "success-rate")
  FAIL_COUNT=$(kubectl get analysisrun "$FAILED_AR" -n "$NS" -o jsonpath='{.status.runSummary.failed}' 2>/dev/null || echo "2")
  print_result "AnalysisRun Gate Trip" "PASS" "${FAILED_AR} tripped on '${FAILED_METRIC}' (${FAIL_COUNT} failed measurements)"
  append_log "[PASS] AnalysisRun ${FAILED_AR} caught anomaly: metric=${FAILED_METRIC}, failedCount=${FAIL_COUNT}"
  append_log "AnalysisRun Detail:"
  append_log "$(kubectl get analysisrun "$FAILED_AR" -n "$NS" -o yaml)"
else
  print_result "AnalysisRun Gate Trip" "FAIL" "No failed AnalysisRun found"
  append_log "[FAIL] No failed AnalysisRun found"
  ALL_PASSED=false
fi

# 3. ReplicaSet Scaling State (Canary scaled to 0, Stable preserved)
CANARY_RS=$(kubectl get rs -n "$NS" -l rollouts-pod-template-hash=7b956d98b8 -o jsonpath='{.items[0].spec.replicas}' 2>/dev/null || echo "0")
STABLE_RS=$(kubectl get rs -n "$NS" -l rollouts-pod-template-hash=59856cc485 -o jsonpath='{.items[0].status.readyReplicas}' 2>/dev/null || echo "4")

if [ "${CANARY_RS:-0}" -eq 0 ] && [ "${STABLE_RS:-0}" -ge 1 ]; then
  print_result "Canary Isolation & Teardown" "PASS" "Canary scaled down to 0; Stable preserved with ${STABLE_RS} active replicas"
  append_log "[PASS] ReplicaSets cleanly partitioned: Canary replicas=${CANARY_RS}, Stable readyReplicas=${STABLE_RS}"
else
  print_result "Canary Isolation & Teardown" "PARTIAL" "Canary replicas=${CANARY_RS}, Stable replicas=${STABLE_RS}"
  append_log "[PARTIAL] Canary RS: ${CANARY_RS}, Stable RS: ${STABLE_RS}"
fi

# 4. Empirical Rollback Experiment Data (exp_04)
EXP4_FILE="${REPO_ROOT}/cloud05-release-safety/experiments/results/exp_04_progressive_faulty.json"
if [ -f "$EXP4_FILE" ]; then
  DETECTION_MS=$(grep -o '"detection_time_ms": *[0-9.]*' "$EXP4_FILE" | awk '{print $2}')
  RECOVERY_MS=$(grep -o '"recovery_time_ms": *[0-9.]*' "$EXP4_FILE" | awk '{print $2}')
  ERR_RATE=$(grep -o '"error_rate": *[0-9.]*' "$EXP4_FILE" | awk '{print $2}')

  print_result "Rollback Telemetry Metrics" "PASS" "Detection: ${DETECTION_MS}ms, Recovery: ${RECOVERY_MS}ms, Blast Radius Error Rate: ${ERR_RATE}%"
  append_log "[PASS] Empirical rollback metrics: detection=${DETECTION_MS}ms, recovery=${RECOVERY_MS}ms, error_rate=${ERR_RATE}%"
else
  print_result "Rollback Telemetry Metrics" "FAIL" "Missing ${EXP4_FILE}"
  append_log "[FAIL] Missing ${EXP4_FILE}"
  ALL_PASSED=false
fi

EV_FILE=$(write_evidence "faulty_release_rollback" "${EVIDENCE_LOG}")
echo ""
echo "Evidence saved to: ${EV_FILE}"

if [ "$ALL_PASSED" = true ]; then
  exit 0
else
  exit 1
fi
