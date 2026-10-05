#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo "    CLOUD-05 CAPSTONE: VERIFY / INSTALL HELPER TOOLS      "
echo "=========================================================="

# Check and install kubectl-argo-rollouts CLI plugin if needed
if ! command -v kubectl-argo-rollouts &> /dev/null; then
  echo "Installing kubectl-argo-rollouts CLI plugin for Darwin..."
  ARCH="arm64"
  if [ "$(uname -m)" != "arm64" ]; then
    ARCH="amd64"
  fi
  curl -sLO "https://github.com/argoproj/argo-rollouts/releases/latest/download/kubectl-argo-rollouts-darwin-${ARCH}"
  chmod +x "kubectl-argo-rollouts-darwin-${ARCH}"
  sudo mv "kubectl-argo-rollouts-darwin-${ARCH}" /usr/local/bin/kubectl-argo-rollouts || mv "kubectl-argo-rollouts-darwin-${ARCH}" /tmp/kubectl-argo-rollouts
  echo "kubectl-argo-rollouts plugin installed successfully!"
fi

echo "All required CLI tooling verified."
echo "=========================================================="
