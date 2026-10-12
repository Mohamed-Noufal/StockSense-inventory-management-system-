import React from 'react';
import { Layers, History, ShoppingBag, Sparkles, LayoutDashboard, Flag, Cpu } from 'lucide-react';
import { HealthResponse } from '../types';

interface SidebarProps {
  activeTab: 'overview' | 'inventory' | 'ledger' | 'procurement' | 'ai' | 'sprint' | 'diagnostics';
  setActiveTab: (tab: 'overview' | 'inventory' | 'ledger' | 'procurement' | 'ai' | 'sprint' | 'diagnostics') => void;
  itemsCount: number;
  ledgerCount: number;
  poCount: number;
  aiCount: number;
  health: HealthResponse | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab, setActiveTab, itemsCount, ledgerCount, poCount, aiCount, health,
}) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Layers style={{ width: 18, height: 18 }} />
        </div>
        <div className="sidebar-logo-text">
          <h1>StockSense</h1>
          <span>Oilfield Inventory AI</span>
        </div>
      </div>

      <nav className="nav-menu">
        <div className="nav-section-label">Operations</div>
        <button
          className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <Layers className="nav-icon" />
          <span>Inventory Master</span>
          {itemsCount > 0 && <span className="nav-badge">{itemsCount}</span>}
        </button>

        <button
          className={`nav-item ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
        >
          <History className="nav-icon" />
          <span>Movement Ledger</span>
          {ledgerCount > 0 && <span className="nav-badge">{ledgerCount}</span>}
        </button>

        <button
          className={`nav-item ${activeTab === 'procurement' ? 'active' : ''}`}
          onClick={() => setActiveTab('procurement')}
        >
          <ShoppingBag className="nav-icon" />
          <span>Purchase Orders</span>
          {poCount > 0 && <span className="nav-badge">{poCount}</span>}
        </button>

        <div className="nav-section-label" style={{ marginTop: '0.85rem' }}>Intelligence</div>
        <button
          className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          <Sparkles className="nav-icon" />
          <span>AI Replenishment</span>
          {aiCount > 0 && <span className="nav-badge" style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}>{aiCount}</span>}
        </button>

        <button
          className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <LayoutDashboard className="nav-icon" />
          <span>Executive Overview</span>
        </button>

        <div className="nav-section-label" style={{ marginTop: '0.85rem' }}>Engineering & Audit</div>
        <button
          className={`nav-item ${activeTab === 'sprint' ? 'active' : ''}`}
          onClick={() => setActiveTab('sprint')}
        >
          <Flag className="nav-icon" />
          <span>Sprint Roadmap</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'diagnostics' ? 'active' : ''}`}
          onClick={() => setActiveTab('diagnostics')}
        >
          <Cpu className="nav-icon" />
          <span>Diagnostics & Health</span>
        </button>
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span className="pulse-dot" style={{ backgroundColor: health?.status === 'healthy' ? '#10b981' : '#f59e0b' }} />
          <span style={{ fontWeight: 500 }}>Engine: SQLite WAL</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          API: {health?.status === 'healthy' ? 'Online (Port 8000)' : 'Connecting...'}
        </div>
      </div>
    </aside>
  );
};
