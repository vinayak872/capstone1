#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MON_DIR="${SCRIPT_DIR}/../monitoring/prometheus"

echo "=========================================================="
echo "  Deploying Prometheus Monitoring for CLOUD-05            "
echo "=========================================================="

echo "Applying Prometheus manifests..."
kubectl apply -f "${MON_DIR}/prometheus.yaml"

echo "Waiting for Prometheus deployment to become ready..."
kubectl rollout status deployment/prometheus-server -n monitoring --timeout=120s

echo "Prometheus successfully deployed and ready!"
echo "Prometheus Web UI accessible on NodePort 30090 (or http://localhost:9090 via kind mapping)."
echo "=========================================================="
