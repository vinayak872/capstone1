import k8sClient from '../integrations/kubernetes.js';

const K8S_NAMESPACE = process.env.K8S_NAMESPACE || 'cloud05';

class ClusterService {
  async getClusterHealth() {
    try {
      const conn = await k8sClient.checkConnection();
      if (!conn.connected) {
        return {
          source: 'kubernetes',
          connected: false,
          cluster: 'cloud05',
          namespace: K8S_NAMESPACE,
          error: conn.error,
          pods: { desired: 0, ready: 0, available: 0 }
        };
      }

      const pods = await k8sClient.getPods(K8S_NAMESPACE);
      let readyCount = 0;
      let availableCount = 0;

      pods.forEach(pod => {
        const isRunning = pod.status?.phase === 'Running';
        const readyCond = pod.status?.conditions?.find(c => c.type === 'Ready');
        const isReady = readyCond?.status === 'True';
        if (isReady && isRunning) {
          readyCount++;
          availableCount++;
        }
      });

      // Get rollout or deployment to find desired replicas
      let desired = pods.length;
      try {
        const deployments = await k8sClient.getDeployments(K8S_NAMESPACE);
        if (deployments.length > 0) {
          desired = deployments[0].spec?.replicas || desired;
        }
      } catch (e) {
        // Fallback to pod count
      }

      console.log(`[K8S] ready replicas: ${readyCount}/${desired}`);

      return {
        source: 'kubernetes',
        connected: true,
        cluster: 'cloud05',
        context: conn.context,
        namespace: K8S_NAMESPACE,
        pods: {
          desired,
          ready: readyCount,
          available: availableCount,
        },
        podList: pods.map(p => ({
          name: p.metadata.name,
          phase: p.status?.phase,
          ip: p.status?.podIP,
          node: p.spec?.nodeName,
          restarts: p.status?.containerStatuses?.[0]?.restartCount || 0,
          ready: p.status?.containerStatuses?.[0]?.ready || false,
          image: p.status?.containerStatuses?.[0]?.image || '',
        }))
      };
    } catch (err) {
      console.error('[K8S] getClusterHealth failed:', err.message);
      return {
        source: 'kubernetes',
        connected: false,
        cluster: 'cloud05',
        namespace: K8S_NAMESPACE,
        error: err.message,
        pods: { desired: 0, ready: 0, available: 0 }
      };
    }
  }

  async getPods() {
    return await k8sClient.getPods(K8S_NAMESPACE);
  }

  async getDeployments() {
    return await k8sClient.getDeployments(K8S_NAMESPACE);
  }

  async getServices() {
    return await k8sClient.getServices(K8S_NAMESPACE);
  }

  async getEvents() {
    return await k8sClient.getEvents(K8S_NAMESPACE);
  }
}

export const clusterService = new ClusterService();
export default clusterService;
