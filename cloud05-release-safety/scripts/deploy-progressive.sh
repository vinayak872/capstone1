#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROLLOUT_DIR="${SCRIPT_DIR}/../gitops/rollout"
TARGET_VERSION="${1:-1.0.0}"

echo "=========================================================="
echo "  Deploying Progressive Delivery (Argo Rollouts): v${TARGET_VERSION} "
echo "=========================================================="

# Remove baseline deployment if exists to prevent selector collisions
if kubectl get deployment cloud05-demo -n cloud05 >/dev/null 2>&1; then
  echo "Scaling down baseline deployment to transition to Rollout..."
  kubectl delete deployment cloud05-demo -n cloud05 --ignore-not-found=true
fi

# Reset rollout if exists to start fresh
if kubectl get rollout cloud05-rollout -n cloud05 >/dev/null 2>&1; then
  echo "Resetting previous rollout to start with a fresh revision..."
  kubectl delete rollout cloud05-rollout -n cloud05 --ignore-not-found=true
fi

echo "Applying Rollout and Analysis manifests..."
kubectl apply -f "${ROLLOUT_DIR}/services.yaml"
kubectl apply -f "${ROLLOUT_DIR}/analysis-template.yaml"
kubectl apply -f "${ROLLOUT_DIR}/rollout.yaml"

export PATH="/opt/homebrew/bin:/Users/vinayakkumar/.local/bin:$PATH"

echo "Setting Rollout image to cloud05-demo:${TARGET_VERSION}..."
if command -v kubectl-argo-rollouts >/dev/null 2>&1; then
  kubectl argo rollouts set image cloud05-rollout demo-service="cloud05-demo:${TARGET_VERSION}" -n cloud05 || true
else
  kubectl patch rollout cloud05-rollout -n cloud05 --type merge \
    -p "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"demo-service\",\"image\":\"cloud05-demo:${TARGET_VERSION}\"}]}}}}"
fi

echo "Rollout updated. Current Rollout status:"
kubectl argo rollouts status cloud05-rollout -n cloud05 --timeout=90s || true
kubectl get rollout cloud05-rollout -n cloud05
kubectl get pods -l app=cloud05-demo -n cloud05
echo "=========================================================="
