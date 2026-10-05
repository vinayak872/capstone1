#!/usr/bin/env bash
set -euo pipefail

CLUSTER_NAME="cloud05"

echo "=========================================================="
echo "    CLOUD-05 CAPSTONE: ENVIRONMENT CLEANUP                "
echo "=========================================================="

echo "1. Checking for kind cluster '${CLUSTER_NAME}'..."
if kind get clusters | grep -q "^${CLUSTER_NAME}\$"; then
  echo "Deleting kind cluster '${CLUSTER_NAME}'..."
  kind delete cluster --name "${CLUSTER_NAME}"
  echo "Cluster deleted."
else
  echo "Cluster '${CLUSTER_NAME}' does not exist."
fi

echo "2. Cleaning up test containers if running..."
docker rm -f test-v1 test-v2 test-v3 2>/dev/null || true

echo "3. Preserving source code, git history, and evidence artifacts..."
echo "Cleanup completed successfully!"
echo "=========================================================="
