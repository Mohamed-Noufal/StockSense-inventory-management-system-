import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck, RefreshCw, Plus, Search, Bell,
  ChevronDown, PanelLeft, PanelLeftClose,
  CheckCircle2, AlertTriangle, Users
} from 'lucide-react';
import { IntegrityCheckResponse, User } from '../types';

interface HeaderProps {
  activeTab: string;
  integrity: IntegrityCheckResponse | null;
  loading: boolean;
  onRefresh: () => void;
  onRunAudit: () => void;
  onOpenModal: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  users: User[];
  currentUser: User | null;
  onSelectUser: (user: User) => void;
  onNavigateTab: (tab: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  integrity,
  loading,
  onRefresh,
  onRunAudit,
  onOpenModal,
  isCollapsed,
  onToggleCollapse,
  users,
  currentUser,
  onSelectUser,
  onNavigateTab,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const titles: Record<string, string> = {
    overview: 'Executive Overview & Operational Metrics',
    inventory: 'Master Inventory & Running Balances',
    ledger: 'Append-Only Stock Ledger Audit Trail',
    procurement: 'Procurement & Purchase Order Lifecycle',
    ai: 'AI Intermittent Replenishment & Decision Queue',
    users: 'Employee Directory & Audit Roles',
    sprint: 'Sprint Milestone Delivery Roadmap',
    diagnostics: 'System Health & Storage Diagnostics',
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const notifications = [
    {
      id: 1,
      title: 'PO #PO-1042 Received',
      desc: '10 units Hydraulic Pump verified into Central Warehouse',
      time: '2h ago',
      icon: CheckCircle2,
      color: '#10b981',
    },
    {
      id: 2,
      title: 'Low Stock Alert',
      desc: 'Pressure Valve (PV-042) dropped to 5 units (threshold: 15)',
      time: '3h ago',
      icon: AlertTriangle,
      color: '#f59e0b',
    },
    {
      id: 3,
      title: 'Ledger Audit Passed',
      desc: 'Zero mismatch verified between movements & running balances',
      time: '5h ago',
      icon: ShieldCheck,
      color: '#38bdf8',
    },
  ];

  return (
    <header className="top-header">
      {/* Left: Sidebar Toggle + Title / Search */}
      <div className="header-left-group">
        <button
          className="header-icon-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeft style={{ width: 18, height: 18 }} />
          ) : (
            <PanelLeftClose style={{ width: 18, height: 18 }} />
          )}
        </button>

        <div className="header-title-container">
          <h2>{titles[activeTab] || 'StockSense Platform'}</h2>
          <div className="header-breadcrumbs">
            <span>StockSense</span> / <span className="current">{activeTab.toUpperCase()}</span>
          </div>
        </div>

        {/* Global Search Input Bar */}
        <div className="header-search-bar">
          <Search style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search items, SKUs, suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="header-search-input"
          />
          <span className="search-shortcut-badge">/</span>
        </div>
      </div>

      {/* Right: Actions, Invariant Badge, Notifications, User Pill */}
      <div className="header-actions">
        {integrity && (
          <div
            className="badge"
            style={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.72rem',
              color: integrity.mismatches_count === 0 ? '#34d399' : '#f87171',
              backgroundColor: integrity.mismatches_count === 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              borderColor: integrity.mismatches_count === 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
            }}
          >
            <ShieldCheck style={{ width: 14, height: 14 }} />
            <span>Invariant: {integrity.mismatches_count === 0 ? '0 Mismatches' : 'Audit Failure!'}</span>
          </div>
        )}

        <button className="btn btn-secondary" onClick={onRefresh} disabled={loading} title="Synchronize state">
          <RefreshCw style={{ width: 13, height: 13 }} className={loading ? 'animate-spin' : ''} />
          <span>Sync</span>
        </button>

        <button className="btn btn-secondary" onClick={onRunAudit} title="Reconcile ledger against running balances">
          <ShieldCheck style={{ width: 13, height: 13 }} />
          <span>Audit</span>
        </button>

        <button className="btn btn-primary" onClick={onOpenModal}>
          <Plus style={{ width: 14, height: 14 }} />
          <span>Record Movement</span>
        </button>

        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }} ref={notifMenuRef}>
          <button
            className="header-icon-btn notif-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="System notifications & audit alerts"
          >
            <Bell style={{ width: 16, height: 16 }} />
            <span className="notif-badge-dot" />
          </button>

          {showNotifications && (
            <div className="header-popover-menu notif-popover">
              <div className="popover-header">
                <span>Operational Alerts</span>
                <span className="popover-badge">3 New</span>
              </div>
              <div className="notif-list">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div key={n.id} className="notif-item">
                      <div className="notif-icon-bubble" style={{ color: n.color }}>
                        <Icon style={{ width: 14, height: 14 }} />
                      </div>
                      <div className="notif-body">
                        <div className="notif-item-title">{n.title}</div>
                        <div className="notif-item-desc">{n.desc}</div>
                        <div className="notif-item-time">{n.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Active Employee Profile Pill & Switcher */}
        <div style={{ position: 'relative' }} ref={userMenuRef}>
          <button
            className="user-profile-pill"
            onClick={() => setShowUserMenu(!showUserMenu)}
            title="Active employee identity for ledger auditing"
          >
            <div className="user-avatar-circle">
              {currentUser ? getInitials(currentUser.full_name) : 'JD'}
            </div>
            <div className="user-pill-text">
              <span className="user-pill-name">{currentUser ? currentUser.full_name : 'John Doe'}</span>
              <span className="user-pill-role">
                {currentUser ? currentUser.role.replace('_', ' ').toLowerCase() : 'storekeeper'}
              </span>
            </div>
            <ChevronDown style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
          </button>

          {showUserMenu && (
            <div className="header-popover-menu user-popover">
              <div className="popover-header user-card-header">
                <div className="user-avatar-circle large">
                  {currentUser ? getInitials(currentUser.full_name) : 'JD'}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="user-card-name">{currentUser?.full_name || 'John Doe'}</div>
                  <div className="user-card-email">{currentUser?.email || 'john.doe@stocksense.oilfield'}</div>
                  <span className="badge badge-info" style={{ marginTop: '0.35rem', display: 'inline-block', fontSize: '0.68rem' }}>
                    {currentUser?.role || 'STOREKEEPER'}
                  </span>
                </div>
              </div>

              <div className="user-switcher-section">
                <div className="user-switcher-label">
                  <span>Switch Employee (Audit Actor)</span>
                </div>
                <div className="user-switcher-list">
                  {users.map((u) => {
                    const isSelected = currentUser?.id === u.id;
                    return (
                      <button
                        key={u.id}
                        className={`user-switcher-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          onSelectUser(u);
                          setShowUserMenu(false);
                        }}
                      >
                        <div className="user-avatar-circle small">
                          {getInitials(u.full_name)}
                        </div>
                        <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                          <div className="user-switch-name">{u.full_name}</div>
                          <div className="user-switch-role">{u.role}</div>
                        </div>
                        {isSelected && <span style={{ color: '#38bdf8', fontSize: '0.75rem' }}>✓ Active</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="user-popover-footer">
                <button
                  className="popover-footer-link"
                  onClick={() => {
                    onNavigateTab('users');
                    setShowUserMenu(false);
                  }}
                >
                  <Users style={{ width: 14, height: 14 }} />
                  <span>Open Team Directory & Audit Roles</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
