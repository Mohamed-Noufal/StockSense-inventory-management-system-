import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, Bell,
  PanelLeft,
  CheckCircle2, AlertTriangle, ShieldCheck, Scan, Globe
} from 'lucide-react';
import { IntegrityCheckResponse, User, WorkspaceInfo } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface HeaderProps {
  activeTab: string;
  integrity: IntegrityCheckResponse | null;
  loading: boolean;
  onRefresh: () => void;
  onRunAudit: () => void;
  onOpenModal: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  users?: User[];
  currentUser?: User | null;
  onSelectUser?: (user: User) => void;
  onNavigateTab?: (tab: any) => void;
  onOpenScanner?: () => void;
  onLogout?: () => void;
  workspaceInfo?: WorkspaceInfo | null;
  onOpenWorkspace?: () => void;
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
  onOpenScanner,
  workspaceInfo,
}) => {
  const { t, locale, toggleLocale } = useI18n();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close notifications menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabLabels: Record<string, string> = {
    overview: t('nav.overview'),
    inventory: t('nav.inventory'),
    operations: t('nav.operations'),
    ledger: t('nav.operations'),
    procurement: t('nav.procurement'),
    ai: t('nav.ai'),
    activity: t('nav.activity'),
    users: t('nav.users'),
  };

  const notifications = locale === 'ar' ? [
    {
      id: 1,
      title: 'تم استلام أمر الشراء #PO-1042',
      desc: 'تم استلام وفحص 10 وحدات من مضخة هيدروليكية بالمستودع المركزي',
      time: 'منذ ساعتين',
      icon: CheckCircle2,
      color: '#10b981',
    },
    {
      id: 2,
      title: 'تنبيه انخفاض رصيد المخزون',
      desc: 'انخفض رصيد صمام ضغط (PV-042) إلى 5 وحدات (حد الطلب: 15)',
      time: 'منذ 3 ساعات',
      icon: AlertTriangle,
      color: '#f59e0b',
    },
    {
      id: 3,
      title: 'اجتياز تدقيق ومطابقة السجل',
      desc: 'تم التحقق من تطابق حركات المخزون مع الأرصدة الحالية بنسبة 100%',
      time: 'منذ 5 ساعات',
      icon: ShieldCheck,
      color: '#10b981',
    },
  ] : [
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
      {/* Left: Sidebar Toggle (when collapsed) + Clean Vercel Breadcrumbs */}
      <div className="header-left-group">
        {isCollapsed && (
          <button
            className="header-icon-btn"
            onClick={onToggleCollapse}
            title="Expand sidebar (Ctrl+B)"
            aria-label="Expand sidebar"
          >
            <PanelLeft style={{ width: 16, height: 16 }} />
          </button>
        )}

        <nav className="header-breadcrumbs" aria-label="Breadcrumb">
          <span className="breadcrumb-org">{workspaceInfo?.company_name || 'StockSense'}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-active">{tabLabels[activeTab] || 'Overview'}</span>
        </nav>
      </div>

      {/* Right: Primary Action + Notifications + Language Switcher + User Profile */}
      <div className="header-actions">

        {/* Language Switcher */}
        <button
          className="lang-toggle-btn"
          onClick={toggleLocale}
          title={locale === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
        >
          <Globe style={{ width: 14, height: 14, color: '#10b981' }} />
          <span>{t('header.language')}</span>
        </button>

        {onOpenScanner && (
          <button
            className="btn btn-secondary"
            onClick={onOpenScanner}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Scan Barcode (F2)"
          >
            <Scan style={{ width: 14, height: 14 }} />
            <span>{t('header.scan_sku')}</span>
          </button>
        )}
        <button className="btn btn-primary" onClick={onOpenModal}>
          <Plus style={{ width: 14, height: 14 }} />
          <span>{t('header.new_tx')}</span>
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
                <span>{locale === 'ar' ? 'تنبيهات العمليات' : 'Operational Alerts'}</span>
                <span className="popover-badge">{locale === 'ar' ? '3 جديدة' : '3 New'}</span>
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
      </div>
    </header>
  );
};
