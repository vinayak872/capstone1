# Empirical Experimentation Framework: CLOUD-05

## 1. Experimental Methodology

The objective of the experimentation framework is to quantitatively answer the primary research question:
> *"Can progressive delivery with evidence-based automated rollback reduce the impact of faulty software releases and improve recovery compared with a conventional automated deployment approach?"*

### Variables
- **Independent Variables**:
  - Deployment Architecture: Baseline (`RollingUpdate`) vs. Progressive Delivery (`Argo Rollouts Canary`)
  - Release Quality: Healthy (v2.0.0) vs. Faulty (v3.0.0 with HTTP 500 error flood or latency)
  - Workload Load Profile: Constant request rate via automated HTTP generator
- **Dependent Variables**:
  - Blast Radius ($B$): Percentage of total incoming user requests that encounter HTTP 5xx errors during deployment.
  - Detection Latency ($T_{\text{detect}}$): Time from release deployment until the system registers failure.
  - Rollback Latency ($T_{\text{rollback}}$): Time required for the system to abort and revert to stable.
  - Total Recovery Time ($T_{\text{recovery}}$): Total duration from the first observed failure until 100% of user traffic is served cleanly by the restored version.
  - Resource Overhead: CPU and memory utilized by the safety controller.

---

## 2. Experiment Matrix

| Experiment ID | Deployment Mode | Transition | Injected Failure Mode | Expected Outcome |
|---|---|---|---|---|
| **EXP-01** | Baseline (`RollingUpdate`) | v1.0.0 -> v2.0.0 | None | 100% promotion, 0% errors, smooth rolling update |
| **EXP-02** | Baseline (`RollingUpdate`) | v2.0.0 -> v3.0.0 | Error (75% error rate) | High blast radius (~75% error rate), all pods replaced, requires manual intervention |
| **EXP-03** | Progressive (`Argo Rollouts`) | v1.0.0 -> v2.0.0 | None | 25% -> 50% -> 100% promotion, AnalysisTemplate passes, successful automated release |
| **EXP-04** | Progressive (`Argo Rollouts`) | v2.0.0 -> v3.0.0 | Error (75% error rate) | AnalysisTemplate fails on Step 1 (25% canary), Rollout aborts and rolls back to v2.0.0 automatically |
| **EXP-05** | Progressive (`Argo Rollouts`) | v2.0.0 -> v3.0.0 | Latency (1500ms delay) | Latency metric triggers analysis failure, canary halted |
| **EXP-06** | GitOps Drift Verification | Baseline | Manual scale replica=1 | Argo CD detects drift (`OutOfSync`), automatically reconciles to 3 replicas |

---

## 3. Mathematical Definitions

1. **Error Rate ($E$)**:
$$E = \frac{N_{\text{failed}}}{N_{\text{total}}} \times 100\%$$

2. **Blast Radius Reduction ($\Delta B$)**:
$$\Delta B = B_{\text{baseline}} - B_{\text{progressive}}$$

3. **Total Recovery Time ($T_{\text{recovery}}$)**:
$$T_{\text{recovery}} = T_{\text{clean\_restore}} - T_{\text{first\_error}}$$

---

## 4. Execution & Automated Output
Experiments are executed via:
```bash
./scripts/run-experiment.sh
```
Outputs are written as individual JSON records (`experiments/results/exp_*.json`) and unified into `experiments/results/summary.csv`.
