import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { PurchaseOrder } from '../types';
import { ProcurementMetrics } from './ProcurementMetrics';
import { ProcurementRow } from './ProcurementRow';

interface ProcurementViewProps {
  orders: PurchaseOrder[];
  onOpenCreateModal: () => void;
  onOpenReceiveModal: (po: PurchaseOrder) => void;
  onApprove: (poId: number) => Promise<void>;
  onCancel: (poId: number) => Promise<void>;
  loading: boolean;
}

export const ProcurementView: React.FC<ProcurementViewProps> = ({
  orders, onOpenCreateModal, onOpenReceiveModal, onApprove, onCancel, loading,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = orders.filter((o) => statusFilter === 'ALL' || o.status === statusFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <ProcurementMetrics orders={orders} />

      <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {['ALL', 'DRAFT', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
              onClick={() => setStatusFilter(st)}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <button className="btn btn-primary" onClick={onOpenCreateModal}>
          <Plus style={{ width: 14, height: 14 }} />
          <span>New Purchase Order</span>
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>PO Number</th>
              <th>Supplier Partner</th>
              <th>Status</th>
              <th>Total Lines</th>
              <th style={{ textAlign: 'right' }}>Total Value</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && orders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  Loading purchase orders...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No purchase orders found matching this filter.
                </td>
              </tr>
            ) : (
              filtered.map((po) => (
                <ProcurementRow
                  key={po.id}
                  order={po}
                  onOpenReceiveModal={onOpenReceiveModal}
                  onApprove={onApprove}
                  onCancel={onCancel}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
