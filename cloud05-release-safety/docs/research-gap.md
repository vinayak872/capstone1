# Research Gap: Release Safety, GitOps, and Progressive Delivery

## 1. Context and Existing Literature

Modern DevOps literature (e.g. DORA, Accelerate, Google SRE Book) advocates for high deployment frequency and short lead time for changes. GitOps (established by Weaveworks and formalized by OpenGitOps) defines a declarative operational model where Git is the single source of truth and automated agents continuously reconcile desired vs. observed state.

However, existing literature and industry practice reveal several key gaps:

### Gap 1: Decoupling of Declarative State from Runtime Health
GitOps controllers (such as Argo CD and Flux) focus heavily on **configuration reconciliation**—they ensure that the Kubernetes resources running in the cluster match the YAML manifests stored in Git. However, a cluster state can be **100% in-sync** and declared "Healthy" according to Kubernetes pod phase (`Running`) and Readiness probes, while the application itself is failing 90% of business transactions at the application layer.

### Gap 2: Limitations of Container Probes (`livenessProbe` / `readinessProbe`)
Kubernetes probes evaluate local container states (e.g. "Can the process respond to a GET /ready ping?"). They do NOT evaluate aggregate statistical health (e.g. HTTP 5xx error rate across 10,000 user requests, p99 latency spikes, or transaction failure rates). As a result, standard deployments promote faulty versions that pass basic startup checks.

### Gap 3: Absence of Integrated Automated Rollback Mechanisms
In typical GitOps workflows, rolling back requires generating a new Git revert commit (`git revert`), pushing it to the repository, and waiting for the GitOps agent to sync. This introduces human and pipeline latency (often minutes to tens of minutes). There is a critical research gap in integrating **in-cluster progressive delivery controllers** with **metric-driven automated rollback** that immediately aborts a degraded canary release without waiting for human intervention or Git commits.

### Gap 4: Lack of Controlled Empirical Baselines
Many studies praise progressive delivery conceptually, but few provide side-by-side, controlled empirical evaluations comparing identical failure modes (HTTP 500 error floods, latency spikes, intermittent failures) across a baseline conventional deployment versus a progressive canary deployment with quantitative metrics (error percentage, time-to-detect, time-to-recover).

## 2. Contribution of this Project
This project addresses these gaps by:
1. Building a reproducible, empirical benchmark environment using Kind, Kubernetes, Prometheus, Argo CD, and Argo Rollouts.
2. Formulating quantitative evaluation criteria (Blast Radius %, Detection Latency $T_{\text{detect}}$, Rollback Latency $T_{\text{rollback}}$, and Total Recovery Time $T_{\text{recovery}}$).
3. Demonstrating that automated canary analysis reduces faulty release exposure and achieves near-instantaneous automated recovery compared to conventional deployment strategies.
