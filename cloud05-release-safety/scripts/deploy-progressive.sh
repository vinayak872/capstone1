#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROLLOUT_DIR="${SCRIPT_DIR}/../gitops/rollout"
TARGET_VERSION="${1:-1.0.0}"

echo "=========================================================="
echo "  Deploying Progressive Delivery via GitOps & Argo CD     "
echo "  Target Release Candidate: v${TARGET_VERSION}            "
echo "=========================================================="

# 1. Ensure baseline deployment is removed if present to prevent port/selector collisions
if kubectl get deployment cloud05-demo -n cloud05 >/dev/null 2>&1; then
  echo "Decommissioning baseline deployment to allow Rollout to serve traffic..."
  kubectl delete deployment cloud05-demo -n cloud05 --ignore-not-found=true
fi

# 2. Update desired state in GitOps manifest
echo "Updating GitOps desired state manifest (gitops/rollout/rollout.yaml)..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' -E "s/image: cloud05-demo:[0-9]+\.[0-9]+\.[0-9]+/image: cloud05-demo:${TARGET_VERSION}/" "${ROLLOUT_DIR}/rollout.yaml"
else
  sed -i -E "s/image: cloud05-demo:[0-9]+\.[0-9]+\.[0-9]+/image: cloud05-demo:${TARGET_VERSION}/" "${ROLLOUT_DIR}/rollout.yaml"
fi

# 3. Synchronize change to GitOps repository and trigger Argo CD reconciliation
echo "Committing desired state change to GitOps repository and notifying Argo CD..."
"${SCRIPT_DIR}/sync-gitops.sh" "deploy(progressive): update image to cloud05-demo:${TARGET_VERSION}"

# 4. Monitor Argo Rollouts progression
export PATH="/opt/homebrew/bin:/Users/vinayakkumar/.local/bin:$PATH"
echo "Observing Rollout status in Kubernetes..."
if command -v kubectl-argo-rollouts >/dev/null 2>&1; then
  kubectl argo rollouts status cloud05-rollout -n cloud05 --timeout=90s || true
  kubectl argo rollouts get rollout cloud05-rollout -n cloud05 || true
else
  kubectl rollout status rollout/cloud05-rollout -n cloud05 --timeout=90s || true
fi

echo "=========================================================="
echo "  Progressive delivery deployment initiated via GitOps!   "
echo "=========================================================="
