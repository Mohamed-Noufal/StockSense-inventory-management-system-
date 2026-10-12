import React from 'react';
import { ShieldCheck, RefreshCw, Plus } from 'lucide-react';
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
    inventory: 'Master Inventory & Running Balances',
    ledger: 'Append-Only Stock Ledger Audit Trail',
    procurement: 'Procurement & Purchase Order Lifecycle',
    ai: 'AI Intermittent Replenishment & Decision Queue',
    overview: 'Executive Overview & Operational Metrics',
    sprint: 'Sprint Milestone Delivery Roadmap',
    diagnostics: 'System Health & Storage Diagnostics',
  };

  return (
    <header className="top-header">
      <div className="header-title-container">
        <h2>{titles[activeTab] || 'StockSense Platform'}</h2>
        <div className="header-breadcrumbs">
          <span>StockSense</span> / <span className="current">{activeTab.toUpperCase()}</span>
        </div>
      </div>

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
      </div>
    </header>
  );
};
