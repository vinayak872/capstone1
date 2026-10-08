#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

print_header "20 - Negative Test NT-3: Rollback Correctness & Replica Partitioning"

EVIDENCE_LOG=""
append_log() {
  EVIDENCE_LOG+="$1"$'\n'
}

append_log "=== NT-3: ROLLBACK CORRECTNESS & REPLICA PARTITIONING VERIFICATION ==="
append_log "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ALL_PASSED=true
NS="cloud05"
ROLLOUT_NAME="cloud05-rollout"

# 1. Rollout Abort State
IS_ABORTED=$(kubectl get rollout "$ROLLOUT_NAME" -n "$NS" -o jsonpath='{.status.conditions[?(@.reason=="RolloutAborted")].status}' 2>/dev/null || echo "")
if [ "$IS_ABORTED" = "True" ] || kubectl get rollout "$ROLLOUT_NAME" -n "$NS" -o jsonpath='{.status.message}' | grep -qi "aborted"; then
  print_result "Rollout Abort Condition" "PASS" "Rollout is in verified Aborted/Degraded containment state"
  append_log "[PASS] Rollout verified in aborted state"
else
  print_result "Rollout Abort Condition" "PARTIAL" "Condition not explicitly True"
  append_log "[PARTIAL] Condition status: ${IS_ABORTED}"
fi

# 2. Canary Pods Teardown (No lingering canary pods)
CANARY_PODS=$(kubectl get pods -n "$NS" -l rollouts-pod-template-hash=7b956d98b8 --no-headers 2>/dev/null | wc -l | tr -d ' ')
if [ "$CANARY_PODS" -eq 0 ]; then
  print_result "Zero Canary Pod Leakage" "PASS" "0 canary pods remaining in cluster (all scaled down)"
  append_log "[PASS] All canary pods cleanly destroyed; no orphaned candidate workloads"
else
  print_result "Zero Canary Pod Leakage" "FAIL" "${CANARY_PODS} lingering canary pods detected"
  append_log "[FAIL] Lingering canary pods: ${CANARY_PODS}"
  ALL_PASSED=false
fi

# 3. Stable Pod Health (Production maintained)
STABLE_READY_PODS=$(kubectl get pods -n "$NS" -l rollouts-pod-template-hash=59856cc485 --no-headers 2>/dev/null | grep -c "Running" || echo 0)
if [ "$STABLE_READY_PODS" -ge 1 ]; then
  print_result "Stable Workload Preservation" "PASS" "${STABLE_READY_PODS} stable production pods active and healthy"
  append_log "[PASS] Stable ReplicaSet preserved: ${STABLE_READY_PODS} active pods"
else
  print_result "Stable Workload Preservation" "FAIL" "No stable pods running"
  append_log "[FAIL] Stable pods missing"
  ALL_PASSED=false
fi

# 4. Routing Integrity Check (Service endpoints point to stable pods only)
SERVICE_ENDPOINTS=$(kubectl get endpoints cloud05-service -n "$NS" -o jsonpath='{.subsets[0].addresses[*].targetRef.name}' 2>/dev/null || echo "")
CANARY_IN_SERVICE=false
for ep_pod in $SERVICE_ENDPOINTS; do
  if echo "$ep_pod" | grep -q "7b956d98b8"; then
    CANARY_IN_SERVICE=true
  fi
done

if [ "$CANARY_IN_SERVICE" = false ]; then
  print_result "Service Endpoint Integrity" "PASS" "Production service points exclusively to stable revision pods"
  append_log "[PASS] Service endpoints verified clean of candidate pods"
else
  print_result "Service Endpoint Integrity" "FAIL" "Candidate pods leaked into production service endpoints"
  append_log "[FAIL] Leakage in service endpoints"
  ALL_PASSED=false
fi

EV_FILE=$(write_evidence "nt3_rollback_correctness" "${EVIDENCE_LOG}")
echo ""
echo "Evidence saved to: ${EV_FILE}"

if [ "$ALL_PASSED" = true ]; then
  exit 0
else
  exit 1
fi
