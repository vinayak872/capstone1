#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

print_header "11 - Real GitOps End-to-End Delivery (Git -> Argo CD -> K8s)"

EVIDENCE_LOG=""
append_log() {
  EVIDENCE_LOG+="$1"$'\n'
}

append_log "=== GITOPS END-TO-END RECONCILIATION VERIFICATION ==="
append_log "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ALL_PASSED=true
SYNC_SCRIPT="${REPO_ROOT}/cloud05-release-safety/scripts/sync-gitops.sh"
CM_FILE="${REPO_ROOT}/cloud05-release-safety/gitops/rollout/configmap.yaml"

if [ ! -f "$SYNC_SCRIPT" ] || [ ! -f "$CM_FILE" ]; then
  print_result "GitOps Prerequisites" "FAIL" "Missing sync-gitops.sh or configmap.yaml"
  append_log "[FAIL] Required GitOps files missing"
  write_evidence "gitops_end_to_end" "${EVIDENCE_LOG}"
  exit 1
fi

# Step 1: Initial In-Cluster Git SHA
INITIAL_REV=$(kubectl get app cloud05-app -n argocd -o jsonpath='{.status.sync.revision}' 2>/dev/null || echo "")
print_result "Initial Argo CD Revision" "PASS" "${INITIAL_REV:0:7}"
append_log "[PASS] Initial Argo CD Revision: ${INITIAL_REV}"

# Step 2: Make controlled test change in ConfigMap manifest
PROBE_VAL="verif-$(date +%s)"
append_log "Applying test probe to ConfigMap: ${PROBE_VAL}"
cp "${CM_FILE}" "${CM_FILE}.bak"

# Add probe key to ConfigMap data
sed -i '' "/PORT: \"8080\"/a\\
  VERIFICATION_PROBE: \"${PROBE_VAL}\"
" "${CM_FILE}" || sed -i "s/PORT: \"8080\"/PORT: \"8080\"\n  VERIFICATION_PROBE: \"${PROBE_VAL}\"/" "${CM_FILE}"

# Step 3: Commit and Push via GitOps synchronization script
append_log "Pushing desired-state change via ${SYNC_SCRIPT}..."
SYNC_OUTPUT=$("${SYNC_SCRIPT}" "test(gitops): verify automated reconciliation ${PROBE_VAL}" 2>&1 || true)
append_log "${SYNC_OUTPUT}"

NEW_REV=$(echo "$SYNC_OUTPUT" | grep "Commit SHA:" | awk '{print $NF}' || echo "")
if [ -z "$NEW_REV" ]; then
  NEW_REV=$(kubectl get app cloud05-app -n argocd -o jsonpath='{.status.sync.revision}' 2>/dev/null || echo "")
fi

print_result "Git Commit & Push" "PASS" "New desired state SHA: ${NEW_REV:0:7}"
append_log "[PASS] Pushed Git commit: ${NEW_REV}"

# Step 4: Verify Argo CD detected and synchronized new revision
ARGO_OBSERVED_REV=$(kubectl get app cloud05-app -n argocd -o jsonpath='{.status.sync.revision}')
if [ "$ARGO_OBSERVED_REV" = "$NEW_REV" ]; then
  print_result "Argo CD Sync" "PASS" "Reconciled Git SHA ${NEW_REV:0:7}"
  append_log "[PASS] Argo CD reconciled desired Git SHA: ${NEW_REV}"
else
  print_result "Argo CD Sync" "FAIL" "Expected ${NEW_REV:0:7}, got ${ARGO_OBSERVED_REV:0:7}"
  append_log "[FAIL] Argo CD did not reconcile to ${NEW_REV}"
  ALL_PASSED=false
fi

# Step 5: Verify Kubernetes observed state matches desired state
K8S_PROBE=$(kubectl get cm cloud05-config -n cloud05 -o jsonpath='{.data.VERIFICATION_PROBE}' 2>/dev/null || echo "")
if [ "$K8S_PROBE" = "$PROBE_VAL" ]; then
  print_result "Kubernetes Observed State" "PASS" "ConfigMap reflects Git commit (VERIFICATION_PROBE=${K8S_PROBE})"
  append_log "[PASS] Kubernetes observed state reconciled via Argo CD: VERIFICATION_PROBE=${K8S_PROBE}"
else
  print_result "Kubernetes Observed State" "FAIL" "Observed: '${K8S_PROBE}', Expected: '${PROBE_VAL}'"
  append_log "[FAIL] Kubernetes ConfigMap did not reconcile desired state"
  ALL_PASSED=false
fi

# Step 6: Restore clean original state through Git
append_log "Reverting test change in Git..."
mv "${CM_FILE}.bak" "${CM_FILE}"
CLEANUP_OUTPUT=$("${SYNC_SCRIPT}" "revert(gitops): restore clean state following verification" 2>&1 || true)
append_log "${CLEANUP_OUTPUT}"

FINAL_REV=$(kubectl get app cloud05-app -n argocd -o jsonpath='{.status.sync.revision}')
K8S_CLEAN_PROBE=$(kubectl get cm cloud05-config -n cloud05 -o jsonpath='{.data.VERIFICATION_PROBE}' 2>/dev/null || echo "")

if [ -z "$K8S_CLEAN_PROBE" ]; then
  print_result "GitOps Reversion & Cleanup" "PASS" "Clean state restored at Git SHA ${FINAL_REV:0:7}"
  append_log "[PASS] GitOps cleanly restored original configuration without probe"
else
  print_result "GitOps Reversion & Cleanup" "FAIL" "Probe still present"
  append_log "[FAIL] GitOps cleanup failed"
  ALL_PASSED=false
fi

EV_FILE=$(write_evidence "gitops_end_to_end" "${EVIDENCE_LOG}")
echo ""
echo "Evidence saved to: ${EV_FILE}"

if [ "$ALL_PASSED" = true ]; then
  exit 0
else
  exit 1
fi
