# Requirements Specification: CLOUD-05 Release Safety

## 1. Functional Requirements

### FR-01: Microservice Implementation
- The application must be a production-ready Node.js REST microservice (`cloud05-demo-service`).
- Endpoints required: `GET /`, `GET /health` (liveness), `GET /ready` (readiness), `GET /version`, `GET /api/status`, `GET /api/metrics-test`, `POST /api/admin/failure`, `GET /metrics`.
- Responses must return JSON containing `application`, `version`, `environment`, `status`, `timestamp`, and `hostname`.
- Must support controlled failure injection modes: `none`, `error`, `latency`, `intermittent`, `unready`.

### FR-02: Automated Testing & Code Quality
- Unit and integration tests covering all routes, failure behaviors, and probe responses using Jest and Supertest.
- Static analysis via ESLint.
- Dependency security auditing.

### FR-03: Containerization
- Multi-stage Dockerfile based on `node:20-alpine`.
- Run as non-root user (`node`).
- Built-in `HEALTHCHECK`.
- Build scripts producing versions `1.0.0`, `2.0.0`, and `3.0.0`.

### FR-04: GitHub Actions CI Pipeline
- Automated build, test, and container scanning on push/PR.
- Container image vulnerability scanning using Trivy.
- Push to GitHub Container Registry (GHCR).

### FR-05: Baseline Kubernetes Deployment
- Namespace `cloud05`.
- 3 replicas with `RollingUpdate` strategy.
- Liveness and readiness probes.
- Resource requests and limits.

### FR-06: GitOps Reconciliation & Self-Healing
- Real Argo CD engine installed in-cluster.
- Application manifests synchronizing from Git.
- Auto-sync and self-healing enabled to detect and correct cluster configuration drift.

### FR-07: Progressive Delivery & Automated Rollback
- Argo Rollouts controller and CRD (`Rollout`).
- Canary strategy with traffic steps (e.g. 25%, 50%, 100%).
- Prometheus-driven `AnalysisTemplate` monitoring error rate and success rate.
- Automated abort and instant rollback to the previous stable replica set upon failure detection.

### FR-08: Observability & Metrics
- Prometheus server scraping application `/metrics`.
- Standard and custom counters/histograms (`http_requests_total`, `http_request_duration_seconds`, `app_health_status`).

### FR-09: Automated Experimentation & Evidence Collection
- Automated Python/Bash experiment runner generating HTTP load and recording timestamped CSV/JSON data.
- Automated evidence collection script preserving logs, metrics, pod states, and rollout status.

---

## 2. Non-Functional Requirements

| ID | Category | Specification |
|---|---|---|
| **NFR-01** | **Reproducibility** | Complete system runs locally on macOS Apple Silicon using Docker Desktop + Kind with a single command (`./scripts/setup.sh` or `make setup`). |
| **NFR-02** | **Fail-Safe Operation** | If monitoring is unavailable, the progressive rollout must fail-closed (pause/abort) rather than blindly promoting an unverified release. |
| **NFR-03** | **Security** | Containers run without root privileges; resource limits prevent container exhaustion; no committed secrets. |
| **NFR-04** | **Observability** | Structured JSON logs output to stdout; metrics exposed in standard Prometheus OpenMetrics format. |
| **NFR-05** | **Low Latency** | Baseline and progressive health probes execute with sub-second response times. |
