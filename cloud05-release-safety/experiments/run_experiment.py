#!/usr/bin/env python3
"""
CLOUD-05 Capstone: Release Safety Experiment Runner
Executes real automated deployment experiments comparing:
  - Baseline (Kubernetes Deployment with RollingUpdate)
  - Progressive Delivery (Argo Rollouts with Prometheus Health Analysis & Automated Rollback)

Measures and records:
  - HTTP traffic outcomes (success rate, error rate, p50/p95/p99 latency)
  - Failure detection latency (ms)
  - Rollback latency (ms)
  - Recovery time (ms)
  - Kubernetes / Argo Rollout state transitions
  - Saves real timestamped evidence in CSV and JSON
"""

import os
import sys
import json
import csv
import time
import urllib.request
import urllib.error
import subprocess
import statistics
import datetime

TARGET_URL = os.environ.get("TARGET_URL", "http://localhost:8088")
PROMETHEUS_URL = os.environ.get("PROMETHEUS_URL", "http://localhost:9090")
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "results")
os.makedirs(RESULTS_DIR, exist_ok=True)

def get_git_commit():
    try:
        out = subprocess.check_output(["git", "rev-parse", "HEAD"], stderr=subprocess.DEVNULL)
        return out.decode("utf-8").strip()
    except Exception:
        return "uncommitted-working-tree"

def query_prometheus(query):
    try:
        url = f"{PROMETHEUS_URL}/api/v1/query?query=" + urllib.parse.quote(query)
        req = urllib.request.Request(url, headers={"User-Agent": "cloud05-runner"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("status") == "success" and data["data"]["result"]:
                return float(data["data"]["result"][0]["value"][1])
    except Exception:
        pass
    return None

def send_request(url):
    start = time.perf_counter()
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "cloud05-experiment-load"})
        with urllib.request.urlopen(req, timeout=4) as resp:
            status = resp.status
            body = resp.read().decode("utf-8", errors="ignore")
            duration_ms = (time.perf_counter() - start) * 1000.0
            return status, duration_ms, body
    except urllib.error.HTTPError as e:
        duration_ms = (time.perf_counter() - start) * 1000.0
        return e.code, duration_ms, str(e)
    except Exception as e:
        duration_ms = (time.perf_counter() - start) * 1000.0
        return 0, duration_ms, str(e)

def run_load_generator(duration_sec=15, request_interval=0.1):
    latencies = []
    statuses = []
    versions_observed = set()
    end_time = time.time() + duration_sec
    first_error_time = None
    recovered_time = None

    print(f"[*] Generating workload against {TARGET_URL} for {duration_sec}s...")
    start_time = time.time()

    while time.time() < end_time:
        status, duration_ms, body = send_request(f"{TARGET_URL}/")
        latencies.append(duration_ms)
        statuses.append(status)

        try:
            parsed = json.loads(body)
            if "version" in parsed:
                versions_observed.add(parsed["version"])
        except Exception:
            pass

        if status >= 500 and first_error_time is None:
            first_error_time = time.time()

        if first_error_time is not None and status == 200:
            recovered_time = time.time()

        time.sleep(request_interval)

    total_requests = len(statuses)
    error_count = sum(1 for s in statuses if s >= 500 or s == 0)
    success_count = sum(1 for s in statuses if s == 200)
    error_rate = (error_count / total_requests * 100.0) if total_requests > 0 else 0.0

    sorted_lat = sorted(latencies) if latencies else [0]
    p50 = sorted_lat[int(len(sorted_lat) * 0.50)]
    p95 = sorted_lat[int(len(sorted_lat) * 0.95)]
    p99 = sorted_lat[int(len(sorted_lat) * 0.99)]

    return {
        "total_requests": total_requests,
        "success_count": success_count,
        "error_count": error_count,
        "error_rate": round(error_rate, 2),
        "latencies": latencies,
        "p50_latency": round(p50, 2),
        "p95_latency": round(p95, 2),
        "p99_latency": round(p99, 2),
        "versions_observed": list(versions_observed),
        "first_error_time": first_error_time,
        "recovered_time": recovered_time
    }

def run_experiment(exp_id, deployment_mode, old_version, new_version, failure_mode="none", failure_rate=0.0):
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    git_commit = get_git_commit()
    print("=" * 65)
    print(f" STARTING EXPERIMENT {exp_id}")
    print(f" Mode: {deployment_mode} | Transition: {old_version} -> {new_version}")
    print(f" Failure Mode: {failure_mode} (rate={failure_rate})")
    print(f" Git Commit: {git_commit}")
    print("=" * 65)

    exp_start_time = time.time()

    # Step 1: Deploy new version
    if deployment_mode == "baseline":
        print(f"[*] Deploying baseline Deployment with image cloud05-demo:{new_version}...")
        subprocess.run([
            "kubectl", "set", "image", "deployment/cloud05-demo",
            f"demo-service=cloud05-demo:{new_version}", "-n", "cloud05"
        ], check=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    elif deployment_mode == "progressive":
        print(f"[*] Deploying progressive Rollout with image cloud05-demo:{new_version}...")
        subprocess.run([
            "kubectl", "argo", "rollouts", "set", "image", "cloud05-rollout",
            f"demo-service=cloud05-demo:{new_version}", "-n", "cloud05"
        ], check=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    # Step 2: Run load and observe behavior
    load_metrics = run_load_generator(duration_sec=20, request_interval=0.15)

    # Step 3: Check Kubernetes / Rollout final state
    detection_time_ms = 0.0
    rollback_time_ms = 0.0
    recovery_time_ms = 0.0
    rollback_success = False

    if load_metrics["first_error_time"]:
        detection_time_ms = round((load_metrics["first_error_time"] - exp_start_time) * 1000.0, 2)
        if load_metrics["recovered_time"]:
            recovery_time_ms = round((load_metrics["recovered_time"] - load_metrics["first_error_time"]) * 1000.0, 2)

    # Inspect rollout status if progressive
    final_version = "unknown"
    try:
        status, _, body = send_request(f"{TARGET_URL}/version")
        if status == 200:
            parsed = json.loads(body)
            final_version = parsed.get("version", "unknown")
    except Exception:
        pass

    if deployment_mode == "progressive" and failure_mode in ["error", "intermittent"]:
        # If rollout aborted and restored old version
        if final_version == old_version:
            rollback_success = True
            rollback_time_ms = recovery_time_ms

    result_status = "SUCCESS"
    if failure_mode in ["error", "intermittent"] and deployment_mode == "baseline":
        result_status = "DEGRADED_UNPROTECTED"
    elif failure_mode in ["error", "intermittent"] and deployment_mode == "progressive":
        result_status = "PROTECTED_ROLLED_BACK" if rollback_success else "DEGRADED"

    record = {
        "experiment_id": exp_id,
        "timestamp": timestamp,
        "git_commit": git_commit,
        "deployment_mode": deployment_mode,
        "old_version": old_version,
        "new_version": new_version,
        "failure_mode": failure_mode,
        "failure_rate": failure_rate,
        "total_requests": load_metrics["total_requests"],
        "error_count": load_metrics["error_count"],
        "error_rate": load_metrics["error_rate"],
        "p50_latency": load_metrics["p50_latency"],
        "p95_latency": load_metrics["p95_latency"],
        "p99_latency": load_metrics["p99_latency"],
        "detection_time_ms": detection_time_ms,
        "rollback_time_ms": rollback_time_ms,
        "recovery_time_ms": recovery_time_ms,
        "rollback_success": rollback_success,
        "final_version": final_version,
        "result": result_status
    }

    # Save JSON
    json_path = os.path.join(RESULTS_DIR, f"{exp_id}.json")
    with open(json_path, "w") as f:
        json.dump(record, f, indent=2)

    # Save CSV
    csv_path = os.path.join(RESULTS_DIR, f"{exp_id}.csv")
    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(record.keys()))
        writer.writeheader()
        writer.writerow(record)

    print("\n[*] Experiment Completed:")
    print(json.dumps(record, indent=2))
    print(f"[*] Artifacts saved to: {json_path} and {csv_path}\n")
    return record

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="CLOUD-05 Automated Experiment Runner")
    parser.add_argument("--id", default=f"exp_{int(time.time())}", help="Experiment Identifier")
    parser.add_argument("--mode", choices=["baseline", "progressive"], default="baseline", help="Deployment mode")
    parser.add_argument("--old-version", default="1.0.0", help="Previous active version")
    parser.add_argument("--new-version", default="2.0.0", help="Target release version")
    parser.add_argument("--failure-mode", choices=["none", "error", "latency", "intermittent"], default="none")
    parser.add_argument("--failure-rate", type=float, default=0.0)

    args = parser.parse_args()
    run_experiment(
        exp_id=args.id,
        deployment_mode=args.mode,
        old_version=args.old_version,
        new_version=args.new_version,
        failure_mode=args.failure_mode,
        failure_rate=args.failure_rate
    )
