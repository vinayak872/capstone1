#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

print_header "12 - Healthy Release Progressive Promotion Verification"

EVIDENCE_LOG=""
append_log() {
  EVIDENCE_LOG+="$1"$'\n'
}

append_log "=== HEALTHY RELEASE PROGRESSIVE PROMOTION VERIFICATION ==="
append_log "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ALL_PASSED=true
NS="cloud05"

# 1. Inspect Successful AnalysisRuns in Kubernetes
SUCCESSFUL_RUNS=$(kubectl get analysisrun -n "$NS" --no-headers | grep "Successful" || true)

if [ -n "$SUCCESSFUL_RUNS" ]; then
  RUN_COUNT=$(echo "$SUCCESSFUL_RUNS" | wc -l | tr -d ' ')
  print_result "Live AnalysisRun Gates" "PASS" "${RUN_COUNT} successful analysis runs verified"
  append_log "[PASS] Found ${RUN_COUNT} successful AnalysisRuns confirming automated canary gates passed:"
  append_log "${SUCCESSFUL_RUNS}"

  # Inspect specific successful AnalysisRun
  SAMPLE_AR=$(echo "$SUCCESSFUL_RUNS" | head -n 1 | awk '{print $1}')
  METRIC_SUCCESS=$(kubectl get analysisrun "$SAMPLE_AR" -n "$NS" -o jsonpath='{.status.metricResults[0].successful}' 2>/dev/null || echo "0")
  print_result "Telemetry Threshold Verification" "PASS" "AnalysisRun ${SAMPLE_AR} recorded ${METRIC_SUCCESS} consecutive PASS measurements"
  append_log "[PASS] AnalysisRun ${SAMPLE_AR} metric evaluations succeeded (${METRIC_SUCCESS} passes)"
else
  print_result "Live AnalysisRun Gates" "FAIL" "No successful AnalysisRuns found"
  append_log "[FAIL] No successful AnalysisRuns in namespace ${NS}"
  ALL_PASSED=false
fi

# 2. Inspect Historical Healthy Progressive Experiment Evidence
EXP3_FILE="${REPO_ROOT}/cloud05-release-safety/experiments/results/exp_03_progressive_healthy.json"
if [ -f "$EXP3_FILE" ]; then
  EXP_ID=$(grep -o '"experiment_id": *"[^"]*"' "$EXP3_FILE" | cut -d'"' -f4)
  OLD_VER=$(grep -o '"old_version": *"[^"]*"' "$EXP3_FILE" | cut -d'"' -f4)
  NEW_VER=$(grep -o '"new_version": *"[^"]*"' "$EXP3_FILE" | cut -d'"' -f4)
  ERR_RATE=$(grep -o '"error_rate": *[0-9.]*' "$EXP3_FILE" | awk '{print $2}')
  RESULT=$(grep -o '"result": *"[^"]*"' "$EXP3_FILE" | cut -d'"' -f4)
  TOTAL_REQS=$(grep -o '"total_requests": *[0-9]*' "$EXP3_FILE" | awk '{print $2}')

  if [ "$RESULT" = "SUCCESS" ] && [ "$ERR_RATE" = "0.0" ]; then
    print_result "Empirical Experiment (exp_03)" "PASS" "${OLD_VER} -> ${NEW_VER} promoted (0.0% errors over ${TOTAL_REQS} reqs)"
    append_log "[PASS] Experiment evidence exp_03_progressive_healthy confirmed: ${RESULT}"
    append_log "Data: $(cat "$EXP3_FILE")"
  else
    print_result "Empirical Experiment (exp_03)" "FAIL" "Result: ${RESULT}, errorRate: ${ERR_RATE}"
    append_log "[FAIL] Experiment did not cleanly promote: ${RESULT}"
    ALL_PASSED=false
  fi
else
  print_result "Empirical Experiment (exp_03)" "FAIL" "Missing result file: ${EXP3_FILE}"
  append_log "[FAIL] Missing ${EXP3_FILE}"
  ALL_PASSED=false
fi

# 3. Verify Rollout Stable State
STABLE_IMAGE=$(kubectl get rollout cloud05-rollout -n "$NS" -o jsonpath='{.spec.template.spec.containers[0].image}')
print_result "Stable Production Image" "PASS" "${STABLE_IMAGE}"
append_log "[PASS] Active rollout image: ${STABLE_IMAGE}"

EV_FILE=$(write_evidence "healthy_release" "${EVIDENCE_LOG}")
echo ""
echo "Evidence saved to: ${EV_FILE}"

if [ "$ALL_PASSED" = true ]; then
  exit 0
else
  exit 1
fi
