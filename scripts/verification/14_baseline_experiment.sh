#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

print_header "14 - Baseline (Conventional) Deployment Experiment Verification"

EVIDENCE_LOG=""
append_log() {
  EVIDENCE_LOG+="$1"$'\n'
}

append_log "=== BASELINE EXPERIMENT VERIFICATION ==="
append_log "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ALL_PASSED=true
EXP_FILE="${REPO_ROOT}/cloud05-release-safety/experiments/results/exp_02_baseline_faulty.json"

if [ -f "$EXP_FILE" ]; then
  EXP_ID=$(grep -o '"experiment_id": *"[^"]*"' "$EXP_FILE" | cut -d'"' -f4)
  TS=$(grep -o '"timestamp": *"[^"]*"' "$EXP_FILE" | cut -d'"' -f4)
  MODE=$(grep -o '"deployment_mode": *"[^"]*"' "$EXP_FILE" | cut -d'"' -f4)
  OLD_VER=$(grep -o '"old_version": *"[^"]*"' "$EXP_FILE" | cut -d'"' -f4)
  NEW_VER=$(grep -o '"new_version": *"[^"]*"' "$EXP_FILE" | cut -d'"' -f4)
  FAIL_MODE=$(grep -o '"failure_mode": *"[^"]*"' "$EXP_FILE" | cut -d'"' -f4)
  TOTAL_REQS=$(grep -o '"total_requests": *[0-9]*' "$EXP_FILE" | awk '{print $2}')
  ERR_COUNT=$(grep -o '"error_count": *[0-9]*' "$EXP_FILE" | awk '{print $2}')
  ERR_RATE=$(grep -o '"error_rate": *[0-9.]*' "$EXP_FILE" | awk '{print $2}')
  P95_LAT=$(grep -o '"p95_latency": *[0-9.]*' "$EXP_FILE" | awk '{print $2}')
  RESULT=$(grep -o '"result": *"[^"]*"' "$EXP_FILE" | cut -d'"' -f4)
  FINAL_VER=$(grep -o '"final_version": *"[^"]*"' "$EXP_FILE" | cut -d'"' -f4)

  print_result "Baseline Artifact (exp_02)" "PASS" "file found, id=${EXP_ID}"
  append_log "[PASS] Baseline experiment artifact found: ${EXP_FILE}"

  if [ "$MODE" = "baseline" ]; then
    print_result "Deployment Mode" "PASS" "baseline (all-at-once rollout)"
    append_log "[PASS] Deployment mode verified: ${MODE}"
  else
    print_result "Deployment Mode" "FAIL" "expected baseline, got ${MODE}"
    append_log "[FAIL] Unexpected mode: ${MODE}"
    ALL_PASSED=false
  fi

  # Error rate in baseline (unprotected faulty release)
  if (( $(echo "$ERR_RATE > 40.0" | bc -l) )); then
    print_result "Baseline Blast Radius" "PASS" "${ERR_RATE}% error rate (${ERR_COUNT}/${TOTAL_REQS} failed)"
    append_log "[PASS] Severe degradation confirmed: ${ERR_RATE}% error rate under baseline"
  else
    print_result "Baseline Blast Radius" "PARTIAL" "Error rate: ${ERR_RATE}%"
    append_log "[PARTIAL] Error rate: ${ERR_RATE}%"
  fi

  # Verify outcome is unprotected degradation
  if [ "$RESULT" = "DEGRADED_UNPROTECTED" ]; then
    print_result "Baseline Protection Gate" "PASS" "DEGRADED_UNPROTECTED (fault propagated to prod version ${FINAL_VER})"
    append_log "[PASS] Conventional deployment offered 0 safety gating; release resulted in DEGRADED_UNPROTECTED"
  else
    print_result "Baseline Protection Gate" "FAIL" "Unexpected outcome: ${RESULT}"
    append_log "[FAIL] Outcome was: ${RESULT}"
    ALL_PASSED=false
  fi

  append_log ""
  append_log "=== RAW EXPERIMENT OUTPUT ==="
  append_log "$(cat "$EXP_FILE")"
else
  print_result "Baseline Artifact (exp_02)" "FAIL" "File missing: ${EXP_FILE}"
  append_log "[FAIL] Missing ${EXP_FILE}"
  ALL_PASSED=false
fi

EV_FILE=$(write_evidence "baseline_experiment" "${EVIDENCE_LOG}")
echo ""
echo "Evidence saved to: ${EV_FILE}"

if [ "$ALL_PASSED" = true ]; then
  exit 0
else
  exit 1
fi
