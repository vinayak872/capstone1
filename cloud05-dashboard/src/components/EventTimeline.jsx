import React from 'react';
import { CheckCircle, AlertTriangle, RotateCcw, GitCommit, Layers } from 'lucide-react';

const EVENTS = [
  {
    id: 1,
    time: '06:15:22 UTC',
    title: 'Prometheus Analysis Failed on Canary',
    detail: 'Metric "error-rate" exceeded 5.0% threshold (measured 8.7%). Abort triggered.',
    type: 'error',
    icon: AlertTriangle
  },
  {
    id: 2,
    time: '06:15:28 UTC',
    title: 'Argo Rollouts Autonomous Rollback',
    detail: 'v3.0.0 traffic scaled to 0%. Reverted seamlessly to stable v2.0.0.',
    type: 'rollback',
    icon: RotateCcw
  },
  {
    id: 3,
    time: '06:10:00 UTC',
    title: 'Canary Step 2 (25%) Activated',
    detail: 'Traffic shifted to 25% canary v3.0.0; analysis duration started (45s).',
    type: 'progress',
    icon: Layers
  },
  {
    id: 4,
    time: '06:08:15 UTC',
    title: 'GitOps Manifest Commit Synced',
    detail: 'Argo CD synced release commit f9d412c from cloud05-gitops repository.',
    type: 'synced',
    icon: GitCommit
  }
];

export default function EventTimeline() {
  return (
    <div className="card">
      <div className="card-title">
        <span>Recent Cluster & Release Events</span>
        <span className="prototype-badge">Event Log</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '14px' }}>
        {EVENTS.map((event) => {
          const Icon = event.icon;
          let iconColor = 'var(--status-blue)';
          if (event.type === 'error' || event.type === 'rollback') iconColor = 'var(--status-red)';
          if (event.type === 'progress') iconColor = 'var(--status-yellow)';

          return (
            <div key={event.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={14} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {event.title}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {event.time}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                  {event.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
