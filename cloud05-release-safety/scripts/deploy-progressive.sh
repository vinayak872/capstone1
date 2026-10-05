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

echo "Applying Rollout and Analysis manifests..."
kubectl apply -f "${ROLLOUT_DIR}/services.yaml"
kubectl apply -f "${ROLLOUT_DIR}/analysis-template.yaml"
kubectl apply -f "${ROLLOUT_DIR}/rollout.yaml"

echo "Setting Rollout image to cloud05-demo:${TARGET_VERSION}..."
kubectl argo rollouts set image cloud05-rollout demo-service="cloud05-demo:${TARGET_VERSION}" -n cloud05 || \
  kubectl set image rollout/cloud05-rollout demo-service="cloud05-demo:${TARGET_VERSION}" -n cloud05

echo "Rollout updated. Current Rollout status:"
kubectl argo rollouts status cloud05-rollout -n cloud05 --timeout=90s || true
kubectl get rollout cloud05-rollout -n cloud05
kubectl get pods -l app=cloud05-demo -n cloud05
echo "=========================================================="
