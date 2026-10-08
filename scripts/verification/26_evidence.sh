#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

print_header "26 - Evidence Catalog & Artifact Inventory Verification"

EVIDENCE_LOG=""
append_log() {
  EVIDENCE_LOG+="$1"$'\n'
}

append_log "=== EVIDENCE CATALOG VERIFICATION ==="
append_log "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ALL_PASSED=true
INVENTORY_MD="${EVIDENCE_DIR}/evidence_inventory.md"

append_log "Cataloging evidence in ${EVIDENCE_DIR} and cloud05-release-safety/evidence/..."

cat << 'EOF' > "$INVENTORY_MD"
# CLOUD-05 Evidence Inventory & Verification Catalog

| File | Purpose | Timestamp | Related Requirement |
| :--- | :--- | :--- | :--- |
EOF

# Scan evidence/verification/*.txt
for ev_file in "${EVIDENCE_DIR}"/*.txt; do
  if [ -f "$ev_file" ]; then
    fname=$(basename "$ev_file")
    fsize=$(wc -c < "$ev_file" | tr -d ' ')
    if [ "$fsize" -gt 0 ]; then
      ts=$(echo "$fname" | cut -d_ -f1,2)
      tag=$(echo "$fname" | cut -d_ -f3- | sed 's/\.txt$//')
      echo "| \`${fname}\` | Automated evidence for verification stage \`${tag}\` | ${ts} | Stage ${tag} |" >> "$INVENTORY_MD"
      append_log "[PASS] Evidence indexed: ${fname} (${fsize} bytes)"
    fi
  fi
done

# Scan historical evidence dumps
HIST_DUMP_DIR="${REPO_ROOT}/cloud05-release-safety/evidence"
if [ -d "$HIST_DUMP_DIR" ]; then
  for dump in "${HIST_DUMP_DIR}"/2026-*; do
    if [ -d "$dump" ]; then
      dname=$(basename "$dump")
      echo "| \`cloud05-release-safety/evidence/${dname}/\` | Historical cluster state dump (pods, rollouts, logs) | ${dname} | Core Architecture State |" >> "$INVENTORY_MD"
      append_log "[PASS] Historical dump indexed: ${dname}"
    fi
  done
fi

# Scan experiment results
RESULTS_DIR="${REPO_ROOT}/cloud05-release-safety/experiments/results"
if [ -d "$RESULTS_DIR" ]; then
  for exp_file in "${RESULTS_DIR}"/*.json; do
    if [ -f "$exp_file" ]; then
      efname=$(basename "$exp_file")
      echo "| \`experiments/results/${efname}\` | Empirical release experiment raw dataset | 2026-10-05T19:22:26Z | Progressive Delivery Research Question |" >> "$INVENTORY_MD"
      append_log "[PASS] Experiment dataset indexed: ${efname}"
    fi
  done
fi

TOTAL_INDEXED=$(grep -c "^|" "$INVENTORY_MD" || echo 0)
TOTAL_INDEXED=$((TOTAL_INDEXED - 2)) # Exclude headers

if [ "$TOTAL_INDEXED" -ge 10 ]; then
  print_result "Evidence Inventory" "PASS" "${TOTAL_INDEXED} verification artifacts indexed"
  append_log "[PASS] Successfully generated ${INVENTORY_MD} with ${TOTAL_INDEXED} entries"
else
  print_result "Evidence Inventory" "FAIL" "Only ${TOTAL_INDEXED} artifacts found"
  append_log "[FAIL] Insufficient evidence files indexed"
  ALL_PASSED=false
fi

EV_FILE=$(write_evidence "evidence" "${EVIDENCE_LOG}")
echo ""
echo "Evidence saved to: ${EV_FILE}"
echo "Inventory report written to: ${INVENTORY_MD}"

if [ "$ALL_PASSED" = true ]; then
  exit 0
else
  exit 1
fi
