import React from 'react';
import DataSourceBadge from './DataSourceBadge';

export default function StatusCard({
  title,
  value,
  status = 'healthy',
  subtitle,
  icon: Icon,
  badgeText,
  isLive = false,
  dataSource = null
}) {
  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'synced':
      case 'connected':
      case 'live':
      case 'passed':
        return 'var(--status-green)';
      case 'warning':
      case 'degraded':
      case 'in-progress':
        return 'var(--status-yellow)';
      case 'error':
      case 'offline':
      case 'failed':
      case 'rolled back':
        return 'var(--status-red)';
      default:
        return 'var(--status-blue)';
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div className="card-title">
          <span>{title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {dataSource && (
              <DataSourceBadge source={dataSource} size="small" />
            )}
            {Icon && <Icon size={16} color="var(--text-muted)" />}
          </div>
        </div>
        <div style={{
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          marginTop: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {value}
        </div>
      </div>

      <div style={{
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px'
      }}>
        {subtitle && (
          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {subtitle}
          </span>
        )}
        {badgeText && (
          <span style={{
            color: getStatusColor(),
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}
