import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  Rocket,
  RotateCcw,
  Gauge,
  GitBranch,
  Database,
  ShieldCheck,
  Server,
  Layers,
  FileCheck
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: Activity },
  { name: 'Releases', path: '/releases', icon: Layers },
  { name: 'Rollout', path: '/rollout', icon: RotateCcw },
  { name: 'Metrics', path: '/metrics', icon: Gauge },
  { name: 'GitOps', path: '/gitops', icon: GitBranch },
  { name: 'Experiments', path: '/experiments', icon: Database },
  { name: 'Evidence', path: '/evidence', icon: FileCheck },
];

export default function Sidebar() {
  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      minHeight: '100vh',
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          backgroundColor: '#1d4ed8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 0 12px rgba(37, 99, 235, 0.4)'
        }}>
          <ShieldCheck size={20} />
        </div>
        <div>
          <h1 style={{
            fontSize: '16px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)'
          }}>
            CLOUD-05
          </h1>
          <p style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontWeight: 500,
            letterSpacing: '-0.01em'
          }}>
            GitOps Progressive Delivery
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '20px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          padding: '6px 12px 10px'
        }}>
          Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--status-blue)' : '3px solid transparent',
                transition: 'all 0.15s ease',
              })}
            >
              <Icon size={17} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Cluster Environment Footer */}
      <div style={{
        padding: '18px 20px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'rgba(10, 13, 20, 0.6)',
        fontSize: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Server size={14} color="var(--status-blue)" />
          <span style={{ color: 'var(--text-muted)' }}>Cluster:</span>
          <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            cloud05
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--status-green)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Environment:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
            Demo
          </span>
        </div>
      </div>
    </aside>
  );
}
