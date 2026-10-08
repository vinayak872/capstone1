#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

print_header "05 - Git Repository & In-Cluster GitOps Server"

EVIDENCE_LOG=""
append_log() {
  EVIDENCE_LOG+="$1"$'\n'
}

append_log "=== GIT REPOSITORY VERIFICATION ==="
append_log "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ALL_PASSED=true

# 1. Host Git repository status
CURRENT_BRANCH=$(git branch --show-current || echo "unknown")
LATEST_COMMIT=$(git rev-parse HEAD || echo "unknown")
COMMIT_COUNT=$(git rev-list --count HEAD || echo "0")

if [ -n "$LATEST_COMMIT" ] && [ "$LATEST_COMMIT" != "unknown" ]; then
  print_result "Host Git Repository" "PASS" "branch: ${CURRENT_BRANCH}, ${COMMIT_COUNT} commits"
  append_log "[PASS] Host git repository valid. Branch: ${CURRENT_BRANCH}, HEAD: ${LATEST_COMMIT}"
  append_log "Recent commits:"
  append_log "$(git log -n 5 --oneline)"
else
  print_result "Host Git Repository" "FAIL" "Invalid git state"
  append_log "[FAIL] Host git repository check failed"
  ALL_PASSED=false
fi

# 2. In-cluster Git server pod check
GIT_POD=$(kubectl get pods -n cloud05 -l app=local-git-server -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -n "$GIT_POD" ]; then
  print_result "In-Cluster Git Server Pod" "PASS" "pod: ${GIT_POD}"
  append_log "[PASS] Found in-cluster local-git-server pod: ${GIT_POD}"

  # 3. In-cluster Git repository log
  CLUSTER_GIT_LOG=$(kubectl exec -n cloud05 "${GIT_POD}" -- git --git-dir=/git/cloud05-gitops.git log -n 5 --oneline 2>/dev/null || echo "")
  if [ -n "$CLUSTER_GIT_LOG" ]; then
    LATEST_CLUSTER_SHA=$(kubectl exec -n cloud05 "${GIT_POD}" -- git --git-dir=/git/cloud05-gitops.git rev-parse HEAD 2>/dev/null || echo "")
    print_result "In-Cluster Git Commits" "PASS" "HEAD: ${LATEST_CLUSTER_SHA:0:7}"
    append_log "[PASS] In-cluster Git repository contains real commits. HEAD: ${LATEST_CLUSTER_SHA}"
    append_log "In-Cluster Git Log:"
    append_log "${CLUSTER_GIT_LOG}"
  else
    print_result "In-Cluster Git Commits" "FAIL" "Git log empty or unreachable"
    append_log "[FAIL] In-cluster Git repository has no commits"
    ALL_PASSED=false
  fi

  # 4. In-cluster Git repository contents (ls-tree)
  CLUSTER_TREE=$(kubectl exec -n cloud05 "${GIT_POD}" -- git --git-dir=/git/cloud05-gitops.git ls-tree -r --name-only HEAD 2>/dev/null || echo "")
  if echo "$CLUSTER_TREE" | grep -q "rollout.yaml"; then
    print_result "GitOps Repository Tree" "PASS" "contains rollout.yaml and manifests"
    append_log "[PASS] GitOps repository contents verified:"
    append_log "${CLUSTER_TREE}"
  else
    print_result "GitOps Repository Tree" "FAIL" "missing expected manifests in git tree"
    append_log "[FAIL] GitOps repository tree missing rollout.yaml: ${CLUSTER_TREE}"
    ALL_PASSED=false
  fi
else
  print_result "In-Cluster Git Server Pod" "UNAVAILABLE" "No local-git-server pod found"
  append_log "[UNAVAILABLE] In-cluster Git server pod missing"
  ALL_PASSED=false
fi

EV_FILE=$(write_evidence "git_repository" "${EVIDENCE_LOG}")
echo ""
echo "Evidence saved to: ${EV_FILE}"

if [ "$ALL_PASSED" = true ]; then
  exit 0
else
  exit 1
fi
