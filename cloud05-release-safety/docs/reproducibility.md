# Reproducibility Guide: CLOUD-05

This guide explains how an evaluator, reviewer, or new team member can clone this repository on an Apple Silicon macOS system and reproduce the entire experimental environment from scratch in minutes.

---

## 1. Prerequisites Checklist

Ensure the following tools are installed:
- **macOS** (Tested on Apple Silicon / ARM64)
- **Docker Desktop** (>= 20.10, running)
- **kubectl** (>= 1.25)
- **kind** (>= 0.18)
- **Node.js & npm** (>= 18.0)
- **Python 3** (>= 3.9)
- **Git** (>= 2.30)

Run the automated prerequisite validator:
```bash
./scripts/check-prerequisites.sh
```

---

## 2. One-Command Setup

To provision the entire system:
```bash
make setup
# OR:
./scripts/setup.sh
```

This single command automatically:
1. Validates all CLI tools and Docker daemon status.
2. Builds the three production container images (`cloud05-demo:1.0.0`, `2.0.0`, `3.0.0`).
3. Provisions the local Kind Kubernetes cluster with port mappings (8080, 9090, 8085).
4. Loads all container images into Kind without requiring external registry pulls.
5. Deploys Prometheus monitoring with automatic pod discovery.
6. Installs the Argo Rollouts controller and custom resource definitions.
7. Installs Argo CD with automated synchronization and self-healing.
8. Deploys the in-cluster Git server and spins up the baseline application.

---

## 3. Running the Verification & Interactive Demo

To execute the reviewer viva demonstration:
```bash
make demo
# OR:
./scripts/demo.sh
```

This interactive script steps through:
1. Live baseline application v1.0.0.
2. RollingUpdate to healthy v2.0.0.
3. GitOps drift injection (scaling to 1 replica) and automatic reconciliation back to 3 replicas.
4. Deploying faulty v3.0.0 via conventional RollingUpdate (showing widespread user errors).
5. Deploying faulty v3.0.0 via Argo Rollouts Progressive Delivery (showing canary isolation, automated metric evaluation, and automatic rollback to stable v2.0.0).
6. Automatic evidence collection into `evidence/<timestamp>/`.

---

## 4. Running the Experiment Matrix

To run the automated benchmark experiments:
```bash
make experiment
# OR:
./scripts/run-experiment.sh
```

All results are written to `experiments/results/summary.csv` and `experiments/results/summary.json`.

---

## 5. Teardown & Clean Up

To safely remove the local Kind cluster and temporary containers without affecting source code or evidence:
```bash
make cleanup
# OR:
./scripts/cleanup.sh
```
