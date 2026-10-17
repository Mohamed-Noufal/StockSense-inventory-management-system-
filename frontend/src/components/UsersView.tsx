import React from 'react';
import { Users, ShieldCheck, UserCheck, Mail, CheckCircle2, ArrowRightLeft } from 'lucide-react';
import { User, StockMovement } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { translateUserRole } from '../i18n/translations';

interface UsersViewProps {
  users: User[];
  currentUser: User | null;
  onSelectUser: (user: User) => void;
  ledger: StockMovement[];
  onNavigateTab: (tab: any) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  currentUser,
  onSelectUser,
  ledger,
  onNavigateTab,
}) => {
  const { t, locale } = useI18n();

  // Compute role breakdown
  const storekeepers = users.filter((u) => u.role === 'STOREKEEPER').length;
  const procurementOfficers = users.filter((u) => u.role === 'PROCUREMENT_OFFICER').length;
  const managers = users.filter((u) => u.role === 'MANAGER' || u.role === 'ADMIN').length;

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'STOREKEEPER':
        return 'badge-info';
      case 'PROCUREMENT_OFFICER':
        return 'badge-purple';
      case 'MANAGER':
      case 'ADMIN':
        return 'badge-success';
      default:
        return 'badge-secondary';
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const countUserMovements = (userName: string) => {
    return ledger.filter((m) => m.actor_label && m.actor_label.toLowerCase().includes(userName.toLowerCase())).length;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">{t('users.title')}</span>
            <Users className="metric-icon" style={{ color: '#ffffff' }} />
          </div>
          <div className="metric-value">{users.length}</div>
          <div className="metric-sub">{t('users.subtitle')}</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">{t('users.storekeepers')}</span>
            <UserCheck className="metric-icon" style={{ color: '#2dd4bf' }} />
          </div>
          <div className="metric-value">{storekeepers}</div>
          <div className="metric-sub">{t('users.storekeepers_sub')}</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">{t('users.procurement')}</span>
            <ShieldCheck className="metric-icon" style={{ color: '#a855f7' }} />
          </div>
          <div className="metric-value">{procurementOfficers}</div>
          <div className="metric-sub">{t('users.procurement_sub')} ({managers} {locale === 'ar' ? 'مدراء عمليات' : 'Governance Managers'})</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">{t('users.active_shift')}</span>
            <CheckCircle2 className="metric-icon" style={{ color: '#10b981' }} />
          </div>
          <div className="metric-value" style={{ fontSize: '1.2rem', color: '#10b981' }}>
            {currentUser ? currentUser.full_name : (locale === 'ar' ? 'جلسة تجريبية افتراضية' : 'Default Session')}
          </div>
          <div className="metric-sub">{t('users.col_role')}: {translateUserRole(currentUser?.role || 'STOREKEEPER', locale)}</div>
        </div>
      </div>

      {/* Real Users Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>{t('users.directory_title')}</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {t('users.directory_desc')}
            </p>
          </div>
          <div className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck style={{ width: 13, height: 13 }} />
            <span>{t('users.audit_active')}</span>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('users.col_employee')}</th>
                <th>{t('users.col_role')}</th>
                <th>{t('users.col_email')}</th>
                <th>{t('users.col_status')}</th>
                <th>{t('users.col_movements')}</th>
                <th>{t('users.col_created')}</th>
                <th style={{ textAlign: locale === 'ar' ? 'left' : 'right' }}>{t('users.col_session')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelected = currentUser?.id === user.id;
                const movCount = countUserMovements(user.full_name);

                return (
                  <tr
                    key={user.id}
                    style={{
                      backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.05)' : undefined,
                    }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: isSelected ? '#ffffff' : '#27272a',
                            color: isSelected ? '#000000' : '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {getInitials(user.full_name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.85rem' }}>
                            {user.full_name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            ID: EMP-{user.id.toString().padStart(4, '0')}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                        {translateUserRole(user.role, locale)}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        <Mail style={{ width: 13, height: 13, color: 'var(--text-muted)' }} />
                        <span>{user.email}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
                        <span className="pulse-dot" style={{ backgroundColor: user.is_active ? '#10b981' : '#71717a' }} />
                        <span style={{ color: user.is_active ? '#34d399' : 'var(--text-muted)' }}>
                          {user.is_active ? t('users.active') : t('users.inactive')}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ffffff' }}>
                          {movCount}
                        </span>
                        {movCount > 0 && (
                          <button
                            className="overview-action-link"
                            style={{ fontSize: '0.72rem', padding: '0.1rem 0.35rem' }}
                            onClick={() => onNavigateTab('ledger')}
                            title="View movements in Movement Ledger"
                          >
                            <span>{t('users.ledger_btn')}</span>
                          </button>
                        )}
                      </div>
                    </td>

                    <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      {user.created_at
                        ? (locale === 'ar'
                            ? new Date(user.created_at).toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' })
                            : new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }))
                        : (locale === 'ar' ? 'الإعداد المبدئي' : 'Initial Setup')}
                    </td>

                    <td style={{ textAlign: locale === 'ar' ? 'left' : 'right' }}>
                      {isSelected ? (
                        <span
                          className="badge badge-success"
                          style={{
                            fontSize: '0.72rem',
                          }}
                        >
                          {t('users.logged_in')}
                        </span>
                      ) : (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.65rem', fontSize: '0.72rem' }}
                          onClick={() => onSelectUser(user)}
                        >
                          <ArrowRightLeft style={{ width: 12, height: 12 }} />
                          <span>{t('users.switch_to_user')}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
