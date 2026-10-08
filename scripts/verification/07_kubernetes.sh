#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

print_header "07 - Kubernetes Cluster & Workload Resources"

EVIDENCE_LOG=""
append_log() {
  EVIDENCE_LOG+="$1"$'\n'
}

append_log "=== KUBERNETES WORKLOAD VERIFICATION ==="
append_log "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ALL_PASSED=true
NS="cloud05"

# 1. Cluster Reachability
if kubectl cluster-info >/dev/null 2>&1; then
  K8S_SERVER=$(kubectl version -o json 2>/dev/null | grep -o '"gitVersion": *"[^"]*"' | head -n 1 | cut -d'"' -f4 || echo "v1.x")
  print_result "Kubernetes API Server" "PASS" "reachable (${K8S_SERVER})"
  append_log "[PASS] Kubernetes cluster reachable. Server version: ${K8S_SERVER}"
else
  print_result "Kubernetes API Server" "FAIL" "unreachable"
  append_log "[FAIL] Kubernetes API unreachable"
  write_evidence "kubernetes" "${EVIDENCE_LOG}"
  exit 1
fi

# 2. Namespace cloud05
if kubectl get ns "$NS" >/dev/null 2>&1; then
  print_result "Namespace ${NS}" "PASS" "active"
  append_log "[PASS] Namespace ${NS} exists"
else
  print_result "Namespace ${NS}" "FAIL" "missing"
  append_log "[FAIL] Namespace ${NS} missing"
  ALL_PASSED=false
fi

# 3. Dynamic Pods inspection
POD_NAMES=$(kubectl get pods -n "$NS" -l app=cloud05-demo -o jsonpath='{.items[*].metadata.name}')
TOTAL_PODS=$(echo "$POD_NAMES" | wc -w | tr -d ' ')
READY_PODS=$(kubectl get pods -n "$NS" -l app=cloud05-demo -o jsonpath='{range .items[*]}{.status.containerStatuses[0].ready}{" "}{end}' | grep -o "true" | wc -l | tr -d ' ')

if [ "$TOTAL_PODS" -gt 0 ]; then
  print_result "Application Pods" "PASS" "${READY_PODS}/${TOTAL_PODS} ready"
  append_log "[PASS] Pods dynamic count: ${READY_PODS} ready out of ${TOTAL_PODS} total"
else
  print_result "Application Pods" "FAIL" "No pods running"
  append_log "[FAIL] No pods found in namespace ${NS}"
  ALL_PASSED=false
fi

# 4. Services
for svc in "cloud05-service" "cloud05-canary-service"; do
  if kubectl get svc "$svc" -n "$NS" >/dev/null 2>&1; then
    PORT_SPEC=$(kubectl get svc "$svc" -n "$NS" -o jsonpath='{.spec.ports[0].port}:{.spec.ports[0].targetPort}')
    print_result "Service: ${svc}" "PASS" "Port mapping: ${PORT_SPEC}"
    append_log "[PASS] Service ${svc} exists with port ${PORT_SPEC}"
  else
    print_result "Service: ${svc}" "FAIL" "missing"
    append_log "[FAIL] Service ${svc} missing"
    ALL_PASSED=false
  fi
done

# 5. ConfigMap
if kubectl get cm cloud05-config -n "$NS" >/dev/null 2>&1; then
  CM_KEYS=$(kubectl get cm cloud05-config -n "$NS" -o jsonpath='{.data}' | grep -o '"[^"]*":' | tr -d '":' | tr '\n' ' ')
  print_result "ConfigMap: cloud05-config" "PASS" "keys: ${CM_KEYS}"
  append_log "[PASS] ConfigMap cloud05-config exists with keys: ${CM_KEYS}"
else
  print_result "ConfigMap: cloud05-config" "FAIL" "missing"
  append_log "[FAIL] ConfigMap cloud05-config missing"
  ALL_PASSED=false
fi

# 6. Resource Requests & Limits inspection
CONTAINER_JSON=$(kubectl get rollout cloud05-rollout -n "$NS" -o jsonpath='{.spec.template.spec.containers[0]}' 2>/dev/null || echo "{}")
CPU_REQ=$(echo "$CONTAINER_JSON" | grep -o '"cpu":"[^"]*"' | head -n 1 | cut -d'"' -f4 || echo "unset")
MEM_REQ=$(echo "$CONTAINER_JSON" | grep -o '"memory":"[^"]*"' | head -n 1 | cut -d'"' -f4 || echo "unset")
CPU_LIM=$(echo "$CONTAINER_JSON" | grep -o '"cpu":"[^"]*"' | tail -n 1 | cut -d'"' -f4 || echo "unset")
MEM_LIM=$(echo "$CONTAINER_JSON" | grep -o '"memory":"[^"]*"' | tail -n 1 | cut -d'"' -f4 || echo "unset")

if [ -n "$CPU_REQ" ] && [ "$CPU_REQ" != "unset" ]; then
  print_result "Resource Requests/Limits" "PASS" "req: [${CPU_REQ}, ${MEM_REQ}] / lim: [${CPU_LIM}, ${MEM_LIM}]"
  append_log "[PASS] Resource envelope verified: cpu_req=${CPU_REQ}, mem_req=${MEM_REQ}, cpu_lim=${CPU_LIM}, mem_lim=${MEM_LIM}"
else
  print_result "Resource Requests/Limits" "PARTIAL" "requests or limits not fully specified"
  append_log "[PARTIAL] Container specs: ${CONTAINER_JSON}"
fi

# 7. Probes inspection (Liveness & Readiness)
LIVENESS_PATH=$(kubectl get rollout cloud05-rollout -n "$NS" -o jsonpath='{.spec.template.spec.containers[0].livenessProbe.httpGet.path}' 2>/dev/null || echo "")
READINESS_PATH=$(kubectl get rollout cloud05-rollout -n "$NS" -o jsonpath='{.spec.template.spec.containers[0].readinessProbe.httpGet.path}' 2>/dev/null || echo "")

if [ "$LIVENESS_PATH" = "/health" ] && [ "$READINESS_PATH" = "/ready" ]; then
  print_result "Health & Readiness Probes" "PASS" "liveness=${LIVENESS_PATH}, readiness=${READINESS_PATH}"
  append_log "[PASS] Health probes properly configured on Rollout spec"
else
  print_result "Health & Readiness Probes" "FAIL" "liveness=${LIVENESS_PATH}, readiness=${READINESS_PATH}"
  append_log "[FAIL] Health probes missing or misconfigured"
  ALL_PASSED=false
fi

append_log ""
append_log "=== POD LIST DUMP ==="
append_log "$(kubectl get pods -n "$NS" -o wide)"

EV_FILE=$(write_evidence "kubernetes" "${EVIDENCE_LOG}")
echo ""
echo "Evidence saved to: ${EV_FILE}"

if [ "$ALL_PASSED" = true ]; then
  exit 0
else
  exit 1
fi
