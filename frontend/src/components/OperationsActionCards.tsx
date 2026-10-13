import React from 'react';
import { ArrowDownLeft, ArrowLeftRight, Package, ShieldCheck, ChevronRight } from 'lucide-react';

interface OperationsActionCardsProps {
  onOpenAction: (type: 'ISSUE' | 'TRANSFER' | 'RECEIPT' | 'ADJUSTMENT') => void;
}

export const OperationsActionCards: React.FC<OperationsActionCardsProps> = ({ onOpenAction }) => {
  return (
    <div className="ops-action-grid">
      {/* 1. Issue Stock */}
      <div className="ops-action-card card-issue" onClick={() => onOpenAction('ISSUE')}>
        <div className="ops-action-top">
          <div className="ops-icon-circle icon-issue">
            <ArrowDownLeft style={{ width: 18, height: 18 }} />
          </div>
          <ChevronRight className="ops-card-chevron" style={{ width: 16, height: 16 }} />
        </div>
        <div className="ops-action-content">
          <h3 className="ops-action-title">Issue Stock</h3>
          <p className="ops-action-desc">Remove items from inventory for projects or internal use.</p>
        </div>
        <button
          type="button"
          className="ops-btn ops-btn-issue"
          onClick={(e) => {
            e.stopPropagation();
            onOpenAction('ISSUE');
          }}
        >
          New Issue
        </button>
      </div>

      {/* 2. Transfer Stock */}
      <div className="ops-action-card card-transfer" onClick={() => onOpenAction('TRANSFER')}>
        <div className="ops-action-top">
          <div className="ops-icon-circle icon-transfer">
            <ArrowLeftRight style={{ width: 18, height: 18 }} />
          </div>
          <ChevronRight className="ops-card-chevron" style={{ width: 16, height: 16 }} />
        </div>
        <div className="ops-action-content">
          <h3 className="ops-action-title">Transfer Stock</h3>
          <p className="ops-action-desc">Move items between warehouses or locations.</p>
        </div>
        <button
          type="button"
          className="ops-btn ops-btn-transfer"
          onClick={(e) => {
            e.stopPropagation();
            onOpenAction('TRANSFER');
          }}
        >
          New Transfer
        </button>
      </div>

      {/* 3. Receive Stock */}
      <div className="ops-action-card card-receive" onClick={() => onOpenAction('RECEIPT')}>
        <div className="ops-action-top">
          <div className="ops-icon-circle icon-receive">
            <Package style={{ width: 18, height: 18 }} />
          </div>
          <ChevronRight className="ops-card-chevron" style={{ width: 16, height: 16 }} />
        </div>
        <div className="ops-action-content">
          <h3 className="ops-action-title">Receive Stock</h3>
          <p className="ops-action-desc">Record incoming deliveries from suppliers.</p>
        </div>
        <button
          type="button"
          className="ops-btn ops-btn-receive"
          onClick={(e) => {
            e.stopPropagation();
            onOpenAction('RECEIPT');
          }}
        >
          New Receipt
        </button>
      </div>

      {/* 4. Adjust Stock Count */}
      <div className="ops-action-card card-adjust" onClick={() => onOpenAction('ADJUSTMENT')}>
        <div className="ops-action-top">
          <div className="ops-icon-circle icon-adjust">
            <ShieldCheck style={{ width: 18, height: 18 }} />
          </div>
          <ChevronRight className="ops-card-chevron" style={{ width: 16, height: 16 }} />
        </div>
        <div className="ops-action-content">
          <h3 className="ops-action-title">Adjust Stock Count</h3>
          <p className="ops-action-desc">Fix discrepancies from cycle counts or physical checks.</p>
        </div>
        <button
          type="button"
          className="ops-btn ops-btn-adjust"
          onClick={(e) => {
            e.stopPropagation();
            onOpenAction('ADJUSTMENT');
          }}
        >
          New Adjustment
        </button>
      </div>
    </div>
  );
};
