#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

print_header "02 - Application Endpoints & Microservice"

EVIDENCE_LOG=""
append_log() {
  EVIDENCE_LOG+="$1"$'\n'
}

append_log "=== APPLICATION ENDPOINTS VERIFICATION ==="
append_log "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

APP_URL="${APP_URL:-http://localhost:8080}"
ALL_PASSED=true

# Test if port is reachable
if ! curl -s --connect-timeout 3 "${APP_URL}/health" >/dev/null 2>&1; then
  print_result "Service Reachability" "UNAVAILABLE" "${APP_URL} not reachable"
  append_log "[UNAVAILABLE] Application endpoint ${APP_URL} is not reachable"
  write_evidence "application" "${EVIDENCE_LOG}"
  exit 1
fi
print_result "Service Reachability" "PASS" "${APP_URL} is online"
append_log "[PASS] Application reachable at ${APP_URL}"

# 1. Root /
HTTP_ROOT=$(curl -s -o /tmp/cloud05_app_root.json -w "%{http_code}" "${APP_URL}/")
if [ "$HTTP_ROOT" -eq 200 ]; then
  print_result "GET / (Root)" "PASS" "HTTP 200"
  append_log "[PASS] GET / returned HTTP 200"
  append_log "Body: $(cat /tmp/cloud05_app_root.json)"
else
  print_result "GET / (Root)" "FAIL" "HTTP ${HTTP_ROOT}"
  append_log "[FAIL] GET / returned HTTP ${HTTP_ROOT}"
  ALL_PASSED=false
fi

# 2. GET /health
HTTP_HEALTH=$(curl -s -o /tmp/cloud05_app_health.json -w "%{http_code}" "${APP_URL}/health")
if [ "$HTTP_HEALTH" -eq 200 ]; then
  print_result "GET /health (Liveness)" "PASS" "HTTP 200"
  append_log "[PASS] GET /health returned HTTP 200"
  append_log "Body: $(cat /tmp/cloud05_app_health.json)"
else
  print_result "GET /health (Liveness)" "FAIL" "HTTP ${HTTP_HEALTH}"
  append_log "[FAIL] GET /health returned HTTP ${HTTP_HEALTH}"
  ALL_PASSED=false
fi

# 3. GET /ready
HTTP_READY=$(curl -s -o /tmp/cloud05_app_ready.json -w "%{http_code}" "${APP_URL}/ready")
if [ "$HTTP_READY" -eq 200 ]; then
  print_result "GET /ready (Readiness)" "PASS" "HTTP 200"
  append_log "[PASS] GET /ready returned HTTP 200"
  append_log "Body: $(cat /tmp/cloud05_app_ready.json)"
else
  print_result "GET /ready (Readiness)" "FAIL" "HTTP ${HTTP_READY}"
  append_log "[FAIL] GET /ready returned HTTP ${HTTP_READY}"
  ALL_PASSED=false
fi

# 4. GET /version
HTTP_VER=$(curl -s -o /tmp/cloud05_app_version.json -w "%{http_code}" "${APP_URL}/version")
APP_VER=$(grep -o '"version":"[^"]*"' /tmp/cloud05_app_version.json | cut -d'"' -f4 || echo "unknown")
if [ "$HTTP_VER" -eq 200 ] && [ -n "$APP_VER" ] && [ "$APP_VER" != "unknown" ]; then
  print_result "GET /version" "PASS" "HTTP 200 (version: ${APP_VER})"
  append_log "[PASS] GET /version returned HTTP 200 with version: ${APP_VER}"
  append_log "Body: $(cat /tmp/cloud05_app_version.json)"
else
  print_result "GET /version" "FAIL" "HTTP ${HTTP_VER}"
  append_log "[FAIL] GET /version returned HTTP ${HTTP_VER}"
  ALL_PASSED=false
fi

# 5. GET /metrics
HTTP_METRICS=$(curl -s -o /tmp/cloud05_app_metrics.txt -w "%{http_code}" "${APP_URL}/metrics")
if [ "$HTTP_METRICS" -eq 200 ] && grep -q "http_requests_total" /tmp/cloud05_app_metrics.txt; then
  METRIC_COUNT=$(grep -c "^[a-zA-Z]" /tmp/cloud05_app_metrics.txt || echo 0)
  print_result "GET /metrics (Prometheus)" "PASS" "HTTP 200 (${METRIC_COUNT} metrics found)"
  append_log "[PASS] GET /metrics returned HTTP 200 with valid Prometheus metrics (${METRIC_COUNT} series)"
  append_log "Metrics Sample:"
  append_log "$(head -n 25 /tmp/cloud05_app_metrics.txt)"
else
  print_result "GET /metrics (Prometheus)" "FAIL" "HTTP ${HTTP_METRICS}"
  append_log "[FAIL] GET /metrics failed or lacked prometheus metrics"
  ALL_PASSED=false
fi

rm -f /tmp/cloud05_app_*.json /tmp/cloud05_app_metrics.txt

EV_FILE=$(write_evidence "application" "${EVIDENCE_LOG}")
echo ""
echo "Evidence saved to: ${EV_FILE}"

if [ "$ALL_PASSED" = true ]; then
  exit 0
else
  exit 1
fi
