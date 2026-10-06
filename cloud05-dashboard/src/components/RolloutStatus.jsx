import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, RotateCcw, ArrowRight, ShieldCheck } from 'lucide-react';
import DataSourceBadge from './DataSourceBadge';

export default function RolloutStatus({ rolloutData }) {
  const {
    currentRelease,
    stableVersion,
    rolloutState,
    statusMessage,
    stages,
    rollbackResult,
  } = rolloutData;

  const isRolledBack = rolloutState === 'ROLLED_BACK' || rolloutState === 'ROLLED BACK';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Automatic Rollback Alert Banner */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid var(--status-red-border)',
        borderRadius: '10px',
        padding: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '18px'
      }}>
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          color: 'var(--status-red)',
          flexShrink: 0
        }}>
          <RotateCcw size={28} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
              AUTOMATIC ROLLBACK TRIGGERED
            </h2>
            <span className="badge badge-red">
              STATUS: {isRolledBack ? 'ROLLED BACK' : rolloutState}
            </span>
            <DataSourceBadge source="PROTOTYPE" label="PROTOTYPE ROLLOUT STATE" />
          </div>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '13px',
            marginTop: '8px',
            lineHeight: 1.6
          }}>
            <strong style={{ color: '#ffffff' }}>Trigger Diagnostic:</strong> {statusMessage}
          </p>

          <div style={{
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(239, 68, 68, 0.2)',
            fontSize: '13px',
            flexWrap: 'wrap'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Faulty Target: </span>
              <span style={{ color: 'var(--status-red)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {currentRelease || 'v3.0.0'}
              </span>
            </div>

            <ArrowRight size={14} color="var(--text-muted)" />

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Preserved Stable Version: </span>
              <span style={{ color: 'var(--status-green)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {stableVersion || 'v2.0.0'}
              </span>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="var(--status-green)" />
              <span style={{ color: 'var(--status-green)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                Recovery Mechanism: {rollbackResult || 'SUCCESS'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progressive Step Stages Visual Flow */}
      <div className="card">
        <div className="card-title">
          <span>Argo Rollouts Step Pipeline Evaluation Model</span>
          <DataSourceBadge source="PROTOTYPE" label="PROTOTYPE ROLLOUT STATE" />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '14px',
          marginTop: '16px'
        }}>
          {stages.map((stage) => {
            const isPassed = stage.analysisStatus === 'PASSED';
            const isFailed = stage.analysisStatus === 'FAILED';
            const isBypassed = stage.analysisStatus === 'SKIPPED' || stage.status === 'bypassed';

            let borderCol = 'var(--border-subtle)';
            let bgCol = 'rgba(255, 255, 255, 0.02)';
            if (isPassed) {
              borderCol = 'var(--status-green-border)';
              bgCol = 'rgba(16, 185, 129, 0.05)';
            } else if (isFailed) {
              borderCol = 'var(--status-red-border)';
              bgCol = 'rgba(239, 68, 68, 0.08)';
            }

            return (
              <div
                key={stage.step}
                style={{
                  border: `1px solid ${borderCol}`,
                  borderRadius: '8px',
                  backgroundColor: bgCol,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600
                    }}>
                      STAGE {stage.step}
                    </span>

                    {isPassed && <span className="badge badge-green"><CheckCircle size={12} /> PASSED</span>}
                    {isFailed && <span className="badge badge-red"><XCircle size={12} /> FAILED</span>}
                    {isBypassed && <span className="badge badge-yellow">BYPASSED</span>}
                  </div>

                  <div style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: isFailed ? 'var(--status-red)' : 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    margin: '4px 0'
                  }}>
                    {stage.label}
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                    {stage.detail}
                  </p>
                </div>

                <div style={{
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)'
                }}>
                  <span>Error Rate: <strong style={{ color: isFailed ? 'var(--status-red)' : 'var(--text-primary)' }}>{stage.errorRate}</strong></span>
                  <span>Duration: {stage.duration}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
