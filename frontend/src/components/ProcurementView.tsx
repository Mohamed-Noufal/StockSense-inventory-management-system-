import React, { useState } from 'react';
import { ShoppingCart, CheckCircle, PackageCheck, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { PurchaseOrder } from '../types';

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
  const [expandedPoId, setExpandedPoId] = useState<number | null>(null);

  const filtered = orders.filter((o) => statusFilter === 'ALL' || o.status === statusFilter);

  const draftCount = orders.filter((o) => o.status === 'DRAFT').length;
  const approvedCount = orders.filter((o) => o.status === 'APPROVED' || o.status === 'PARTIALLY_RECEIVED').length;
  const receivedCount = orders.filter((o) => o.status === 'RECEIVED').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="badge badge-warning">Draft</span>;
      case 'APPROVED':
        return <span className="badge badge-info">Approved</span>;
      case 'PARTIALLY_RECEIVED':
        return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid #f59e0b' }}>Partial Inbound</span>;
      case 'RECEIVED':
        return <span className="badge badge-success">Fulfilled</span>;
      case 'CANCELLED':
        return <span className="badge badge-critical">Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Orders</span>
            <ShoppingCart className="metric-icon" style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div className="metric-value">{orders.length}</div>
          <div className="metric-sub">Active & historical PO records</div>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Drafts Pending Review</span>
            <CheckCircle className="metric-icon" style={{ color: '#fbbf24' }} />
          </div>
          <div className="metric-value">{draftCount}</div>
          <div className="metric-sub">Requires procurement sign-off</div>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Inbound Receiving</span>
            <PackageCheck className="metric-icon" style={{ color: '#60a5fa' }} />
          </div>
          <div className="metric-value">{approvedCount}</div>
          <div className="metric-sub">Awaiting warehouse dock deliveries</div>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Fully Fulfilled</span>
            <CheckCircle className="metric-icon" style={{ color: '#34d399' }} />
          </div>
          <div className="metric-value">{receivedCount}</div>
          <div className="metric-sub">100% received into stock balance</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['ALL', 'DRAFT', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              onClick={() => setStatusFilter(st)}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={onOpenCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Plus style={{ width: 16, height: 16 }} />
          <span>Draft Purchase Order</span>
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>PO Number</th>
              <th>Vendor / Supplier</th>
              <th>Status</th>
              <th>Lines</th>
              <th>Total Amount</th>
              <th>Created Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && orders.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading purchase orders...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No purchase orders match this filter.</td></tr>
            ) : (
              filtered.map((po) => {
                const isExpanded = expandedPoId === po.id;
                const canCancel = (po.status === 'DRAFT' || po.status === 'APPROVED') && po.lines.every(l => l.qty_received === 0);
                const canReceive = (po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED') && po.lines.some(l => l.remaining_quantity > 0);
                return (
                  <React.Fragment key={po.id}>
                    <tr>
                      <td>
                        <button
                          onClick={() => setExpandedPoId(isExpanded ? null : po.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                        >
                          {isExpanded ? <ChevronDown style={{ width: 16, height: 16 }} /> : <ChevronRight style={{ width: 16, height: 16 }} />}
                        </button>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{po.po_number}</td>
                      <td>{po.supplier_name || `Supplier #${po.supplier_id}`}</td>
                      <td>{getStatusBadge(po.status)}</td>
                      <td>{po.total_lines} lines</td>
                      <td style={{ fontWeight: 600 }}>${(po.total_amount_minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(po.created_at).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          {po.status === 'DRAFT' && (
                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', color: '#60a5fa' }} onClick={() => onApprove(po.id)}>
                              Approve
                            </button>
                          )}
                          {canReceive && (
                            <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }} onClick={() => onOpenReceiveModal(po)}>
                              Receive
                            </button>
                          )}
                          {canCancel && (
                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', color: '#f87171' }} onClick={() => onCancel(po.id)}>
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ background: 'rgba(255,255,255,0.015)' }}>
                        <td colSpan={8} style={{ padding: '0.75rem 1.5rem' }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            Line Items Breakdown & Inbound Delivery Progress:
                          </div>
                          <div style={{ display: 'grid', gap: '0.4rem' }}>
                            {po.lines.map((l) => (
                              <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.75rem', background: 'rgba(0,0,0,0.15)', borderRadius: '4px', fontSize: '0.78rem' }}>
                                <span><strong style={{ color: 'var(--brand-primary)' }}>{l.item_sku}</strong> — {l.item_name} @ {l.location_code}</span>
                                <span>
                                  Ordered: <strong>{l.qty_ordered}</strong> | Received: <strong style={{ color: '#34d399' }}>{l.qty_received}</strong> | Remaining: <strong style={{ color: '#fbbf24' }}>{l.remaining_quantity}</strong>
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
