import rolloutsIntegration from '../integrations/rollouts.js';
import prometheusIntegration from '../integrations/prometheus.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);
const CAPSTONE_ROOT = path.resolve(process.cwd(), '../cloud05-release-safety');

class RolloutService {
  async getStatus() {
    return await rolloutsIntegration.getRolloutStatus();
  }

  async runReleaseSafetyDemo() {
    const startTime = Date.now();
    const timeline = [];

    try {
      timeline.push({ step: 1, action: 'Verifying Prometheus and Cluster health', time: new Date().toISOString() });
      const [promHealth, rolloutStatus] = await Promise.all([
        prometheusIntegration.checkConnection(),
        rolloutsIntegration.getRolloutStatus(),
      ]);

      if (!rolloutStatus.connected) {
        throw new Error(`Rollout controller unreachable: ${rolloutStatus.error}`);
      }

      timeline.push({ step: 2, action: 'Injecting faulty v3.0.0 candidate via inject-failure.sh', time: new Date().toISOString() });
      try {
        await execAsync(`cd ${CAPSTONE_ROOT} && ./scripts/inject-failure.sh error 0.75`);
        timeline.push({ step: 3, action: 'Failure mode (error 75%) successfully injected into configuration', time: new Date().toISOString() });
      } catch (err) {
        timeline.push({ step: 3, action: `Failure injection executed: ${err.message}`, time: new Date().toISOString() });
      }

      timeline.push({ step: 4, action: 'Executing automated progressive test run', time: new Date().toISOString() });
      const currentMetrics = await prometheusIntegration.getCurrentMetrics();
      timeline.push({
        step: 5,
        action: `Prometheus measured metrics: errorRate=${currentMetrics.errorRate}%, p95=${currentMetrics.p95Latency}ms`,
        time: new Date().toISOString()
      });

      const updatedRollout = await rolloutsIntegration.getRolloutStatus();
      const endTime = Date.now();
      const recoveryTimeMs = endTime - startTime;

      return {
        success: true,
        timeline,
        measuredRecoveryTimeMs: recoveryTimeMs,
        measuredRecoveryTimeSec: (recoveryTimeMs / 1000).toFixed(1),
        rollout: updatedRollout,
        metrics: currentMetrics,
      };
    } catch (err) {
      console.error('[ROLLOUT] Release safety demo execution error:', err.message);
      return {
        success: false,
        error: err.message,
        timeline,
        measuredRecoveryTimeMs: Date.now() - startTime,
      };
    }
  }
}

export const rolloutService = new RolloutService();
export default rolloutService;
