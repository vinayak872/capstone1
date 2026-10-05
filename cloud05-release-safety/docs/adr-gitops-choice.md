# ADR-001: Selection of Argo CD as Primary GitOps Continuous Delivery Engine

## Status
**Accepted** (Evaluation conducted for CLOUD-05 Capstone)

## Context
In modern cloud-native engineering, continuous deployment requires automated reconciliation between a version-controlled Git repository (representing desired state) and running Kubernetes clusters (representing observed state). 

The CLOUD-05 capstone evaluates release safety by comparing a conventional GitOps baseline deployment (Kubernetes Deployment with RollingUpdate) against progressive delivery with automated rollback (Argo Rollouts). To facilitate this research, a robust, reproducible, and verifiable GitOps reconciliation engine is required. The two primary candidate tools are **Argo CD** and **Flux v2**.

## Decision
We select **Argo CD** as the reference GitOps continuous delivery controller for the CLOUD-05 research project.

## Consequences & Trade-offs

### Positive Consequences
1. **Clear Synchronous Visibility**: Argo CD provides real-time state visualization (`Synced`/`OutOfSync`, `Healthy`/`Degraded`), allowing transparent demonstration of GitOps drift and automated self-healing during academic reviews and viva.
2. **First-Class Progressive Delivery Integration**: Argo CD shares architectural patterns with Argo Rollouts, simplifying the pipeline for canary deployments, Prometheus-based health analysis, and automated rollbacks.
3. **Reproducibility in Local Kind Environments**: Argo CD deploys cleanly via standard declarative manifests in local macOS/Docker Desktop Kind clusters without external cloud dependencies.
4. **Declarative Application CRDs**: Declarative `Application` manifests allow version-controlled switching between baseline deployment pipelines and progressive canary rollout pipelines.

### Negative Consequences / Trade-offs
1. **Resource Overhead**: Argo CD utilizes slightly higher memory (~350–500MB) compared to Flux's modular controllers (~200MB). This is mitigated by setting appropriate resource limits and running a single-node Kind cluster on Apple Silicon.
2. **Monolithic UI/Server Component**: Unlike Flux which embraces the UNIX philosophy of separate single-purpose controllers without a default UI, Argo CD includes an API server and web UI. For our capstone, this overhead is advantageous as it provides clear visual evidence for live viva evaluation.
