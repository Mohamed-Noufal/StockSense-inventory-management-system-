import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, Box, ArrowLeftRight, ShoppingBag, Sparkles,
  Users, PanelLeftClose, Activity, Settings, ChevronDown, LogOut
} from 'lucide-react';
import { HealthResponse, User } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { translateUserRole } from '../i18n/translations';

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
  onOpenSettings?: () => void;
  currentUser?: User | null;
  users?: User[];
  onSelectUser?: (user: User) => void;
  onLogout?: () => void;
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
  health: _health,
  isCollapsed,
  onToggleCollapse,
  onOpenSettings,
  currentUser,
  users = [],
  onSelectUser,
  onLogout,
}) => {
  const { t, locale } = useI18n();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'AF';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

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

      {/* Main Navigation Menu */}
      <nav className="nav-menu">
        <button
          className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          title={t('nav.overview')}
        >
          <LayoutDashboard className="nav-icon" />
          {!isCollapsed && <span>{t('nav.overview')}</span>}
        </button>

        <button
          className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
          title={t('nav.inventory')}
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
          title={t('nav.operations')}
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
          title={t('nav.procurement')}
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
          title={t('nav.ai')}
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
          title={t('nav.activity')}
        >
          <Activity className="nav-icon" />
          {!isCollapsed && <span>{t('nav.activity')}</span>}
          {activityCount !== undefined && activityCount > 0 && !isCollapsed && (
            <span className="nav-badge" style={{ background: '#f59e0b', color: '#000000' }}>{activityCount}</span>
          )}
        </button>

        {/* Management & Roles tab */}
        {!isCollapsed && <div className="nav-section-label" style={{ marginTop: '0.85rem' }}>{t('sidebar.mgmt_health')}</div>}

        <button
          className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
          title={t('nav.users')}
        >
          <Users className="nav-icon" />
          {!isCollapsed && <span>{t('nav.users')}</span>}
          {usersCount > 0 && !isCollapsed && (
            <span className="nav-badge">{usersCount}</span>
          )}
        </button>
      </nav>

      {/* -------------------------------------------------------------
          Sidebar Bottom Section:
          1. Role / User Switcher Button (ON TOP OF Settings)
          2. Settings Button (AT THE VERY END)
          ------------------------------------------------------------- */}
      <div className="sidebar-bottom-section" ref={userMenuRef}>
        {/* User / Role Switcher Popover (opens upward above the role button) */}
        {showUserMenu && onSelectUser && (
          <div className="sidebar-user-popover">
            <div className="popover-header user-card-header">
              <div className="user-avatar-circle large">
                {currentUser ? getInitials(currentUser.full_name) : 'AF'}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="user-card-name">{currentUser?.full_name || 'Ahmed Fawzy'}</div>
                <div className="user-card-email">{currentUser?.email || 'ahmed.fawzy@stocksense.oilfield'}</div>
                <span className="badge badge-info" style={{ marginTop: '0.35rem', display: 'inline-block', fontSize: '0.68rem' }}>
                  {translateUserRole(currentUser?.role || 'STOREKEEPER', locale)}
                </span>
              </div>
            </div>

            <div className="user-switcher-section">
              <div className="user-switcher-label">
                <span>{t('header.switch_employee')}</span>
              </div>
              <div className="user-switcher-list">
                {users.map((u) => {
                  const isSelected = currentUser?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      className={`user-switcher-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        onSelectUser(u);
                        setShowUserMenu(false);
                      }}
                    >
                      <div className="user-avatar-circle small">
                        {getInitials(u.full_name)}
                      </div>
                      <div style={{ textAlign: locale === 'ar' ? 'right' : 'left', flex: 1, minWidth: 0 }}>
                        <div className="user-switch-name">{u.full_name}</div>
                        <div className="user-switch-role">{translateUserRole(u.role, locale)}</div>
                      </div>
                      {isSelected && <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 500 }}>✓ {t('header.active')}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="user-popover-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <button
                type="button"
                className="popover-footer-link"
                onClick={() => {
                  setActiveTab('users');
                  setShowUserMenu(false);
                }}
              >
                <Users style={{ width: 14, height: 14 }} />
                <span>{t('header.team_directory')}</span>
              </button>
              {onLogout && (
                <button
                  type="button"
                  className="popover-footer-link"
                  style={{ color: '#ef4444', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', marginTop: '0.25rem' }}
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                >
                  <LogOut style={{ width: 14, height: 14 }} />
                  <span>{t('header.sign_out')}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 1. Active Role / User Button (directly on top of Settings) */}
        {currentUser && (
          <button
            type="button"
            className={`sidebar-user-pill ${showUserMenu ? 'active' : ''}`}
            onClick={() => setShowUserMenu(!showUserMenu)}
            title={currentUser.full_name}
          >
            <div className="user-avatar-circle">
              {getInitials(currentUser.full_name)}
            </div>
            {!isCollapsed && (
              <div className="sidebar-user-text">
                <span className="sidebar-user-name">{currentUser.full_name}</span>
                <span className="sidebar-user-role">
                  {translateUserRole(currentUser.role, locale)}
                </span>
              </div>
            )}
            {!isCollapsed && (
              <ChevronDown
                style={{
                  width: 14,
                  height: 14,
                  color: 'var(--text-muted)',
                  marginLeft: locale === 'ar' ? 0 : 'auto',
                  marginRight: locale === 'ar' ? 'auto' : 0,
                  transform: showUserMenu ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease',
                }}
              />
            )}
          </button>
        )}

        {/* 2. Settings Button (At the very end of the sidebar) */}
        {onOpenSettings && (
          <button
            type="button"
            className="nav-item sidebar-settings-item"
            onClick={onOpenSettings}
            title={t('nav.settings') || 'Settings'}
          >
            <Settings className="nav-icon" />
            {!isCollapsed && <span>{t('nav.settings') || 'Settings'}</span>}
          </button>
        )}
      </div>
    </aside>
  );
};
