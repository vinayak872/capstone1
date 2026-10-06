import * as k8s from '@kubernetes/client-node';

class KubernetesClient {
  constructor() {
    this.kc = new k8s.KubeConfig();
    this.initialized = false;
    this.initError = null;

    try {
      this.kc.loadFromDefault();
      this.currentContext = this.kc.currentContext;
      this.coreV1Api = this.kc.makeApiClient(k8s.CoreV1Api);
      this.appsV1Api = this.kc.makeApiClient(k8s.AppsV1Api);
      this.customObjectsApi = this.kc.makeApiClient(k8s.CustomObjectsApi);
      this.initialized = true;
      console.log(`[K8S] Loaded kubeconfig successfully. Current context: ${this.currentContext}`);
    } catch (err) {
      this.initError = err.message;
      console.error('[K8S] Failed to load kubeconfig:', err.message);
    }
  }

  async checkConnection() {
    if (!this.initialized) return { connected: false, error: this.initError };
    try {
      const res = await this.coreV1Api.listNamespace({});
      const namespaces = (res.items || res.body?.items || []).map(ns => ns.metadata.name);
      return {
        connected: true,
        context: this.currentContext,
        namespaces,
        error: null
      };
    } catch (err) {
      console.error('[K8S] Connection check failed:', err.message);
      return { connected: false, error: err.message };
    }
  }

  async getPods(namespace = 'cloud05') {
    if (!this.initialized) throw new Error(this.initError);
    const res = await this.coreV1Api.listNamespacedPod({ namespace });
    return res.items || res.body?.items || [];
  }

  async getDeployments(namespace = 'cloud05') {
    if (!this.initialized) throw new Error(this.initError);
    const res = await this.appsV1Api.listNamespacedDeployment({ namespace });
    return res.items || res.body?.items || [];
  }

  async getServices(namespace = 'cloud05') {
    if (!this.initialized) throw new Error(this.initError);
    const res = await this.coreV1Api.listNamespacedService({ namespace });
    return res.items || res.body?.items || [];
  }

  async getReplicaSets(namespace = 'cloud05') {
    if (!this.initialized) throw new Error(this.initError);
    const res = await this.appsV1Api.listNamespacedReplicaSet({ namespace });
    return res.items || res.body?.items || [];
  }

  async getEvents(namespace = 'cloud05') {
    if (!this.initialized) throw new Error(this.initError);
    const res = await this.coreV1Api.listNamespacedEvent({ namespace });
    return res.items || res.body?.items || [];
  }

  async getCustomResource(group, version, namespace, plural, name) {
    if (!this.initialized) throw new Error(this.initError);
    try {
      const res = await this.customObjectsApi.getNamespacedCustomObject({
        group,
        version,
        namespace,
        plural,
        name
      });
      return res.body || res;
    } catch (err) {
      if (err.statusCode === 404 || err.response?.statusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  async listCustomResources(group, version, namespace, plural) {
    if (!this.initialized) throw new Error(this.initError);
    try {
      const res = await this.customObjectsApi.listNamespacedCustomObject({
        group,
        version,
        namespace,
        plural
      });
      return res.items || res.body?.items || [];
    } catch (err) {
      if (err.statusCode === 404 || err.response?.statusCode === 404) {
        return [];
      }
      throw err;
    }
  }
}

export const k8sClient = new KubernetesClient();
export default k8sClient;
