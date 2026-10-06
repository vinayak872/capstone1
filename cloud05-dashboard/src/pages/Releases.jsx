import React, { useState, useEffect } from 'react';
import { Layers, RotateCcw, X, GitCommit, AlertTriangle, CheckCircle, RefreshCw, Server } from 'lucide-react';
import VersionBadge from '../components/VersionBadge';
import DataSourceBadge from '../components/DataSourceBadge';
import { getCurrentRelease, getReleaseHistory } from '../services/api';

export default function Releases() {
  const [releases, setReleases] = useState([]);
  const [currentRelease, setCurrentRelease] = useState(null);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [histRes, currRes] = await Promise.all([
        getReleaseHistory(),
        getCurrentRelease(),
      ]);

      if (histRes.data?.items?.length) {
        setReleases(histRes.data.items);
        if (!selectedRelease) {
          // Select v3.0.0 or first item for review inspection
          const v3 = histRes.data.items.find(r => r.version === 'v3.0.0') || histRes.data.items[0];
          setSelectedRelease(v3);
        }
      }

      if (currRes.data) {
        setCurrentRelease(currRes.data);
      }
    } catch (err) {
      console.error('Failed to load real release data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Layers size={24} color="var(--status-blue)" />
            Release History &amp; Deployment Log
          </h1>
          <p className="page-subtitle">
            Observed release revisions and active ReplicaSet lifecycle queried directly from Kubernetes and Argo Rollouts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={fetchData}
            className="secondary-button"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}
          >
            <RefreshCw size={13} /> Refresh Revisions
          </button>
          <DataSourceBadge source="KUBERNETES" label="K8S REPLICASETS & ROLLOUTS" />
        </div>
      </div>

      {/* Active Release Overview Banner */}
      {currentRelease && (
        <div className="card" style={{ marginBottom: '20px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Server size={22} color="var(--status-green)" />
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Production Workload
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{currentRelease.backendDirect?.application || 'cloud05-demo-service'}</span>
                <VersionBadge version={currentRelease.currentVersion} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Ready Pods: </span>
              <span style={{ color: 'var(--status-green)', fontWeight: 700 }}>
                {currentRelease.readyReplicas} / {currentRelease.totalReplicas}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Rollout Multi-Version: </span>
              <span style={{ color: currentRelease.multipleVersionsDetected ? 'var(--status-yellow)' : 'var(--text-secondary)' }}>
                {currentRelease.multipleVersionsDetected ? `Canary Active (${currentRelease.canary})` : 'Single Stable Active'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Direct Health: </span>
              <span style={{ color: 'var(--status-green)', fontWeight: 600 }}>
                {currentRelease.backendDirect?.status || 'healthy'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selectedRelease ? '2fr 1fr' : '1fr', gap: '24px' }}>
        {/* Main Release Table */}
        <div className="card">
          <div className="card-title">
            <span>Observed Kubernetes Revisions</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {loading ? 'Querying API...' : `${releases.length} ReplicaSets detected in namespace cloud05`}
            </span>
          </div>

          <div className="table-container" style={{ marginTop: '12px' }}>
            <table className="devops-table">
              <thead>
                <tr>
                  <th>Revision / Version</th>
                  <th>Status</th>
                  <th>Strategy</th>
                  <th>Replicas</th>
                  <th>Image</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {releases.length === 0 && !loading && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No ReplicaSet revisions retrieved from cluster.
                    </td>
                  </tr>
                )}
                {releases.map((release) => {
                  const isSelected = selectedRelease?.revision === release.revision;
                  const isRollback = release.status === 'ROLLED BACK';

                  return (
                    <tr
                      key={release.revision || release.name}
                      onClick={() => setSelectedRelease(release)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        borderLeft: isSelected ? '3px solid var(--status-blue)' : '3px solid transparent'
                      }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            Rev {release.revision}
                          </span>
                          <VersionBadge version={release.version} isRollback={isRollback} />
                        </div>
                      </td>
                      <td>
                        {release.status === 'STABLE' && (
                          <span className="badge badge-green">STABLE</span>
                        )}
                        {release.status === 'ROLLED BACK' && (
                          <span className="badge badge-red">
                            <RotateCcw size={11} /> ROLLED BACK
                          </span>
                        )}
                        {release.status === 'SCALED_DOWN' && (
                          <span className="badge" style={{ backgroundColor: 'rgba(148, 163, 184, 0.1)', color: 'var(--text-muted)' }}>
                            SCALED DOWN (0)
                          </span>
                        )}
                        {release.status === 'FAILED' && (
                          <span className="badge badge-red">FAILED</span>
                        )}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{release.strategy}</td>
                      <td style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {release.readyReplicas} / {release.replicas}
                      </td>
                      <td>
                        <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {release.image}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 600,
                          fontSize: '11px',
                          color: isRollback ? 'var(--status-red)' : (release.status === 'STABLE' ? 'var(--status-green)' : 'var(--text-muted)')
                        }}>
                          {release.result}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Release Detail Panel */}
        {selectedRelease && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <VersionBadge version={selectedRelease.version} isRollback={selectedRelease.status === 'ROLLED BACK'} />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Revision {selectedRelease.revision} Audit
                  </span>
                </div>
                <button
                  onClick={() => setSelectedRelease(null)}
                  style={{ color: 'var(--text-muted)', padding: '4px' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.5 }}>
                Kubernetes ReplicaSet resource: <code style={{ color: 'var(--status-blue)' }}>{selectedRelease.name}</code>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Image Reference:</span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)', fontSize: '11px' }}>{selectedRelease.image}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Target Strategy:</span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{selectedRelease.strategy}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Replica State:</span>
                  <span className="font-mono" style={{ color: selectedRelease.replicas > 0 ? 'var(--status-green)' : 'var(--text-muted)' }}>
                    {selectedRelease.readyReplicas} ready / {selectedRelease.replicas} desired
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Data Source:</span>
                  <span className="font-mono" style={{ color: '#60a5fa' }}>{selectedRelease.dataSource}</span>
                </div>
              </div>

              {selectedRelease.rollbackReason && (
                <div style={{
                  marginTop: '20px',
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-red)', fontWeight: 600, fontSize: '12px' }}>
                    <AlertTriangle size={14} />
                    <span>Rollback Trigger Diagnostics</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#fca5a5', marginTop: '6px', lineHeight: 1.5 }}>
                    {selectedRelease.rollbackReason}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Stable ReplicaSet was preserved and returned to 100% traffic weight without manual human intervention.
                  </p>
                </div>
              )}
            </div>

            <div style={{
              marginTop: '20px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)'
            }}>
              Creation Timestamp: {selectedRelease.createdAt || 'N/A'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
