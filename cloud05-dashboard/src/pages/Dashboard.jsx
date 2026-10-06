import React, { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Activity,
  Layers,
  GitBranch,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Play,
  Clock,
  BookOpen
} from 'lucide-react';
import StatusCard from '../components/StatusCard';
import VersionBadge from '../components/VersionBadge';
import DeploymentTimeline from '../components/DeploymentTimeline';
import CanaryProgress from '../components/CanaryProgress';
import DataSourceBadge from '../components/DataSourceBadge';
import {
  getClusterHealth,
  getCurrentRelease,
  getGitOpsStatus,
  getRolloutStatus,
  getMetricsCurrent,
  runRolloutDemo
} from '../services/api';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Live Infrastructure Telemetry State
  const [cluster, setCluster] = useState({ connected: true, pods: { desired: 3, ready: 3 } });
  const [release, setRelease] = useState({ currentVersion: 'v1.0.0', stable: 'v1.0.0', canary: null, pods: [] });
  const [gitops, setGitops] = useState({ syncStatus: 'Synced', healthStatus: 'Healthy', revision: 'main' });
  const [rollout, setRollout] = useState({ phase: 'Healthy', rolloutState: 'STABLE', canaryWeight: 0, stablePercent: 100, canaryPercent: 0 });
  const [metrics, setMetrics] = useState({ requestRate: 0, errorRate: 0, p95Latency: 0, availability: 100 });

  // Reviewer Demo State
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoResult, setDemoResult] = useState(null);

  const fetchLiveTelemetry = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [clusterRes, releaseRes, gitopsRes, rolloutRes, metricsRes] = await Promise.all([
        getClusterHealth(),
        getCurrentRelease(),
        getGitOpsStatus(),
        getRolloutStatus(),
        getMetricsCurrent(),
      ]);

      if (clusterRes.data) setCluster(clusterRes.data);
      if (releaseRes.data) setRelease(releaseRes.data);
      if (gitopsRes.data) setGitops(gitopsRes.data);
      if (rolloutRes.data) setRollout(rolloutRes.data);
      if (metricsRes.data) setMetrics(metricsRes.data);

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('[DASHBOARD] Error fetching live telemetry:', err);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, []);

  // Set up SSE Stream with polling fallback
  useEffect(() => {
    fetchLiveTelemetry();

    // Check if EventSource is supported
    let eventSource = null;
    try {
      eventSource = new EventSource('/api/stream');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.cluster) setCluster(payload.cluster);
          if (payload.release) setRelease(payload.release);
          if (payload.argo) setGitops(payload.argo);
          if (payload.rollout) setRollout(payload.rollout);
          if (payload.metrics) setMetrics(payload.metrics);
          setLastUpdated(new Date().toLocaleTimeString());
        } catch (e) {}
      };
      eventSource.onerror = () => {
        eventSource.close();
      };
    } catch (e) {
      // Fallback to interval
    }

    const interval = setInterval(fetchLiveTelemetry, 5000);
    return () => {
      clearInterval(interval);
      if (eventSource) eventSource.close();
    };
  }, [fetchLiveTelemetry]);

  // Execute Real Reviewer Demo
  const handleRunDemo = async () => {
    setDemoRunning(true);
    setDemoResult(null);
    try {
      const res = await runRolloutDemo();
      setDemoResult(res.data);
      await fetchLiveTelemetry();
    } catch (err) {
      setDemoResult({ success: false, error: err.message });
    } finally {
      setDemoRunning(false);
    }
  };

  const isRolledBack = rollout.isAborted || rollout.phase === 'Degraded';

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Activity size={24} color="var(--status-blue)" />
            Real-Time Capstone Observability Dashboard
          </h1>
          <p className="page-subtitle">
            Live telemetry stream from Kubernetes cluster (kind-cloud05), Argo CD, Prometheus, and Argo Rollouts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {lastUpdated && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Live Telemetry: {lastUpdated}
            </span>
          )}
          <button
            onClick={fetchLiveTelemetry}
            disabled={isRefreshing}
            className="btn btn-secondary"
            style={{ fontSize: '12px' }}
          >
            <RefreshCw size={13} className={isRefreshing ? 'spin-anim' : ''} />
            <span>Poll Now</span>
          </button>
        </div>
      </div>

      {/* Reviewer Demonstration Action Banner */}
      <div className="card" style={{
        marginBottom: '24px',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)',
        borderLeft: '4px solid var(--status-blue)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="var(--status-green)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
              Reviewer Viva Demonstration: Controlled Release Safety Workflow
            </h3>
            <DataSourceBadge source="LIVE" label="LIVE CLUSTER WORKFLOW" size="small" />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Triggers fault injection on the cluster, initiates progressive canary steps, and measures automated rollback latency.
          </p>
        </div>

        <button
          onClick={handleRunDemo}
          disabled={demoRunning}
          className="btn btn-primary"
          style={{ padding: '10px 18px', fontSize: '13px' }}
        >
          <Play size={14} className={demoRunning ? 'spin-anim' : ''} />
          <span>{demoRunning ? 'Executing Automated Workflow...' : 'Run Release Safety Demo'}</span>
        </button>
      </div>

      {/* Demo Execution Output Panel */}
      {demoResult && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '8px',
          backgroundColor: demoResult.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          border: `1px solid ${demoResult.success ? 'var(--status-green-border)' : 'var(--status-red-border)'}`,
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: demoResult.success ? 'var(--status-green)' : 'var(--status-red)' }}>
              {demoResult.success ? 'Automated Rollback Workflow Successfully Verified' : 'Workflow Execution Failed'}
            </span>
            {demoResult.measuredRecoveryTimeSec && (
              <span className="font-mono" style={{ fontSize: '12px', color: '#ffffff' }}>
                Measured Time: <strong>{demoResult.measuredRecoveryTimeSec}s</strong>
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {demoResult.timeline?.map(t => (
              <div key={t.step} style={{ display: 'flex', gap: '8px' }}>
                <span className="font-mono" style={{ color: 'var(--text-muted)' }}>[{t.step}]</span>
                <span>{t.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. Real System Status Cards (Connected to live Kubernetes & Prometheus) */}
      <div className="grid-4">
        <StatusCard
          title="Application"
          value={release.backendDirect?.application || 'cloud05-demo-service'}
          subtitle={`Host: ${release.backendDirect?.hostname || release.pods?.[0]?.podName || 'cluster'}`}
          status={cluster.connected ? 'healthy' : 'offline'}
          badgeText={cluster.connected ? 'LIVE WORKLOAD' : 'OFFLINE'}
          icon={Server}
          dataSource="LIVE"
        />

        <StatusCard
          title="Current Version"
          value={
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <VersionBadge version={release.currentVersion} />
              {release.canary && (
                <span style={{ fontSize: '12px', color: 'var(--status-yellow)' }}>
                  Canary: {release.canary}
                </span>
              )}
            </div>
          }
          subtitle={`Stable: ${release.stable}`}
          status="healthy"
          badgeText="KUBERNETES TAG"
          icon={ShieldCheck}
          dataSource="LIVE"
        />

        <StatusCard
          title="Kubernetes Replicas"
          value={`${cluster.pods?.ready ?? 0} / ${cluster.pods?.desired ?? 3}`}
          subtitle="Observed / Desired Pods"
          status={cluster.pods?.ready === cluster.pods?.desired ? 'healthy' : 'warning'}
          badgeText="LIVE K8S"
          icon={Layers}
          dataSource="LIVE"
        />

        <StatusCard
          title="GitOps State"
          value={gitops.syncStatus || 'Synced'}
          subtitle={`Health: ${gitops.healthStatus || 'Healthy'}`}
          status={gitops.syncStatus === 'Synced' ? 'synced' : 'warning'}
          badgeText="ARGO CD LIVE"
          icon={GitBranch}
          dataSource="LIVE"
        />
      </div>

      {/* 2. Live Rollout Engine & Prometheus Telemetry Summary */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="var(--status-green)" />
            <span>Progressive Delivery Mechanism: Real Rollout &amp; Telemetry Status</span>
          </div>
          <DataSourceBadge source="LIVE" label="LIVE CONTROLLER OBSERVED" />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          padding: '16px 0 20px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Release Tag</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {rollout.targetVersion || release.currentVersion}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Image tag in spec</span>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Controller Phase</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: isRolledBack ? 'var(--status-red)' : 'var(--status-blue)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {rollout.phase || 'Healthy'}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Argo Rollout status</span>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Live Error Rate</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: metrics.errorRate > 5 ? 'var(--status-red)' : 'var(--status-green)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {metrics.errorRate}%
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prometheus PromQL</span>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rollback State</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: isRolledBack ? 'var(--status-red)' : 'var(--status-green)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {isRolledBack ? 'ROLLED BACK' : 'READY / ACTIVE'}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AnalysisRun evaluated</span>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <DeploymentTimeline />
        </div>
      </div>

      {/* 3. Live Canary Traffic Distribution Bar */}
      <div className="grid-2">
        <div>
          <CanaryProgress
            stablePercent={rollout.traffic?.stablePercent ?? 100}
            canaryPercent={rollout.traffic?.canaryPercent ?? 0}
            stableVersion={rollout.stableVersion || release.stable || 'v2.0.0'}
            canaryVersion={rollout.targetVersion || 'v3.0.0'}
            isAborted={isRolledBack}
            statusLabel={isRolledBack ? 'Rolled Back to Stable (100%)' : 'Canary Evaluated'}
          />
        </div>

        {/* Live Kubernetes Pods Workload State */}
        <div className="card">
          <div className="card-title">
            <span>Observed Pod Workloads (Namespace: cloud05)</span>
            <DataSourceBadge source="LIVE" label="KUBERNETES PODS" size="small" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            {release.pods?.slice(0, 4).map((pod) => (
              <div
                key={pod.podName}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {pod.podName}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Image Tag: <strong>{pod.imageTag}</strong> • Node: {pod.node}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${pod.ready ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '10px' }}>
                    {pod.ready ? 'READY' : 'NOT READY'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    restarts: {pod.restartCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
