#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXP_PY="${SCRIPT_DIR}/../experiments/run_experiment.py"
RESULTS_DIR="${SCRIPT_DIR}/../experiments/results"
REPORTS_DIR="${SCRIPT_DIR}/../reports"
mkdir -p "${RESULTS_DIR}" "${REPORTS_DIR}"

echo "=========================================================="
echo "    CLOUD-05 CAPSTONE: AUTOMATED EXPERIMENT MATRIX        "
echo "=========================================================="

echo "[1/4] Running Experiment 1: Baseline Healthy Release (v1.0.0 -> v2.0.0)..."
"${SCRIPT_DIR}/deploy-baseline.sh" "1.0.0"
python3 "${EXP_PY}" --id "exp_01_baseline_healthy" --mode "baseline" --old-version "1.0.0" --new-version "2.0.0" --failure-mode "none"

echo ""
echo "[2/4] Running Experiment 2: Baseline Faulty Release (v2.0.0 -> v3.0.0)..."
python3 "${EXP_PY}" --id "exp_02_baseline_faulty" --mode "baseline" --old-version "2.0.0" --new-version "3.0.0" --failure-mode "error" --failure-rate 0.75

echo ""
echo "[3/4] Running Experiment 3: Progressive Healthy Release (v1.0.0 -> v2.0.0)..."
"${SCRIPT_DIR}/deploy-progressive.sh" "1.0.0"
python3 "${EXP_PY}" --id "exp_03_progressive_healthy" --mode "progressive" --old-version "1.0.0" --new-version "2.0.0" --failure-mode "none"

echo ""
echo "[4/4] Running Experiment 4: Progressive Faulty Release with Auto-Rollback (v2.0.0 -> v3.0.0)..."
python3 "${EXP_PY}" --id "exp_04_progressive_faulty" --mode "progressive" --old-version "2.0.0" --new-version "3.0.0" --failure-mode "error" --failure-rate 0.75

echo ""
echo "=========================================================="
echo "  Aggregating Experiment Results into Summary Tables     "
echo "=========================================================="

python3 -c "
import os, glob, json, csv

results_dir = '${RESULTS_DIR}'
summary_csv = os.path.join(results_dir, 'summary.csv')
summary_json = os.path.join(results_dir, 'summary.json')

all_records = []
for f in sorted(glob.glob(os.path.join(results_dir, 'exp_*.json'))):
    with open(f) as fp:
        all_records.append(json.load(fp))

if all_records:
    with open(summary_json, 'w') as fp:
        json.dump(all_records, fp, indent=2)

    with open(summary_csv, 'w', newline='') as fp:
        writer = csv.DictWriter(fp, fieldnames=list(all_records[0].keys()))
        writer.writeheader()
        writer.writerows(all_records)
    print(f'Successfully compiled summary of {len(all_records)} experiments into:')
    print(f' - {summary_csv}')
    print(f' - {summary_json}')
"

echo "=========================================================="
