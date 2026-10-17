import React from 'react';
import {
  LayoutDashboard, Box, ArrowLeftRight, ShoppingBag, Sparkles,
  Users, ShieldCheck, PanelLeftClose, Activity
} from 'lucide-react';
import { HealthResponse } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface SidebarProps {
  activeTab: 'overview' | 'inventory' | 'ledger' | 'procurement' | 'ai' | 'activity' | 'users';
  setActiveTab: (tab: 'overview' | 'inventory' | 'ledger' | 'procurement' | 'ai' | 'activity' | 'users') => void;
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
  const { t } = useI18n();

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
              <h1>{t('brand.name')}</h1>
              <span className="sidebar-version-badge">{t('brand.poc')}</span>
            </div>
            <span className="sidebar-logo-sub">{t('brand.tagline')}</span>
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
          {!isCollapsed && <span>{t('nav.overview')}</span>}
        </button>

        <button
          className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
          title="Inventory Master & Availability"
        >
          <Box className="nav-icon" />
          {!isCollapsed && <span>{t('nav.inventory')}</span>}
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
          {!isCollapsed && <span>{t('nav.operations')}</span>}
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
          {!isCollapsed && <span>{t('nav.procurement')}</span>}
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
          {!isCollapsed && <span>{t('nav.ai')}</span>}
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
          {!isCollapsed && <span>{t('nav.activity')}</span>}
          {activityCount !== undefined && activityCount > 0 && !isCollapsed && (
            <span className="nav-badge" style={{ background: '#f59e0b', color: '#000000' }}>{activityCount}</span>
          )}
        </button>

        {/* Secondary Admin/Audit items */}
        {!isCollapsed && <div className="nav-section-label" style={{ marginTop: '0.85rem' }}>{t('sidebar.mgmt_health')}</div>}

        <button
          className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
          title="Team & Audit Roles"
        >
          <Users className="nav-icon" />
          {!isCollapsed && <span>{t('nav.users')}</span>}
          {usersCount > 0 && !isCollapsed && (
            <span className="nav-badge">{usersCount}</span>
          )}
        </button>
      </nav>

      {/* Bottom AI Promo Card matching reference design */}
      {!isCollapsed && (
        <div className="sidebar-promo-card">
          <div className="sidebar-promo-icon">
            <ShieldCheck style={{ width: 18, height: 18, color: '#10b981' }} />
          </div>
          <div className="sidebar-promo-title">{t('sidebar.promo_title')}</div>
          <div className="sidebar-promo-desc">{t('sidebar.promo_desc')}</div>
        </div>
      )}

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span
            className="pulse-dot"
            style={{ backgroundColor: health?.status === 'healthy' ? '#10b981' : '#f59e0b' }}
            title={health?.status === 'healthy' ? 'Engine: SQLite WAL (Online)' : 'Connecting to database...'}
          />
          {!isCollapsed && <span style={{ fontWeight: 500 }}>{t('sidebar.engine_db')}</span>}
        </div>
        {!isCollapsed && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {health?.status === 'healthy' ? t('sidebar.api_online') : t('sidebar.api_connecting')}
          </div>
        )}
      </div>
    </aside>
  );
};
