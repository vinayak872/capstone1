# CLOUD-05: GitOps CI/CD with Progressive Delivery and Automated Rollback

![CI Status](https://img.shields.io/badge/CI-GitHub_Actions-blue?logo=github-actions)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Kind-326CE5?logo=kubernetes)
![GitOps](https://img.shields.io/badge/GitOps-Argo_CD-EF6B55?logo=argo)
![Progressive Delivery](https://img.shields.io/badge/Canary-Argo_Rollouts-F37254)
![Monitoring](https://img.shields.io/badge/Observability-Prometheus-E6522C?logo=prometheus)
![Language](https://img.shields.io/badge/Node.js-v20-339933?logo=nodedotjs)
![Tests](https://img.shields.io/badge/Tests-13%2F13_Passed-brightgreen)

> **Research Direction**: CLOUD-05 — Software Modelling and DevOps Capstone Project  
> **Core Focus**: **Release Safety** in Automated CI/CD Pipelines.

---

## 1. Problem & Research Motivation

### The Research Problem
> *"How can we reduce the impact of faulty software releases in automated CI/CD pipelines by detecting release-health degradation early and automatically recovering before the faulty version is exposed to all users?"*

Modern cloud-native engineering pipelines automate build, test, and deployment steps. However, passing a test suite and basic Kubernetes container readiness probes does not guarantee correct runtime behavior under live workloads. 

In a conventional deployment (`RollingUpdate`), a faulty release propagates to 100% of user traffic before engineers detect degradation, resulting in severe outages, delayed recovery, and extensive manual firefighting.

### The Research Question (RQ)
> *"Can progressive delivery with evidence-based automated rollback reduce the impact of faulty software releases and improve recovery compared with a conventional automated deployment approach?"*

---

## 2. Technology Stack

- **Container Orchestration**: Kubernetes v1.36+ via local Kind
- **Continuous Integration**: GitHub Actions (Lint, Jest tests, Docker build, Trivy scan)
- **Container Registry**: GitHub Container Registry (GHCR) / Local Docker runtime
- **GitOps Engine**: Argo CD (Declarative sync, self-healing, drift reconciliation)
- **Progressive Delivery**: Argo Rollouts (Canary strategy, metric analysis, automated rollback)
- **Telemetry & Monitoring**: Prometheus (pull-based scraping, PromQL, real-time error rates)
- **Application**: Node.js + Express REST Microservice (`cloud05-demo-service`)
- **Testing & Quality**: Jest, Supertest, ESLint
- **Experimentation Engine**: Python 3 Automated Load Generator and Evidence Recorder

---

## 3. High-Level Architecture

```
Developer ---> GitHub App Repo ---> GitHub Actions (Test, Lint, Security Scan, Docker Build)
                                           |
                                           v
GitOps Desired State Repo ------------> Argo CD (Reconciliation & Self-Healing)
                                           |
                                           v
                                   Kubernetes Cluster (Kind)
                                           |
                   +-----------------------+-----------------------+
                   |                                               |
                   v                                               v
        Baseline Deployment                           Progressive Delivery (Argo Rollouts)
      (RollingUpdate Strategy)                                     |
                   |                               +---------------+---------------+
                   v                               |                               |
          Faulty v3.0.0                      Canary 25%                       Stable 75%
         (100% blast radius)                  (v3.0.0)                         (v2.0.0)
                                                   |                               |
                                                   +---------------+---------------+
                                                                   |
                                                      Prometheus Health Analysis
                                                       (Error Rate > 15% ?)
                                                                   |
                                                     [ABORT & AUTOMATED ROLLBACK]
                                                                   |
                                                                   v
                                                      Stable v2.0.0 Preserved!
```

---

## 4. Quick Start & Reproducibility

### Prerequisites
- macOS (Apple Silicon / ARM64 or Intel)
- Docker Desktop (Running)
- `kind`, `kubectl`, `node`, `npm`, `python3`, `git`

Verify prerequisites:
```bash
make check-prerequisites # OR: ./scripts/check-prerequisites.sh
```

### One-Command Setup
Provision the entire cluster, build all container images, install Prometheus, Argo Rollouts, Argo CD, and deploy the baseline service:
```bash
make setup
# OR:
./scripts/setup.sh
```

### Accessing Endpoints
| Component | Local URL | Port / Protocol |
|---|---|---|
| **Demo Application** | `http://localhost:8080` | Port 8080 (NodePort 30080) |
| **Prometheus Web UI** | `http://localhost:9090` | Port 9090 (NodePort 30090) |
| **Argo CD Dashboard** | `http://localhost:8085` | Port 8085 (NodePort 30092) |

---

## 5. Running the Demonstration

To guide reviewers and evaluators through the complete research scenario:
```bash
make demo
# OR:
./scripts/demo.sh
```

### Demonstration Steps:
1. **Show v1.0.0**: Inspect cluster, pods, and `/version`.
2. **Deploy Healthy v2.0.0**: Demonstrate smooth rolling update.
3. **GitOps Drift Reconcile**: Inject manual drift (`kubectl scale replicas=1`) and observe automatic self-healing back to 3 replicas.
4. **Deploy Faulty v3.0.0 (Baseline)**: Observe 100% traffic exposed to HTTP 500 errors (proving the research problem).
5. **Switch to Progressive Delivery**: Deploy Argo Rollouts canary.
6. **Deploy Faulty v3.0.0 (Progressive)**: Observe canary traffic isolation (25%), Prometheus analysis evaluation, automatic abort, and instantaneous rollback to stable v2.0.0.
7. **Collect Evidence**: Timestamped evidence stored in `evidence/<timestamp>/`.

---

## 6. Running Automated Experiments

Execute the automated experiment matrix and record quantitative results:
```bash
make experiment
# OR:
./scripts/run-experiment.sh
```

Outputs are stored in:
- `experiments/results/summary.csv`
- `experiments/results/summary.json`

---

## 7. Project Structure

```
cloud05-release-safety/
├── app/                  # Node.js microservice, tests, Dockerfile
├── gitops/               # K8s manifests (base, rollout, argocd, services)
├── infrastructure/       # Kind cluster configuration with port mappings
├── monitoring/           # Prometheus configuration and manifests
├── experiments/          # Automated experiment runner and CSV/JSON results
├── scripts/              # Setup, deploy, demo, and evidence collection scripts
├── evidence/             # Real timestamped logs, cluster dumps, and metrics
├── docs/                 # Research problem, gap, architecture, viva, reproducibility
├── reports/              # Summary analysis reports
├── Makefile              # Top-level make targets
└── README.md             # Project documentation
```

---

## 8. Troubleshooting & Teardown

See [`docs/troubleshooting.md`](docs/troubleshooting.md) for detailed diagnostics.

To safely delete the local cluster and temporary test resources:
```bash
make cleanup
# OR:
./scripts/cleanup.sh
```
