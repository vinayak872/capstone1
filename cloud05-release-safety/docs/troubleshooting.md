# Troubleshooting Guide: CLOUD-05

This guide provides automated and manual remediation procedures for common operational issues encountered in local Kubernetes, Argo CD, Argo Rollouts, and Prometheus environments.

---

## 1. Fast Diagnostic Checklist

Run the automated prerequisite check first:
```bash
./scripts/check-prerequisites.sh
```

Inspect active cluster health:
```bash
kubectl get nodes
kubectl get pods -A
```

---

## 2. Common Issues & Solutions

### 2.1 Docker Daemon Not Running
- **Symptom**: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`
- **Cause**: Docker Desktop is not started.
- **Fix**: Launch Docker Desktop:
  ```bash
  open -a Docker
  ```
  Wait until `docker info` returns 0.

---

### 2.2 Kind Cluster Unavailable or Context Incorrect
- **Symptom**: `The connection to the server localhost:6443 was refused` or `error: no context exists with the name: "kind-cloud05"`
- **Cause**: The cluster was not created or the current kubectl context is pointing elsewhere.
- **Fix**: Switch context or recreate:
  ```bash
  kubectl config use-context kind-cloud05
  # Or recreate:
  ./scripts/create-cluster.sh
  ```

---

### 2.3 Image Pull Failure (`ErrImagePull` / `ImagePullBackOff`)
- **Symptom**: Pod status shows `ImagePullBackOff` for `cloud05-demo:1.0.0` or `3.0.0`.
- **Cause**: Locally built images were not loaded into the Kind control plane node.
- **Fix**: Run the image loader script:
  ```bash
  ./scripts/load-image.sh
  ```

---

### 2.4 Argo Rollouts CRD Missing or Controller Not Ready
- **Symptom**: `error: the server doesn't have a resource type "rollout"`
- **Cause**: Argo Rollouts manifests were not applied.
- **Fix**: Reinstall Argo Rollouts:
  ```bash
  ./scripts/install-rollouts.sh
  kubectl rollout status deployment/argo-rollouts -n argo-rollouts
  ```

---

### 2.5 Prometheus Unavailable or Scrapes Empty
- **Symptom**: `http://localhost:9090` unreachable or AnalysisTemplate returns empty vector.
- **Cause**: Prometheus pod pending or port mapping occupied.
- **Fix**:
  ```bash
  kubectl get pods -n monitoring
  kubectl logs -n monitoring -l app=prometheus
  # Forward port directly if NodePort 30090 has port collision:
  kubectl port-forward svc/prometheus-server -n monitoring 9090:9090 &
  ```

---

### 2.6 Rollout Stuck in Paused State
- **Symptom**: `cloud05-rollout` status shows `Paused` indefinitely.
- **Cause**: Canary step had a manual pause or an analysis run is evaluating.
- **Fix**: Inspect the rollout details:
  ```bash
  kubectl argo rollouts get rollout cloud05-rollout -n cloud05
  # Promote manually if desired:
  kubectl argo rollouts promote cloud05-rollout -n cloud05
  # Or abort:
  kubectl argo rollouts abort cloud05-rollout -n cloud05
  ```

---

### 2.7 Application Port 8080 Unreachable on Host
- **Symptom**: `curl http://localhost:8080/health` returns `Connection refused`.
- **Cause**: Kind extraPortMapping 30080 -> 8080 might be blocked by another local process, or the Service does not have pods.
- **Fix**:
  ```bash
  # Check if pods are running
  kubectl get pods -n cloud05 -l app=cloud05-demo
  # Direct port-forward fallback:
  kubectl port-forward svc/cloud05-service -n cloud05 8080:80 &
  ```
