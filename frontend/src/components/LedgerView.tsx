import React, { useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { StockMovement } from '../types';

interface LedgerViewProps {
  ledger: StockMovement[];
  onRefresh: () => void;
}

export const LedgerView: React.FC<LedgerViewProps> = ({ ledger, onRefresh }) => {
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filtered = ledger.filter((m) => {
    if (typeFilter === 'ALL') return true;
    if (typeFilter === 'TRANSFER') return m.movement_type.startsWith('TRANSFER');
    return m.movement_type === typeFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History style={{ width: 16, height: 16, color: '#ffffff' }} />
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Audit Ledger: Append-Only Immutable Records</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {['ALL', 'RECEIPT', 'ISSUE', 'TRANSFER'].map((t) => (
              <button
                key={t}
                className={`btn ${typeFilter === t ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                onClick={() => setTypeFilter(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <button className="btn btn-secondary" onClick={onRefresh} style={{ padding: '0.25rem 0.65rem', fontSize: '0.72rem' }}>
            <RefreshCw style={{ width: 12, height: 12 }} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Entry ID</th>
              <th>Occurred At</th>
              <th>Part SKU</th>
              <th>Location</th>
              <th>Type</th>
              <th style={{ textAlign: 'right' }}>Quantity Delta</th>
              <th>Recorded By</th>
              <th>Reference / Audit Note</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No movement records found for this filter.
                </td>
              </tr>
            ) : (
              filtered.map((mov) => (
                <tr key={mov.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    #{mov.id}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(mov.occurred_at).toLocaleString()}
                  </td>
                  <td>
                    <span className="sku-cell">{mov.item_sku || `Item #${mov.item_id}`}</span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{mov.location_code || `Loc #${mov.location_id}`}</td>
                  <td>
                    <span
                      className={`badge ${
                        mov.movement_type === 'RECEIPT' || mov.movement_type === 'TRANSFER_IN'
                          ? 'badge-receipt'
                          : mov.movement_type === 'ISSUE' || mov.movement_type === 'TRANSFER_OUT'
                          ? 'badge-issue'
                          : 'badge-transfer'
                      }`}
                    >
                      {mov.movement_type}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    <span style={{ color: mov.quantity > 0 ? '#34d399' : '#f87171' }}>
                      {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{mov.actor_label}</td>
                  <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {mov.transfer_group_id ? `xfer:${mov.transfer_group_id.slice(0, 8)}` : mov.reason || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
