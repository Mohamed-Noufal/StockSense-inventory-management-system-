import React from 'react';
import { History, RefreshCw } from 'lucide-react';
import { StockMovement } from '../types';

interface LedgerViewProps {
  ledger: StockMovement[];
  onRefresh: () => void;
}

export const LedgerView: React.FC<LedgerViewProps> = ({ ledger, onRefresh }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History style={{ width: 18, height: 18, color: '#38bdf8' }} />
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Audit Ledger: Append-Only Source of Truth</span>
        </div>
        <button className="btn btn-secondary" onClick={onRefresh} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
          <RefreshCw style={{ width: 12, height: 12 }} />
          Refresh Feed
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th># ID</th>
              <th>Event Timestamp</th>
              <th>Item SKU</th>
              <th>Location</th>
              <th>Movement Type</th>
              <th>Quantity Change</th>
              <th>Actor Attribution</th>
              <th>Reference / Group</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((mov) => (
              <tr key={mov.id}>
                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>#{mov.id}</td>
                <td style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                  {new Date(mov.occurred_at).toLocaleString()}
                </td>
                <td className="sku-cell">{mov.item_sku || `Item #${mov.item_id}`}</td>
                <td style={{ fontWeight: 600 }}>{mov.location_code || `Loc #${mov.location_id}`}</td>
                <td>
                  <span
                    className={`badge ${
                      mov.movement_type === 'RECEIPT' || mov.movement_type === 'TRANSFER_IN'
                        ? 'badge-receipt'
                        : mov.movement_type === 'ISSUE'
                        ? 'badge-issue'
                        : 'badge-transfer'
                    }`}
                  >
                    {mov.movement_type}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                  <span style={{ color: mov.quantity > 0 ? '#34d399' : '#f87171' }}>
                    {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{mov.actor_label}</td>
                <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {mov.transfer_group_id ? `transfer:${mov.transfer_group_id.slice(0, 8)}` : mov.reason || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
