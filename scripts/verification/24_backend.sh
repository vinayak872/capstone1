#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

print_header "24 - Backend Server & Multi-Integration API Verification"

EVIDENCE_LOG=""
append_log() {
  EVIDENCE_LOG+="$1"$'\n'
}

append_log "=== BACKEND SERVER VERIFICATION ==="
append_log "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ALL_PASSED=true
BACKEND_PORT="${BACKEND_PORT:-3001}"
BACKEND_URL="http://localhost:${BACKEND_PORT}"

# 1. Verify backend port connectivity
if ! curl -s --connect-timeout 2 "${BACKEND_URL}/api/health/integrations" >/dev/null 2>&1; then
  append_log "Backend not responding on port ${BACKEND_PORT}. Attempting to launch from project root..."
  (cd "${REPO_ROOT}" && npm run backend >/tmp/cloud05_backend_test.log 2>&1 &)
  sleep 4
fi

if curl -s --connect-timeout 3 "${BACKEND_URL}/api/health/integrations" >/dev/null 2>&1; then
  print_result "Backend API Availability" "PASS" "${BACKEND_URL} is online"
  append_log "[PASS] Backend API online at ${BACKEND_URL}"
else
  print_result "Backend API Availability" "UNAVAILABLE" "Could not connect to ${BACKEND_URL}"
  append_log "[UNAVAILABLE] Backend API unreachable"
  write_evidence "backend" "${EVIDENCE_LOG}"
  exit 1
fi

# 2. Test /api/health/integrations
HEALTH_RES=$(curl -s "${BACKEND_URL}/api/health/integrations")
if echo "$HEALTH_RES" | grep -q '"kubernetes":true'; then
  K8S_OK=$(echo "$HEALTH_RES" | grep -o '"kubernetes":[^,}]*' | cut -d: -f2)
  ARGO_OK=$(echo "$HEALTH_RES" | grep -o '"argocd":[^,}]*' | cut -d: -f2)
  PROM_OK=$(echo "$HEALTH_RES" | grep -o '"prometheus":[^,}]*' | cut -d: -f2)
  ROLL_OK=$(echo "$HEALTH_RES" | grep -o '"rollouts":[^,}]*' | cut -d: -f2)
  
  print_result "API: /health/integrations" "PASS" "k8s=${K8S_OK}, argo=${ARGO_OK}, prom=${PROM_OK}, rollouts=${ROLL_OK}"
  append_log "[PASS] Integrations status: ${HEALTH_RES}"
else
  print_result "API: /health/integrations" "FAIL" "Malformed or failed integrations response"
  append_log "[FAIL] Response: ${HEALTH_RES}"
  ALL_PASSED=false
fi

# 3. Test /api/releases/history
RELEASES_RES=$(curl -s "${BACKEND_URL}/api/releases/history")
if echo "$RELEASES_RES" | grep -q '"items"'; then
  REV_COUNT=$(echo "$RELEASES_RES" | grep -o '"revision"' | wc -l | tr -d ' ')
  SOURCE=$(echo "$RELEASES_RES" | grep -o '"source":"[^"]*"' | head -n 1 | cut -d'"' -f4)
  print_result "API: /releases/history" "PASS" "${REV_COUNT} revisions found (source: ${SOURCE})"
  append_log "[PASS] /api/releases/history returned ${REV_COUNT} revisions (source=${SOURCE})"
else
  print_result "API: /releases/history" "FAIL" "Invalid response"
  append_log "[FAIL] Response: ${RELEASES_RES}"
  ALL_PASSED=false
fi

# 4. Test /api/rollout/status
ROLLOUT_RES=$(curl -s "${BACKEND_URL}/api/rollout/status")
if echo "$ROLLOUT_RES" | grep -q '"connected":true'; then
  PHASE=$(echo "$ROLLOUT_RES" | grep -o '"phase":"[^"]*"' | cut -d'"' -f4)
  TARGET=$(echo "$ROLLOUT_RES" | grep -o '"targetVersion":"[^"]*"' | cut -d'"' -f4)
  print_result "API: /rollout/status" "PASS" "phase=${PHASE}, target=${TARGET}"
  append_log "[PASS] /api/rollout/status: phase=${PHASE}, target=${TARGET}"
else
  print_result "API: /rollout/status" "FAIL" "Failed rollout API"
  append_log "[FAIL] Rollout status: ${ROLLOUT_RES}"
  ALL_PASSED=false
fi

# 5. Test /api/gitops/status
GITOPS_RES=$(curl -s "${BACKEND_URL}/api/gitops/status")
if echo "$GITOPS_RES" | grep -q '"connected":true'; then
  SYNC_ST=$(echo "$GITOPS_RES" | grep -o '"syncStatus":"[^"]*"' | cut -d'"' -f4)
  print_result "API: /gitops/status" "PASS" "Argo CD CRD connected, status: ${SYNC_ST}"
  append_log "[PASS] /api/gitops/status: syncStatus=${SYNC_ST}"
else
  print_result "API: /gitops/status" "FAIL" "Failed gitops API"
  append_log "[FAIL] GitOps status: ${GITOPS_RES}"
  ALL_PASSED=false
fi

# 6. Test /api/experiments
EXP_RES=$(curl -s "${BACKEND_URL}/api/experiments")
if echo "$EXP_RES" | grep -q '"results"'; then
  EXP_COUNT=$(echo "$EXP_RES" | grep -o '"experiment_id"' | wc -l | tr -d ' ')
  print_result "API: /experiments" "PASS" "${EXP_COUNT} empirical datasets served"
  append_log "[PASS] /api/experiments returned ${EXP_COUNT} items"
else
  print_result "API: /experiments" "FAIL" "Failed experiments API"
  append_log "[FAIL] Experiments: ${EXP_RES}"
  ALL_PASSED=false
fi

EV_FILE=$(write_evidence "backend" "${EVIDENCE_LOG}")
echo ""
echo "Evidence saved to: ${EV_FILE}"

if [ "$ALL_PASSED" = true ]; then
  exit 0
else
  exit 1
fi
