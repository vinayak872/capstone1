import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

const CustomTooltip = ({ active, payload, label, unit = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontFamily: 'var(--font-mono)'
      }}>
        <p style={{ color: '#94a3b8', marginBottom: '4px' }}>Time: {label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, fontWeight: 600 }}>
            {entry.name}: {entry.value} {unit}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function MetricsChart({
  title,
  data,
  dataKey,
  chartType = 'area',
  color = '#3b82f6',
  unit = '',
  threshold,
  thresholdLabel = 'Threshold',
  height = 240
}) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-title">
        <span>{title}</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {unit ? `Unit: ${unit}` : ''}
        </span>
      </div>

      <div style={{ width: '100%', height: `${height}px`, marginTop: '12px' }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontFamily="var(--font-mono)" />
              <YAxis stroke="#64748b" fontSize={11} fontFamily="var(--font-mono)" />
              <Tooltip content={<CustomTooltip unit={unit} />} />
              {threshold && (
                <ReferenceLine
                  y={threshold}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: `${thresholdLabel} (${threshold}${unit})`, fill: '#ef4444', fontSize: 10 }}
                />
              )}
              <Area
                type="monotone"
                dataKey={dataKey}
                name={title}
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#grad-${dataKey})`}
              />
            </AreaChart>
          ) : (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontFamily="var(--font-mono)" />
              <YAxis stroke="#64748b" fontSize={11} fontFamily="var(--font-mono)" />
              <Tooltip content={<CustomTooltip unit={unit} />} />
              {threshold && (
                <ReferenceLine
                  y={threshold}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: `${thresholdLabel} (${threshold}${unit})`, fill: '#ef4444', fontSize: 10 }}
                />
              )}
              <Line
                type="monotone"
                dataKey={dataKey}
                name={title}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 2, fill: color }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
