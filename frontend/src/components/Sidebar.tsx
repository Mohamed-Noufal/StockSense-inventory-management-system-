import React from 'react';
import {
  LayoutDashboard, Box, ArrowLeftRight, ShoppingBag, Sparkles,
  History, Users, Flag, Cpu, ShieldCheck, PanelLeftClose, PanelLeftOpen
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
          <Box style={{ width: 18, height: 18, color: '#38bdf8' }} />
        </div>
        {!isCollapsed && (
          <div className="sidebar-logo-text">
            <h1>StockSense</h1>
            <span>Smarter Inventory, Lower Risk.</span>
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
        {/* Core Operations matching reference mock */}
        <button
          className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          title="Overview Dashboard"
        >
          <LayoutDashboard className="nav-icon" />
          {!isCollapsed && <span>Overview</span>}
        </button>

        <button
          className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
          title="Inventory Master & Availability"
        >
          <Box className="nav-icon" />
          {!isCollapsed && <span>Inventory</span>}
          {itemsCount > 0 && !isCollapsed && (
            <span className="nav-badge">{itemsCount}</span>
          )}
        </button>

        <button
          className={`nav-item ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
          title="Stock Operations & Movement Ledger"
        >
          <ArrowLeftRight className="nav-icon" />
          {!isCollapsed && <span>Operations</span>}
          {ledgerCount > 0 && !isCollapsed && (
            <span className="nav-badge">{ledgerCount}</span>
          )}
        </button>

        <button
          className={`nav-item ${activeTab === 'procurement' ? 'active' : ''}`}
          onClick={() => setActiveTab('procurement')}
          title="Purchase Orders & Procurement"
        >
          <ShoppingBag className="nav-icon" />
          {!isCollapsed && <span>Purchase Orders</span>}
          {poCount > 0 && !isCollapsed && (
            <span className="nav-badge">{poCount}</span>
          )}
        </button>

        <button
          className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
          title="AI & Replenishment Intelligence"
        >
          <Sparkles className="nav-icon" />
          {!isCollapsed && <span>AI & Replenishment</span>}
          {aiCount > 0 && !isCollapsed && (
            <span className="nav-badge ai-badge" style={{ color: '#38bdf8' }}>{aiCount}</span>
          )}
        </button>

        <button
          className={`nav-item ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
          title="Activity & Audit Logs"
        >
          <History className="nav-icon" />
          {!isCollapsed && <span>Activity & Logs</span>}
        </button>

        {/* Secondary Admin/Audit items */}
        {!isCollapsed && <div className="nav-section-label" style={{ marginTop: '0.85rem' }}>Management & Health</div>}

        <button
          className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
          title="Team & Audit Roles"
        >
          <Users className="nav-icon" />
          {!isCollapsed && <span>Team & Roles</span>}
          {usersCount > 0 && !isCollapsed && (
            <span className="nav-badge">{usersCount}</span>
          )}
        </button>

        <button
          className={`nav-item ${activeTab === 'sprint' ? 'active' : ''}`}
          onClick={() => setActiveTab('sprint')}
          title="Sprint Delivery Roadmap"
        >
          <Flag className="nav-icon" />
          {!isCollapsed && <span>Sprint Roadmap</span>}
        </button>

        <button
          className={`nav-item ${activeTab === 'diagnostics' ? 'active' : ''}`}
          onClick={() => setActiveTab('diagnostics')}
          title="Diagnostics & Engine Status"
        >
          <Cpu className="nav-icon" />
          {!isCollapsed && <span>Diagnostics</span>}
        </button>
      </nav>

      {/* Bottom AI Promo Card matching reference design */}
      {!isCollapsed && (
        <div className="sidebar-promo-card">
          <div className="sidebar-promo-icon">
            <ShieldCheck style={{ width: 18, height: 18, color: '#10b981' }} />
          </div>
          <div className="sidebar-promo-title">Keep your stock running smoothly</div>
          <div className="sidebar-promo-desc">AI-powered insights for better decisions.</div>
        </div>
      )}

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
