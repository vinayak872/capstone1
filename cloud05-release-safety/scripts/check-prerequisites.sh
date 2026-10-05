#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo "    CLOUD-05 CAPSTONE: PREREQUISITE ENVIRONMENT CHECK     "
echo "=========================================================="
printf "%-12s %-16s %-16s %-10s\n" "TOOL" "INSTALLED" "REQUIRED" "STATUS"
echo "----------------------------------------------------------"

check_tool() {
  local tool="$1"
  local req="$2"
  local cmd="$3"

  if command -v "$tool" >/dev/null 2>&1; then
    local ver
    ver=$(eval "$cmd" 2>&1 | head -n 1)
    printf "%-12s %-16s %-16s %-10s\n" "$tool" "${ver:0:15}" "$req" "[PASS]"
  else
    printf "%-12s %-16s %-16s %-10s\n" "$tool" "NOT FOUND" "$req" "[FAIL]"
  fi
}

check_tool "docker"   ">= 20.10" "docker --version | awk '{print \$3}' | tr -d ','"
check_tool "kubectl"  ">= 1.25"  "kubectl version --client -o yaml | grep gitVersion | awk '{print \$2}'"
check_tool "kind"     ">= 0.18"  "kind --version | awk '{print \$3}'"
check_tool "git"      ">= 2.30"  "git --version | awk '{print \$3}'"
check_tool "node"     ">= 18.0"  "node -v"
check_tool "npm"      ">= 9.0"   "npm -v"
check_tool "python3"  ">= 3.9"   "python3 --version | awk '{print \$2}'"

echo "----------------------------------------------------------"
# Verify Docker daemon is running
if docker info >/dev/null 2>&1; then
  echo "Docker Daemon: [RUNNING]"
else
  echo "Docker Daemon: [STOPPED] -> Please start Docker Desktop"
fi
echo "=========================================================="
