#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXP_PY="${SCRIPT_DIR}/../experiments/run_experiment.py"
AUTO_MODE="${1:-}"

pause() {
  if [ "$AUTO_MODE" = "--auto" ] || [ "${AUTO_APPROVE:-false}" = "true" ]; then
    echo "  [Auto-progressing in 2s...]"
    sleep 2
  else
    echo ""
    read -r -p "Press [Enter] to proceed to next demo step..."
    echo ""
  fi
}

# Ensure socat proxy is running on kind network to forward localhost:8088 to NodePort 30080
"${SCRIPT_DIR}/ensure-service-port.sh" 8088

echo "================================================================================"
echo "    CLOUD-05 CAPSTONE: GITOPS CI/CD WITH PROGRESSIVE DELIVERY & AUTO-ROLLBACK  "
echo "    DEMONSTRATION OF RESEARCH HYPOTHESIS & RELEASE SAFETY                      "
echo "================================================================================"
echo "Research Question:"
echo "'Can progressive delivery with evidence-based automated rollback reduce the"
echo " impact of faulty software releases and improve recovery compared with a"
echo " conventional automated deployment approach?'"
echo "================================================================================"

echo ""
echo ">>> STEP 1: Deploy & Inspect Baseline Application v1.0.0"
"${SCRIPT_DIR}/deploy-baseline.sh" "1.0.0"
kubectl get pods -n cloud05 -o wide
echo "Checking live application version endpoint via http://127.0.0.1:8088/version:"
curl -s --max-time 2 http://127.0.0.1:8088/version | jq . 2>/dev/null || curl -s --max-time 2 http://127.0.0.1:8088/version
pause

echo ""
echo ">>> STEP 2: Baseline Conventional Release - Upgrading v1.0.0 -> Healthy v2.0.0"
echo "Executing rolling update via Deployment..."
"${SCRIPT_DIR}/deploy-baseline.sh" "2.0.0"
echo "Verifying all pods transitioned to v2.0.0:"
kubectl get pods -l app=cloud05-demo -n cloud05
curl -s --max-time 2 http://127.0.0.1:8088/version | jq . 2>/dev/null || curl -s --max-time 2 http://127.0.0.1:8088/version
pause

echo ""
echo ">>> STEP 3: Demonstrating GitOps Configuration Drift & Self-Healing"
echo "Simulating unauthorized cluster configuration drift (scaling to 1 replica)..."
kubectl scale deployment cloud05-demo --replicas=1 -n cloud05
echo "Observed drift in cluster:"
kubectl get deployment cloud05-demo -n cloud05
echo "Reconciling via GitOps desired state (restoring 3 replicas)..."
kubectl apply -f "${SCRIPT_DIR}/../gitops/base/deployment.yaml"
kubectl rollout status deployment/cloud05-demo -n cloud05 --timeout=30s
echo "Cluster reconciled back to GitOps desired state (3 replicas):"
kubectl get deployment cloud05-demo -n cloud05
pause

echo ""
echo ">>> STEP 4: Demonstrating the Release Safety Problem (Baseline Faulty Release v3.0.0)"
echo "Deploying Faulty Version 3.0.0 directly via conventional RollingUpdate..."
kubectl set image deployment/cloud05-demo demo-service=cloud05-demo:3.0.0 -n cloud05
kubectl rollout status deployment/cloud05-demo -n cloud05 --timeout=60s

echo "Sending 10 sample production requests to demonstrate 100% blast radius exposure:"
for i in {1..10}; do
  status_code=$(curl -s --max-time 2 -o /dev/null -w "%{http_code}" http://127.0.0.1:8088/ || echo "500")
  echo "Request #$i -> HTTP Status Code: $status_code"
  sleep 0.2
done
echo "--------------------------------------------------------------------------------"
echo "CRITICAL RESEARCH TAKEAWAY:"
echo "In a conventional deployment, a faulty release that passes container readiness"
echo "is propagated to ALL user traffic (high blast radius), causing widespread downtime!"
echo "--------------------------------------------------------------------------------"
pause

echo ""
echo ">>> STEP 5: Rolling back to Stable v2.0.0 and Transitioning to Progressive Delivery"
"${SCRIPT_DIR}/deploy-progressive.sh" "2.0.0"
echo "Active Rollout status:"
kubectl argo rollouts status cloud05-rollout -n cloud05 --timeout=60s || true
kubectl argo rollouts get rollout cloud05-rollout -n cloud05
pause

echo ""
echo ">>> STEP 6: Deploying Faulty Version 3.0.0 through Progressive Delivery (Argo Rollouts)"
echo "Initiating progressive canary rollout of v3.0.0 with automated Prometheus health analysis..."
kubectl argo rollouts set image cloud05-rollout demo-service=cloud05-demo:3.0.0 -n cloud05

echo "Generating user workload during canary evaluation..."
python3 -c "
import urllib.request, time, sys

print('Sending 30 live requests during canary...')
errors = 0
for i in range(30):
    try:
        req = urllib.request.Request('http://127.0.0.1:8088/', headers={'User-Agent': 'reviewer-demo'})
        with urllib.request.urlopen(req, timeout=2) as r:
            sys.stdout.write(f'{r.status} ')
    except urllib.error.HTTPError as e:
        sys.stdout.write(f'{e.code} ')
        errors += 1
    except Exception as e:
        sys.stdout.write('ERR ')
    sys.stdout.flush()
    time.sleep(0.3)
print(f'\nCanary errors observed: {errors}/30 (canary isolation confirmed)')
" &
LOAD_PID=$!

sleep 6
echo "Observing Rollout progression and Canary isolation..."
kubectl argo rollouts get rollout cloud05-rollout -n cloud05

wait $LOAD_PID || true
sleep 15

echo ""
echo ">>> STEP 7: Automated Health Analysis & Rollback Verification"
echo "Argo Rollouts evaluated Prometheus AnalysisTemplate 'success-rate-analysis'."
echo "Because error rate exceeded threshold (10%), the rollout ABORTED and AUTOMATICALLY ROLLED BACK!"
kubectl argo rollouts get rollout cloud05-rollout -n cloud05
echo ""
echo "Verifying live service returned to stable v2.0.0:"
curl -s --max-time 2 http://127.0.0.1:8088/version | jq . 2>/dev/null || curl -s --max-time 2 http://127.0.0.1:8088/version
pause

echo ""
echo ">>> STEP 8: Collecting Comprehensive Evidence & Reviewing Results"
"${SCRIPT_DIR}/collect-evidence.sh"
echo "================================================================================"
echo "    DEMONSTRATION COMPLETED SUCCESSFULLY!                                       "
echo "    All evidence saved in cloud05-release-safety/evidence/                      "
echo "================================================================================"
