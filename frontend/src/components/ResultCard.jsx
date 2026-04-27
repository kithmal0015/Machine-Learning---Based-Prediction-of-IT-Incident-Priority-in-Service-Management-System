import React from 'react';

const PRIORITY_META = {
  High:   { icon: '🔴', cls: 'high',   color: 'var(--priority-high)',   label: 'High Priority' },
  Medium: { icon: '🟡', cls: 'medium', color: 'var(--priority-medium)', label: 'Medium Priority' },
  Low:    { icon: '🟢', cls: 'low',    color: 'var(--priority-low)',     label: 'Low Priority' },
};

const SHORT_MODEL = {
  'Logistic Regression': 'Log. Reg.',
  'Random Forest':       'Rnd Forest',
  'XGBoost':             'XGBoost',
};

export default function ResultCard({ result }) {
  if (!result) return null;

  const { priority, confidence, model_used, all_predictions } = result;
  const meta = PRIORITY_META[priority] || PRIORITY_META['Medium'];
  const pct  = Math.round(confidence * 100);

  return (
    <div className={`glass-card result-card priority-${meta.cls} animate-fade-in-up`}
         style={{ padding: 28 }}>

      {/* Priority display */}
      <div className="priority-display">
        <div className="priority-icon">{meta.icon}</div>
        <div>
          <div className="form-section-title" style={{ textAlign: 'center', marginBottom: 6 }}>
            Predicted Priority
          </div>
          <div className={`priority-label ${meta.cls}`}>{priority}</div>
        </div>

        {/* Confidence bar */}
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Confidence
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: meta.color }}>
              {pct}%
            </span>
          </div>
          <div className="confidence-bar-wrap">
            <div className="confidence-bar"
                 style={{ width: `${pct}%`, background: meta.color }} />
          </div>
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          via <strong style={{ color: 'var(--text-secondary)' }}>{model_used}</strong>
        </div>
      </div>

      <div className="divider" />

      {/* All model predictions */}
      <div className="form-section-title" style={{ marginBottom: 12 }}>
        All Model Predictions
      </div>
      <div className="all-predictions-grid">
        {Object.entries(all_predictions).map(([model, pred]) => {
          const m2 = PRIORITY_META[pred.priority] || PRIORITY_META['Medium'];
          return (
            <div key={model}
                 className={`pred-mini-card ${model === model_used ? 'active-model' : ''}`}>
              <div className="pred-mini-model">{SHORT_MODEL[model] || model}</div>
              <div style={{ fontSize: '22px' }}>{m2.icon}</div>
              <div className="pred-mini-priority" style={{ color: m2.color }}>
                {pred.priority}
              </div>
              <div className="pred-mini-confidence">
                {Math.round(pred.confidence * 100)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
