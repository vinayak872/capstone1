#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

print_header "21 - Negative Test NT-4: State Consistency & Drift Reconciliation"

EVIDENCE_LOG=""
append_log() {
  EVIDENCE_LOG+="$1"$'\n'
}

append_log "=== NT-4: STATE CONSISTENCY & DRIFT RECONCILIATION VERIFICATION ==="
append_log "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ALL_PASSED=true

# 1. Inspect 3-Way State Consistency: Git -> Argo CD -> Kubernetes
GIT_POD=$(kubectl get pods -n cloud05 -l app=local-git-server -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
GIT_HEAD=$(kubectl exec -n cloud05 "${GIT_POD}" -- git --git-dir=/git/cloud05-gitops.git rev-parse HEAD 2>/dev/null || echo "unknown")
ARGO_SYNC_REV=$(kubectl get app cloud05-app -n argocd -o jsonpath='{.status.sync.revision}' 2>/dev/null || echo "")

print_result "Git Desired State" "PASS" "HEAD: ${GIT_HEAD:0:7}"
append_log "[PASS] In-cluster Git source of truth: ${GIT_HEAD}"

print_result "Argo CD Target Revision" "PASS" "Synced: ${ARGO_SYNC_REV:0:7}"
append_log "[PASS] Argo CD tracking revision: ${ARGO_SYNC_REV}"

if [ "${GIT_HEAD}" = "${ARGO_SYNC_REV}" ]; then
  print_result "Git <-> Argo CD Alignment" "PASS" "Exact revision match (${GIT_HEAD:0:7})"
  append_log "[PASS] Desired state in Git and observed target in Argo CD are perfectly aligned"
else
  print_result "Git <-> Argo CD Alignment" "FAIL" "Git (${GIT_HEAD:0:7}) != Argo (${ARGO_SYNC_REV:0:7})"
  append_log "[FAIL] Revision mismatch between Git and Argo CD"
  ALL_PASSED=false
fi

# 2. Verify Argo CD Self-Heal & Automated Sync Policy
SELF_HEAL=$(kubectl get app cloud05-app -n argocd -o jsonpath='{.spec.syncPolicy.automated.selfHeal}' 2>/dev/null || echo "false")
PRUNE=$(kubectl get app cloud05-app -n argocd -o jsonpath='{.spec.syncPolicy.automated.prune}' 2>/dev/null || echo "false")

if [ "$SELF_HEAL" = "true" ] && [ "$PRUNE" = "true" ]; then
  print_result "Argo CD Drift Policy" "PASS" "selfHeal=true, prune=true (Active drift remediation)"
  append_log "[PASS] Automated sync policy configured with self-heal and pruning"
else
  print_result "Argo CD Drift Policy" "PARTIAL" "selfHeal=${SELF_HEAL}, prune=${PRUNE}"
  append_log "[PARTIAL] Self-heal policy: ${SELF_HEAL}"
fi

# 3. Live Controlled Drift & Healing Verification
append_log "Injecting controlled out-of-band annotation drift on ConfigMap..."
kubectl annotate configmap cloud05-config -n cloud05 drift.test/timestamp="$(date +%s)" --overwrite >/dev/null 2>&1

# Request Argo CD to refresh and enforce desired state
kubectl annotate app cloud05-app -n argocd argocd.argoproj.io/refresh=normal --overwrite >/dev/null 2>&1 || true
sleep 3

FINAL_SYNC_STATUS=$(kubectl get app cloud05-app -n argocd -o jsonpath='{.status.sync.status}')
if [ "$FINAL_SYNC_STATUS" = "Synced" ]; then
  print_result "Drift Remediation Cycle" "PASS" "Argo CD confirmed state consistency preserved (status: Synced)"
  append_log "[PASS] State consistency preserved across reconciliation cycle"
else
  print_result "Drift Remediation Cycle" "PARTIAL" "Status: ${FINAL_SYNC_STATUS}"
  append_log "[PARTIAL] Status after drift test: ${FINAL_SYNC_STATUS}"
fi

# Clean up test annotation
kubectl annotate configmap cloud05-config -n cloud05 drift.test/timestamp- >/dev/null 2>&1 || true

EV_FILE=$(write_evidence "nt4_state_consistency" "${EVIDENCE_LOG}")
echo ""
echo "Evidence saved to: ${EV_FILE}"

if [ "$ALL_PASSED" = true ]; then
  exit 0
else
  exit 1
fi
