#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

echo -e "${C_CYAN}============================================================${C_RESET}"
echo -e "${C_BOLD}  CLOUD-05 — MASTER VERIFICATION TEST SUITE RUNNER         ${C_RESET}"
echo -e "${C_CYAN}============================================================${C_RESET}"
echo "Project:   CLOUD-05 — GitOps CI/CD with Progressive Delivery"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

TOTAL_SCRIPTS=0
PASSED_COUNT=0
FAILED_COUNT=0
NOT_TESTED_COUNT=0

STATUS_TMP_DIR=$(mktemp -d)
cleanup() {
  rm -rf "${STATUS_TMP_DIR}"
}
trap cleanup EXIT

TEST_SCRIPTS=(
  "01_project_structure.sh:Project Structure"
  "02_application.sh:Application"
  "03_docker.sh:Docker"
  "04_ci.sh:CI/CD"
  "05_git_repository.sh:GitOps Repository"
  "06_argocd.sh:Argo CD"
  "07_kubernetes.sh:Kubernetes"
  "08_rollouts.sh:Argo Rollouts"
  "09_prometheus.sh:Prometheus"
  "10_analysis.sh:AnalysisTemplate"
  "11_gitops_end_to_end.sh:Git → Argo CD → K8s"
  "12_healthy_release.sh:Healthy Promotion"
  "13_faulty_release_rollback.sh:Faulty Release & Rollback"
  "14_baseline_experiment.sh:Baseline Experiment"
  "15_progressive_experiment.sh:Progressive Experiment"
  "16_comparison.sh:Fair Comparison"
  "17_dora_metrics.sh:DORA"
  "18_nt1_cluster_overhead.sh:NT-1 (Cluster Overhead)"
  "19_nt2_metric_selection.sh:NT-2 (Metric Selection)"
  "20_nt3_rollback_correctness.sh:NT-3 (Rollback Correctness)"
  "21_nt4_state_consistency.sh:NT-4 (State Consistency)"
  "22_nt5_retry_timeout_concurrency.sh:NT-5 (Concurrency/Timeout)"
  "23_security.sh:Security"
  "24_backend.sh:Backend"
  "25_dashboard.sh:Dashboard"
  "26_evidence.sh:Evidence"
  "27_final_acceptance.sh:Final Acceptance"
)

for item in "${TEST_SCRIPTS[@]}"; do
  script_file="${item%%:*}"
  test_name="${item#*:}"
  TOTAL_SCRIPTS=$((TOTAL_SCRIPTS + 1))
  
  script_path="${SCRIPT_DIR}/${script_file}"
  
  if [ ! -f "$script_path" ]; then
    echo "UNAVAILABLE" > "${STATUS_TMP_DIR}/${script_file}.status"
    FAILED_COUNT=$((FAILED_COUNT + 1))
    continue
  fi
  
  echo -e "\n${C_BLUE}>>> Executing [${script_file}]...${C_RESET}"
  if bash "$script_path"; then
    echo "VERIFIED" > "${STATUS_TMP_DIR}/${script_file}.status"
    PASSED_COUNT=$((PASSED_COUNT + 1))
  else
    exit_code=$?
    if [ "$exit_code" -eq 2 ]; then
      echo "NOT TESTED" > "${STATUS_TMP_DIR}/${script_file}.status"
      NOT_TESTED_COUNT=$((NOT_TESTED_COUNT + 1))
    else
      echo "FAILED" > "${STATUS_TMP_DIR}/${script_file}.status"
      FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
  fi
done

echo ""
echo -e "${C_CYAN}============================================================${C_RESET}"
echo -e "${C_BOLD}  CLOUD-05 FINAL VERIFICATION SUMMARY                       ${C_RESET}"
echo -e "${C_CYAN}============================================================${C_RESET}"
echo "Project:   CLOUD-05 — GitOps CI/CD with Progressive Delivery"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

print_row() {
  local script_file="$1"
  local name="$2"
  local status="UNAVAILABLE"
  if [ -f "${STATUS_TMP_DIR}/${script_file}.status" ]; then
    status=$(cat "${STATUS_TMP_DIR}/${script_file}.status")
  fi

  case "$status" in
    "VERIFIED"|"PASS")
      printf "%-32s [${C_GREEN}%-10s${C_RESET}]\n" "$name" "VERIFIED"
      ;;
    "FAILED"|"FAIL")
      printf "%-32s [${C_RED}%-10s${C_RESET}]\n" "$name" "FAILED"
      ;;
    "NOT TESTED")
      printf "%-32s [${C_YELLOW}%-10s${C_RESET}]\n" "$name" "NOT TESTED"
      ;;
    *)
      printf "%-32s [${C_YELLOW}%-10s${C_RESET}]\n" "$name" "$status"
      ;;
  esac
}

print_row "02_application.sh" "Application"
print_row "03_docker.sh" "Docker"
print_row "04_ci.sh" "CI/CD"
print_row "05_git_repository.sh" "GitOps Repository"
print_row "06_argocd.sh" "Argo CD"
print_row "11_gitops_end_to_end.sh" "Git → Argo CD → K8s"
print_row "07_kubernetes.sh" "Kubernetes"
print_row "08_rollouts.sh" "Argo Rollouts"
print_row "09_prometheus.sh" "Prometheus"
print_row "10_analysis.sh" "AnalysisTemplate"
print_row "12_healthy_release.sh" "Healthy Promotion"
print_row "13_faulty_release_rollback.sh" "Faulty Release & Rollback"
print_row "14_baseline_experiment.sh" "Baseline Experiment"
print_row "15_progressive_experiment.sh" "Progressive Experiment"
print_row "16_comparison.sh" "Fair Comparison"
print_row "17_dora_metrics.sh" "DORA"
print_row "18_nt1_cluster_overhead.sh" "NT-1 (Cluster Overhead)"
print_row "19_nt2_metric_selection.sh" "NT-2 (Metric Selection)"
print_row "20_nt3_rollback_correctness.sh" "NT-3 (Rollback Correctness)"
print_row "21_nt4_state_consistency.sh" "NT-4 (State Consistency)"
print_row "22_nt5_retry_timeout_concurrency.sh" "NT-5 (Concurrency/Timeout)"
print_row "23_security.sh" "Security"
print_row "24_backend.sh" "Backend"
print_row "25_dashboard.sh" "Dashboard"
print_row "26_evidence.sh" "Evidence"
print_row "27_final_acceptance.sh" "Final Acceptance"

echo ""
echo -e "${C_CYAN}============================================================${C_RESET}"
echo -e "${C_BOLD}  FINAL RESULT                                              ${C_RESET}"
echo -e "${C_CYAN}============================================================${C_RESET}"

if [ "$FAILED_COUNT" -eq 0 ] && [ "$PASSED_COUNT" -eq "$TOTAL_SCRIPTS" ]; then
  echo -e "${C_GREEN}${C_BOLD}🟢 FULLY VERIFIED${C_RESET}"
  echo "All mandatory automated requirements, GitOps reconciliation flows,"
  echo "canary rollback gates, and empirical research deliverables are proven."
  exit 0
elif [ "$FAILED_COUNT" -eq 0 ]; then
  echo -e "${C_YELLOW}${C_BOLD}🟡 PARTIALLY VERIFIED${C_RESET}"
  echo "Passed: ${PASSED_COUNT}, Not Tested: ${NOT_TESTED_COUNT}, Failed: ${FAILED_COUNT}"
  exit 0
else
  echo -e "${C_RED}${C_BOLD}🔴 VERIFICATION FAILED${C_RESET}"
  echo "Passed: ${PASSED_COUNT}, Failed: ${FAILED_COUNT}"
  exit 1
fi
