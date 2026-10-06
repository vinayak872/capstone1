import React from 'react';
import { ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import DataSourceBadge from './DataSourceBadge';

export default function CanaryProgress({
  stablePercent = 100,
  canaryPercent = 0,
  stableVersion = 'v2.0.0',
  canaryVersion = 'v3.0.0',
  isAborted = false,
  statusLabel = 'Traffic Reverted (0% Canary)'
}) {
  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Canary Traffic Distribution Model
            </h3>
            <DataSourceBadge source="PROTOTYPE" size="small" />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Dynamic traffic splitting mechanism for blast-radius containment
          </p>
        </div>

        {isAborted || canaryPercent === 0 ? (
          <span className="badge badge-green">
            <ShieldCheck size={13} />
            <span>{statusLabel}</span>
          </span>
        ) : (
          <span className="badge badge-yellow">
            <AlertTriangle size={13} />
            <span>Progressive Evaluation Active ({canaryPercent}% Canary)</span>
          </span>
        )}
      </div>

      {/* Traffic Distribution Visual Bar */}
      <div style={{
        height: '28px',
        width: '100%',
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        border: '1px solid var(--border-subtle)',
        marginBottom: '16px'
      }}>
        <div
          style={{
            width: `${stablePercent}%`,
            backgroundColor: '#10b981',
            transition: 'width 0.4s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            color: '#064e3b',
            fontFamily: 'var(--font-mono)'
          }}
          title={`Stable ${stablePercent}%`}
        >
          {stablePercent > 15 ? `${stablePercent}% Stable (${stableVersion})` : `${stablePercent}%`}
        </div>

        {canaryPercent > 0 && (
          <div
            style={{
              width: `${canaryPercent}%`,
              backgroundColor: isAborted ? '#ef4444' : '#f59e0b',
              transition: 'width 0.4s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
              color: isAborted ? '#7f1d1d' : '#78350f',
              fontFamily: 'var(--font-mono)'
            }}
            title={`Canary ${canaryPercent}%`}
          >
            {canaryPercent > 15 ? `${canaryPercent}% Canary` : `${canaryPercent}%`}
          </div>
        )}
      </div>

      {/* Detail breakdown cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Stable Target</span>
            <span style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--status-green)',
              fontFamily: 'var(--font-mono)'
            }}>
              {stablePercent}%
            </span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
            {stableVersion} (Active Release)
          </div>
        </div>

        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: canaryPercent > 0 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(148, 163, 184, 0.06)',
          border: canaryPercent > 0 ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Canary Target</span>
            <span style={{
              fontSize: '14px',
              fontWeight: 700,
              color: canaryPercent > 0 ? 'var(--status-yellow)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)'
            }}>
              {canaryPercent}%
            </span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: canaryPercent > 0 ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '4px' }}>
            {canaryVersion || 'None'} {canaryPercent === 0 ? '(0% - Quarantined / Drained)' : '(Active Evaluation)'}
          </div>
        </div>
      </div>
    </div>
  );
}
