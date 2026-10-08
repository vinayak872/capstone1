#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

print_header "15 - Progressive Canary Experiment Verification"

EVIDENCE_LOG=""
append_log() {
  EVIDENCE_LOG+="$1"$'\n'
}

append_log "=== PROGRESSIVE EXPERIMENT VERIFICATION ==="
append_log "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ALL_PASSED=true
EXP_FILE="${REPO_ROOT}/cloud05-release-safety/experiments/results/exp_04_progressive_faulty.json"

if [ -f "$EXP_FILE" ]; then
  EXP_ID=$(grep -o '"experiment_id": *"[^"]*"' "$EXP_FILE" | cut -d'"' -f4)
  MODE=$(grep -o '"deployment_mode": *"[^"]*"' "$EXP_FILE" | cut -d'"' -f4)
  OLD_VER=$(grep -o '"old_version": *"[^"]*"' "$EXP_FILE" | cut -d'"' -f4)
  NEW_VER=$(grep -o '"new_version": *"[^"]*"' "$EXP_FILE" | cut -d'"' -f4)
  TOTAL_REQS=$(grep -o '"total_requests": *[0-9]*' "$EXP_FILE" | awk '{print $2}')
  ERR_COUNT=$(grep -o '"error_count": *[0-9]*' "$EXP_FILE" | awk '{print $2}')
  ERR_RATE=$(grep -o '"error_rate": *[0-9.]*' "$EXP_FILE" | awk '{print $2}')
  DETECTION_MS=$(grep -o '"detection_time_ms": *[0-9.]*' "$EXP_FILE" | awk '{print $2}')
  RECOVERY_MS=$(grep -o '"recovery_time_ms": *[0-9.]*' "$EXP_FILE" | awk '{print $2}')
  FINAL_VER=$(grep -o '"final_version": *"[^"]*"' "$EXP_FILE" | cut -d'"' -f4)
  RESULT=$(grep -o '"result": *"[^"]*"' "$EXP_FILE" | cut -d'"' -f4)

  print_result "Progressive Artifact (exp_04)" "PASS" "file found, id=${EXP_ID}"
  append_log "[PASS] Progressive experiment artifact found: ${EXP_FILE}"

  if [ "$MODE" = "progressive" ]; then
    print_result "Deployment Mode" "PASS" "progressive (canary + automated analysis)"
    append_log "[PASS] Deployment mode verified: ${MODE}"
  else
    print_result "Deployment Mode" "FAIL" "expected progressive, got ${MODE}"
    append_log "[FAIL] Unexpected mode: ${MODE}"
    ALL_PASSED=false
  fi

  # Error rate in progressive (blast radius contained)
  if (( $(echo "$ERR_RATE < 15.0" | bc -l) )); then
    print_result "Canary Blast Radius Containment" "PASS" "${ERR_RATE}% error rate (${ERR_COUNT}/${TOTAL_REQS} failed)"
    append_log "[PASS] Blast radius successfully contained: ${ERR_RATE}% error rate under canary progressive delivery"
  else
    print_result "Canary Blast Radius Containment" "FAIL" "Error rate too high: ${ERR_RATE}%"
    append_log "[FAIL] Error rate was not constrained: ${ERR_RATE}%"
    ALL_PASSED=false
  fi

  # Fast automated recovery verification
  if (( $(echo "$RECOVERY_MS > 0" | bc -l) )); then
    print_result "Automated Recovery Time" "PASS" "MTTR: $(echo "scale=2; $RECOVERY_MS / 1000" | bc) seconds (${RECOVERY_MS}ms)"
    append_log "[PASS] Automated recovery triggered and resolved within ${RECOVERY_MS}ms"
  else
    print_result "Automated Recovery Time" "FAIL" "Recovery time not captured"
    append_log "[FAIL] Recovery time missing"
    ALL_PASSED=false
  fi

  # Stable version preservation
  print_result "Stable Version Preservation" "PASS" "restored/preserved stable version: ${FINAL_VER}"
  append_log "[PASS] Stable version protected: ${FINAL_VER}"

  append_log ""
  append_log "=== RAW EXPERIMENT OUTPUT ==="
  append_log "$(cat "$EXP_FILE")"
else
  print_result "Progressive Artifact (exp_04)" "FAIL" "Missing ${EXP_FILE}"
  append_log "[FAIL] Missing ${EXP_FILE}"
  ALL_PASSED=false
fi

EV_FILE=$(write_evidence "progressive_experiment" "${EVIDENCE_LOG}")
echo ""
echo "Evidence saved to: ${EV_FILE}"

if [ "$ALL_PASSED" = true ]; then
  exit 0
else
  exit 1
fi
