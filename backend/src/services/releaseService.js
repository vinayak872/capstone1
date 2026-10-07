import k8sClient from '../integrations/kubernetes.js';
import axios from 'axios';

const K8S_NAMESPACE = process.env.K8S_NAMESPACE || 'cloud05';
const BACKEND_APP_URL = process.env.BACKEND_APP_URL || 'http://localhost:8080';

class ReleaseService {
  async getCurrentRelease() {
    try {
      // 1. Check live microservice directly
      let directApp = null;
      try {
        const [vRes, hRes] = await Promise.all([
          axios.get(`${BACKEND_APP_URL}/version`, { timeout: 3000 }),
          axios.get(`${BACKEND_APP_URL}/health`, { timeout: 3000 }),
        ]);
        directApp = {
          application: vRes.data?.application || 'cloud05-demo-service',
          version: vRes.data?.version || 'unknown',
          environment: vRes.data?.environment || 'demo',
          status: hRes.data?.status || 'healthy',
          hostname: vRes.data?.hostname || '',
          alive: hRes.data?.alive ?? true,
        };
      } catch (e) {
        console.warn('[RELEASE] Microservice endpoint check failed:', e.message);
      }

      // 2. Query Kubernetes pods in namespace cloud05
      const pods = await k8sClient.getPods(K8S_NAMESPACE);
      const appPods = pods.filter(p => p.metadata.name.includes('cloud05-rollout') || p.metadata.name.includes('demo'));

      const versionsFound = new Set();
      const podDetails = appPods.map(pod => {
        const cStatus = pod.status?.containerStatuses?.[0];
        const image = pod.spec?.containers?.[0]?.image || cStatus?.image || '';
        const tagMatch = image.match(/:([^:]+)$/);
        const tag = tagMatch ? tagMatch[1] : (directApp?.version || '1.0.0');

        versionsFound.add(tag.startsWith('v') ? tag : `v${tag}`);

        return {
          podName: pod.metadata.name,
          image,
          imageTag: tag.startsWith('v') ? tag : `v${tag}`,
          ready: cStatus?.ready || false,
          restartCount: cStatus?.restartCount || 0,
          node: pod.spec?.nodeName || 'cloud05-control-plane',
          phase: pod.status?.phase || 'Unknown',
          createdTimestamp: pod.metadata.creationTimestamp,
        };
      });

      const versionList = Array.from(versionsFound);
      const primaryVersion = versionList[0] || (directApp?.version ? `v${directApp.version}` : 'v1.0.0');

      // If multiple versions exist during a rollout
      let stableVersion = primaryVersion;
      let canaryVersion = null;
      if (versionList.length > 1) {
        stableVersion = versionList[0];
        canaryVersion = versionList[1];
      }

      return {
        source: 'kubernetes',
        connected: true,
        currentVersion: primaryVersion,
        stable: stableVersion,
        canary: canaryVersion,
        multipleVersionsDetected: versionList.length > 1,
        versionsDetected: versionList,
        backendDirect: directApp,
        totalReplicas: podDetails.length,
        readyReplicas: podDetails.filter(p => p.ready).length,
        pods: podDetails,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error('[RELEASE] getCurrentRelease failed:', err.message);
      return {
        source: 'kubernetes',
        connected: false,
        currentVersion: 'unknown',
        error: err.message,
        pods: [],
      };
    }
  }

  async getReleaseHistory() {
    // Collect from real ReplicaSets and Rollout revisions in cloud05
    try {
      const rsList = await k8sClient.getReplicaSets(K8S_NAMESPACE);
      const cloud05RS = rsList.filter(rs => rs.metadata.name.includes('cloud05-rollout'));

      const [analysisRuns, rollout] = await Promise.all([
        k8sClient.listCustomResources('argoproj.io', 'v1alpha1', K8S_NAMESPACE, 'analysisruns').catch(() => []),
        k8sClient.getCustomResource('argoproj.io', 'v1alpha1', K8S_NAMESPACE, 'rollouts', 'cloud05-rollout').catch(() => null),
      ]);

      const history = cloud05RS.map((rs, idx) => {
        const image = rs.spec?.template?.spec?.containers?.[0]?.image || '';
        const tagMatch = image.match(/:([^:]+)$/);
        const version = tagMatch ? `v${tagMatch[1]}` : 'v1.0.0';
        const replicas = rs.status?.replicas || 0;
        const readyReplicas = rs.status?.readyReplicas || 0;
        const revision = rs.metadata.annotations?.['rollout.argoproj.io/revision'] || `${cloud05RS.length - idx}`;
        const podHash = rs.metadata.labels?.['rollouts-pod-template-hash'] || '';

        // Check for any failed analysis run corresponding to this RS/revision
        const failedRun = analysisRuns.find(ar => {
          const arRev = ar.metadata?.annotations?.['rollout.argoproj.io/revision'];
          const arHash = ar.metadata?.labels?.['rollouts-pod-template-hash'];
          const isPhaseFailed = ar.status?.phase === 'Failed' || ar.status?.phase === 'Error';
          return isPhaseFailed && (arRev === revision || (podHash && arHash === podHash));
        });

        let status = 'SCALED_DOWN';
        let result = 'SUPERSEDED';
        let rollbackReason = null;

        if (replicas > 0 && readyReplicas > 0) {
          status = 'STABLE';
          result = 'ACTIVE_PRODUCTION';
        } else if (failedRun) {
          status = 'ROLLED BACK';
          result = 'AUTOMATED ROLLBACK';
          const failedMetric = failedRun.status?.metricResults?.find(m => m.phase === 'Failed');
          const metricDetail = failedMetric ? ` Metric '${failedMetric.name}' failed threshold condition.` : '';
          rollbackReason = `AnalysisRun ${failedRun.metadata.name} failed.${metricDetail} Automated rollback aborted candidate and preserved stable revision.`;
        }

        return {
          revision,
          name: rs.metadata.name,
          version,
          status,
          result,
          strategy: 'Canary Progressive (25% → 50% → 100%)',
          replicas,
          readyReplicas,
          image,
          createdAt: rs.metadata.creationTimestamp,
          rollbackReason,
          commit: rs.metadata.labels?.['app.kubernetes.io/version'] || `rev-${revision}`,
          dataSource: 'Kubernetes ReplicaSet & Argo Rollouts CRD',
        };
      });

      return history.sort((a, b) => parseInt(b.revision) - parseInt(a.revision));
    } catch (err) {
      console.error('[RELEASE] getReleaseHistory failed:', err.message);
      return [];
    }
  }
}

export const releaseService = new ReleaseService();
export default releaseService;
