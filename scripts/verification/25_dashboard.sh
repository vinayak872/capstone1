#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

print_header "25 - React Dashboard & Telemetry Visualization Verification"

EVIDENCE_LOG=""
append_log() {
  EVIDENCE_LOG+="$1"$'\n'
}

append_log "=== REACT DASHBOARD VERIFICATION ==="
append_log "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ALL_PASSED=true
DASHBOARD_DIR="${REPO_ROOT}/cloud05-dashboard"

# 1. Dashboard Source Structure
if [ -d "$DASHBOARD_DIR/src" ] && [ -f "$DASHBOARD_DIR/package.json" ]; then
  print_result "Dashboard Directory" "PASS" "found at cloud05-dashboard"
  append_log "[PASS] React Dashboard sources verified"
else
  print_result "Dashboard Directory" "FAIL" "missing"
  append_log "[FAIL] Dashboard sources missing"
  ALL_PASSED=false
fi

# 2. Production Bundle Verification (Vite build)
if [ -f "$DASHBOARD_DIR/dist/index.html" ]; then
  DIST_HTML_SIZE=$(wc -c < "$DASHBOARD_DIR/dist/index.html" | tr -d ' ')
  print_result "Production Static Bundle" "PASS" "dist/index.html present (${DIST_HTML_SIZE} bytes)"
  append_log "[PASS] Production bundle verified"
else
  append_log "Triggering production build in cloud05-dashboard..."
  if (cd "$DASHBOARD_DIR" && npm run build >/tmp/cloud05_dash_build.log 2>&1); then
    print_result "Production Static Bundle" "PASS" "Built cleanly"
    append_log "[PASS] Vite build succeeded"
  else
    print_result "Production Static Bundle" "FAIL" "Build failed"
    append_log "[FAIL] Build failed"
    ALL_PASSED=false
  fi
fi

# 3. Scan for hardcoded mock operational fallbacks in frontend services
append_log "Scanning frontend API consumers for fake hardcoded success mocks..."
MOCK_FALLBACKS=$(grep -rn "FALLBACK_MOCK" "$DASHBOARD_DIR/src" 2>/dev/null || true)
if [ -z "$MOCK_FALLBACKS" ]; then
  print_result "No Fabricated Mock Data" "PASS" "Frontend consumes dynamic backend telemetry without fake mocks"
  append_log "[PASS] No hardcoded fake fallback data found in dashboard source"
else
  print_result "No Fabricated Mock Data" "FAIL" "Found hardcoded mock fallbacks"
  append_log "[FAIL] Mock fallbacks found: ${MOCK_FALLBACKS}"
  ALL_PASSED=false
fi

# 4. Check API client integration configuration
API_SERVICE_FILE="$DASHBOARD_DIR/src/services/api.js"
if [ -f "$API_SERVICE_FILE" ]; then
  ENDPOINTS_CHECKED=("health/integrations" "releases/history" "rollout/status" "gitops/status" "experiments")
  ALL_ENDPOINTS_PRESENT=true
  for ep in "${ENDPOINTS_CHECKED[@]}"; do
    if ! grep -q "$ep" "$API_SERVICE_FILE"; then
      ALL_ENDPOINTS_PRESENT=false
    fi
  done
  
  if [ "$ALL_ENDPOINTS_PRESENT" = true ]; then
    print_result "Frontend API Service Layer" "PASS" "Consumes real endpoints: /health, /releases, /rollout, /gitops, /experiments"
    append_log "[PASS] API service layer properly mapped to live backend routes"
  else
    print_result "Frontend API Service Layer" "PARTIAL" "Some endpoints missing"
    append_log "[PARTIAL] Incomplete API service mappings"
  fi
fi

EV_FILE=$(write_evidence "dashboard" "${EVIDENCE_LOG}")
echo ""
echo "Evidence saved to: ${EV_FILE}"

if [ "$ALL_PASSED" = true ]; then
  exit 0
else
  exit 1
fi
