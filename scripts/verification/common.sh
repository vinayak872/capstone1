#!/usr/bin/env bash
# Common verification utilities for CLOUD-05 Acceptance Suite

set -uo pipefail

VERIF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${VERIF_DIR}/../.." && pwd)"
EVIDENCE_DIR="${REPO_ROOT}/evidence/verification"
mkdir -p "${EVIDENCE_DIR}"

TIMESTAMP="$(date +"%Y-%m-%d_%H%M%S")"

# Colors
C_RESET="\033[0m"
C_GREEN="\033[32m"
C_RED="\033[31m"
C_YELLOW="\033[33m"
C_BLUE="\033[34m"
C_CYAN="\033[36m"
C_BOLD="\033[1m"

print_header() {
  local title="$1"
  echo -e "${C_CYAN}============================================================${C_RESET}"
  echo -e "${C_BOLD}  CLOUD-05 VERIFICATION: ${title}${C_RESET}"
  echo -e "${C_CYAN}============================================================${C_RESET}"
  echo -e "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo ""
}

print_result() {
  local name="$1"
  local status="$2"
  local detail="${3:-}"

  case "$status" in
    "PASS"|"VERIFIED")
      printf "%-35s [${C_GREEN}%-10s${C_RESET}] %s\n" "$name" "$status" "$detail"
      ;;
    "FAIL"|"FAILED")
      printf "%-35s [${C_RED}%-10s${C_RESET}] %s\n" "$name" "$status" "$detail"
      ;;
    "NOT TESTED")
      printf "%-35s [${C_YELLOW}%-10s${C_RESET}] %s\n" "$name" "$status" "$detail"
      ;;
    "UNAVAILABLE")
      printf "%-35s [${C_YELLOW}%-10s${C_RESET}] %s\n" "$name" "$status" "$detail"
      ;;
    "PARTIAL")
      printf "%-35s [${C_YELLOW}%-10s${C_RESET}] %s\n" "$name" "$status" "$detail"
      ;;
    *)
      printf "%-35s [%-10s] %s\n" "$name" "$status" "$detail"
      ;;
  esac
}

write_evidence() {
  local script_tag="$1"
  local content="$2"
  local target_file="${EVIDENCE_DIR}/${TIMESTAMP}_${script_tag}.txt"
  echo -e "${content}" > "${target_file}"
  echo "${target_file}"
}
