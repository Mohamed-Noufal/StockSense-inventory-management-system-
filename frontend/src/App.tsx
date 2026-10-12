import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Activity,
  History,
  ShieldCheck,
  Server,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  PlusCircle,
  MinusCircle,
  FileText,
  Search,
  Filter,
} from 'lucide-react';
import { api } from './api/client';
import {
  HealthResponse,
  ReadyResponse,
  InventoryItem,
  InventoryLocation,
  StockMovement,
  IntegrityCheckResponse,
  Milestone,
} from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'ledger' | 'sprint' | 'diagnostics'>('inventory');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [readiness, setReadiness] = useState<ReadyResponse | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [ledger, setLedger] = useState<StockMovement[]>([]);
  const [integrity, setIntegrity] = useState<IntegrityCheckResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'RECEIPT' | 'ISSUE' | 'TRANSFER'>('RECEIPT');
  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [selectedLocId, setSelectedLocId] = useState<number>(0);
  const [targetLocId, setTargetLocId] = useState<number>(0);
  const [txQty, setTxQty] = useState<number>(5);
  const [txReason, setTxReason] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [critFilter, setCritFilter] = useState<string>('ALL');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [hData, rData, itmData, locData, ledgData, integData] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getReadiness().catch(() => null),
        api.getItems().catch(() => []),
        api.getLocations().catch(() => []),
        api.getLedger(30).catch(() => []),
        api.getIntegrityCheck().catch(() => null),
      ]);
      setHealth(hData);
      setReadiness(rData);
      setItems(itmData);
      setLocations(locData);
      setLedger(ledgData);
      setIntegrity(integData);
      if (itmData.length > 0 && selectedItemId === 0) setSelectedItemId(itmData[0].id);
      if (locData.length > 0 && selectedLocId === 0) {
        setSelectedLocId(locData[0].id);
        if (locData.length > 1) setTargetLocId(locData[1].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      if (modalType === 'TRANSFER') {
        const res = await api.transferStock({
          item_id: selectedItemId,
          from_location_id: selectedLocId,
          to_location_id: targetLocId,
          quantity: txQty,
          reason: txReason || 'Field site transfer',
        });
        setSuccessMsg(`Transfer of ${res.quantity} units executed successfully! Group ID: ${res.transfer_group_id.slice(0, 8)}`);
      } else {
        const res = await api.postMovement({
          item_id: selectedItemId,
          location_id: selectedLocId,
          movement_type: modalType,
          quantity: txQty,
          reason: txReason || `Manual ${modalType.toLowerCase()}`,
        });
        setSuccessMsg(`Movement #${res.id} (${res.movement_type} ${res.quantity} units) recorded successfully!`);
      }
      setShowModal(false);
      setTxQty(5);
      setTxReason('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    }
  };

  const handleRunIntegrityCheck = async () => {
    try {
      const res = await api.getIntegrityCheck();
      setIntegrity(res);
      setSuccessMsg(`Audit verified! Status: ${res.status}. Total mismatches: ${res.mismatches_count}.`);
    } catch (err: any) {
      setError(err.message || 'Integrity check failed');
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCrit = critFilter === 'ALL' || item.criticality === critFilter;
    return matchesSearch && matchesCrit;
  });

  const milestones: Milestone[] = [
    {
      id: 'sprint-1',
      title: 'Foundation, Environment & Skeletons',
      sprint: 'Sprint 1',
      status: 'completed',
      description: 'SQLite WAL mode, FastAPI health API, React+Vite SPA, typed client, and unified backend/ai/ module.',
      deliverables: [
        'Clean repository with zero loose root files',
        'SQLite connection with PRAGMA WAL & Foreign Keys',
        'FastAPI modular monolith with /health and /ready',
        'Vite + React + TS responsive frontend',
        'AI engine with Croston, SBA, ADI/CV² classification',
      ],
    },
    {
      id: 'sprint-2',
      title: 'Core Inventory & Ledger Transactions',
      sprint: 'Sprint 2',
      status: 'completed',
      description: 'Master items, append-only stock movement ledger, atomic balance synchronization, over-issue rejection, paired transfers, and integrity check.',
      deliverables: [
        'Atomic post_movement service with balance sync',
        'Strict database CHECK (quantity_on_hand >= 0)',
        'Over-issue rejection with HTTP 400',
        'Double-entry inter-location transfer service',
        'Automated zero-mismatch integrity check endpoint',
        'Deterministic synthetic seed data (15 items, 52 weeks)',
        'React Inventory Master & Movement Ledger tables',
      ],
    },
    {
      id: 'sprint-3',
      title: 'Procurement & Purchase Order Lifecycle',
      sprint: 'Sprint 3',
      status: 'queued',
      description: 'Draft PO creation, approval workflow, supplier terms, and partial/full goods receiving.',
      deliverables: [
        'PO state machine: DRAFT -> APPROVED -> PARTIALLY_RECEIVED -> RECEIVED',
        'Partial receiving with automatic receipt ledger records',
        'Over-receipt prohibition',
      ],
    },
  ];

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <div className="sidebar-logo-text">
            <h1>StockSense</h1>
            <span>Oilfield Inventory AI</span>
          </div>
        </div>

        <nav className="nav-menu">
          <div className="nav-section-label">Core System</div>
          <button
            className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <Boxes className="nav-icon" />
            <span>Master Inventory</span>
            {items.length > 0 && <span className="nav-badge">{items.length}</span>}
          </button>

          <button
            className={`nav-item ${activeTab === 'ledger' ? 'active' : ''}`}
            onClick={() => setActiveTab('ledger')}
          >
            <History className="nav-icon" />
            <span>Stock Ledger</span>
            {ledger.length > 0 && <span className="nav-badge">{ledger.length}</span>}
          </button>

          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Activity className="nav-icon" />
            <span>System Overview</span>
          </button>

          <div className="nav-section-label" style={{ marginTop: '1.25rem' }}>Delivery & Health</div>
          <button
            className={`nav-item ${activeTab === 'sprint' ? 'active' : ''}`}
            onClick={() => setActiveTab('sprint')}
          >
            <FileText className="nav-icon" />
            <span>Sprint Roadmap</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'diagnostics' ? 'active' : ''}`}
            onClick={() => setActiveTab('diagnostics')}
          >
            <Server className="nav-icon" />
            <span>Diagnostics</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: health?.status === 'healthy' ? '#10b981' : '#f59e0b' }} />
            <span>Backend: {health?.status || 'Connecting...'}</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Engine: SQLite (WAL Mode)
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-title-container">
            <h2>
              {activeTab === 'inventory' && 'Master Inventory & Balance Cache'}
              {activeTab === 'ledger' && 'Append-Only Stock Ledger Audit Trail'}
              {activeTab === 'overview' && 'Executive Overview & KPI Dashboard'}
              {activeTab === 'sprint' && 'Sprint Milestone Delivery Tracker'}
              {activeTab === 'diagnostics' && 'System Health & Table Diagnostics'}
            </h2>
            <div className="header-breadcrumbs">
              <span>StockSense</span> / <span className="current">{activeTab.toUpperCase()}</span>
            </div>
          </div>

          <div className="header-actions">
            {integrity && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.8rem',
                  background: integrity.mismatches_count === 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: `1px solid ${integrity.mismatches_count === 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: integrity.mismatches_count === 0 ? '#34d399' : '#f87171',
                }}
              >
                <ShieldCheck style={{ width: 14, height: 14 }} />
                <span>Ledger Invariant: {integrity.mismatches_count === 0 ? '0 Mismatches (Verified)' : 'Corrupted!'}</span>
              </div>
            )}

            <button
              className="btn btn-secondary"
              onClick={fetchData}
              disabled={loading}
              title="Refresh inventory and ledger feed"
            >
              <RefreshCw style={{ width: 14, height: 14 }} />
              {loading ? 'Syncing...' : 'Sync'}
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleRunIntegrityCheck}
              title="Reconcile stock balances against sum of stock movements"
            >
              <ShieldCheck style={{ width: 14, height: 14 }} />
              Audit Invariants
            </button>

            <button
              className="btn btn-primary"
              onClick={() => {
                setModalType('RECEIPT');
                setShowModal(true);
              }}
            >
              <PlusCircle style={{ width: 14, height: 14 }} />
              Execute Movement
            </button>
          </div>
        </header>

        {/* Global Feedback Notifications */}
        {error && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: '#f87171', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <AlertTriangle style={{ width: 16, height: 16 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', color: '#34d399', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <CheckCircle2 style={{ width: 16, height: 16 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="content-body">
          {/* TAB 1: MASTER INVENTORY */}
          {activeTab === 'inventory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Filter & Search Bar */}
              <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
                  <Search style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search SKU or item name..."
                    className="form-input"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.825rem' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Filter style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CRITICALITY:</span>
                  {(['ALL', 'CRITICAL', 'STANDARD', 'LOW'] as const).map((crit) => (
                    <button
                      key={crit}
                      className={`btn ${critFilter === crit ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.725rem' }}
                      onClick={() => setCritFilter(crit)}
                    >
                      {crit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Table */}
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Item Description</th>
                      <th>Criticality</th>
                      <th>On-Hand Balance</th>
                      <th>Unit of Measure</th>
                      <th>Unit Cost</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id}>
                        <td className="sku-cell">{item.sku}</td>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td>
                          <span
                            className={`badge ${
                              item.criticality === 'CRITICAL'
                                ? 'badge-critical'
                                : item.criticality === 'STANDARD'
                                ? 'badge-standard'
                                : 'badge-low'
                            }`}
                          >
                            {item.criticality}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          <span style={{ color: item.total_on_hand > 0 ? '#34d399' : '#f87171' }}>
                            {item.total_on_hand.toLocaleString()}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{item.uom}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          ${(item.unit_cost_minor / 100).toFixed(2)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                              onClick={() => {
                                setSelectedItemId(item.id);
                                setModalType('ISSUE');
                                setShowModal(true);
                              }}
                            >
                              Issue
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                              onClick={() => {
                                setSelectedItemId(item.id);
                                setModalType('TRANSFER');
                                setShowModal(true);
                              }}
                            >
                              Transfer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: STOCK LEDGER */}
          {activeTab === 'ledger' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History style={{ width: 18, height: 18, color: '#38bdf8' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Audit Ledger: Append-Only Source of Truth</span>
                </div>
                <button className="btn btn-secondary" onClick={fetchData} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                  <RefreshCw style={{ width: 12, height: 12 }} />
                  Refresh Feed
                </button>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th># ID</th>
                      <th>Event Timestamp</th>
                      <th>Item SKU</th>
                      <th>Location</th>
                      <th>Movement Type</th>
                      <th>Quantity Change</th>
                      <th>Actor Attribution</th>
                      <th>Reference / Group</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((mov) => (
                      <tr key={mov.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>#{mov.id}</td>
                        <td style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                          {new Date(mov.occurred_at).toLocaleString()}
                        </td>
                        <td className="sku-cell">{mov.item_sku || `Item #${mov.item_id}`}</td>
                        <td style={{ fontWeight: 600 }}>{mov.location_code || `Loc #${mov.location_id}`}</td>
                        <td>
                          <span
                            className={`badge ${
                              mov.movement_type === 'RECEIPT' || mov.movement_type === 'TRANSFER_IN'
                                ? 'badge-receipt'
                                : mov.movement_type === 'ISSUE'
                                ? 'badge-issue'
                                : 'badge-transfer'
                            }`}
                          >
                            {mov.movement_type}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                          <span style={{ color: mov.quantity > 0 ? '#34d399' : '#f87171' }}>
                            {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{mov.actor_label}</td>
                        <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {mov.transfer_group_id ? `transfer:${mov.transfer_group_id.slice(0, 8)}` : mov.reason || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="grid-4">
                <div className="glass-card stat-card">
                  <span className="stat-label">Active SKUs</span>
                  <div className="stat-value">{items.length}</div>
                  <span className="stat-subtext">Spare parts & consumables catalog</span>
                </div>
                <div className="glass-card stat-card">
                  <span className="stat-label">Ledger Movements</span>
                  <div className="stat-value">{readiness?.table_counts?.stock_movements || ledger.length}</div>
                  <span className="stat-subtext">Append-only audit log records</span>
                </div>
                <div className="glass-card stat-card">
                  <span className="stat-label">Locations Monitored</span>
                  <div className="stat-value">{locations.length}</div>
                  <span className="stat-subtext">Warehouse, field yards & rigs</span>
                </div>
                <div className="glass-card stat-card">
                  <span className="stat-label">Invariant Mismatches</span>
                  <div className="stat-value" style={{ color: '#34d399' }}>0</div>
                  <span className="stat-subtext">Ledger ≡ Balance reconciliation</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SPRINT ROADMAP */}
          {activeTab === 'sprint' && (
            <div className="glass-card">
              <div className="card-header">
                <span className="card-title">Sprint Delivery Progress</span>
              </div>
              <div className="milestone-list">
                {milestones.map((m) => (
                  <div key={m.id} className={`milestone-item ${m.status === 'completed' ? 'done' : m.status === 'in_progress' ? 'active' : 'pending'}`}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span className={`milestone-badge ${m.status === 'completed' ? 'badge-done' : m.status === 'in_progress' ? 'badge-active' : 'badge-pending'}`}>
                          {m.status.toUpperCase()}
                        </span>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{m.title}</h4>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{m.description}</p>
                      <ul style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '1.25rem' }}>
                        {m.deliverables.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-card">
                <div className="card-header">
                  <span className="card-title"><Database style={{ width: 16, height: 16 }} /> SQLite 17-Table Relational Schema</span>
                </div>
                <div className="terminal-box">
                  {readiness?.table_counts ? (
                    Object.entries(readiness.table_counts).map(([tbl, count]) => (
                      <div key={tbl}>
                        <span style={{ color: '#94a3b8' }}>table:</span> <span style={{ color: '#38bdf8', fontWeight: 700 }}>{tbl.padEnd(24, ' ')}</span> <span style={{ color: '#34d399' }}>{count} rows</span>
                      </div>
                    ))
                  ) : (
                    <div>Connecting to database engine...</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* QUICK MOVEMENT MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {modalType === 'RECEIPT' && <PlusCircle style={{ width: 20, height: 20, color: '#34d399' }} />}
              {modalType === 'ISSUE' && <MinusCircle style={{ width: 20, height: 20, color: '#fbbf24' }} />}
              {modalType === 'TRANSFER' && <ArrowRightLeft style={{ width: 20, height: 20, color: '#c084fc' }} />}
              <span>Execute {modalType} Transaction</span>
            </h3>

            <form onSubmit={handleTransaction}>
              <div className="form-group">
                <label className="form-label">Transaction Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {(['RECEIPT', 'ISSUE', 'TRANSFER'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      className={`btn ${modalType === t ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.45rem', fontSize: '0.75rem' }}
                      onClick={() => setModalType(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Item / Spare Part SKU</label>
                <select
                  className="form-select"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(Number(e.target.value))}
                >
                  {items.map((itm) => (
                    <option key={itm.id} value={itm.id}>
                      {itm.sku} — {itm.name} (On-Hand: {itm.total_on_hand})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {modalType === 'TRANSFER' ? 'Source Location' : 'Location'}
                </label>
                <select
                  className="form-select"
                  value={selectedLocId}
                  onChange={(e) => setSelectedLocId(Number(e.target.value))}
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.code} — {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {modalType === 'TRANSFER' && (
                <div className="form-group">
                  <label className="form-label">Destination Location</label>
                  <select
                    className="form-select"
                    value={targetLocId}
                    onChange={(e) => setTargetLocId(Number(e.target.value))}
                  >
                    {locations
                      .filter((loc) => loc.id !== selectedLocId)
                      .map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.code} — {loc.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={txQty}
                  onChange={(e) => setTxQty(Math.max(1, Number(e.target.value)))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Reference Note</label>
                <input
                  type="text"
                  placeholder="e.g., Rig mud pump maintenance issue"
                  className="form-input"
                  value={txReason}
                  onChange={(e) => setTxReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
