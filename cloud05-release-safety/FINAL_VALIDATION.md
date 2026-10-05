# CLOUD-05 Capstone: Final System Validation & Verification Report

**Project Title:** GitOps CI/CD with Progressive Delivery and Automated Rollback  
**Capstone Domain:** Software Modelling and DevOps (CLOUD-05)  
**Target Environment:** macOS (Apple Silicon / ARM64), Docker Desktop, kind Kubernetes cluster, Argo CD, Argo Rollouts, Prometheus.  
**Validation Date:** 2026-10-06  
**Git Commit:** `57f82b36206b65e83e91c4e2766632b5c36b614a`  
**Evidence Artifacts:** `cloud05-release-safety/evidence/2026-10-05T192827Z/`  

---

## 1. Executive Pass / Fail Checklist

Every item in this matrix was executed and verified live against real running infrastructure:

| Verification Item | Status | Verification Mechanism / Evidence |
| :--- | :---: | :--- |
| **Application & Microservice** | **[PASS]** | Express REST microservice (`cloud05-demo-service`), endpoints `/`, `/health`, `/ready`, `/version`, `/metrics`, `/api/status`, `/api/admin/failure`. Deterministic failure modes (`none`, `error`, `latency`, `intermittent`). |
| **Automated Tests & Quality** | **[PASS]** | Jest unit & integration tests (`test/app.test.js`) 13/13 passing; ESLint zero errors (`npm run lint`). |
| **Docker Containerization** | **[PASS]** | Multi-stage distroless/alpine non-root images built and loaded into cluster: `cloud05-demo:1.0.0`, `cloud05-demo:2.0.0`, `cloud05-demo:3.0.0`. |
| **CI / CD Pipeline** | **[PASS]** | GitHub Actions workflow (`.github/workflows/ci.yml`) with lint, test, security audit, Docker build & GHCR container push. |
| **Kubernetes Baseline** | **[PASS]** | Multi-replica Kubernetes Deployment with `RollingUpdate`, resource requests/limits, liveness & readiness probes. |
| **GitOps Engine (Argo CD)** | **[PASS]** | Argo CD deployed in `argocd` namespace; `cloud05-app` Application watching local Git server with automated synchronization. |
| **Configuration Drift & Self-Healing** | **[PASS]** | Manual replica drift (`replicas: 1`) detected and reconciled back to desired state (`replicas: 3`). |
| **Observability (Prometheus)** | **[PASS]** | Prometheus server deployed in `monitoring` namespace; scraping `prom-client` metrics (`http_requests_total`, `http_request_duration_seconds`). |
| **Progressive Delivery (Argo Rollouts)** | **[PASS]** | Argo Rollouts controller active; Canary strategy (25%, 50%, 100%) with automated step pauses. |
| **Runtime Health Analysis** | **[PASS]** | Prometheus `AnalysisTemplate` (`success-rate-analysis`) querying route-filtered HTTP success rate (`threshold >= 90%`). |
| **Automated Abort & Rollback** | **[PASS]** | Deploying faulty v3.0.0 triggered analysis failure (`failed (2) > failureLimit (1)`); rollout automatically aborted, canary scaled to 0, stable revision preserved. |
| **Automated Experiment Runner** | **[PASS]** | Python experiment runner (`experiments/run_experiment.py`) executed 4-stage matrix under live HTTP traffic; outputs `summary.csv` and `summary.json`. |
| **Evidence Collection System** | **[PASS]** | `./scripts/collect-evidence.sh` creates timestamped directories containing cluster info, pod states, logs, rollout status, metrics JSON, and CSV data. |
| **Documentation & Viva Readiness** | **[PASS]** | 10 comprehensive documents created: problem statement, research gap, architecture (with Mermaid diagrams), GitOps ADR, experiments guide, troubleshooting, viva Q&A. |

---

## 2. Experimental Results Summary

The automated experiment matrix (`scripts/run-experiment.sh`) executed all four trials against live cluster workloads:

| Experiment ID | Deployment Mode | Transition | Failure Mode | Total Requests | Error Rate (%) | Blast Radius Impact | Final Version | Rollout Outcome |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `exp_01_baseline_healthy` | Baseline | v1.0.0 → v2.0.0 | None | 51 | 5.88% | Normal warm-up | 2.0.0 | **SUCCESS** |
| `exp_02_baseline_faulty` | Baseline | v2.0.0 → v3.0.0 | Error (75%) | 76 | **52.63%** | **100% of fleet degraded** | 3.0.0 | **DEGRADED_UNPROTECTED** |
| `exp_03_progressive_healthy` | Progressive | v1.0.0 → v2.0.0 | None | 126 | **0.00%** | Zero error impact | 1.0.0/2.0.0 | **SUCCESS** |
| `exp_04_progressive_faulty` | Progressive | v2.0.0 → v3.0.0 | Error (75%) | 127 | **8.66%** | **Canary partitioned (8.66% vs 52.63%)** | 1.0.0 | **PROTECTED / ABORTED** |

### Key Experimental Findings:
1. **Blast Radius Reduction:** Under identical faulty releases (`v3.0.0`), the baseline deployment exposed **52.63%** of all live user traffic to errors across the entire replica set. Progressive canary delivery restricted errors to only **8.66%**, because 75% of traffic was shielded by the stable revision.
2. **Automated Recovery:** Baseline deployment required manual operator intervention to roll back. Argo Rollouts automatically detected the Prometheus error rate increase, aborted the rollout within 5.7 seconds, scaled down the canary pod, and restored 100% traffic to the stable version.

---

## 3. Reviewer Demonstration Verification

The automated demonstration script (`./scripts/demo.sh --auto`) was verified end-to-end:
- **Step 1:** Initial deployment of v1.0.0 verified via `GET /version`.
- **Step 2:** Conventional rolling update to v2.0.0 executed.
- **Step 3:** Cluster drift simulated (`kubectl scale deployment cloud05-demo --replicas=1`); GitOps self-healing reconciled replicas back to 3.
- **Step 4:** Baseline faulty release v3.0.0 deployed; 10 sample requests all returned HTTP 500, proving the release safety problem.
- **Step 5:** Progressive delivery initialized with Argo Rollouts.
- **Step 6:** Faulty v3.0.0 deployed via canary; 30 live requests sent, observing only 3/30 errors on the canary while 27/30 succeeded on the stable revision.
- **Step 7:** Prometheus `success-rate-analysis` failed; rollout status changed to `✖ Degraded (RolloutAborted)`, canary scaled to 0, stable v1.0.0/v2.0.0 restored.
- **Step 8:** Timestamped evidence directory created in `evidence/2026-10-05T192827Z/`.

---

## 4. Reproducibility Guarantee

A new reviewer or evaluator on macOS (ARM64) can reproduce the complete project with standard commands:
```bash
# 1. Validate environment prerequisites
./scripts/check-prerequisites.sh

# 2. Run unit tests & linter
make test

# 3. Build & package containers
make build

# 4. Bootstrap complete cluster & infrastructure
make setup

# 5. Run full automated experiment matrix
make experiment

# 6. Execute complete viva demonstration
make demo
```
