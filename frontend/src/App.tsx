import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Activity,
  ShoppingCart,
  BrainCircuit,
  ShieldCheck,
  Server,
  Database,
  RefreshCw,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { api } from './api/client';
import { HealthResponse, ReadyResponse, Milestone } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sprint' | 'diagnostics'>('overview');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [readiness, setReadiness] = useState<ReadyResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<'STOREKEEPER' | 'PROCUREMENT_OFFICER' | 'MANAGER'>('STOREKEEPER');

  const checkConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const [hData, rData] = await Promise.all([
        api.getHealth().catch((err) => {
          console.warn('Health check not available yet:', err);
          return null;
        }),
        api.getReadiness().catch((err) => {
          console.warn('Readiness check not available yet:', err);
          return null;
        }),
      ]);
      setHealth(hData);
      setReadiness(rData);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const milestones: Milestone[] = [
    {
      id: 'sprint-1',
      title: 'Foundation, Environment & Skeletons',
      sprint: 'Sprint 1',
      status: 'completed',
      description: 'Repository structure, requirements, SQLite WAL setup, FastAPI health endpoints, React+Vite app, typed client, and agent skills.',
      deliverables: [
        'Git repository initialized & tracked',
        'Assessment documentation indexed in docs/',
        'Executive README.md & Sprint tracker',
        'Python 3.12 virtualenv & pinned requirements',
        'SQLite connection with PRAGMA WAL & Foreign Keys',
        'FastAPI modular monolith foundation',
        'Vite + React + TS responsive frontend',
      ],
    },
    {
      id: 'sprint-2',
      title: 'Core Inventory & Append-Only Ledger',
      sprint: 'Sprint 2',
      status: 'in_progress',
      description: '17-table schema, append-only stock movement ledger, transactional balance updates, and zero-mismatch integrity checker.',
      deliverables: [
        'SQLAlchemy 2.0 ORM models for all 17 tables',
        'Receipt, Issue, and Transfer atomic services',
        'Over-issue check preventing negative stock',
        'Idempotency key handling for external mutations',
        'Balance-vs-ledger integrity validation endpoint',
      ],
    },
    {
      id: 'sprint-3',
      title: 'Procurement & Purchase Order Lifecycle',
      sprint: 'Sprint 3',
      status: 'queued',
      description: 'Draft PO creation, approval workflow, destination warehouse assignment, and partial/full goods receiving.',
      deliverables: [
        'PO state machine: DRAFT -> APPROVED -> PARTIALLY_RECEIVED -> RECEIVED',
        'Destination-aware PO line receiving',
        'Automatic receipt ledger movements on goods delivery',
        'Audit attribution for storekeeper and procurement officers',
      ],
    },
    {
      id: 'sprint-4',
      title: 'AI Replenishment & Decision Intelligence',
      sprint: 'Sprint 4',
      status: 'queued',
      description: 'Intermittent demand forecasting (Croston, SBA, TSB), lead time risk simulation, and explainable recommendations.',
      deliverables: [
        'Demand pattern classification (ADI & CV²)',
        'Croston & Syntetos-Boylan Approximation (SBA) forecasts',
        'Monte Carlo lead-time risk simulation',
        'Explainable recommendations with structured rationale JSON',
        'Strict temporal cutoff (zero future leakage)',
      ],
    },
    {
      id: 'sprint-5',
      title: 'Operations Dashboard & Golden Demo UI',
      sprint: 'Sprint 5',
      status: 'queued',
      description: 'Interactive stock ledger table, inventory management, PO approval, recommendation review modal, and integrity dashboard.',
      deliverables: [
        'Inventory master list & movement history viewer',
        'Issue and Transfer operational action forms',
        'AI recommendation review & 1-click PO generator',
        'Live integrity test runner in UI',
      ],
    },
    {
      id: 'sprint-6',
      title: 'Verification, Evaluation & Interview Rehearsal',
      sprint: 'Sprint 6',
      status: 'queued',
      description: 'End-to-end golden flow verification, paired simulation against min/max baseline, and presentation readiness.',
      deliverables: [
        'Out-of-sample backtesting (RMSSE, MASE, bias)',
        'Paired simulation report (service level vs inventory value)',
        'Clean-clone verification from fresh repository',
        'Complete rehearsal of the live interview demonstration',
      ],
    },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Boxes size={22} color="#ffffff" />
          </div>
          <div className="sidebar-logo-text">
            <h1>StockSense</h1>
            <span>AI Inventory PoC</span>
          </div>
        </div>

        <div className="nav-section-title">Operations</div>
        <ul className="nav-list">
          <li>
            <button
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
              style={{ width: '100%', background: 'none', textAlign: 'left' }}
            >
              <Activity size={18} />
              <span>System Overview</span>
            </button>
          </li>
          <li>
            <button
              className={`nav-item ${activeTab === 'sprint' ? 'active' : ''}`}
              onClick={() => setActiveTab('sprint')}
              style={{ width: '100%', background: 'none', textAlign: 'left' }}
            >
              <Layers size={18} />
              <span>Sprint Roadmap</span>
            </button>
          </li>
          <li>
            <button
              className={`nav-item ${activeTab === 'diagnostics' ? 'active' : ''}`}
              onClick={() => setActiveTab('diagnostics')}
              style={{ width: '100%', background: 'none', textAlign: 'left' }}
            >
              <Server size={18} />
              <span>API & Diagnostics</span>
            </button>
          </li>
        </ul>

        <div className="nav-section-title" style={{ marginTop: '1rem' }}>Modules (Sprint 2-5)</div>
        <ul className="nav-list">
          <li className="nav-item" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
            <Boxes size={18} />
            <span>Inventory Master</span>
          </li>
          <li className="nav-item" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
            <ShoppingCart size={18} />
            <span>Purchase Orders</span>
          </li>
          <li className="nav-item" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
            <BrainCircuit size={18} />
            <span>AI Replenishment</span>
          </li>
          <li className="nav-item" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
            <ShieldCheck size={18} />
            <span>Ledger & Audit</span>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="user-avatar">
              {selectedUser === 'STOREKEEPER' ? 'SK' : selectedUser === 'PROCUREMENT_OFFICER' ? 'PO' : 'MGR'}
            </div>
            <div className="user-meta" style={{ flex: 1 }}>
              <h4>Demo Persona</h4>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value as any)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  outline: 'none',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <option value="STOREKEEPER" style={{ background: '#0f172a' }}>Storekeeper</option>
                <option value="PROCUREMENT_OFFICER" style={{ background: '#0f172a' }}>Procurement Officer</option>
                <option value="MANAGER" style={{ background: '#0f172a' }}>Operations Manager</option>
              </select>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-wrapper">
        <header className="header">
          <div className="header-title-section">
            <h2 className="header-title">Environment & Foundations Setup</h2>
            <span className="header-badge badge-poc">Assessment PoC</span>
          </div>

          <div className="header-actions">
            <div className="connection-indicator">
              <span
                className={`indicator-dot ${
                  loading ? 'dot-checking' : health?.status === 'healthy' ? 'dot-online' : 'dot-offline'
                }`}
              />
              <span>
                {loading
                  ? 'Connecting...'
                  : health?.status === 'healthy'
                  ? 'Backend Online'
                  : 'Backend Standby'}
              </span>
            </div>

            <button className="btn btn-secondary" onClick={checkConnection} title="Refresh connection">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Ping</span>
            </button>
          </div>
        </header>

        <main className="page-container">
          {/* Header Card */}
          <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.7))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                  StockSense Assessment Platform
                </h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '750px', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Complete AI-Assisted Inventory Management Proof of Concept for spare parts and consumables.
                  Designed with an append-only stock ledger, transactional balance maintenance, and human-in-the-loop
                  intermittent demand forecasting.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <a href="/api/v1/health" target="_blank" rel="noreferrer" className="btn btn-secondary">
                  <Activity size={14} />
                  <span>API Health</span>
                </a>
                <button className="btn btn-primary" onClick={() => setActiveTab('sprint')}>
                  <span>View Sprint Roadmap</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid-4">
            <div className="glass-card stat-card">
              <span className="stat-label">
                Database Engine
                <Database size={16} color="var(--accent-cyan)" />
              </span>
              <div className="stat-value">
                SQLite <span style={{ fontSize: '0.9rem', color: 'var(--status-success)' }}>WAL</span>
              </div>
              <span className="stat-subtext">PRAGMA foreign_keys = ON</span>
            </div>

            <div className="glass-card stat-card">
              <span className="stat-label">
                Backend Service
                <Server size={16} color="var(--accent-indigo)" />
              </span>
              <div className="stat-value">FastAPI</div>
              <span className="stat-subtext">Python 3.12 + SQLAlchemy 2.0</span>
            </div>

            <div className="glass-card stat-card">
              <span className="stat-label">
                Frontend App
                <Layers size={16} color="var(--accent-cyan)" />
              </span>
              <div className="stat-value">React 18</div>
              <span className="stat-subtext">TypeScript + Vite 5 + Custom CSS</span>
            </div>

            <div className="glass-card stat-card">
              <span className="stat-label">
                Target Invariant
                <ShieldCheck size={16} color="var(--status-success)" />
              </span>
              <div className="stat-value">0 Mismatch</div>
              <span className="stat-subtext">Ledger = Balances parity guarantee</span>
            </div>
          </div>

          {/* Content Switcher */}
          {activeTab === 'overview' && (
            <div className="grid-3">
              {/* Architecture Pillars */}
              <div className="glass-card" style={{ gridColumn: 'span 2' }}>
                <div className="card-header">
                  <h4 className="card-title">
                    <CheckCircle2 size={18} color="var(--accent-cyan)" />
                    System Architecture & Foundations
                  </h4>
                  <span className="milestone-badge badge-done">Configured</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem', color: 'var(--accent-cyan)' }}>
                      1. Immutable Ledger
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Stock movements are append-only. No row updates or deletions. Running balances are updated transactionally.
                    </p>
                  </div>
                  <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem', color: 'var(--accent-cyan)' }}>
                      2. Non-Negative Stock
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Enforced at the storage layer via <code>CHECK (quantity_on_hand &gt;= 0)</code>. Over-issue operations are rejected atomically.
                    </p>
                  </div>
                  <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem', color: 'var(--accent-cyan)' }}>
                      3. Advisory AI Only
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Models propose purchase orders with transparent math and explanations. A human reviews and approves every order.
                    </p>
                  </div>
                  <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem', color: 'var(--accent-cyan)' }}>
                      4. Time-Safe Backtests
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Rolling-origin backtesting with strict temporal cutoffs prevents future leakage into demand forecasting features.
                    </p>
                  </div>
                </div>
              </div>

              {/* Documentation Summary */}
              <div className="glass-card">
                <div className="card-header">
                  <h4 className="card-title">
                    <FileText size={18} color="var(--accent-indigo)" />
                    Assessment Docs
                  </h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--status-success)' }}>✓</span>
                    <span><strong>01:</strong> Problem Statement & Goals</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--status-success)' }}>✓</span>
                    <span><strong>02:</strong> Technical Architecture (17 Tables)</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--status-success)' }}>✓</span>
                    <span><strong>03:</strong> Sprint Plan & Interview Guide</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--status-success)' }}>✓</span>
                    <span><strong>04:</strong> Frontend UX & Navigation Plan</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--status-success)' }}>✓</span>
                    <span><strong>Root:</strong> README.md & Setup Guide</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sprint' && (
            <div className="glass-card">
              <div className="card-header">
                <h4 className="card-title">
                  <Layers size={18} color="var(--accent-cyan)" />
                  Sprint Plan & Assessment Execution Roadmap
                </h4>
                <span className="milestone-badge badge-active">Sprint 1 Ready</span>
              </div>
              <div className="milestone-list">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    className={`milestone-item ${
                      m.status === 'completed' ? 'done' : m.status === 'in_progress' ? 'active' : 'pending'
                    }`}
                  >
                    <div style={{ marginTop: '0.1rem' }}>
                      {m.status === 'completed' ? (
                        <CheckCircle2 size={20} color="var(--status-success)" />
                      ) : m.status === 'in_progress' ? (
                        <Clock size={20} color="var(--accent-cyan)" />
                      ) : (
                        <Clock size={20} color="var(--text-muted)" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>{m.title}</span>
                        <span
                          className={`milestone-badge ${
                            m.status === 'completed'
                              ? 'badge-done'
                              : m.status === 'in_progress'
                              ? 'badge-active'
                              : 'badge-pending'
                          }`}
                        >
                          {m.status === 'completed' ? 'Completed' : m.status === 'in_progress' ? 'Up Next' : 'In Queue'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.sprint}</span>
                      </div>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {m.description}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {m.deliverables.map((d, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '0.725rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              color: 'var(--text-muted)',
                            }}
                          >
                            • {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'diagnostics' && (
            <div className="glass-card">
              <div className="card-header">
                <h4 className="card-title">
                  <Server size={18} color="var(--accent-cyan)" />
                  Backend & Database Connection Status
                </h4>
                <button className="btn btn-secondary" onClick={checkConnection}>
                  <RefreshCw size={14} />
                  <span>Re-test Connection</span>
                </button>
              </div>

              {loading ? (
                <p style={{ color: 'var(--text-muted)' }}>Querying `/api/v1/health` and `/api/v1/ready`...</p>
              ) : error ? (
                <div style={{ background: 'var(--status-danger-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--status-danger)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-danger)', fontWeight: 700 }}>
                    <AlertTriangle size={18} />
                    <span>Connection Diagnostic</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="terminal-box">
                    <pre>{JSON.stringify({ health: health || 'connecting...', readiness: readiness || 'pending...' }, null, 2)}</pre>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    SQLite Database target: <code>./data/stocksense.db</code>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
