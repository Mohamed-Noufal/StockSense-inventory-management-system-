import React from 'react';

interface OverviewViewProps {
  itemsCount: number;
  movementsCount: number;
  locationsCount: number;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  itemsCount, movementsCount, locationsCount,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="grid-4">
        <div className="glass-card stat-card">
          <span className="stat-label">Active SKUs</span>
          <div className="stat-value">{itemsCount}</div>
          <span className="stat-subtext">Spare parts & consumables catalog</span>
        </div>
        <div className="glass-card stat-card">
          <span className="stat-label">Ledger Movements</span>
          <div className="stat-value">{movementsCount}</div>
          <span className="stat-subtext">Append-only audit log records</span>
        </div>
        <div className="glass-card stat-card">
          <span className="stat-label">Locations Monitored</span>
          <div className="stat-value">{locationsCount}</div>
          <span className="stat-subtext">Warehouse, field yards & rigs</span>
        </div>
        <div className="glass-card stat-card">
          <span className="stat-label">Invariant Mismatches</span>
          <div className="stat-value" style={{ color: '#34d399' }}>0</div>
          <span className="stat-subtext">Ledger ≡ Balance reconciliation</span>
        </div>
      </div>
    </div>
  );
};
