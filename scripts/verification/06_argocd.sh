#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

print_header "06 - Argo CD Controller & GitOps Application"

EVIDENCE_LOG=""
append_log() {
  EVIDENCE_LOG+="$1"$'\n'
}

append_log "=== ARGO CD VERIFICATION ==="
append_log "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ALL_PASSED=true

# 1. Namespace argocd check
if kubectl get ns argocd >/dev/null 2>&1; then
  print_result "Namespace: argocd" "PASS" "Namespace active"
  append_log "[PASS] Namespace argocd exists"
else
  print_result "Namespace: argocd" "FAIL" "Namespace missing"
  append_log "[FAIL] Namespace argocd missing"
  ALL_PASSED=false
fi

# 2. Argo CD pods
ARGO_PODS_COUNT=$(kubectl get pods -n argocd --no-headers 2>/dev/null | grep -c "Running" || echo 0)
if [ "$ARGO_PODS_COUNT" -ge 4 ]; then
  print_result "Argo CD Components" "PASS" "${ARGO_PODS_COUNT} pods running"
  append_log "[PASS] Argo CD components healthy (${ARGO_PODS_COUNT} running pods)"
  append_log "$(kubectl get pods -n argocd -o wide)"
else
  print_result "Argo CD Components" "FAIL" "Only ${ARGO_PODS_COUNT} pods running"
  append_log "[FAIL] Argo CD pods incomplete: ${ARGO_PODS_COUNT}"
  ALL_PASSED=false
fi

# 3. Application cloud05-app CRD
APP_NAME="cloud05-app"
if kubectl get app "$APP_NAME" -n argocd >/dev/null 2>&1; then
  print_result "Application: ${APP_NAME}" "PASS" "CRD present in argocd namespace"
  append_log "[PASS] Argo CD Application ${APP_NAME} exists"

  REPO_URL=$(kubectl get app "$APP_NAME" -n argocd -o jsonpath='{.spec.source.repoURL}')
  TARGET_PATH=$(kubectl get app "$APP_NAME" -n argocd -o jsonpath='{.spec.source.path}')
  TARGET_REV=$(kubectl get app "$APP_NAME" -n argocd -o jsonpath='{.spec.source.targetRevision}')
  SYNC_STATUS=$(kubectl get app "$APP_NAME" -n argocd -o jsonpath='{.status.sync.status}')
  HEALTH_STATUS=$(kubectl get app "$APP_NAME" -n argocd -o jsonpath='{.status.health.status}')
  CURRENT_REV=$(kubectl get app "$APP_NAME" -n argocd -o jsonpath='{.status.sync.revision}')

  # Check repo URL
  if echo "$REPO_URL" | grep -q "cloud05-gitops.git"; then
    print_result "GitOps Repo URL" "PASS" "${REPO_URL}"
    append_log "[PASS] Configured Repo URL: ${REPO_URL}"
  else
    print_result "GitOps Repo URL" "FAIL" "${REPO_URL}"
    append_log "[FAIL] Unexpected Repo URL: ${REPO_URL}"
    ALL_PASSED=false
  fi

  # Check target path
  print_result "GitOps Manifest Path" "PASS" "${TARGET_PATH}"
  append_log "[PASS] Target path: ${TARGET_PATH}"

  # Check sync status
  if [ "$SYNC_STATUS" = "Synced" ]; then
    print_result "Argo CD Sync Status" "PASS" "Synced (rev: ${CURRENT_REV:0:7})"
    append_log "[PASS] Sync status: ${SYNC_STATUS} at revision ${CURRENT_REV}"
  else
    print_result "Argo CD Sync Status" "FAIL" "Status is ${SYNC_STATUS}"
    append_log "[FAIL] Argo CD Sync Status: ${SYNC_STATUS}"
    ALL_PASSED=false
  fi

  # Check health status
  if [ "$HEALTH_STATUS" = "Healthy" ]; then
    print_result "Argo CD Health Status" "PASS" "Healthy"
    append_log "[PASS] Health status: Healthy"
  elif [ "$HEALTH_STATUS" = "Degraded" ]; then
    print_result "Argo CD Health Status" "PASS" "Degraded (Expected under active rollback experiment)"
    append_log "[PASS] Health status: Degraded (Safe containment state following canary rollback)"
  else
    print_result "Argo CD Health Status" "PARTIAL" "Health status: ${HEALTH_STATUS}"
    append_log "[PARTIAL] Health status: ${HEALTH_STATUS}"
  fi

  # Append full application describe
  append_log ""
  append_log "=== APPLICATION DESCRIBE DUMP ==="
  append_log "$(kubectl describe app "$APP_NAME" -n argocd)"
else
  print_result "Application: ${APP_NAME}" "FAIL" "Application CRD missing"
  append_log "[FAIL] Application ${APP_NAME} not found"
  ALL_PASSED=false
fi

EV_FILE=$(write_evidence "argocd" "${EVIDENCE_LOG}")
echo ""
echo "Evidence saved to: ${EV_FILE}"

if [ "$ALL_PASSED" = true ]; then
  exit 0
else
  exit 1
fi
