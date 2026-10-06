import k8sClient from './kubernetes.js';
import axios from 'axios';

const ARGOCD_NAMESPACE = process.env.ARGOCD_NAMESPACE || 'argocd';
const ARGOCD_APP_NAME = process.env.ARGOCD_APPLICATION || 'cloud05-app';
const ARGOCD_URL = process.env.ARGOCD_URL || 'http://localhost:8085';

class ArgoCDIntegration {
  async getApplicationStatus() {
    try {
      // Primary approach: Query Kubernetes Custom Object for Argo CD Application CRD
      const app = await k8sClient.getCustomResource(
        'argoproj.io',
        'v1alpha1',
        ARGOCD_NAMESPACE,
        'applications',
        ARGOCD_APP_NAME
      );

      if (app) {
        console.log(`[ARGOCD] Successfully retrieved Application ${ARGOCD_APP_NAME} from Kubernetes CRD`);
        return {
          source: 'argocd_crd',
          connected: true,
          application: app.metadata?.name || ARGOCD_APP_NAME,
          namespace: ARGOCD_NAMESPACE,
          repoURL: app.spec?.source?.repoURL || 'git://local-git-server.cloud05.svc.cluster.local:9418/cloud05-gitops.git',
          targetRevision: app.spec?.source?.targetRevision || 'main',
          path: app.spec?.source?.path || 'gitops/rollout',
          syncStatus: app.status?.sync?.status || 'Unknown',
          healthStatus: app.status?.health?.status || 'Unknown',
          revision: app.status?.sync?.revision || app.status?.operationState?.syncResult?.revision || 'unknown',
          reconciledAt: app.status?.reconciledAt || null,
          operationPhase: app.status?.operationState?.phase || null,
          operationMessage: app.status?.operationState?.message || null,
          conditions: app.status?.conditions || [],
          history: app.status?.history || [],
          autoHeal: Boolean(app.spec?.syncPolicy?.automated?.selfHeal),
          error: null
        };
      }

      // If specific app wasn't found, list all applications
      const apps = await k8sClient.listCustomResources(
        'argoproj.io',
        'v1alpha1',
        ARGOCD_NAMESPACE,
        'applications'
      );

      if (apps.length > 0) {
        const first = apps[0];
        console.log(`[ARGOCD] Found alternate Application ${first.metadata.name}`);
        return {
          source: 'argocd_crd',
          connected: true,
          application: first.metadata.name,
          namespace: ARGOCD_NAMESPACE,
          repoURL: first.spec?.source?.repoURL || '',
          targetRevision: first.spec?.source?.targetRevision || 'main',
          path: first.spec?.source?.path || '',
          syncStatus: first.status?.sync?.status || 'Unknown',
          healthStatus: first.status?.health?.status || 'Unknown',
          revision: first.status?.sync?.revision || '',
          reconciledAt: first.status?.reconciledAt || null,
          operationPhase: first.status?.operationState?.phase || null,
          conditions: first.status?.conditions || [],
          error: null
        };
      }

      // Check HTTP connectivity as fallback
      const httpCheck = await this.checkHttpHealth();
      return {
        source: 'argocd_api',
        connected: httpCheck.reachable,
        application: ARGOCD_APP_NAME,
        syncStatus: 'Unknown',
        healthStatus: httpCheck.reachable ? 'Healthy' : 'Unavailable',
        error: httpCheck.reachable ? null : 'Application CRD not found in cluster'
      };
    } catch (err) {
      console.error('[ARGOCD] Error querying Argo CD Application:', err.message);
      return {
        source: 'argocd',
        connected: false,
        application: ARGOCD_APP_NAME,
        syncStatus: 'Offline',
        healthStatus: 'Offline',
        error: err.message
      };
    }
  }

  async checkHttpHealth() {
    try {
      const res = await axios.get(ARGOCD_URL, { timeout: 3000 });
      return { reachable: res.status >= 200 && res.status < 400 };
    } catch (err) {
      return { reachable: false, error: err.message };
    }
  }
}

export const argoCDIntegration = new ArgoCDIntegration();
export default argoCDIntegration;
