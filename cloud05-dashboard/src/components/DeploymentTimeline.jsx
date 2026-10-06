import React from 'react';
import {
  GitCommit,
  GitBranch,
  Cloud,
  Server,
  Layers,
  Gauge,
  Activity,
  RotateCcw,
  ArrowRight,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import DataSourceBadge from './DataSourceBadge';

const PROGRESSIVE_STEPS = [
  { name: '1. Code', tool: 'Git commit', icon: GitCommit },
  { name: '2. GitOps', tool: 'Argo CD declarative', icon: GitBranch },
  { name: '3. Canary', tool: 'Argo Rollouts (10%-25%)', icon: Layers },
  { name: '4. Telemetry', tool: 'Prometheus scraping', icon: Gauge },
  { name: '5. Analysis', tool: 'PromQL threshold gate', icon: Activity },
  { name: '6. Promote / Rollback', tool: 'Autonomous recovery', icon: RotateCcw },
];

export default function DeploymentTimeline() {
  return (
    <div className="card">
      <div className="card-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="var(--status-blue)" />
          <span>Capstone Research Mechanism: Release Safety Comparison</span>
        </div>
        <DataSourceBadge source="ILLUSTRATIVE" label="RESEARCH MECHANISM" />
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
        The research compares conventional automated deployments with progressive delivery mechanisms for blast-radius containment and evidence-based automated rollback.
      </p>

      {/* Side-by-Side Architectural Flow */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '20px' }}>
        {/* Path A: Conventional Deployment */}
        <div style={{
          padding: '16px',
          borderRadius: '8px',
          backgroundColor: 'rgba(239, 68, 68, 0.04)',
          border: '1px solid rgba(239, 68, 68, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-red)', fontWeight: 700, fontSize: '13px', marginBottom: '10px' }}>
            <AlertTriangle size={15} />
            <span>Path A: Conventional Deployment (Kubernetes RollingUpdate)</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: '#fca5a5',
            flexWrap: 'wrap',
            lineHeight: 1.8
          }}>
            <span>Code</span>
            <ArrowRight size={11} />
            <span>Build</span>
            <ArrowRight size={11} />
            <span>Deploy</span>
            <ArrowRight size={11} />
            <span style={{ color: '#ef4444', fontWeight: 700 }}>100% Exposure</span>
            <ArrowRight size={11} />
            <span>Fault Detection</span>
            <ArrowRight size={11} />
            <span style={{ color: '#f87171' }}>Manual Recovery</span>
          </div>
        </div>

        {/* Path B: Progressive Delivery */}
        <div style={{
          padding: '16px',
          borderRadius: '8px',
          backgroundColor: 'rgba(16, 185, 129, 0.04)',
          border: '1px solid rgba(16, 185, 129, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-green)', fontWeight: 700, fontSize: '13px', marginBottom: '10px' }}>
            <ShieldCheck size={15} />
            <span>Path B: Progressive Delivery (GitOps + Argo Rollouts + Telemetry)</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: '#6ee7b7',
            flexWrap: 'wrap',
            lineHeight: 1.8
          }}>
            <span>Code</span>
            <ArrowRight size={11} />
            <span>GitOps</span>
            <ArrowRight size={11} />
            <span>Canary (25%)</span>
            <ArrowRight size={11} />
            <span>Telemetry</span>
            <ArrowRight size={11} />
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>Analysis Gate</span>
            <ArrowRight size={11} />
            <span style={{ color: '#10b981', fontWeight: 700 }}>Promote OR Rollback</span>
          </div>
        </div>
      </div>

      {/* Step Pipeline Connected Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '6px'
      }}>
        {PROGRESSIVE_STEPS.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <React.Fragment key={stage.name}>
              <div style={{
                flex: 1,
                minWidth: '130px',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '12px 10px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  color: 'var(--status-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px auto'
                }}>
                  <Icon size={16} />
                </div>

                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {stage.name}
                </div>

                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                  {stage.tool}
                </div>
              </div>

              {idx < PROGRESSIVE_STEPS.length - 1 && (
                <ArrowRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
