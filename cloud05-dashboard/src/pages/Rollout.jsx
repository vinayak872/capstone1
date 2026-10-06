import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, ShieldCheck, AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import RolloutStatus from '../components/RolloutStatus';
import CanaryProgress from '../components/CanaryProgress';
import DataSourceBadge from '../components/DataSourceBadge';
import { getRolloutStatus } from '../services/api';

export default function Rollout() {
  const [rolloutData, setRolloutData] = useState({
    source: 'argo_rollouts',
    connected: true,
    rolloutName: 'cloud05-rollout',
    phase: 'Healthy',
    isAborted: false,
    currentStepIndex: 0,
    canaryWeight: 0,
    targetVersion: 'v1.0.0',
    stableVersion: 'v1.0.0',
    currentRelease: 'v1.0.0',
    rolloutState: 'STABLE',
    rollbackResult: 'READY',
    statusMessage: 'Rollout operating nominally.',
    traffic: { stablePercent: 100, canaryPercent: 0 },
    stages: [],
    analysisRunsCount: 0,
    latestAnalysisPhase: 'N/A'
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchLiveRollout = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await getRolloutStatus();
      if (res.data && res.data.connected) {
        setRolloutData(res.data);
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('[ROLLOUT] Error fetching live rollout status:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveRollout();
    const interval = setInterval(fetchLiveRollout, 5000);
    return () => clearInterval(interval);
  }, [fetchLiveRollout]);

  const isRolledBack = rolloutData.isAborted || rolloutData.phase === 'Degraded';

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <RotateCcw size={24} color="var(--status-blue)" />
            Progressive Rollout Engine
          </h1>
          <p className="page-subtitle">
            Live controller status queried directly from the Argo Rollouts Custom Resource (namespace: cloud05).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <DataSourceBadge source="LIVE" label="LIVE ARGO ROLLOUT CRD" />
          {lastUpdated && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Last poll: {lastUpdated}
            </span>
          )}
          <button
            onClick={fetchLiveRollout}
            disabled={isRefreshing}
            className="btn btn-secondary"
            style={{ fontSize: '12px' }}
          >
            <RefreshCw size={13} className={isRefreshing ? 'spin-anim' : ''} />
            <span>Poll Rollout</span>
          </button>
        </div>
      </div>

      {/* Main Rollout Status & Pipeline Component */}
      <div style={{ marginBottom: '24px' }}>
        <RolloutStatus rolloutData={rolloutData} />
      </div>

      {/* Canary Traffic Distribution Visualization */}
      <div style={{ marginBottom: '24px' }}>
        <CanaryProgress
          stablePercent={rolloutData.traffic?.stablePercent ?? 100}
          canaryPercent={rolloutData.traffic?.canaryPercent ?? 0}
          stableVersion={rolloutData.stableVersion || 'v2.0.0'}
          canaryVersion={rolloutData.targetVersion || 'v3.0.0'}
          isAborted={isRolledBack}
          statusLabel={isRolledBack ? 'Rolled Back to Stable (100%)' : 'Canary Active'}
        />
      </div>

      {/* Deep-Dive Live AnalysisRun Inspection Card */}
      <div className="card">
        <div className="card-title">
          <span>Observed AnalysisRun Telemetry Gate Diagnostics</span>
          <DataSourceBadge source="LIVE" label="ANALYSISRUN CRD" size="small" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginTop: '16px' }}>
          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--status-blue)', marginBottom: '6px' }}>
              Target Custom Resource
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, fontFamily: 'var(--font-mono)' }}>
              rollouts.argoproj.io/{rolloutData.rolloutName}
            </p>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Namespace: {rolloutData.namespace} • Phase: <strong>{rolloutData.phase}</strong>
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--status-yellow)', marginBottom: '6px' }}>
              AnalysisRuns Executed
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Total AnalysisRuns evaluated: <strong>{rolloutData.analysisRunsCount}</strong>
            </p>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Latest Outcome: <span className={`badge ${rolloutData.latestAnalysisPhase === 'Failed' ? 'badge-red' : 'badge-green'}`} style={{ fontSize: '10px' }}>{rolloutData.latestAnalysisPhase}</span>
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: isRolledBack ? 'var(--status-red)' : 'var(--status-green)', marginBottom: '6px' }}>
              Rollback Reconciliation
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {isRolledBack ? 'Step-based threshold check triggered abort. Traffic drained from candidate.' : 'No active rollback required.'}
            </p>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              State: <strong>{rolloutData.rollbackResult}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
