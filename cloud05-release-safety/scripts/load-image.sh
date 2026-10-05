#!/usr/bin/env bash
set -euo pipefail

CLUSTER_NAME="cloud05"
IMAGES=(
  "cloud05-demo:1.0.0"
  "cloud05-demo:2.0.0"
  "cloud05-demo:3.0.0"
)

echo "=========================================================="
echo "  Loading Container Images into kind cluster: ${CLUSTER_NAME} "
echo "=========================================================="

for img in "${IMAGES[@]}"; do
  echo "-> Loading image ${img} into kind cluster..."
  kind load docker-image "${img}" --name "${CLUSTER_NAME}"
done

echo "All images successfully loaded into ${CLUSTER_NAME}!"
echo "=========================================================="
