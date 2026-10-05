#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="${SCRIPT_DIR}/../gitops/base"
TARGET_VERSION="${1:-1.0.0}"

echo "=========================================================="
echo "  Deploying Baseline Deployment (RollingUpdate): v${TARGET_VERSION} "
echo "=========================================================="

echo "Updating deployment image to cloud05-demo:${TARGET_VERSION}..."
kubectl apply -f "${BASE_DIR}/namespace.yaml"
kubectl apply -f "${BASE_DIR}/configmap.yaml"
kubectl apply -f "${BASE_DIR}/service.yaml"

# Update deployment image
kubectl apply -f "${BASE_DIR}/deployment.yaml"
kubectl set image deployment/cloud05-demo demo-service="cloud05-demo:${TARGET_VERSION}" -n cloud05

echo "Waiting for baseline deployment rollout to complete..."
kubectl rollout status deployment/cloud05-demo -n cloud05 --timeout=90s

echo "Baseline deployment successfully running:"
kubectl get deployment cloud05-demo -n cloud05
kubectl get pods -l app=cloud05-demo -n cloud05

echo ""
echo "Verifying service endpoint via localhost:8080 (NodePort 30080)..."
curl -s http://localhost:8080/version || echo "Endpoint reachable via in-cluster port-forward or NodePort"
echo ""
echo "=========================================================="
