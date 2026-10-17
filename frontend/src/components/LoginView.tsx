import React, { useState } from 'react';
import {
  ShieldCheck, ArrowRight, Lock, Mail,
  UserCheck, Sparkles, AlertCircle, Database, Layers
} from 'lucide-react';
import { api } from '../api/client';
import { User } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'demo' | 'credentials'>('demo');
  const [email, setEmail] = useState('john.doe@stocksense.oilfield');
  const [password, setPassword] = useState('stocksense123');
  const [loading, setLoading] = useState(false);
  const [loadingPersonaId, setLoadingPersonaId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const demoPersonas = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@stocksense.oilfield',
      role: 'STOREKEEPER',
      initials: 'JD',
      badgeColor: '#10b981',
      desc: 'Warehouse dock receiving, issue dispatch, scanner mobility',
    },
    {
      id: 2,
      name: 'Sara Mansour',
      email: 'sara.mansour@stocksense.oilfield',
      role: 'PROCUREMENT_OFFICER',
      initials: 'SM',
      badgeColor: '#6366f1',
      desc: 'AI replenishment review, PO approval & vendor lead-times',
    },
    {
      id: 3,
      name: 'Khaled Hassan',
      email: 'khaled.hassan@stocksense.oilfield',
      role: 'MANAGER',
      initials: 'KH',
      badgeColor: '#f59e0b',
      desc: 'Inventory valuation analytics, audit logs & system governance',
    },
  ];

  const handleDemoLogin = async (user: typeof demoPersonas[0]) => {
    setError(null);
    setLoading(true);
    setLoadingPersonaId(user.id);
    try {
      const res = await api.demoLogin({ user_id: user.id });
      localStorage.setItem('stocksense_token', res.access_token);
      localStorage.setItem('stocksense_current_user_id', String(res.user.id));
      onLoginSuccess(res.user, res.access_token);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
      setLoadingPersonaId(null);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      localStorage.setItem('stocksense_token', res.access_token);
      localStorage.setItem('stocksense_current_user_id', String(res.user.id));
      onLoginSuccess(res.user, res.access_token);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-viewport">
      <div className="login-card">
        {/* Header & Brand */}
        <div className="login-header">
          <div className="login-logo-badge">
            <Layers style={{ width: 26, height: 26 }} />
          </div>
          <h1 className="login-title">StockSense</h1>
          <p className="login-subtitle">
            AI-Assisted MRO & Oilfield Inventory Intelligence
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="login-mode-toggle">
          <button
            type="button"
            className={`login-mode-btn ${mode === 'demo' ? 'active' : ''}`}
            onClick={() => {
              setMode('demo');
              setError(null);
            }}
          >
            <Sparkles style={{ width: 14, height: 14 }} />
            <span>1-Click Demo Personas</span>
          </button>
          <button
            type="button"
            className={`login-mode-btn ${mode === 'credentials' ? 'active' : ''}`}
            onClick={() => {
              setMode('credentials');
              setError(null);
            }}
          >
            <Lock style={{ width: 14, height: 14 }} />
            <span>Email & Password</span>
          </button>
        </div>

        {error && (
          <div className="login-error-alert">
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Mode 1: 1-Click Demo Personas */}
        {mode === 'demo' && (
          <div className="persona-list">
            {demoPersonas.map((p) => {
              const isCurrentLoading = loadingPersonaId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`persona-card ${isCurrentLoading ? 'loading' : ''}`}
                  onClick={() => handleDemoLogin(p)}
                  disabled={loading}
                >
                  <div
                    className="persona-avatar"
                    style={{ borderColor: p.badgeColor, color: p.badgeColor }}
                  >
                    {p.initials}
                  </div>
                  <div className="persona-info">
                    <div className="persona-name-row">
                      <span className="persona-name">{p.name}</span>
                      <span className="persona-role-badge">{p.role.replace('_', ' ')}</span>
                    </div>
                    <div className="persona-desc">{p.desc}</div>
                  </div>
                  <div className="persona-arrow">
                    {isCurrentLoading ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Entering...</span>
                    ) : (
                      <ArrowRight style={{ width: 16, height: 16 }} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Mode 2: Standard Credentials Sign In */}
        {mode === 'credentials' && (
          <form className="login-form" onSubmit={handleCredentialsSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="form-input-wrapper">
                <Mail style={{ width: 14, height: 14 }} className="form-input-icon" />
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john.doe@stocksense.oilfield"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-wrapper">
                <Lock style={{ width: 14, height: 14 }} className="form-input-icon" />
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
              </div>
              <div className="form-input-hint">
                Default demo password: <code style={{ color: 'var(--text-primary)' }}>stocksense123</code>
              </div>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              <UserCheck style={{ width: 16, height: 16 }} />
              <span>{loading ? 'Authenticating...' : 'Sign In with JWT'}</span>
            </button>
          </form>
        )}

        {/* System Invariant Badges Footer */}
        <div className="login-footer-badges">
          <div className="footer-badge-item">
            <ShieldCheck style={{ width: 13, height: 13, color: '#10b981' }} />
            <span>HS256 Bearer JWT</span>
          </div>
          <div className="footer-badge-item">
            <Database style={{ width: 13, height: 13, color: '#6366f1' }} />
            <span>SQLite WAL Ledger</span>
          </div>
          <div className="footer-badge-item">
            <Sparkles style={{ width: 13, height: 13, color: '#f59e0b' }} />
            <span>Zero-Leakage AI</span>
          </div>
        </div>
      </div>
    </div>
  );
};
