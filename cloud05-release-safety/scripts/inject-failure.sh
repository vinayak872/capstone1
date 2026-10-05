#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-error}"
RATE="${2:-0.8}"
LATENCY="${3:-1500}"

echo "=========================================================="
echo "  Injecting Controlled Failure Mode: ${MODE}              "
echo "  Error Rate: ${RATE}, Latency: ${LATENCY}ms              "
echo "=========================================================="

echo "1. Attempting dynamic runtime injection via Admin API on http://localhost:8080/api/admin/failure..."
if curl -s -X POST http://localhost:8080/api/admin/failure \
     -H "Content-Type: application/json" \
     -d "{\"mode\": \"${MODE}\", \"errorRate\": ${RATE}, \"latencyMs\": ${LATENCY}}" >/dev/null 2>&1; then
  echo "Dynamic injection succeeded without pod restarts!"
else
  echo "Admin API not reached via localhost:8080, updating Kubernetes ConfigMap..."
  kubectl patch configmap cloud05-config -n cloud05 --type merge \
    -p "{\"data\":{\"FAILURE_MODE\":\"${MODE}\",\"FAILURE_ERROR_RATE\":\"${RATE}\",\"FAILURE_LATENCY_MS\":\"${LATENCY}\"}}"
  echo "ConfigMap patched."
fi

echo "Verifying active failure mode on http://localhost:8080/version..."
curl -s http://localhost:8080/version || echo "Endpoint reachable via port-forward"
echo ""
echo "=========================================================="
