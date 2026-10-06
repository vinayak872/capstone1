import React from 'react';
import { Activity, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

export default function HealthIndicator({ status = 'CONNECTED', label, showIcon = true }) {
  const normStatus = (status || 'OFFLINE').toUpperCase();

  let color = 'var(--status-green)';
  let bg = 'var(--status-green-bg)';
  let border = 'var(--status-green-border)';
  let Icon = CheckCircle;
  let text = label || 'CONNECTED';

  if (normStatus === 'DEGRADED' || normStatus === 'WARNING') {
    color = 'var(--status-yellow)';
    bg = 'var(--status-yellow-bg)';
    border = 'var(--status-yellow-border)';
    Icon = AlertTriangle;
    text = label || 'DEGRADED';
  } else if (normStatus === 'OFFLINE' || normStatus === 'ERROR' || normStatus === 'UNHEALTHY') {
    color = 'var(--status-red)';
    bg = 'var(--status-red-bg)';
    border = 'var(--status-red-border)';
    Icon = XCircle;
    text = label || 'OFFLINE';
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 10px',
      borderRadius: '6px',
      backgroundColor: bg,
      border: `1px solid ${border}`,
      color: color,
      fontSize: '12px',
      fontWeight: 600,
      fontFamily: 'var(--font-mono)'
    }}>
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: color,
        display: 'inline-block',
        boxShadow: `0 0 6px ${color}`
      }} />
      {showIcon && <Icon size={14} />}
      <span>{text}</span>
    </div>
  );
}
