#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

print_header "03 - Docker & Container Artifacts"

EVIDENCE_LOG=""
append_log() {
  EVIDENCE_LOG+="$1"$'\n'
}

append_log "=== DOCKER & CONTAINER VERIFICATION ==="
append_log "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ALL_PASSED=true
DOCKERFILE="${REPO_ROOT}/cloud05-release-safety/app/Dockerfile"

# 1. Dockerfile check
if [ -f "$DOCKERFILE" ]; then
  print_result "Dockerfile" "PASS" "found at cloud05-release-safety/app/Dockerfile"
  append_log "[PASS] Dockerfile exists: ${DOCKERFILE}"
  append_log "Dockerfile summary: $(wc -l < "$DOCKERFILE" | tr -d ' ') lines"
  append_log "Base Image: $(grep -m 1 "^FROM" "$DOCKERFILE")"
  append_log "User: $(grep -m 1 "^USER" "$DOCKERFILE" || echo 'Not specified')"
else
  print_result "Dockerfile" "FAIL" "missing Dockerfile"
  append_log "[FAIL] Dockerfile missing: ${DOCKERFILE}"
  ALL_PASSED=false
fi

# 2. Check existing local docker images
REQUIRED_IMAGES=("cloud05-demo:1.0.0" "cloud05-demo:2.0.0" "cloud05-demo:3.0.0")
for img in "${REQUIRED_IMAGES[@]}"; do
  if docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^${img}$"; then
    IMG_ID=$(docker images --format "{{.Repository}}:{{.Tag}} ({{.ID}}, {{.Size}})" | grep "^${img}")
    print_result "Image ${img}" "PASS" "Local image present"
    append_log "[PASS] Docker image present: ${IMG_ID}"
  else
    print_result "Image ${img}" "FAIL" "Local image missing"
    append_log "[FAIL] Docker image missing: ${img}"
    ALL_PASSED=false
  fi
done

# 3. Docker inspect verification
if docker inspect cloud05-demo:1.0.0 >/dev/null 2>&1; then
  ARCH=$(docker inspect cloud05-demo:1.0.0 --format '{{.Architecture}}' || echo "unknown")
  OS=$(docker inspect cloud05-demo:1.0.0 --format '{{.Os}}' || echo "unknown")
  USER_CONFIG=$(docker inspect cloud05-demo:1.0.0 --format '{{.Config.User}}' || echo "root")
  print_result "Docker Inspect" "PASS" "arch=${ARCH}, os=${OS}, user=${USER_CONFIG}"
  append_log "[PASS] docker inspect valid. Architecture: ${ARCH}, OS: ${OS}, User: ${USER_CONFIG}"
else
  print_result "Docker Inspect" "FAIL" "failed to inspect cloud05-demo:1.0.0"
  append_log "[FAIL] docker inspect failed for cloud05-demo:1.0.0"
  ALL_PASSED=false
fi

# 4. In-cluster Kind image availability
KIND_NODE="cloud05-control-plane"
if docker ps --format '{{.Names}}' | grep -q "^${KIND_NODE}$"; then
  CRICTL_IMAGES=$(docker exec "${KIND_NODE}" crictl images 2>/dev/null || true)
  for img_tag in "1.0.0" "2.0.0" "3.0.0"; do
    if echo "${CRICTL_IMAGES}" | grep "cloud05-demo" | grep -q "${img_tag}"; then
      print_result "Kind Cache: cloud05-demo:${img_tag}" "PASS" "present in Kind node"
      append_log "[PASS] Image cloud05-demo:${img_tag} is cached in Kind node ${KIND_NODE}"
    else
      print_result "Kind Cache: cloud05-demo:${img_tag}" "FAIL" "missing from Kind node"
      append_log "[FAIL] Image cloud05-demo:${img_tag} missing from Kind node ${KIND_NODE}"
      ALL_PASSED=false
    fi
  done
else
  print_result "Kind Node Inspection" "UNAVAILABLE" "Node ${KIND_NODE} not running"
  append_log "[UNAVAILABLE] Kind node ${KIND_NODE} not found in docker ps"
  ALL_PASSED=false
fi

# 5. Ephemeral test container run
TEST_PORT=18081
if docker run -d --rm --name cloud05-verif-test -p "${TEST_PORT}:8080" cloud05-demo:1.0.0 >/dev/null 2>&1; then
  sleep 2
  TEST_HEALTH=$(curl -s "http://localhost:${TEST_PORT}/health" || echo "")
  docker stop cloud05-verif-test >/dev/null 2>&1 || true
  if echo "$TEST_HEALTH" | grep -q "healthy"; then
    print_result "Container Runtime Exec" "PASS" "spanned, passed /health, stopped cleanly"
    append_log "[PASS] Standalone container execution succeeded. Health response: ${TEST_HEALTH}"
  else
    print_result "Container Runtime Exec" "FAIL" "failed health check"
    append_log "[FAIL] Standalone container failed health check. Response: ${TEST_HEALTH}"
    ALL_PASSED=false
  fi
else
  print_result "Container Runtime Exec" "FAIL" "failed to launch docker container"
  append_log "[FAIL] Could not run docker test container"
  ALL_PASSED=false
fi

EV_FILE=$(write_evidence "docker" "${EVIDENCE_LOG}")
echo ""
echo "Evidence saved to: ${EV_FILE}"

if [ "$ALL_PASSED" = true ]; then
  exit 0
else
  exit 1
fi
