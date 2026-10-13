import React from 'react';
import {
  LayoutDashboard, Box, ArrowLeftRight, ShoppingBag, Sparkles,
  Users, Flag, Cpu, ShieldCheck, PanelLeftClose, Activity
} from 'lucide-react';
import { HealthResponse } from '../types';

interface SidebarProps {
  activeTab: 'overview' | 'inventory' | 'ledger' | 'procurement' | 'ai' | 'activity' | 'sprint' | 'diagnostics' | 'users';
  setActiveTab: (tab: 'overview' | 'inventory' | 'ledger' | 'procurement' | 'ai' | 'activity' | 'sprint' | 'diagnostics' | 'users') => void;
  itemsCount: number;
  ledgerCount: number;
  poCount: number;
  aiCount: number;
  activityCount?: number;
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
  activityCount = 0,
  usersCount = 0,
  health,
  isCollapsed,
  onToggleCollapse,
}) => {
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header with Logo & Collapse Toggle */}
      <div className="sidebar-logo">
        <div
          className="sidebar-logo-icon"
          title={isCollapsed ? 'Click to expand sidebar (Ctrl+B)' : 'StockSense Platform'}
          onClick={isCollapsed ? onToggleCollapse : undefined}
          style={{ cursor: isCollapsed ? 'pointer' : 'default' }}
        >
          <Box style={{ width: 18, height: 18, color: '#ffffff' }} />
        </div>
        {!isCollapsed && (
          <div className="sidebar-logo-text">
            <div className="sidebar-logo-title-row">
              <h1>StockSense</h1>
              <span className="sidebar-version-badge">POC</span>
            </div>
            <span className="sidebar-logo-sub">AI Inventory Engine</span>
          </div>
        )}
        {!isCollapsed && (
          <button
            className="sidebar-toggle-btn"
            onClick={onToggleCollapse}
            title="Collapse sidebar (Ctrl+B)"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose style={{ width: 15, height: 15 }} />
          </button>
        )}
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
            <span className="nav-badge ai-badge">{aiCount}</span>
          )}
        </button>

        <button
          className={`nav-item ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
          title="Activity & Integrity Center"
        >
          <Activity className="nav-icon" />
          {!isCollapsed && <span>Activity & Integrity</span>}
          {activityCount !== undefined && activityCount > 0 && !isCollapsed && (
            <span className="nav-badge" style={{ background: '#f59e0b', color: '#000000' }}>{activityCount}</span>
          )}
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
