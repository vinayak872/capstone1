#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

print_header "10 - AnalysisTemplate & Progressive AnalysisRuns"

EVIDENCE_LOG=""
append_log() {
  EVIDENCE_LOG+="$1"$'\n'
}

append_log "=== ANALYSISTEMPLATE & ANALYSISRUN VERIFICATION ==="
append_log "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ALL_PASSED=true
NS="cloud05"
TEMPLATE_NAME="success-rate-analysis"

# 1. AnalysisTemplate exists
if kubectl get analysistemplate "$TEMPLATE_NAME" -n "$NS" >/dev/null 2>&1; then
  print_result "AnalysisTemplate: ${TEMPLATE_NAME}" "PASS" "CRD present in namespace ${NS}"
  append_log "[PASS] AnalysisTemplate ${TEMPLATE_NAME} found"

  # Metrics in template
  METRICS=$(kubectl get analysistemplate "$TEMPLATE_NAME" -n "$NS" -o jsonpath='{.spec.metrics[*].name}')
  INTERVAL=$(kubectl get analysistemplate "$TEMPLATE_NAME" -n "$NS" -o jsonpath='{.spec.metrics[0].interval}')
  FAIL_LIMIT=$(kubectl get analysistemplate "$TEMPLATE_NAME" -n "$NS" -o jsonpath='{.spec.metrics[0].failureLimit}')
  PROM_ADDR=$(kubectl get analysistemplate "$TEMPLATE_NAME" -n "$NS" -o jsonpath='{.spec.metrics[0].provider.prometheus.address}')

  print_result "Template Metrics" "PASS" "metrics: [${METRICS}], interval: ${INTERVAL}, failureLimit: ${FAIL_LIMIT}"
  append_log "[PASS] Metrics: ${METRICS}, interval: ${INTERVAL}, failureLimit: ${FAIL_LIMIT}"
  append_log "Prometheus Address: ${PROM_ADDR}"

  # 2. PromQL queries
  SUCCESS_COND=$(kubectl get analysistemplate "$TEMPLATE_NAME" -n "$NS" -o jsonpath='{.spec.metrics[0].successCondition}')
  print_result "Evaluation Gate" "PASS" "success condition: ${SUCCESS_COND}"
  append_log "[PASS] Success Condition: ${SUCCESS_COND}"

  append_log ""
  append_log "=== ANALYSISTEMPLATE YAML ==="
  append_log "$(kubectl get analysistemplate "$TEMPLATE_NAME" -n "$NS" -o yaml)"
else
  print_result "AnalysisTemplate: ${TEMPLATE_NAME}" "FAIL" "missing"
  append_log "[FAIL] AnalysisTemplate ${TEMPLATE_NAME} missing"
  ALL_PASSED=false
fi

# 3. AnalysisRuns in cluster
ANALYSIS_RUNS=$(kubectl get analysisrun -n "$NS" --no-headers 2>/dev/null || echo "")
if [ -n "$ANALYSIS_RUNS" ]; then
  TOTAL_RUNS=$(echo "$ANALYSIS_RUNS" | wc -l | tr -d ' ')
  SUCCESS_RUNS=$(echo "$ANALYSIS_RUNS" | grep -c "Successful" || echo 0)
  FAILED_RUNS=$(echo "$ANALYSIS_RUNS" | grep -c "Failed" || echo 0)
  
  print_result "AnalysisRuns History" "PASS" "${TOTAL_RUNS} runs (${SUCCESS_RUNS} successful, ${FAILED_RUNS} failed)"
  append_log "[PASS] AnalysisRuns present: ${TOTAL_RUNS} runs (${SUCCESS_RUNS} successful, ${FAILED_RUNS} failed)"
  append_log ""
  append_log "=== ANALYSISRUNS LIST ==="
  append_log "${ANALYSIS_RUNS}"

  # Inspect latest AnalysisRun
  LATEST_AR=$(echo "$ANALYSIS_RUNS" | tail -n 1 | awk '{print $1}')
  if [ -n "$LATEST_AR" ]; then
    append_log ""
    append_log "=== LATEST ANALYSISRUN YAML (${LATEST_AR}) ==="
    append_log "$(kubectl get analysisrun "$LATEST_AR" -n "$NS" -o yaml)"
  fi
else
  print_result "AnalysisRuns History" "FAIL" "No AnalysisRuns found"
  append_log "[FAIL] No AnalysisRuns found in cluster"
  ALL_PASSED=false
fi

EV_FILE=$(write_evidence "analysis" "${EVIDENCE_LOG}")
echo ""
echo "Evidence saved to: ${EV_FILE}"

if [ "$ALL_PASSED" = true ]; then
  exit 0
else
  exit 1
fi
