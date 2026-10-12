import React from 'react';
import {
  Layers, History, ShoppingBag, Sparkles, LayoutDashboard, Flag, Cpu,
  Users, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { HealthResponse } from '../types';

interface SidebarProps {
  activeTab: 'overview' | 'inventory' | 'ledger' | 'procurement' | 'ai' | 'sprint' | 'diagnostics' | 'users';
  setActiveTab: (tab: 'overview' | 'inventory' | 'ledger' | 'procurement' | 'ai' | 'sprint' | 'diagnostics' | 'users') => void;
  itemsCount: number;
  ledgerCount: number;
  poCount: number;
  aiCount: number;
  usersCount?: number;
  health: HealthResponse | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  itemsCount,
  ledgerCount,
  poCount,
  aiCount,
  usersCount = 0,
  health,
  isCollapsed,
  onToggleCollapse,
}) => {
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header with Logo & Collapse Toggle */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" title="StockSense Platform">
          <Layers style={{ width: 18, height: 18 }} />
        </div>
        {!isCollapsed && (
          <div className="sidebar-logo-text">
            <h1>StockSense</h1>
            <span>Oilfield Inventory AI</span>
          </div>
        )}
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen style={{ width: 16, height: 16 }} />
          ) : (
            <PanelLeftClose style={{ width: 16, height: 16 }} />
          )}
        </button>
      </div>

      <nav className="nav-menu">
        {!isCollapsed && <div className="nav-section-label">Operations</div>}

        <button
          className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          title="Executive Overview & Operational Metrics"
        >
          <LayoutDashboard className="nav-icon" />
          {!isCollapsed && <span>Executive Overview</span>}
        </button>

        <button
          className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
          title="Inventory Master & Running Balances"
        >
          <Layers className="nav-icon" />
          {!isCollapsed && <span>Inventory Master</span>}
          {itemsCount > 0 && (
            <span className={isCollapsed ? 'nav-dot-badge' : 'nav-badge'}>
              {isCollapsed ? '' : itemsCount}
            </span>
          )}
        </button>

        <button
          className={`nav-item ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
          title="Append-Only Stock Ledger Audit Trail"
        >
          <History className="nav-icon" />
          {!isCollapsed && <span>Movement Ledger</span>}
          {ledgerCount > 0 && (
            <span className={isCollapsed ? 'nav-dot-badge' : 'nav-badge'}>
              {isCollapsed ? '' : ledgerCount}
            </span>
          )}
        </button>

        <button
          className={`nav-item ${activeTab === 'procurement' ? 'active' : ''}`}
          onClick={() => setActiveTab('procurement')}
          title="Procurement & Purchase Order Lifecycle"
        >
          <ShoppingBag className="nav-icon" />
          {!isCollapsed && <span>Purchase Orders</span>}
          {poCount > 0 && (
            <span className={isCollapsed ? 'nav-dot-badge' : 'nav-badge'}>
              {isCollapsed ? '' : poCount}
            </span>
          )}
        </button>

        {!isCollapsed && <div className="nav-section-label" style={{ marginTop: '0.85rem' }}>Intelligence</div>}

        <button
          className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
          title="AI Intermittent Replenishment & Decision Queue"
        >
          <Sparkles className="nav-icon" />
          {!isCollapsed && <span>AI Replenishment</span>}
          {aiCount > 0 && (
            <span
              className={isCollapsed ? 'nav-dot-badge ai-badge' : 'nav-badge'}
              style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
            >
              {isCollapsed ? '' : aiCount}
            </span>
          )}
        </button>

        {!isCollapsed && <div className="nav-section-label" style={{ marginTop: '0.85rem' }}>Engineering & Audit</div>}

        <button
          className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
          title="Employee Directory & Audit Roles"
        >
          <Users className="nav-icon" />
          {!isCollapsed && <span>Team & Audit Roles</span>}
          {usersCount > 0 && (
            <span className={isCollapsed ? 'nav-dot-badge' : 'nav-badge'}>
              {isCollapsed ? '' : usersCount}
            </span>
          )}
        </button>

        <button
          className={`nav-item ${activeTab === 'sprint' ? 'active' : ''}`}
          onClick={() => setActiveTab('sprint')}
          title="Sprint Milestone Delivery Roadmap"
        >
          <Flag className="nav-icon" />
          {!isCollapsed && <span>Sprint Roadmap</span>}
        </button>

        <button
          className={`nav-item ${activeTab === 'diagnostics' ? 'active' : ''}`}
          onClick={() => setActiveTab('diagnostics')}
          title="System Health & Storage Diagnostics"
        >
          <Cpu className="nav-icon" />
          {!isCollapsed && <span>Diagnostics & Health</span>}
        </button>
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span
            className="pulse-dot"
            style={{ backgroundColor: health?.status === 'healthy' ? '#10b981' : '#f59e0b' }}
            title={health?.status === 'healthy' ? 'Engine: SQLite WAL (Online)' : 'Connecting to database...'}
          />
          {!isCollapsed && <span style={{ fontWeight: 500 }}>Engine: SQLite WAL</span>}
        </div>
        {!isCollapsed && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            API: {health?.status === 'healthy' ? 'Online (Port 8000)' : 'Connecting...'}
          </div>
        )}
      </div>
    </aside>
  );
};
