import React from 'react';
import { Database, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export default function DataSourceBadge({
  source = 'PROTOTYPE',
  label,
  size = 'normal'
}) {
  const norm = (source || 'PROTOTYPE').toUpperCase();

  let text = label;
  let bg = 'rgba(245, 158, 11, 0.1)';
  let border = 'rgba(245, 158, 11, 0.3)';
  let color = '#fbbf24';
  let Icon = AlertTriangle;

  if (norm === 'REAL' || norm === 'LIVE' || norm === 'LIVE BACKEND') {
    text = text || 'LIVE BACKEND DATA';
    bg = 'rgba(16, 185, 129, 0.12)';
    border = 'rgba(16, 185, 129, 0.3)';
    color = '#34d399';
    Icon = CheckCircle;
  } else if (norm === 'PENDING' || norm === 'PENDING EXPERIMENT' || norm === 'PENDING INTEGRATION') {
    text = text || 'PENDING EXPERIMENT';
    bg = 'rgba(148, 163, 184, 0.1)';
    border = 'rgba(148, 163, 184, 0.3)';
    color = '#94a3b8';
    Icon = Clock;
  } else if (norm === 'VERIFIED') {
    text = text || 'VERIFIED INFRASTRUCTURE';
    bg = 'rgba(59, 130, 246, 0.12)';
    border = 'rgba(59, 130, 246, 0.3)';
    color = '#60a5fa';
    Icon = Database;
  } else {
    // PROTOTYPE / ILLUSTRATIVE
    text = text || 'PROTOTYPE DATA';
    bg = 'rgba(245, 158, 11, 0.1)';
    border = 'rgba(245, 158, 11, 0.3)';
    color = '#fbbf24';
    Icon = AlertTriangle;
  }

  const isSmall = size === 'small';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? '4px' : '6px',
        padding: isSmall ? '2px 6px' : '3px 8px',
        borderRadius: '4px',
        backgroundColor: bg,
        border: `1px solid ${border}`,
        color: color,
        fontSize: isSmall ? '10px' : '11px',
        fontWeight: 600,
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        lineHeight: 1.3
      }}
      title={`Data classification: ${norm}`}
    >
      <Icon size={isSmall ? 10 : 12} />
      <span>{text}</span>
    </span>
  );
}
