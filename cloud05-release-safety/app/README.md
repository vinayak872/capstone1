# CLOUD-05 Demo Service (`cloud05-demo-service`)

Production-ready microservice built with Node.js and Express to demonstrate **GitOps CI/CD with Progressive Delivery and Automated Rollback**.

## Architecture Overview

- **Port**: `8080` (configurable via `PORT`)
- **Prometheus Metrics**: Available at `/metrics` using `prom-client`
- **Health Probes**: Liveness (`/health`), Readiness (`/ready`)
- **Version Identification**: `/version` and `/`
- **Dynamic & Config-driven Failure Injection**: Supports `none`, `error`, `latency`, `intermittent`, and `unready` modes.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | Application info, version, environment, and health status |
| `GET` | `/health` | Kubernetes Liveness probe (HTTP 200 = alive, 503 = unalive) |
| `GET` | `/ready` | Kubernetes Readiness probe (HTTP 200 = ready, 503 = unready) |
| `GET` | `/version` | Release version metadata (`1.0.0`, `2.0.0`, `3.0.0`) |
| `GET` | `/api/status` | Detailed runtime diagnostics, memory, and failure config |
| `GET` | `/api/metrics-test` | Workload endpoint for automated load generators |
| `POST` | `/api/admin/failure` | Dynamically reconfigure failure modes for live experiments |
| `GET` | `/metrics` | Prometheus metrics scrape target |

## Configuration Environment Variables

- `APP_VERSION`: Sets release version (e.g., `1.0.0`, `2.0.0`, `3.0.0`)
- `ENVIRONMENT`: e.g. `production`, `demo`, `canary`
- `FAILURE_MODE`: `none`, `error`, `latency`, `intermittent`, `unready`
- `FAILURE_ERROR_RATE`: Float between `0.0` and `1.0` (fraction of requests to fail)
- `FAILURE_LATENCY_MS`: Milliseconds of artificial latency to introduce
- `INITIAL_READY`: `true` or `false`

## Local Development & Testing

```bash
# Install dependencies
npm install

# Run static linter
npm run lint

# Run automated unit/integration tests
npm test

# Run microservice locally
npm start
```
