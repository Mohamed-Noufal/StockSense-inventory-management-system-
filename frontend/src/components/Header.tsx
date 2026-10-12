import React from 'react';
import { ShieldCheck, RefreshCw, PlusCircle } from 'lucide-react';
import { IntegrityCheckResponse } from '../types';

interface HeaderProps {
  activeTab: string;
  integrity: IntegrityCheckResponse | null;
  loading: boolean;
  onRefresh: () => void;
  onRunAudit: () => void;
  onOpenModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab, integrity, loading, onRefresh, onRunAudit, onOpenModal,
}) => {
  const titles: Record<string, string> = {
    inventory: 'Master Inventory & Balance Cache',
    ledger: 'Append-Only Stock Ledger Audit Trail',
    overview: 'Executive Overview & KPI Dashboard',
    sprint: 'Sprint Milestone Delivery Tracker',
    diagnostics: 'System Health & Table Diagnostics',
  };

  return (
    <header className="top-header">
      <div className="header-title-container">
        <h2>{titles[activeTab] || 'StockSense Dashboard'}</h2>
        <div className="header-breadcrumbs">
          <span>StockSense</span> / <span className="current">{activeTab.toUpperCase()}</span>
        </div>
      </div>

      <div className="header-actions">
        {integrity && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 0.8rem',
              background: integrity.mismatches_count === 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${integrity.mismatches_count === 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: 'var(--radius-md)', fontSize: '0.75rem', fontWeight: 600,
              color: integrity.mismatches_count === 0 ? '#34d399' : '#f87171',
            }}
          >
            <ShieldCheck style={{ width: 14, height: 14 }} />
            <span>Ledger Invariant: {integrity.mismatches_count === 0 ? '0 Mismatches (Verified)' : 'Corrupted!'}</span>
          </div>
        )}

        <button className="btn btn-secondary" onClick={onRefresh} disabled={loading} title="Sync data feed">
          <RefreshCw style={{ width: 14, height: 14 }} />
          {loading ? 'Syncing...' : 'Sync'}
        </button>

        <button className="btn btn-secondary" onClick={onRunAudit} title="Audit ledger vs balances">
          <ShieldCheck style={{ width: 14, height: 14 }} />
          Audit Invariants
        </button>

        <button className="btn btn-primary" onClick={onOpenModal}>
          <PlusCircle style={{ width: 14, height: 14 }} />
          Execute Movement
        </button>
      </div>
    </header>
  );
};
