#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-8088}"

# Ensure socat proxy container is running on kind network to forward localhost:8088 to NodePort 30080
if ! docker ps --format '{{.Names}}' | grep -q "^cloud05-proxy\$"; then
  echo "Starting cloud05-proxy on port ${PORT} -> NodePort 30080..."
  docker rm -f cloud05-proxy 2>/dev/null || true
  docker run -d --name cloud05-proxy --network kind -p "${PORT}:8080" alpine/socat tcp-listen:8080,fork,reuseaddr tcp:cloud05-control-plane:30080
  sleep 1.5
fi
