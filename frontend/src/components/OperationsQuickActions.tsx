import React from 'react';
import { Zap, ArrowDownLeft, ArrowLeftRight, Package, ShieldCheck, ChevronRight } from 'lucide-react';

interface OperationsQuickActionsProps {
  onOpenAction: (type: 'ISSUE' | 'TRANSFER' | 'RECEIPT' | 'ADJUSTMENT') => void;
}

export const OperationsQuickActions: React.FC<OperationsQuickActionsProps> = ({ onOpenAction }) => {
  return (
    <div className="card ops-side-card">
      <div className="ops-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap style={{ width: 16, height: 16, color: '#38bdf8' }} />
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Quick Actions
          </h3>
        </div>
      </div>

      <div className="ops-quick-actions-list">
        {/* Issue */}
        <div className="ops-qa-row" onClick={() => onOpenAction('ISSUE')}>
          <div className="ops-qa-icon icon-issue">
            <ArrowDownLeft style={{ width: 15, height: 15 }} />
          </div>
          <div className="ops-qa-text">
            <div className="ops-qa-title">Issue Stock</div>
            <div className="ops-qa-subtitle">Withdraw items for projects</div>
          </div>
          <ChevronRight className="ops-qa-chevron" style={{ width: 15, height: 15 }} />
        </div>

        {/* Transfer */}
        <div className="ops-qa-row" onClick={() => onOpenAction('TRANSFER')}>
          <div className="ops-qa-icon icon-transfer">
            <ArrowLeftRight style={{ width: 15, height: 15 }} />
          </div>
          <div className="ops-qa-text">
            <div className="ops-qa-title">Transfer Stock</div>
            <div className="ops-qa-subtitle">Move between locations</div>
          </div>
          <ChevronRight className="ops-qa-chevron" style={{ width: 15, height: 15 }} />
        </div>

        {/* Receive */}
        <div className="ops-qa-row" onClick={() => onOpenAction('RECEIPT')}>
          <div className="ops-qa-icon icon-receive">
            <Package style={{ width: 15, height: 15 }} />
          </div>
          <div className="ops-qa-text">
            <div className="ops-qa-title">Receive Stock</div>
            <div className="ops-qa-subtitle">Record supplier deliveries</div>
          </div>
          <ChevronRight className="ops-qa-chevron" style={{ width: 15, height: 15 }} />
        </div>

        {/* Adjust */}
        <div className="ops-qa-row" onClick={() => onOpenAction('ADJUSTMENT')}>
          <div className="ops-qa-icon icon-adjust">
            <ShieldCheck style={{ width: 15, height: 15 }} />
          </div>
          <div className="ops-qa-text">
            <div className="ops-qa-title">Adjust Count</div>
            <div className="ops-qa-subtitle">Fix discrepancies</div>
          </div>
          <ChevronRight className="ops-qa-chevron" style={{ width: 15, height: 15 }} />
        </div>
      </div>
    </div>
  );
};
