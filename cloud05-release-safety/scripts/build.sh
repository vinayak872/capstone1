#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${SCRIPT_DIR}/../app"
REGISTRY_NAME="cloud05-demo"

echo "=========================================================="
echo "  Building Container Images for CLOUD-05 Release Safety   "
echo "=========================================================="

echo "-> Building v1.0.0 (Stable Baseline Release)..."
docker build \
  --build-arg APP_VERSION=1.0.0 \
  --build-arg FAILURE_MODE=none \
  -t "${REGISTRY_NAME}:1.0.0" \
  "${APP_DIR}"

echo "-> Building v2.0.0 (Healthy Release)..."
docker build \
  --build-arg APP_VERSION=2.0.0 \
  --build-arg FAILURE_MODE=none \
  -t "${REGISTRY_NAME}:2.0.0" \
  "${APP_DIR}"

echo "-> Building v3.0.0 (Faulty Release with Error Rate)..."
docker build \
  --build-arg APP_VERSION=3.0.0 \
  --build-arg FAILURE_MODE=error \
  --build-arg FAILURE_ERROR_RATE=0.75 \
  -t "${REGISTRY_NAME}:3.0.0" \
  "${APP_DIR}"

echo ""
echo "Successfully built images:"
docker images | grep "${REGISTRY_NAME}" || true
echo "=========================================================="
