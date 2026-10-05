#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================================="
echo "    CLOUD-05 CAPSTONE: AUTOMATED ONE-COMMAND SETUP        "
echo "=========================================================="

echo "STEP 1: Checking environment prerequisites..."
"${SCRIPT_DIR}/check-prerequisites.sh"

echo ""
echo "STEP 2: Building container images (1.0.0, 2.0.0, 3.0.0)..."
"${SCRIPT_DIR}/build.sh"

echo ""
echo "STEP 3: Provisioning kind Kubernetes cluster..."
"${SCRIPT_DIR}/create-cluster.sh"

echo ""
echo "STEP 4: Loading built container images into kind cluster..."
"${SCRIPT_DIR}/load-image.sh"

echo ""
echo "STEP 5: Installing Prometheus monitoring stack..."
"${SCRIPT_DIR}/install-monitoring.sh"

echo ""
echo "STEP 6: Installing Argo Rollouts controller & CRDs..."
"${SCRIPT_DIR}/install-rollouts.sh"

echo ""
echo "STEP 7: Installing Argo CD GitOps engine..."
"${SCRIPT_DIR}/install-argocd.sh"

echo ""
echo "STEP 8: Deploying in-cluster GitOps Git Server..."
kubectl apply -f "${SCRIPT_DIR}/../gitops/argocd/git-server.yaml"
kubectl rollout status deployment/local-git-server -n cloud05 --timeout=90s

echo ""
echo "STEP 9: Deploying Baseline Release v1.0.0..."
"${SCRIPT_DIR}/deploy-baseline.sh" "1.0.0"

echo ""
echo "=========================================================="
echo "  CLOUD-05 SETUP COMPLETED SUCCESSFULLY!                  "
echo "  - Cluster: kind-cloud05                                 "
echo "  - App endpoint: http://localhost:8080                   "
echo "  - Prometheus:   http://localhost:9090                   "
echo "  - Argo CD:      http://localhost:8085                   "
echo "=========================================================="
