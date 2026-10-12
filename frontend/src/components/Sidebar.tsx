import React from 'react';
import { Boxes, History, ShoppingCart, Activity, FileText, Server } from 'lucide-react';
import { HealthResponse } from '../types';

interface SidebarProps {
  activeTab: 'overview' | 'inventory' | 'ledger' | 'procurement' | 'sprint' | 'diagnostics';
  setActiveTab: (tab: 'overview' | 'inventory' | 'ledger' | 'procurement' | 'sprint' | 'diagnostics') => void;
  itemsCount: number;
  ledgerCount: number;
  poCount: number;
  health: HealthResponse | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab, setActiveTab, itemsCount, ledgerCount, poCount, health,
}) => {
  return (
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
          {itemsCount > 0 && <span className="nav-badge">{itemsCount}</span>}
        </button>

        <button
          className={`nav-item ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
        >
          <History className="nav-icon" />
          <span>Stock Ledger</span>
          {ledgerCount > 0 && <span className="nav-badge">{ledgerCount}</span>}
        </button>

        <button
          className={`nav-item ${activeTab === 'procurement' ? 'active' : ''}`}
          onClick={() => setActiveTab('procurement')}
        >
          <ShoppingCart className="nav-icon" />
          <span>Purchase Orders</span>
          {poCount > 0 && <span className="nav-badge">{poCount}</span>}
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
  );
};
