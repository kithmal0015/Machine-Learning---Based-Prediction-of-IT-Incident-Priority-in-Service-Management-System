import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';
import './components.css';
import kduLogo from './assets/kdu-logo.png';
import PredictionForm from './components/PredictionForm';
import ResultCard from './components/ResultCard';
import MetricsPanel from './components/MetricsPanel';

const API = 'http://localhost:8000';

export default function App() {
  const [tab, setTab] = useState('predict');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [uniqueValues, setUniqueValues] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');  // checking | ok | error

  /* ── Check API health ── */
  useEffect(() => {
    axios.get(`${API}/health`)
      .then(() => setApiStatus('ok'))
      .catch(() => setApiStatus('error'));
  }, []);

  /* ── Fetch dropdown values ── */
  useEffect(() => {
    axios.get(`${API}/unique-values`)
      .then(r => setUniqueValues(r.data))
      .catch(console.warn);
  }, []);

  /* ── Fetch metrics when metrics tab opens ── */
  useEffect(() => {
    if (tab === 'metrics' && !metrics) {
      axios.get(`${API}/metrics`)
        .then(r => setMetrics(r.data))
        .catch(console.warn);
    }
  }, [tab]);

  const handlePredict = async (form) => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await axios.post(`${API}/predict`, form);
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to reach the API. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Header ── */}
      <header className="header">
        <div className="header-logo">
          <img src={kduLogo} alt="KDU Logo" style={{ width: 48, height: 48, objectFit: 'contain' }} />
          <div>
            <div className="header-logo-text">Group 07</div>
            <div className="header-subtitle">IT Priority Predictor</div>
          </div>
        </div>
        <div className="header-badge">
          <div className="header-dot" style={{ background: apiStatus === 'ok' ? '#22c55e' : '#ef4444' }} />
          {apiStatus === 'ok' ? 'API Connected' : apiStatus === 'checking' ? 'Connecting…' : 'API Offline'}
        </div>
      </header>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', padding: '52px 24px 36px' }}>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          fontWeight: 800,
          background: 'var(--accent-grad)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.03em',
          marginBottom: 12,
        }}>
          IT INCIDENT PRIORITY IN SERVICE <br />
          MANAGEMENT SYSTEMS
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto', fontSize: '1rem' }}>
          Select the incident details below to instantly predict its priority level using Machine Learning.
        </p>
      </div>

      {/* ── Main ── */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 60px' }}>

        {/* Tab bar */}
        <div className="tab-bar" style={{ marginBottom: 32 }}>
          <button className={`tab-btn ${tab === 'predict' ? 'active' : ''}`}
            onClick={() => setTab('predict')}>
            Predict Priority
          </button>
          <button className={`tab-btn ${tab === 'metrics' ? 'active' : ''}`}
            onClick={() => setTab('metrics')}>
            Model Metrics
          </button>
        </div>

        {/* ── Predict Tab ── */}
        {tab === 'predict' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}
            className="predict-layout">
            <div className="glass-card animate-fade-in" style={{ padding: 32 }}>
              <PredictionForm
                onResult={handlePredict}
                uniqueValues={uniqueValues}
                loading={loading}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div className="error-msg animate-fade-in">{error}</div>
              )}
              {!result && !loading && !error && (
                <div className="glass-card animate-fade-in" style={{
                  padding: 32, textAlign: 'center', color: 'var(--text-muted)',
                  borderStyle: 'dashed'
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🎯</div>
                  <div style={{ fontSize: '0.95rem' }}>
                    Fill in the form and click<br /><strong style={{ color: 'var(--text-secondary)' }}>Predict Priority</strong>
                  </div>
                </div>
              )}
              {loading && (
                <div className="glass-card animate-fade-in" style={{
                  padding: 32, textAlign: 'center',
                }}>
                  <div className="spinner" style={{ margin: '0 auto 16px' }} />
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Running prediction…
                  </div>
                </div>
              )}
              {result && <ResultCard result={result} />}
            </div>
          </div>
        )}

        {/* ── Metrics Tab ── */}
        {tab === 'metrics' && (
          <MetricsPanel metrics={metrics} />
        )}
      </main>

      {/* ── Responsive layout adjustment ── */}
      <style>{`
        @media (max-width: 800px) {
          .predict-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
