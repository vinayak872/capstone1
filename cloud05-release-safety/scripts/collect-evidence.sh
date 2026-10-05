#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP="$(date -u +"%Y-%m-%dT%H%M%SZ")"
EVIDENCE_DIR="${SCRIPT_DIR}/../evidence/${TIMESTAMP}"
mkdir -p "${EVIDENCE_DIR}"

echo "=========================================================="
echo "  Collecting Timestamped Evidence: ${TIMESTAMP}          "
echo "  Target: ${EVIDENCE_DIR}                                 "
echo "=========================================================="

echo "1. Capturing Git metadata..."
git log -1 --stat > "${EVIDENCE_DIR}/git.txt" 2>&1 || echo "Git repo not initialized" > "${EVIDENCE_DIR}/git.txt"

echo "2. Capturing Docker images..."
docker images | grep -E "cloud05|kind" > "${EVIDENCE_DIR}/docker-images.txt" 2>&1 || true

echo "3. Capturing Kubernetes cluster info and nodes..."
kubectl cluster-info > "${EVIDENCE_DIR}/cluster.txt" 2>&1 || true
kubectl get nodes -o wide >> "${EVIDENCE_DIR}/cluster.txt" 2>&1 || true

echo "4. Capturing Pods, Deployments, and Services in cloud05..."
kubectl get pods -n cloud05 -o wide > "${EVIDENCE_DIR}/pods.txt" 2>&1 || true
kubectl get deployment -n cloud05 -o wide > "${EVIDENCE_DIR}/deployments.txt" 2>&1 || true
kubectl get svc -n cloud05 -o wide > "${EVIDENCE_DIR}/services.txt" 2>&1 || true
kubectl get events -n cloud05 --sort-by='.metadata.creationTimestamp' > "${EVIDENCE_DIR}/events.txt" 2>&1 || true

echo "5. Capturing Argo Rollouts status..."
kubectl get rollouts -n cloud05 -o wide > "${EVIDENCE_DIR}/rollout.txt" 2>&1 || true
kubectl argo rollouts get rollout cloud05-rollout -n cloud05 >> "${EVIDENCE_DIR}/rollout.txt" 2>&1 || true

echo "6. Capturing Argo CD status..."
kubectl get applications -n argocd -o wide > "${EVIDENCE_DIR}/argocd.txt" 2>&1 || true

echo "7. Capturing Application container logs..."
kubectl logs -n cloud05 -l app=cloud05-demo --tail=200 > "${EVIDENCE_DIR}/application.log" 2>&1 || true

echo "8. Capturing Prometheus metrics snapshot..."
curl -s "http://localhost:9090/api/v1/query?query=http_requests_total" > "${EVIDENCE_DIR}/metrics.json" 2>&1 || echo "{}" > "${EVIDENCE_DIR}/metrics.json"

echo "9. Copying experiment summary..."
if [ -f "${SCRIPT_DIR}/../experiments/results/summary.csv" ]; then
  cp "${SCRIPT_DIR}/../experiments/results/summary.csv" "${EVIDENCE_DIR}/"
fi
if [ -f "${SCRIPT_DIR}/../experiments/results/summary.json" ]; then
  cp "${SCRIPT_DIR}/../experiments/results/summary.json" "${EVIDENCE_DIR}/"
fi

echo "Evidence collected successfully in: ${EVIDENCE_DIR}"
ls -la "${EVIDENCE_DIR}"
echo "=========================================================="
