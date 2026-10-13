import React from 'react';
import { Users, ShieldCheck, UserCheck, Mail, CheckCircle2, ArrowRightLeft } from 'lucide-react';
import { User, StockMovement } from '../types';

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
            <span className="metric-title">Active Personnel</span>
            <Users className="metric-icon" style={{ color: '#ffffff' }} />
          </div>
          <div className="metric-value">{users.length}</div>
          <div className="metric-sub">Authenticated personnel in SQLite database</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Storekeepers (Yard & Base)</span>
            <UserCheck className="metric-icon" style={{ color: '#2dd4bf' }} />
          </div>
          <div className="metric-value">{storekeepers}</div>
          <div className="metric-sub">Custodians authorized for receipts & issues</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Procurement Officers</span>
            <ShieldCheck className="metric-icon" style={{ color: '#a855f7' }} />
          </div>
          <div className="metric-value">{procurementOfficers}</div>
          <div className="metric-sub">Requisition approvers ({managers} Governance Managers)</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Active Operating Shift</span>
            <CheckCircle2 className="metric-icon" style={{ color: '#10b981' }} />
          </div>
          <div className="metric-value" style={{ fontSize: '1.2rem', color: '#10b981' }}>
            {currentUser ? currentUser.full_name : 'Default Session'}
          </div>
          <div className="metric-sub">Role: {currentUser?.role || 'STOREKEEPER'}</div>
        </div>
      </div>

      {/* Real Users Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>Employee Directory & Operational Roles</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Real database identities linked to every ledger movement, transfer, and procurement decision.
            </p>
          </div>
          <div className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck style={{ width: 13, height: 13 }} />
            <span>Audit Trail Non-Repudiation Active</span>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Assigned Role</th>
                <th>Work Email</th>
                <th>Status</th>
                <th>Audit Movements Logged</th>
                <th>Account Created</th>
                <th style={{ textAlign: 'right' }}>Active Session</th>
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
                        {user.role}
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
                          {user.is_active ? 'Active' : 'Inactive'}
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
                            <span>Ledger</span>
                          </button>
                        )}
                      </div>
                    </td>

                    <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Initial Setup'}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      {isSelected ? (
                        <span
                          className="badge badge-success"
                          style={{
                            fontSize: '0.72rem',
                          }}
                        >
                          ✓ Logged In
                        </span>
                      ) : (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.65rem', fontSize: '0.72rem' }}
                          onClick={() => onSelectUser(user)}
                        >
                          <ArrowRightLeft style={{ width: 12, height: 12 }} />
                          <span>Switch to User</span>
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
