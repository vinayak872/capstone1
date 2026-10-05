#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_PATH="${SCRIPT_DIR}/../infrastructure/kind-config.yaml"
CLUSTER_NAME="cloud05"

echo "=========================================================="
echo "  Provisioning kind Kubernetes Cluster: ${CLUSTER_NAME}   "
echo "=========================================================="

if kind get clusters | grep -q "^${CLUSTER_NAME}\$"; then
  echo "Cluster '${CLUSTER_NAME}' already exists. Skipping creation."
else
  echo "Creating cluster '${CLUSTER_NAME}' with custom port mappings..."
  kind create cluster --name "${CLUSTER_NAME}" --config "${CONFIG_PATH}"
fi

kubectl cluster-info --context "kind-${CLUSTER_NAME}"

echo "Creating namespace 'cloud05'..."
kubectl get ns cloud05 >/dev/null 2>&1 || kubectl create ns cloud05

echo "Cluster ready and active context set to kind-${CLUSTER_NAME}."
echo "=========================================================="
