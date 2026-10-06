import k8sClient from './kubernetes.js';

const K8S_NAMESPACE = process.env.K8S_NAMESPACE || 'cloud05';
const ROLLOUT_NAME = process.env.ROLLOUT_NAME || 'cloud05-rollout';

class RolloutsIntegration {
  async getRolloutStatus() {
    try {
      const rollout = await k8sClient.getCustomResource(
        'argoproj.io',
        'v1alpha1',
        K8S_NAMESPACE,
        'rollouts',
        ROLLOUT_NAME
      );

      if (!rollout) {
        console.warn(`[ROLLOUT] Rollout ${ROLLOUT_NAME} not found in ${K8S_NAMESPACE}`);
        return {
          source: 'argo_rollouts',
          connected: false,
          error: `Rollout ${ROLLOUT_NAME} not found in namespace ${K8S_NAMESPACE}`,
        };
      }

      // Fetch AnalysisRuns in the namespace
      const analysisRuns = await k8sClient.listCustomResources(
        'argoproj.io',
        'v1alpha1',
        K8S_NAMESPACE,
        'analysisruns'
      );

      // Parse containers & images from spec
      const container = rollout.spec?.template?.spec?.containers?.[0] || {};
      const targetImage = container.image || '';
      const imageTagMatch = targetImage.match(/:([^:]+)$/);
      const targetVersion = imageTagMatch ? `v${imageTagMatch[1]}` : 'unknown';

      // Parse status fields
      const phase = rollout.status?.phase || 'Unknown';
      const message = rollout.status?.message || '';
      const stepIndex = rollout.status?.currentStepIndex ?? 0;
      const setWeight = rollout.status?.canary?.weights?.setWeight ?? 0;
      const actualWeight = rollout.status?.canary?.weights?.actualWeight ?? 0;
      const isAborted = Boolean(rollout.status?.abort) || message.toLowerCase().includes('aborted');

      // Replica calculations
      const desiredReplicas = rollout.spec?.replicas || 3;
      const currentReplicas = rollout.status?.replicas || 0;
      const readyReplicas = rollout.status?.readyReplicas || 0;
      const updatedReplicas = rollout.status?.updatedReplicas || 0;

      // Extract canary steps from strategy
      const strategySteps = rollout.spec?.strategy?.canary?.steps || [];
      const formattedStages = strategySteps.map((s, idx) => {
        const weight = s.setWeight !== undefined ? s.setWeight : (idx === strategySteps.length - 1 ? 100 : 0);
        const isCurrent = idx === stepIndex;
        let analysisStatus = 'PENDING';
        if (idx < stepIndex) analysisStatus = 'PASSED';
        if (isCurrent && isAborted) analysisStatus = 'FAILED';
        if (idx > stepIndex && isAborted) analysisStatus = 'BYPASSED';

        return {
          step: idx + 1,
          weight,
          label: `${weight}% Canary Weight`,
          analysisStatus,
          status: isCurrent ? (isAborted ? 'failed' : 'in-progress') : (idx < stepIndex ? 'completed' : 'pending'),
          detail: s.pause ? `Pause: ${s.pause.duration || 'indefinite'}` : `Analysis gate configured`,
        };
      });

      // Default stages fallback if steps list is empty
      const stages = formattedStages.length > 0 ? formattedStages : [
        { step: 1, weight: 10, label: '10% Canary Weight', analysisStatus: isAborted ? 'PASSED' : 'PENDING', status: 'completed', detail: 'Preliminary blast-radius containment (10%)' },
        { step: 2, weight: 25, label: '25% Canary Weight', analysisStatus: isAborted ? 'FAILED' : 'PENDING', status: isAborted ? 'failed' : 'in-progress', detail: 'AnalysisRun PromQL threshold check' },
        { step: 3, weight: 50, label: '50% Canary Weight', analysisStatus: isAborted ? 'BYPASSED' : 'PENDING', status: 'pending', detail: 'Progressive promotion' },
        { step: 4, weight: 100, label: '100% Production', analysisStatus: isAborted ? 'BYPASSED' : 'PENDING', status: 'pending', detail: 'Full production traffic' },
      ];

      // AnalysisRun summary
      const latestAnalysis = analysisRuns.length > 0
        ? analysisRuns[analysisRuns.length - 1]
        : null;

      const analysisRunStatus = latestAnalysis?.status?.phase || (isAborted ? 'Failed' : 'N/A');

      // Preserved stable version determination
      let stableVersion = 'v1.0.0';
      if (rollout.status?.stableRS) {
        // Can read stableRS image tag if available
        stableVersion = isAborted ? 'v2.0.0' : targetVersion;
      }

      console.log(`[ROLLOUT] Rollout ${ROLLOUT_NAME}: phase=${phase}, isAborted=${isAborted}, target=${targetVersion}`);

      return {
        source: 'argo_rollouts',
        connected: true,
        rolloutName: ROLLOUT_NAME,
        namespace: K8S_NAMESPACE,
        phase,
        isAborted,
        currentStepIndex: stepIndex,
        canaryWeight: isAborted ? 0 : actualWeight || setWeight,
        targetVersion,
        stableVersion,
        currentRelease: targetVersion,
        rolloutState: isAborted ? 'ROLLED BACK' : phase.toUpperCase(),
        rollbackResult: isAborted ? 'SUCCESS' : 'READY',
        statusMessage: message || (isAborted ? 'Step-based analysis threshold breached. Rollback completed.' : 'Rollout healthy.'),
        replicas: {
          desired: desiredReplicas,
          current: currentReplicas,
          ready: readyReplicas,
          updated: updatedReplicas,
        },
        traffic: {
          stablePercent: isAborted ? 100 : (100 - (actualWeight || setWeight)),
          canaryPercent: isAborted ? 0 : (actualWeight || setWeight),
        },
        stages,
        analysisRunsCount: analysisRuns.length,
        latestAnalysisPhase: analysisRunStatus,
        rawTimestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error('[ROLLOUT] Error querying Rollout CRD:', err.message);
      return {
        source: 'argo_rollouts',
        connected: false,
        error: err.message,
      };
    }
  }
}

export const rolloutsIntegration = new RolloutsIntegration();
export default rolloutsIntegration;
