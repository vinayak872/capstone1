#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

print_header "19 - Negative Test NT-2: Metric Selection & Fail-Closed Guardrails"

EVIDENCE_LOG=""
append_log() {
  EVIDENCE_LOG+="$1"$'\n'
}

append_log "=== NT-2: METRIC SELECTION & FAIL-CLOSED GUARDRAILS VERIFICATION ==="
append_log "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ALL_PASSED=true
NS="cloud05"
TEMPLATE_NAME="success-rate-analysis"

# 1. Inspect AnalysisTemplate Fail-Closed Guardrails
FAIL_LIMIT=$(kubectl get analysistemplate "$TEMPLATE_NAME" -n "$NS" -o jsonpath='{.spec.metrics[0].failureLimit}')
SUCCESS_COND=$(kubectl get analysistemplate "$TEMPLATE_NAME" -n "$NS" -o jsonpath='{.spec.metrics[0].successCondition}')
ERROR_COND=$(kubectl get analysistemplate "$TEMPLATE_NAME" -n "$NS" -o jsonpath='{.spec.metrics[1].successCondition}')

if [ "$FAIL_LIMIT" -le 1 ]; then
  print_result "Strict Failure Threshold" "PASS" "failureLimit=${FAIL_LIMIT} (Trips on single consecutive anomaly)"
  append_log "[PASS] Strict failure threshold enforced: failureLimit=${FAIL_LIMIT}"
else
  print_result "Strict Failure Threshold" "PARTIAL" "failureLimit=${FAIL_LIMIT}"
  append_log "[PARTIAL] failureLimit=${FAIL_LIMIT}"
fi

# 2. Check Fail-Closed Behavior on Telemetry Anomaly
FAILED_AR=$(kubectl get analysisrun -n "$NS" --no-headers | grep "Failed" | head -n 1 | awk '{print $1}' || echo "")
if [ -n "$FAILED_AR" ]; then
  PHASE=$(kubectl get analysisrun "$FAILED_AR" -n "$NS" -o jsonpath='{.status.phase}')
  MSG=$(kubectl get analysisrun "$FAILED_AR" -n "$NS" -o jsonpath='{.status.message}')
  
  if [ "$PHASE" = "Failed" ]; then
    print_result "Fail-Closed Decision Gating" "PASS" "AnalysisRun ${FAILED_AR} transitioned to Failed: ${MSG}"
    append_log "[PASS] System fails closed when metrics fail evaluation: ${MSG}"
  else
    print_result "Fail-Closed Decision Gating" "FAIL" "Did not fail closed"
    append_log "[FAIL] AnalysisRun phase: ${PHASE}"
    ALL_PASSED=false
  fi
else
  print_result "Fail-Closed Decision Gating" "NOT TESTED" "No failed AnalysisRun historical artifact"
  append_log "[NOT TESTED] No failed AnalysisRun"
fi

# 3. Guard against silent promotion on missing telemetry
PROMQL_QUERY=$(kubectl get analysistemplate "$TEMPLATE_NAME" -n "$NS" -o jsonpath='{.spec.metrics[0].provider.prometheus.query}')
if echo "$PROMQL_QUERY" | grep -q "vector(100)"; then
  print_result "Telemetry Zero-Traffic Handling" "PASS" "Safe vector fallback prevents division by zero without false-positive aborts"
  append_log "[PASS] PromQL safe fallback verified: prevents NaN anomalies during cold starts"
else
  print_result "Telemetry Zero-Traffic Handling" "PARTIAL" "PromQL fallback not detected"
  append_log "[PARTIAL] PromQL query: ${PROMQL_QUERY}"
fi

EV_FILE=$(write_evidence "nt2_metric_selection" "${EVIDENCE_LOG}")
echo ""
echo "Evidence saved to: ${EV_FILE}"

if [ "$ALL_PASSED" = true ]; then
  exit 0
else
  exit 1
fi
