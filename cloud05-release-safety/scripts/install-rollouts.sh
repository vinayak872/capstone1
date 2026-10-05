#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo "  Installing Argo Rollouts Controller & CRDs              "
echo "=========================================================="

echo "Creating argo-rollouts namespace..."
kubectl get ns argo-rollouts >/dev/null 2>&1 || kubectl create ns argo-rollouts

echo "Applying Argo Rollouts release manifests using server-side apply..."
kubectl apply --server-side -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml

echo "Waiting for Argo Rollouts controller to become ready..."
kubectl rollout status deployment/argo-rollouts -n argo-rollouts --timeout=120s

echo "Checking if kubectl-argo-rollouts plugin is installed..."
if ! command -v kubectl-argo-rollouts &> /dev/null; then
  echo "Downloading kubectl-argo-rollouts plugin for Darwin ARM64..."
  ARCH="arm64"
  if [ "$(uname -m)" != "arm64" ]; then
    ARCH="amd64"
  fi
  curl -sLO "https://github.com/argoproj/argo-rollouts/releases/latest/download/kubectl-argo-rollouts-darwin-${ARCH}" || true
  if [ -f "kubectl-argo-rollouts-darwin-${ARCH}" ]; then
    chmod +x "kubectl-argo-rollouts-darwin-${ARCH}"
    sudo mv "kubectl-argo-rollouts-darwin-${ARCH}" /usr/local/bin/kubectl-argo-rollouts || mv "kubectl-argo-rollouts-darwin-${ARCH}" /tmp/kubectl-argo-rollouts
    echo "kubectl-argo-rollouts plugin ready!"
  fi
fi

echo "Argo Rollouts controller successfully installed!"
echo "=========================================================="
