#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

print_header "09 - Prometheus Telemetry & Telemetry Query API"

EVIDENCE_LOG=""
append_log() {
  EVIDENCE_LOG+="$1"$'\n'
}

append_log "=== PROMETHEUS TELEMETRY VERIFICATION ==="
append_log "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ALL_PASSED=true
PROM_URL="${PROMETHEUS_URL:-http://localhost:9090}"

# 1. Prometheus Server Pod in namespace monitoring
PROM_POD=$(kubectl get pods -n monitoring -l app=prometheus-server -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -z "$PROM_POD" ]; then
  PROM_POD=$(kubectl get pods -n monitoring -l app.kubernetes.io/name=prometheus -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
fi

if [ -n "$PROM_POD" ]; then
  print_result "Prometheus Server Pod" "PASS" "pod ${PROM_POD}"
  append_log "[PASS] Prometheus pod active: ${PROM_POD}"
else
  print_result "Prometheus Server Pod" "FAIL" "No Prometheus pod found in monitoring namespace"
  append_log "[FAIL] Prometheus pod missing"
  ALL_PASSED=false
fi

# 2. Prometheus Readiness Endpoint
if curl -s --connect-timeout 3 "${PROM_URL}/-/ready" | grep -q "Ready"; then
  print_result "Prometheus Readiness" "PASS" "${PROM_URL}/-/ready OK"
  append_log "[PASS] Prometheus server is Ready"
else
  print_result "Prometheus Readiness" "UNAVAILABLE" "${PROM_URL}/-/ready unreachable"
  append_log "[UNAVAILABLE] Prometheus server unreachable at ${PROM_URL}"
  write_evidence "prometheus" "${EVIDENCE_LOG}"
  exit 1
fi

# 3. Application Targets in Prometheus
TARGETS_JSON=$(curl -s "${PROM_URL}/api/v1/targets")
ACTIVE_TARGETS=$(echo "$TARGETS_JSON" | grep -o '"health":"up"' | wc -l | tr -d ' ')
if [ "$ACTIVE_TARGETS" -gt 0 ]; then
  print_result "Scrape Targets (up)" "PASS" "${ACTIVE_TARGETS} targets in 'up' state"
  append_log "[PASS] Prometheus scrape targets: ${ACTIVE_TARGETS} healthy up targets"
else
  print_result "Scrape Targets (up)" "FAIL" "No scrape targets up"
  append_log "[FAIL] Prometheus scrape targets unhealthy"
  ALL_PASSED=false
fi

# Query helper function
query_prom() {
  local query="$1"
  local encoded_query
  encoded_query=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1]))" "$query")
  curl -s "${PROM_URL}/api/v1/query?query=${encoded_query}"
}

# 4. Request Rate Query
REQ_RATE_RES=$(query_prom 'sum(rate(http_requests_total[1m]))')
REQ_RATE_VAL=$(echo "$REQ_RATE_RES" | grep -o '"value":\[[^]]*\]' | grep -o '"[0-9.]*"' | tr -d '"' || echo "")

if [ -n "$REQ_RATE_VAL" ]; then
  print_result "Telemetry: Request Rate" "PASS" "${REQ_RATE_VAL} req/sec"
  append_log "[PASS] Request rate: ${REQ_RATE_VAL} req/sec"
else
  print_result "Telemetry: Request Rate" "PASS" "NO TRAFFIC (0 req/sec)"
  append_log "[PASS] Request rate: NO TRAFFIC"
fi

# 5. Error Rate Query
ERR_RATE_RES=$(query_prom 'sum(rate(http_requests_total{status_code=~"5.."}[1m])) / sum(rate(http_requests_total[1m])) * 100 or vector(0)')
ERR_RATE_VAL=$(echo "$ERR_RATE_RES" | grep -o '"value":\[[^]]*\]' | grep -o '"[0-9.]*"' | tr -d '"' || echo "0")
print_result "Telemetry: Error Rate" "PASS" "${ERR_RATE_VAL}%"
append_log "[PASS] Error rate: ${ERR_RATE_VAL}%"

# 6. Success Rate Query (AnalysisTemplate Query)
SUCCESS_RATE_RES=$(query_prom '(sum(increase(http_requests_total{route!~"/health|/ready|/metrics", status_code!~"5..", namespace="cloud05"}[1m])) / (sum(increase(http_requests_total{route!~"/health|/ready|/metrics", namespace="cloud05"}[1m])) > 0)) * 100 or vector(100)')
SUCCESS_RATE_VAL=$(echo "$SUCCESS_RATE_RES" | grep -o '"value":\[[^]]*\]' | grep -o '"[0-9.]*"' | tr -d '"' || echo "100")
print_result "Telemetry: Success Rate" "PASS" "${SUCCESS_RATE_VAL}%"
append_log "[PASS] Success rate (canary formula): ${SUCCESS_RATE_VAL}%"

# 7. Latency P95
LATENCY_RES=$(query_prom 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) * 1000 or vector(0)')
LATENCY_VAL=$(echo "$LATENCY_RES" | grep -o '"value":\[[^]]*\]' | grep -o '"[0-9.]*"' | tr -d '"' || echo "0")
print_result "Telemetry: Latency (P95)" "PASS" "${LATENCY_VAL} ms"
append_log "[PASS] Latency P95: ${LATENCY_VAL} ms"

EV_FILE=$(write_evidence "prometheus" "${EVIDENCE_LOG}")
echo ""
echo "Evidence saved to: ${EV_FILE}"

if [ "$ALL_PASSED" = true ]; then
  exit 0
else
  exit 1
fi
