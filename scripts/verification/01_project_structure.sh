#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

print_header "01 - Project Structure & Directory Layout"

EVIDENCE_LOG=""
append_log() {
  EVIDENCE_LOG+="$1"$'\n'
}

append_log "=== CLOUD-05 PROJECT STRUCTURE VERIFICATION ==="
append_log "Executed at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
append_log "Repo Root: ${REPO_ROOT}"
append_log ""

ALL_PASSED=true

check_path() {
  local rel_path="$1"
  local type="$2"
  local full_path="${REPO_ROOT}/${rel_path}"

  if [ "$type" = "dir" ]; then
    if [ -d "$full_path" ]; then
      print_result "$rel_path" "PASS" "directory exists"
      append_log "[PASS] Directory exists: ${rel_path}"
    else
      print_result "$rel_path" "FAIL" "directory missing"
      append_log "[FAIL] Directory missing: ${rel_path}"
      ALL_PASSED=false
    fi
  elif [ "$type" = "file" ]; then
    if [ -f "$full_path" ]; then
      print_result "$rel_path" "PASS" "file exists ($(wc -l < "$full_path" | tr -d ' ') lines)"
      append_log "[PASS] File exists: ${rel_path}"
    else
      print_result "$rel_path" "FAIL" "file missing"
      append_log "[FAIL] File missing: ${rel_path}"
      ALL_PASSED=false
    fi
  fi
}

# Directories to inspect
check_path "cloud05-release-safety" "dir"
check_path "cloud05-dashboard" "dir"
check_path "backend" "dir"
check_path "scripts" "dir"
check_path "cloud05-release-safety/scripts" "dir"
check_path "cloud05-release-safety/experiments" "dir"
check_path "cloud05-release-safety/evidence" "dir"
check_path "cloud05-release-safety/gitops" "dir"
check_path "cloud05-release-safety/infrastructure" "dir"
check_path "cloud05-release-safety/monitoring" "dir"
check_path ".github/workflows" "dir"

# Key files to inspect
check_path "README.md" "file"
check_path "Makefile" "file"
check_path "package.json" "file"
check_path "FINAL_VALIDATION.md" "file"
check_path "cloud05-release-safety/Makefile" "file"
check_path "cloud05-release-safety/README.md" "file"

append_log ""
append_log "=== REPOSITORY TREE SUMMARY ==="
append_log "$(find "${REPO_ROOT}" -maxdepth 2 -not -path '*/.*' -not -path '*/node_modules*')"

EV_FILE=$(write_evidence "project_structure" "${EVIDENCE_LOG}")
echo ""
echo "Evidence saved to: ${EV_FILE}"

if [ "$ALL_PASSED" = true ]; then
  exit 0
else
  exit 1
fi
