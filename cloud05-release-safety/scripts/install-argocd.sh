#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo "  Installing Argo CD in Kubernetes Cluster                "
echo "=========================================================="

echo "Creating argocd namespace..."
kubectl get ns argocd >/dev/null 2>&1 || kubectl create ns argocd

echo "Applying Argo CD manifests using server-side apply..."
kubectl apply --server-side -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "Waiting for Argo CD deployments to stabilize..."
kubectl rollout status deployment/argocd-server -n argocd --timeout=180s || true
kubectl rollout status deployment/argocd-repo-server -n argocd --timeout=180s || true

echo "Patching argocd-server service to NodePort 30092 for local access..."
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort", "ports": [{"name": "http", "port": 80, "targetPort": 8080, "nodePort": 30092}]}}' || true

# Enable insecure mode for easy local reviewer demonstration
kubectl patch configmap argocd-cmd-params-cm -n argocd --type merge -p '{"data":{"server.insecure":"true"}}'
kubectl rollout restart deployment/argocd-server -n argocd || true

echo "Argo CD setup completed!"
echo "Web UI accessible at http://localhost:8085 (or NodePort 30092)"
echo "Initial admin password can be retrieved via:"
echo "kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d"
echo "=========================================================="
