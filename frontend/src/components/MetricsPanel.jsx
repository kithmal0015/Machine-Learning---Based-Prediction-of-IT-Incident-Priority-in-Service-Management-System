import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts';

const MODEL_COLORS = {
  'Logistic Regression': '#4f8fff',
  'Random Forest':       '#7c3aed',
  'XGBoost':             '#34d399',
};

const METRICS_LIST = [
  { key: 'accuracy',  label: 'Accuracy',  color: '#4f8fff' },
  { key: 'precision', label: 'Precision', color: '#7c3aed' },
  { key: 'recall',    label: 'Recall',    color: '#34d399' },
  { key: 'f1',        label: 'F1 Score',  color: '#fbbf24' },
];

/* ── Confusion Matrix ────────────────────────────────────── */
function ConfusionMatrix({ matrix, classes }) {
  if (!matrix || !classes) return null;
  return (
    <table className="cm-table">
      <thead>
        <tr>
          <th style={{ background: 'transparent', border: 'none' }} />
          {classes.map(c => <th key={c}>Pred: {c}</th>)}
        </tr>
      </thead>
      <tbody>
        {matrix.map((row, ri) => (
          <tr key={ri}>
            <th style={{ textAlign: 'left' }}>Act: {classes[ri]}</th>
            {row.map((val, ci) => (
              <td key={ci}
                  className={ri === ci ? 'cm-cell-diag' : 'cm-cell-offdiag'}>
                {val.toLocaleString()}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Bar chart data ─────────────────────────────────────── */
function buildChartData(metrics) {
  return METRICS_LIST.map(({ key, label, color }) => {
    const entry = { metric: label, color };
    Object.keys(metrics).forEach(model => {
      entry[model] = +(metrics[model][key] * 100).toFixed(1);
    });
    return entry;
  });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card2)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-sm)', padding: '10px 14px', fontSize: '0.82rem',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.fill, marginBottom: 2 }}>
          {p.dataKey}: <strong>{p.value}%</strong>
        </div>
      ))}
    </div>
  );
};

/* ── Main component ──────────────────────────────────────── */
export default function MetricsPanel({ metrics }) {
  const [activeModel, setActiveModel] = React.useState(null);

  if (!metrics) {
    return (
      <div className="glass-card animate-fade-in" style={{ padding: 40, textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <div style={{ color: 'var(--text-secondary)' }}>Loading metrics…</div>
      </div>
    );
  }

  const models    = Object.keys(metrics);
  const chartData = buildChartData(metrics);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Bar Chart ── */}
      <div className="glass-card animate-fade-in" style={{ padding: 28 }}>
        <div className="form-section-title" style={{ marginBottom: 20 }}>
          Model Performance Comparison
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barGap={6} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,162,255,0.08)" />
            <XAxis dataKey="metric" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                   axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`}
                   tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                   axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 16, fontSize: '0.82rem' }}
              formatter={(v) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>}
            />
            {models.map(model => (
              <Bar key={model} dataKey={model} fill={MODEL_COLORS[model]}
                   radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Per-Model Cards ── */}
      <div className="metrics-grid">
        {models.map(model => {
          const m   = metrics[model];
          const col = MODEL_COLORS[model];
          return (
            <div key={model} className="glass-card animate-fade-in"
                 style={{ padding: 22, cursor: 'pointer' }}
                 onClick={() => setActiveModel(activeModel === model ? null : model)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: col }}>
                  {model}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: col }}>
                  {(m.accuracy * 100).toFixed(1)}%
                </div>
              </div>

              <div className="metric-stat-row">
                {METRICS_LIST.map(({ key, label, color }) => (
                  <div className="metric-stat-item" key={key}>
                    <span className="metric-stat-label">{label}</span>
                    <div className="metric-stat-bar-wrap">
                      <div className="metric-stat-bar"
                           style={{ width: `${(m[key] * 100).toFixed(1)}%`, background: color }} />
                    </div>
                    <span className="metric-stat-val">
                      {(m[key] * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>

              {activeModel === model && (
                <div style={{ marginTop: 18 }}>
                  <div className="divider" />
                  <div className="form-section-title" style={{ marginBottom: 10 }}>
                    Confusion Matrix
                  </div>
                  <ConfusionMatrix matrix={m.confusion_matrix} classes={m.classes} />
                </div>
              )}

              <div style={{ marginTop: 10, fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                {activeModel === model ? '▲ Hide matrix' : '▼ Show confusion matrix'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
