#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GITOPS_DIR="$(cd "${SCRIPT_DIR}/../gitops" && pwd)"
COMMIT_MSG="${1:-deploy: update gitops desired state}"
PORT="${GITOPS_PORT:-19418}"
REPO_URL="git://local-git-server.cloud05.svc.cluster.local:9418/cloud05-gitops.git"

echo "=========================================================="
echo "  GITOPS DESIRED-STATE SYNCHRONIZATION                    "
echo "=========================================================="
echo "Commit message: ${COMMIT_MSG}"

# 1. Ensure local-git-server is running
if ! kubectl get deployment local-git-server -n cloud05 >/dev/null 2>&1; then
  echo "Error: local-git-server deployment not found in namespace cloud05"
  exit 1
fi

kubectl rollout status deployment/local-git-server -n cloud05 --timeout=60s

# 2. Port-forward in background
echo "Connecting to in-cluster Git server..."
kubectl port-forward -n cloud05 svc/local-git-server "${PORT}:9418" >/dev/null 2>&1 &
PF_PID=$!

cleanup() {
  kill "${PF_PID}" 2>/dev/null || true
  if [ -n "${TMP_DIR:-}" ] && [ -d "${TMP_DIR:-}" ]; then
    rm -rf "${TMP_DIR}"
  fi
}
trap cleanup EXIT

# Wait briefly for port-forward socket
for i in {1..10}; do
  if nc -z 127.0.0.1 "${PORT}" 2>/dev/null; then
    break
  fi
  sleep 0.5
done

# 3. Clone repository
TMP_DIR=$(mktemp -d)
git clone "git://127.0.0.1:${PORT}/cloud05-gitops.git" "${TMP_DIR}"

# 4. Synchronize gitops/ files into clone
mkdir -p "${TMP_DIR}/gitops"
rsync -av --delete --exclude='.git' --exclude='._*' "${GITOPS_DIR}/" "${TMP_DIR}/gitops/"

# 5. Commit and push
cd "${TMP_DIR}"
git config user.name "GitOps Bot"
git config user.email "gitops@cloud05.local"

# Remove any stray macOS attribute files
find . -name "._*" -delete

git add -A

if git diff --cached --quiet; then
  echo "No changes detected in gitops manifests; repository already up to date."
  COMMIT_SHA=$(git rev-parse HEAD)
else
  git commit -m "${COMMIT_MSG}"
  git push origin main
  COMMIT_SHA=$(git rev-parse HEAD)
  echo "Successfully pushed commit: ${COMMIT_SHA}"
fi

# 6. Signal Argo CD to sync
echo "Notifying Argo CD to reconcile application cloud05-app..."
kubectl annotate application cloud05-app -n argocd argocd.argoproj.io/refresh=normal --overwrite >/dev/null 2>&1 || true

# Wait for Argo CD sync to observe the new revision
echo "Waiting for Argo CD to reconcile desired state..."
for i in {1..30}; do
  CURRENT_REV=$(kubectl get app cloud05-app -n argocd -o jsonpath='{.status.sync.revision}' 2>/dev/null || echo "")
  SYNC_STATUS=$(kubectl get app cloud05-app -n argocd -o jsonpath='{.status.sync.status}' 2>/dev/null || echo "Unknown")
  HEALTH_STATUS=$(kubectl get app cloud05-app -n argocd -o jsonpath='{.status.health.status}' 2>/dev/null || echo "Unknown")

  if [ "${CURRENT_REV}" = "${COMMIT_SHA}" ] && [ "${SYNC_STATUS}" = "Synced" ]; then
    echo "Argo CD confirmed synchronized at revision ${COMMIT_SHA}!"
    break
  fi
  sleep 1
done

echo ""
echo "=========================================================="
echo "  GITOPS DEPLOYMENT VERIFICATION RECORD                    "
echo "  Repository URL: ${REPO_URL}                              "
echo "  Branch:         main                                     "
echo "  Commit SHA:     ${COMMIT_SHA}                            "
echo "  Argo CD Sync:   ${SYNC_STATUS}                           "
echo "  Argo CD Health: ${HEALTH_STATUS}                         "
echo "=========================================================="
