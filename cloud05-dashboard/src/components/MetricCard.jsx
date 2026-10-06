import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

export default function MetricCard({
  title,
  value,
  unit = '',
  change,
  isPositive = true,
  isWarning = false,
  warningThreshold,
  icon: Icon
}) {
  return (
    <div className="card" style={{
      borderColor: isWarning ? 'var(--status-red-border)' : 'var(--border-subtle)',
      background: isWarning ? 'rgba(239, 68, 68, 0.04)' : 'var(--bg-surface)'
    }}>
      <div className="card-title">
        <span>{title}</span>
        {Icon && <Icon size={16} color={isWarning ? 'var(--status-red)' : 'var(--text-muted)'} />}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
        <span style={{
          fontSize: '28px',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color: isWarning ? 'var(--status-red)' : 'var(--text-primary)'
        }}>
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
            {unit}
          </span>
        )}
      </div>

      <div style={{
        marginTop: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px'
      }}>
        {change && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: isPositive ? 'var(--status-green)' : 'var(--status-red)',
            fontWeight: 600
          }}>
            {isPositive ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
            <span>{change}</span>
          </div>
        )}

        {isWarning ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--status-red)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 600
          }}>
            <AlertTriangle size={13} />
            <span>&gt; {warningThreshold} (BREACH)</span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
            Normal operating threshold
          </span>
        )}
      </div>
    </div>
  );
}
