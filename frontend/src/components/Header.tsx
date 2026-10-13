import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, Bell,
  ChevronDown, PanelLeft, PanelLeftClose,
  CheckCircle2, AlertTriangle, Users, ShieldCheck
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
  integrity: _integrity,
  loading: _loading,
  onRefresh: _onRefresh,
  onRunAudit: _onRunAudit,
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

  const tabLabels: Record<string, string> = {
    overview: 'Overview',
    inventory: 'Inventory',
    operations: 'Operations',
    ledger: 'Operations',
    procurement: 'Procurement',
    ai: 'AI & Replenishment',
    users: 'Users & Roles',
    sprint: 'Roadmap',
    diagnostics: 'Diagnostics',
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
      color: '#10b981',
    },
  ];

  return (
    <header className="top-header">
      {/* Left: Sidebar Toggle + Clean Vercel Breadcrumbs + Search */}
      <div className="header-left-group">
        <button
          className="header-icon-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeft style={{ width: 16, height: 16 }} />
          ) : (
            <PanelLeftClose style={{ width: 16, height: 16 }} />
          )}
        </button>

        <nav className="header-breadcrumbs" aria-label="Breadcrumb">
          <span className="breadcrumb-org">StockSense</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-active">{tabLabels[activeTab] || 'Overview'}</span>
        </nav>
      </div>

      {/* Right: Primary Action + Notifications + User Profile */}
      <div className="header-actions">
        <button className="btn btn-primary" onClick={onOpenModal}>
          <Plus style={{ width: 14, height: 14 }} />
          <span>Record Movement</span>
        </button>

        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }} ref={notifMenuRef}>
          <button
            className="header-icon-btn notif-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <Bell style={{ width: 15, height: 15 }} />
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
              {currentUser ? getInitials(currentUser.full_name) : 'AF'}
            </div>
            <div className="user-pill-text">
              <span className="user-pill-name">{currentUser ? currentUser.full_name : 'Ahmed Fawzy'}</span>
              <span className="user-pill-role">
                {currentUser ? currentUser.role.replace('_', ' ').toLowerCase() : 'storekeeper'}
              </span>
            </div>
            <ChevronDown style={{ width: 13, height: 13, color: 'var(--text-muted)' }} />
          </button>

          {showUserMenu && (
            <div className="header-popover-menu user-popover">
              <div className="popover-header user-card-header">
                <div className="user-avatar-circle large">
                  {currentUser ? getInitials(currentUser.full_name) : 'AF'}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="user-card-name">{currentUser?.full_name || 'Ahmed Fawzy'}</div>
                  <div className="user-card-email">{currentUser?.email || 'ahmed.fawzy@stocksense.oilfield'}</div>
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
                        {isSelected && <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 500 }}>✓ Active</span>}
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
