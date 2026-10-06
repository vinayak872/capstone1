import React, { useState } from 'react';
import { GitBranch, RefreshCw, CheckCircle, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import DataSourceBadge from './DataSourceBadge';

export default function GitOpsStatus({ gitOpsData }) {
  const [showDriftDemo, setShowDriftDemo] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);

  const activeScenario = showDriftDemo ? gitOpsData.driftScenarios[1] : gitOpsData.driftScenarios[0];

  const handleSimulateSelfHeal = () => {
    setIsReconciling(true);
    setTimeout(() => {
      setIsReconciling(false);
      setShowDriftDemo(false);
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* GitOps Sync Status Overview Card */}
      <div className="card">
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitBranch size={16} color="var(--status-blue)" />
            <span>Declarative GitOps State Management</span>
          </div>
          <DataSourceBadge source="PROTOTYPE" label="PROTOTYPE GITOPS STATE" />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginTop: '12px'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Repository</span>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {gitOpsData.repository}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Branch: {gitOpsData.branch}</span>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Declared Git Revision</span>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {gitOpsData.revision}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sync Interval: {gitOpsData.reconciliationInterval}</span>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Synchronization State</span>
            <div style={{ marginTop: '4px' }}>
              {isReconciling ? (
                <span className="badge badge-yellow">
                  <RefreshCw size={12} className="spin-anim" /> RECONCILING...
                </span>
              ) : activeScenario.driftDetected ? (
                <span className="badge badge-red">
                  <AlertTriangle size={12} /> DRIFT DETECTED
                </span>
              ) : (
                <span className="badge badge-green">
                  <CheckCircle size={12} /> SYNCED
                </span>
              )}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Self-Healing Mode</span>
            <div style={{ marginTop: '4px' }}>
              <span className="badge badge-blue">
                <ShieldCheck size={12} /> AUTO-HEAL CONFIGURED
              </span>
            </div>
          </div>
        </div>

        {/* Viva Interactive Controller */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            <strong>GitOps Drift Demonstration (PROTOTYPE):</strong> Toggle simulated manual drift (`kubectl scale replicas=1`) to demonstrate Argo CD declarative self-healing:
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowDriftDemo(!showDriftDemo)}
              className="btn btn-secondary"
              style={{ fontSize: '12px' }}
            >
              {showDriftDemo ? 'Reset to Synced' : 'Simulate Config Drift'}
            </button>

            {showDriftDemo && !isReconciling && (
              <button
                onClick={handleSimulateSelfHeal}
                className="btn btn-primary"
                style={{ fontSize: '12px' }}
              >
                Trigger Argo CD Sync
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Comparison: Git Desired State VS Kubernetes Observed State */}
      <div className="card">
        <div className="card-title">
          <span>Git Desired State (Source of Truth) vs. Kubernetes Live Observed State</span>
          <DataSourceBadge source="PROTOTYPE" size="small" />
        </div>

        <div className="table-container" style={{ marginTop: '12px' }}>
          <table className="devops-table">
            <thead>
              <tr>
                <th>Attribute</th>
                <th>Git Desired State (Manifest)</th>
                <th>Kubernetes Live State (Cluster)</th>
                <th>Comparison Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Replicas Count</strong></td>
                <td><span className="font-mono">{activeScenario.desiredReplicas} Pods</span></td>
                <td>
                  <span className="font-mono" style={{ color: activeScenario.driftDetected ? 'var(--status-red)' : 'var(--text-primary)' }}>
                    {isReconciling ? 'Syncing...' : `${activeScenario.observedReplicas} Pods`}
                  </span>
                </td>
                <td>
                  {activeScenario.driftDetected && !isReconciling ? (
                    <span className="badge badge-red"><AlertTriangle size={12} /> DRIFT DETECTED</span>
                  ) : (
                    <span className="badge badge-green"><CheckCircle size={12} /> MATCH</span>
                  )}
                </td>
              </tr>
              <tr>
                <td><strong>Release Version</strong></td>
                <td><span className="font-mono">v2.0.0</span></td>
                <td><span className="font-mono">v2.0.0</span></td>
                <td><span className="badge badge-green"><CheckCircle size={12} /> MATCH</span></td>
              </tr>
              <tr>
                <td><strong>Deployment Strategy</strong></td>
                <td><span className="font-mono">Argo Rollout (Canary)</span></td>
                <td><span className="font-mono">Argo Rollout (Canary)</span></td>
                <td><span className="badge badge-green"><CheckCircle size={12} /> MATCH</span></td>
              </tr>
              <tr>
                <td><strong>Health Status</strong></td>
                <td><span className="font-mono">Healthy</span></td>
                <td><span className="font-mono">Healthy</span></td>
                <td><span className="badge badge-green"><CheckCircle size={12} /> MATCH</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
