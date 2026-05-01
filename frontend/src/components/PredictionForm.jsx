import React, { useState } from 'react';

const MODELS = [
  { id: 'Logistic Regression', desc: 'Baseline model' },
  { id: 'Random Forest',       desc: 'Ensemble trees' },
  { id: 'XGBoost',             desc: 'Gradient boosting' },
];

const URGENCY_OPTS  = [
  { value: '1 - High', label: 'Completely Blocked' },
  { value: '2 - Medium', label: 'Partially Blocked' },
  { value: '3 - Low', label: 'Not Blocked' }
];
const IMPACT_OPTS   = [
  { value: '1 - High', label: 'Entire Business' },
  { value: '2 - Medium', label: 'Department or Group' },
  { value: '3 - Low', label: 'Single User or Device' }
];
const STATE_OPTS    = ['New', 'Active', 'Awaiting User Info', 'Awaiting Problem',
                       'Awaiting Vendor', 'Resolved', 'Closed'];
const CONTACT_OPTS  = ['Phone', 'Email', 'Self service', 'IVR', 'Walk In'];

export default function PredictionForm({ onResult, uniqueValues, loading }) {
  const [form, setForm] = useState({
    impact: '2 - Medium',
    urgency: '2 - Medium',
    category: '',
    subcategory: '',
    contact_type: 'Phone',
    incident_state: 'New',
    assignment_group: '',
    reassignment_count: 0,
    reopen_count: 0,
    sys_mod_count: 0,
    selected_model: 'Random Forest',
  });

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = e => {
    e.preventDefault();
    onResult(form);
  };

  const categories   = uniqueValues?.category        || [];
  const subcategories = uniqueValues?.subcategory     || [];
  const groups        = uniqueValues?.assignment_group || [];

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      {/* ── Model Selector ── */}
      <div style={{ marginBottom: 28 }}>
        <div className="form-section-title">Select Model</div>
        <div className="model-selector-row">
          {MODELS.map(m => (
            <button
              key={m.id}
              type="button"
              className={`model-chip ${form.selected_model === m.id ? 'selected' : ''}`}
              onClick={() => set('selected_model', m.id)}
            >
              {m.id}
            </button>
          ))}
        </div>
      </div>

      {/* ── Primary Fields ── */}
      <div className="form-section-title">Incident Details</div>
      <div className="form-grid" style={{ marginBottom: 18 }}>
        <div className="form-group">
          <label className="form-label">Impact *</label>
          <select className="form-control" value={form.impact}
            onChange={e => set('impact', e.target.value)} required>
            {IMPACT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Work Status *</label>
          <select className="form-control" value={form.urgency}
            onChange={e => set('urgency', e.target.value)} required>
            {URGENCY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-control" value={form.category}
            onChange={e => set('category', e.target.value)}>
            <option value="">— Any —</option>
            {categories.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Incident State</label>
          <select className="form-control" value={form.incident_state}
            onChange={e => set('incident_state', e.target.value)}>
            {STATE_OPTS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* ── Advanced Toggle ── */}
      <button 
        type="button" 
        className="advanced-toggle"
        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
      >
        {isAdvancedOpen ? '▼ Hide Advanced Options' : '▶ Show Advanced Options'}
      </button>

      {/* ── Advanced Fields ── */}
      {isAdvancedOpen && (
        <div className="animate-fade-in" style={{ marginTop: 16, marginBottom: 18 }}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Contact Type</label>
              <select className="form-control" value={form.contact_type}
                onChange={e => set('contact_type', e.target.value)}>
                {CONTACT_OPTS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Subcategory</label>
              <select className="form-control" value={form.subcategory}
                onChange={e => set('subcategory', e.target.value)}>
                <option value="">— Any —</option>
                {subcategories.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assignment Group</label>
              <select className="form-control" value={form.assignment_group}
                onChange={e => set('assignment_group', e.target.value)}>
                <option value="">— Any —</option>
                {groups.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Reassignment Count</label>
              <input type="number" className="form-control" min={0} value={form.reassignment_count}
                onChange={e => set('reassignment_count', parseInt(e.target.value, 10) || 0)} />
            </div>

            <div className="form-group">
              <label className="form-label">Reopen Count</label>
              <input type="number" className="form-control" min={0} value={form.reopen_count}
                onChange={e => set('reopen_count', parseInt(e.target.value, 10) || 0)} />
            </div>

            <div className="form-group">
              <label className="form-label">Modification Count</label>
              <input type="number" className="form-control" min={0} value={form.sys_mod_count}
                onChange={e => set('sys_mod_count', parseInt(e.target.value, 10) || 0)} />
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : null}
          {loading ? 'Predicting…' : 'Predict Priority'}
        </button>
      </div>
    </form>
  );
}
