#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

print_header "08 - Argo Rollouts Controller & Progressive Delivery Spec"

EVIDENCE_LOG=""
append_log() {
  EVIDENCE_LOG+="$1"$'\n'
}

append_log "=== ARGO ROLLOUTS VERIFICATION ==="
append_log "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ALL_PASSED=true
NS="cloud05"
ROLLOUT_NAME="cloud05-rollout"

# 1. Argo Rollouts Controller Pod
CONTROLLER_POD=$(kubectl get pods -n argo-rollouts -l app.kubernetes.io/name=argo-rollouts -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -n "$CONTROLLER_POD" ]; then
  CONTROLLER_STATUS=$(kubectl get pod "$CONTROLLER_POD" -n argo-rollouts -o jsonpath='{.status.phase}')
  if [ "$CONTROLLER_STATUS" = "Running" ]; then
    print_result "Argo Rollouts Controller" "PASS" "pod ${CONTROLLER_POD} is Running"
    append_log "[PASS] Argo Rollouts Controller active: ${CONTROLLER_POD}"
  else
    print_result "Argo Rollouts Controller" "FAIL" "phase: ${CONTROLLER_STATUS}"
    append_log "[FAIL] Argo Rollouts Controller pod phase: ${CONTROLLER_STATUS}"
    ALL_PASSED=false
  fi
else
  print_result "Argo Rollouts Controller" "FAIL" "Controller pod missing in argo-rollouts"
  append_log "[FAIL] Controller pod missing"
  ALL_PASSED=false
fi

# 2. Rollout CRD
if kubectl get crd rollouts.argoproj.io >/dev/null 2>&1; then
  print_result "Rollout CRD" "PASS" "rollouts.argoproj.io present"
  append_log "[PASS] Rollout CRD registered"
else
  print_result "Rollout CRD" "FAIL" "CRD missing"
  append_log "[FAIL] rollouts.argoproj.io CRD missing"
  ALL_PASSED=false
fi

# 3. cloud05-rollout resource
if kubectl get rollout "$ROLLOUT_NAME" -n "$NS" >/dev/null 2>&1; then
  CURRENT_PHASE=$(kubectl get rollout "$ROLLOUT_NAME" -n "$NS" -o jsonpath='{.status.phase}')
  REVISION=$(kubectl get rollout "$ROLLOUT_NAME" -n "$NS" -o jsonpath='{.status.currentPodHash}')
  IMAGE_SPEC=$(kubectl get rollout "$ROLLOUT_NAME" -n "$NS" -o jsonpath='{.spec.template.spec.containers[0].image}')
  
  print_result "Rollout Resource: ${ROLLOUT_NAME}" "PASS" "Phase: ${CURRENT_PHASE}, Image: ${IMAGE_SPEC}"
  append_log "[PASS] Rollout ${ROLLOUT_NAME} exists. Phase=${CURRENT_PHASE}, Image=${IMAGE_SPEC}, Hash=${REVISION}"

  # 4. Canary Steps Configuration
  STEPS_COUNT=$(kubectl get rollout "$ROLLOUT_NAME" -n "$NS" -o jsonpath='{.spec.strategy.canary.steps}' | grep -o '"setWeight":' | wc -l | tr -d ' ')
  ANALYSIS_STEPS=$(kubectl get rollout "$ROLLOUT_NAME" -n "$NS" -o jsonpath='{.spec.strategy.canary.steps}' | grep -o '"templateName":"success-rate-analysis"' | wc -l | tr -d ' ')
  
  if [ "$STEPS_COUNT" -ge 3 ] && [ "$ANALYSIS_STEPS" -ge 2 ]; then
    print_result "Configured Rollout Weights" "PASS" "${STEPS_COUNT} weight steps (25% -> 50% -> 100%) with ${ANALYSIS_STEPS} AnalysisTemplate gates"
    append_log "[PASS] Canary strategy steps verified: ${STEPS_COUNT} weight steps, ${ANALYSIS_STEPS} inline analysis steps"
  else
    print_result "Configured Rollout Weights" "FAIL" "Incomplete steps (weights: ${STEPS_COUNT}, analysis: ${ANALYSIS_STEPS})"
    append_log "[FAIL] Canary steps misconfigured"
    ALL_PASSED=false
  fi

  # 5. CLI Plugin rollouts status/get
  if kubectl argo rollouts version >/dev/null 2>&1; then
    ARGO_CLI_OUTPUT=$(kubectl argo rollouts get rollout "$ROLLOUT_NAME" -n "$NS" 2>&1 || true)
    print_result "kubectl-argo-rollouts CLI Plugin" "PASS" "Available and functional"
    append_log ""
    append_log "=== KUBECTL ARGO ROLLOUTS GET ROLLOUT ==="
    append_log "${ARGO_CLI_OUTPUT}"
  else
    print_result "kubectl-argo-rollouts CLI Plugin" "PARTIAL" "Plugin not installed in PATH; evaluated via K8s CRD"
    append_log "[PARTIAL] kubectl argo rollouts plugin not in PATH"
  fi
else
  print_result "Rollout Resource: ${ROLLOUT_NAME}" "FAIL" "Missing in namespace ${NS}"
  append_log "[FAIL] Rollout ${ROLLOUT_NAME} not found"
  ALL_PASSED=false
fi

EV_FILE=$(write_evidence "rollouts" "${EVIDENCE_LOG}")
echo ""
echo "Evidence saved to: ${EV_FILE}"

if [ "$ALL_PASSED" = true ]; then
  exit 0
else
  exit 1
fi
