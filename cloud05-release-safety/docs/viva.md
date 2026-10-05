# CLOUD-05: Comprehensive Capstone Viva & Review Preparation Guide

This document prepares the student team to authoritatively answer all architectural, theoretical, and operational questions during viva examinations and academic defense reviews.

---

### Q1: What is the research problem investigated in this project?
**Answer:** The research problem is **Release Safety in Automated CI/CD Pipelines**. Specifically: *"How can we reduce the impact of faulty software releases in automated CI/CD pipelines by detecting release-health degradation early and automatically recovering before the faulty version is exposed to all users?"* GitOps, Argo CD, Kubernetes, and Prometheus are the engineering mechanisms used to investigate this problem.

---

### Q2: Why is this a real and critical engineering problem?
**Answer:** In modern cloud-native systems, container images can pass all pre-deployment checks (linter, unit tests, integration tests, container image build) and pass basic Kubernetes startup probes (`livenessProbe`, `readinessProbe`). Yet under live user traffic, subtle defects (e.g. database query regressions, third-party timeouts, concurrency bugs, or misconfigurations) cause runtime degradation. In standard deployments, 100% of user traffic is immediately exposed to the faulty release, leading to widespread downtime and long recovery times.

---

### Q3: What did existing literature and industry practice say, and what is the research gap?
**Answer:** 
- **Literature**: DORA research establishes that elite teams deploy frequently with low change failure rates. GitOps literature establishes declarative desired-state reconciliation.
- **The Gap**: Traditional GitOps reconciles *configuration*, not *runtime behavioral health*. Standard Kubernetes deployment strategies (such as `RollingUpdate`) lack integrated metric-driven feedback loops. When a faulty release passes readiness probes, RollingUpdate blindly replaces all healthy pods. Furthermore, rolling back via GitOps traditionally requires manual human intervention (creating a git revert commit), which increases Mean Time to Recover (MTTR).

---

### Q4: Why did you choose Kubernetes and GitOps?
**Answer:** Kubernetes provides the standard declarative container orchestration platform. GitOps ensures that the desired state of the cluster is version-controlled, auditable, and continuously reconciled, eliminating configuration drift and providing immutable audit trails.

---

### Q5: Why Argo CD instead of Flux?
**Answer:** Both are graduated CNCF GitOps tools. We chose Argo CD because:
1. It provides an intuitive real-time UI showing live sync status, diffs, and health conditions, which is crucial for transparent viva demonstrations.
2. It provides native synergy with **Argo Rollouts**, which belongs to the same project ecosystem and shares application CRD paradigms.
3. Flux employs a modular, headless UNIX philosophy that requires external third-party UIs for equivalent visual inspection.

---

### Q6: Why Progressive Delivery (Canary) instead of a conventional RollingUpdate?
**Answer:** 
- **RollingUpdate**: Replaces pods one-by-one. Once a pod is `Ready`, traffic is routed to it. If the application has a runtime defect, 100% of incoming requests will eventually hit the faulty version.
- **Canary Progressive Delivery**: Only routes a small, controlled fraction of traffic (e.g. 10% or 25%) to the new version. The remaining 75%–90% continues to be safely served by the proven stable version. If health criteria degrade, the canary is aborted with zero impact to the majority of users.

---

### Q7: Why Prometheus for health metrics?
**Answer:** Prometheus is the cloud-native standard for pull-based metric collection. It supports high-frequency scraping (down to 2–3s intervals), rich mathematical queries via PromQL (rates, histograms, percentiles), and direct integration into Argo Rollouts `AnalysisTemplate` CRDs.

---

### Q8: How does automated rollback work under the hood?
**Answer:**
1. During a canary step, Argo Rollouts instantiates an `AnalysisRun` based on our `AnalysisTemplate`.
2. The controller executes a PromQL query against Prometheus evaluating the error rate:
   `sum(rate(http_requests_total{status_code=~"5.."}[1m])) / sum(rate(http_requests_total[1m])) * 100`.
3. If the error rate exceeds the configured threshold (e.g. > 15%), the metric evaluation fails.
4. The Argo Rollouts controller marks the analysis as `Failed`, changes the Rollout phase to `Degraded`, terminates the canary pods, and immediately points 100% of service traffic back to the stable replica set.

---

### Q9: How do you verify that rollback actually happened and wasn't faked?
**Answer:** We verify through multiple independent data sources:
1. `kubectl argo rollouts status`: Inspects the real controller phase transitioning from `Progressing` -> `Degraded` -> `Aborted`.
2. `curl http://localhost:8080/version`: Queries the live endpoint, proving that the HTTP response version immediately reverted to stable `2.0.0`.
3. Pod inspect: Checking `kubectl get pods` shows canary pods terminated and only stable replica pods active.
4. Prometheus metrics: Live query shows error rate drop back to 0%.

---

### Q10: What happens if Prometheus or the monitoring signal fails?
**Answer:** The system implements a **fail-closed** safety philosophy. In our `AnalysisTemplate`, failure to query Prometheus or exceeding `failureLimit` causes the analysis to fail. Argo Rollouts does NOT blindly promote an unverified release; it halts progression and preserves the stable release.

---

### Q11: What is your baseline, and what did your experiments demonstrate?
**Answer:**
- **Baseline**: A standard Kubernetes `Deployment` using `RollingUpdate` with 3 replicas and liveness/readiness probes.
- **Experimental Findings**:
  - Baseline Faulty Release: Blast radius reached ~75%–100% error rate; required manual intervention to recover.
  - Progressive Faulty Release: Blast radius was constrained to the canary fraction; automated health analysis detected degradation in < 15 seconds; automated rollback restored healthy operation without human intervention.

---

### Q12: What are the current limitations and scope boundaries?
**Answer:**
- Traffic splitting in our local reference implementation is pod-ratio based (replicas) or service-based rather than utilizing an advanced service mesh (such as Istio or Envoy).
- Local cluster runs on single-node Kind on macOS. Multi-cluster GitOps and distributed multi-region deployments are planned for Semester VIII extensions.

---

### Q13: What are DORA metrics and how does this relate to them?
**Answer:** DORA (DevOps Research and Assessment) metrics track four key delivery capabilities: Deployment Frequency, Lead Time for Changes, Change Failure Rate, and Time to Restore Service (MTTR). Our project directly targets **Change Failure Rate** (by isolating failures before full promotion) and drastically reduces **Time to Restore Service** (from minutes of manual firefighting down to automated sub-minute rollbacks).
