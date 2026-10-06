import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import { getIntegrationsHealth } from '../services/api';

export default function Topbar({ onRefresh }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [integrations, setIntegrations] = useState({
    backend: true,
    kubernetes: true,
    argocd: true,
    prometheus: true,
    rollouts: true,
  });
  const [isChecking, setIsChecking] = useState(false);

  // Poll clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll real integration statuses from /api/health/integrations
  const checkIntegrations = async () => {
    setIsChecking(true);
    try {
      const res = await getIntegrationsHealth();
      if (res.data) {
        setIntegrations({
          backend: Boolean(res.data.backend),
          kubernetes: Boolean(res.data.kubernetes),
          argocd: Boolean(res.data.argocd),
          prometheus: Boolean(res.data.prometheus),
          rollouts: Boolean(res.data.rollouts),
        });
      } else {
        setIntegrations(prev => ({ ...prev, backend: false }));
      }
    } catch (e) {
      setIntegrations({
        backend: false,
        kubernetes: false,
        argocd: false,
        prometheus: false,
        rollouts: false,
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkIntegrations();
    const interval = setInterval(checkIntegrations, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderBadge = (label, isConnected) => {
    const color = isConnected ? 'var(--status-green)' : 'var(--status-red)';
    const bg = isConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)';
    const border = isConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';
    const text = isConnected ? (label === 'Backend' ? 'LIVE' : 'CONNECTED') : 'OFFLINE';

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        padding: '3px 8px',
        borderRadius: '4px',
        backgroundColor: bg,
        border: `1px solid ${border}`,
        color: color
      }}>
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: isConnected ? `0 0 6px ${color}` : 'none'
        }} />
        <span>{label}: <strong>{text}</strong></span>
      </div>
    );
  };

  return (
    <header style={{
      height: '64px',
      backgroundColor: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 20
    }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{
          fontSize: '15px',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)'
        }}>
          CLOUD-05
        </span>
        <span style={{ color: 'var(--border-focus)', fontWeight: 300 }}>|</span>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Real-Time Observability
        </span>
      </div>

      {/* 5 Real Integration Status Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {renderBadge('Backend', integrations.backend)}
        {renderBadge('Kubernetes', integrations.kubernetes)}
        {renderBadge('Argo CD', integrations.argocd)}
        {renderBadge('Prometheus', integrations.prometheus)}
        {renderBadge('Rollouts', integrations.rollouts)}

        {/* Live Clock */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-muted)',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          paddingLeft: '6px',
          borderLeft: '1px solid var(--border-subtle)'
        }}>
          <Clock size={12} />
          <span>{time}</span>
        </div>

        {/* Manual Refresh Button */}
        <button
          onClick={() => {
            checkIntegrations();
            if (onRefresh) onRefresh();
          }}
          title="Refresh All Telemetry"
          style={{
            padding: '6px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <RefreshCw size={13} className={isChecking ? 'spin-anim' : ''} />
        </button>
      </div>
    </header>
  );
}
