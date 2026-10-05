# Problem Statement: Release Safety in Cloud-Native Automated CI/CD Pipelines

## 1. Domain Background
In modern cloud-native software engineering, teams strive for high deployment velocity using Continuous Integration and Continuous Deployment (CI/CD) pipelines. In standard containerized environments running on Kubernetes, automated pipelines typically build container images, run unit and integration tests, and initiate a deployment update using strategies such as `RollingUpdate`.

## 2. The Core Problem
**A successful build, test suite, and container startup do not guarantee correct runtime behavior under live traffic.**

When software changes are released:
1. **Latent Runtime Failures**: Subtle defects (e.g. database schema incompatibilities, race conditions, memory leaks, third-party API rate limits, or edge-case configuration errors) are often undetected by isolated test environments.
2. **Immediate Blast Radius Exposure**: Conventional Kubernetes deployment strategies (such as `RollingUpdate`) gradually replace old pods with new pods. Once the container passes its readiness probe, 100% of user traffic is directed to the new version.
3. **Delayed Detection**: Degradation is usually detected only after end-users report errors, or after centralized alerts trigger minutes or hours later.
4. **Manual Recovery Effort**: Once an outage is detected, SREs must manually trigger a rollback or deploy an emergency hotfix, resulting in elevated Mean Time to Detect (MTTD) and Mean Time to Recover (MTTR).

## 3. Formal Problem Statement
> *"Modern cloud-native teams need to release application changes frequently, but a successful build and deployment do not guarantee that a new version will behave correctly under real runtime conditions. A faulty release can therefore be propagated too broadly before its impact is detected, increasing service degradation and recovery effort. Existing practices address parts of this problem through automated CI/CD, GitOps reconciliation, canary/gradual deployment and rollback, but these mechanisms must be integrated with measurable health criteria and evaluated under controlled failure conditions. This project investigates whether a GitOps-based CI/CD workflow enhanced with progressive delivery and automated rollback can reduce release impact and improve recovery compared with a defined baseline deployment workflow."*

## 4. Research Hypothesis
By combining **GitOps continuous reconciliation** (Argo CD) with **progressive delivery** (Argo Rollouts) and **automated real-time health analysis** (Prometheus), we can:
- Constrain blast radius to a small fraction (e.g. 10%–25%) of traffic.
- Detect runtime degradation automatically within seconds without human intervention.
- Trigger automatic rollback and restore stable operation before the defect impacts all users.
