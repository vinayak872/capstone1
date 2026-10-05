# CLOUD-05: Architecture & Design Specification

## 1. System Architecture Overview

The CLOUD-05 release safety architecture integrates developer workflows, containerization, declarative GitOps reconciliation, progressive delivery canary controllers, and metric-based automated rollback.

```mermaid
graph TD
    subgraph Development & CI
        Dev[Developer] -->|Push Code| GitApp[GitHub App Repo]
        GitApp -->|Trigger| GHA[GitHub Actions CI]
        GHA -->|Lint & Test| Tests[Automated Tests]
        GHA -->|Build & Scan| Docker[Docker Build & Trivy Scan]
        Docker -->|Push Image| GHCR[Container Registry GHCR]
    end

    subgraph GitOps Source of Truth
        Dev -->|Commit Manifests| GitRepo[GitOps Repo / in-cluster Git]
        GitRepo -->|Watches Desired State| ArgoCD[Argo CD Controller]
    end

    subgraph Kubernetes Runtime Cluster
        ArgoCD -->|Reconcile & Self-Heal| K8s[Kubernetes Cluster]
        K8s -->|Baseline Pipeline| Deploy[Conventional Deployment RollingUpdate]
        K8s -->|Progressive Pipeline| Rollout[Argo Rollout Controller]
        Rollout -->|Canary 25%| CanaryPod[Canary Pods v3.0.0]
        Rollout -->|Stable 75%| StablePod[Stable Pods v2.0.0]
        
        Prom[Prometheus Server] -->|Scrapes /metrics| CanaryPod
        Prom -->|Scrapes /metrics| StablePod
        
        Rollout -->|Queries AnalysisTemplate| Prom
        Prom -->|Error Rate > 15%| Abort[Trigger Automated Abort & Rollback]
        Abort -->|Restore 100%| StablePod
    end
```

---

## 2. GitHub Actions CI Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant GH as GitHub
    participant CI as GitHub Actions Runner
    participant Reg as Container Registry (GHCR)

    Dev->>GH: git push origin main
    GH->>CI: Trigger Workflow (ci.yml)
    CI->>CI: Checkout repository
    CI->>CI: Install Node.js dependencies
    CI->>CI: Run ESLint (Static Analysis)
    CI->>CI: Run Jest Tests (13/13 test cases)
    CI->>CI: Dependency Security Audit
    CI->>CI: Multi-stage Docker Build (node:20-alpine)
    CI->>CI: Trivy Vulnerability Scan
    CI->>Reg: Authenticate & Push image (cloud05-demo:SHA)
```

---

## 3. GitOps Continuous Reconciliation & Drift Flow

```mermaid
sequenceDiagram
    autonumber
    participant Git as Git Repository (Desired State)
    participant ArgoCD as Argo CD Application Controller
    participant K8s as Kubernetes API Server (Live State)

    Note over Git,K8s: Normal Automated GitOps Sync
    Git->>ArgoCD: Manifest update committed (e.g. replicas: 3)
    ArgoCD->>K8s: Compare Desired vs Observed State
    ArgoCD->>K8s: Apply Kustomize manifests (Sync: Synced)

    Note over Git,K8s: Configuration Drift & Self-Healing
    actor Attacker as Rogue kubectl actor
    Attacker->>K8s: kubectl scale deployment --replicas=1
    K8s->>ArgoCD: Cluster state changed (Replicas=1)
    ArgoCD->>ArgoCD: Detects Drift (Status: OutOfSync)
    ArgoCD->>K8s: Self-Heal triggers: patches Deployment back to 3 replicas
    Note over ArgoCD,K8s: Desired State Restored Automatically!
```

---

## 4. Progressive Delivery & Automated Rollback Flow

```mermaid
stateDiagram-v2
    [*] --> InitialState: Stable Release v2.0.0 (100% Traffic)
    InitialState --> CanaryDeploy: Deploy Release v3.0.0
    
    state CanaryDeploy {
        [*] --> Canary25: Step 1 Route 25% Traffic to v3.0.0
        Canary25 --> PauseWait: Pause 6 seconds
        PauseWait --> AnalysisRun: Execute AnalysisTemplate
        
        state AnalysisRun {
            [*] --> QueryProm: Query Prometheus http_requests_total
            QueryProm --> Evaluate: Error Rate <= 15% ?
        }
    }

    AnalysisRun --> PromoteNext: Metric Pass (Error Rate <= 15%)
    PromoteNext --> Canary50: Step 2 Route 50% Traffic
    Canary50 --> Canary100: Step 3 Route 100% Traffic
    Canary100 --> [*]: Promoted to Stable v3.0.0

    AnalysisRun --> AbortRollback: Metric Fail (Error Rate > 15%)
    state AbortRollback {
        [*] --> TerminateCanary: Terminate Canary Pods v3.0.0
        TerminateCanary --> RevertStable: Route 100% Traffic to Stable v2.0.0
    }
    AbortRollback --> [*]: System Restored to v2.0.0 (Zero Manual Intervention)
```

---

## 5. Experiment Evaluation Pipeline

```mermaid
flowchart LR
    Start([Start Experiment]) --> Mode{Select Mode}
    Mode -->|Baseline| RunBase[Deploy RollingUpdate]
    Mode -->|Progressive| RunProg[Deploy Argo Rollout]
    
    RunBase --> Inject[Inject Failure: HTTP 500 / Latency]
    RunProg --> Inject
    
    Inject --> LoadGen[Run Automated Workload Generator]
    LoadGen --> Health[Sample HTTP Statuses & Latencies]
    Health --> PromScrape[Query Prometheus Metrics]
    
    PromScrape --> Record[Calculate MTTD, MTTR, Blast Radius %]
    Record --> Export[Write JSON & CSV Evidence Files]
    Export --> Done([Complete])
```
