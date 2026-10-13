import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, PackageCheck, Ban } from 'lucide-react';
import { PurchaseOrder } from '../types';

interface ProcurementRowProps {
  order: PurchaseOrder;
  onOpenReceiveModal: (po: PurchaseOrder) => void;
  onApprove: (poId: number) => Promise<void>;
  onCancel: (poId: number) => Promise<void>;
}

export const ProcurementRow: React.FC<ProcurementRowProps> = ({
  order: po, onOpenReceiveModal, onApprove, onCancel,
}) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <span className="badge badge-warning">Draft</span>;
      case 'APPROVED': return <span className="badge badge-info">Approved</span>;
      case 'PARTIALLY_RECEIVED': return <span className="badge" style={{ color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.3)' }}>Partial</span>;
      case 'RECEIVED': return <span className="badge badge-success">Fulfilled</span>;
      case 'CANCELLED': return <span className="badge badge-critical">Cancelled</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <>
      <tr>
        <td>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.2rem 0.4rem', border: 'none', background: 'transparent' }}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronDown style={{ width: 14, height: 14 }} /> : <ChevronRight style={{ width: 14, height: 14 }} />}
          </button>
        </td>
        <td>
          <span className="sku-cell">{po.po_number}</span>
          {po.source_recommendation_id && (
            <span style={{ marginLeft: '0.35rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>AI Rec #{po.source_recommendation_id}</span>
          )}
        </td>
        <td style={{ fontWeight: 500, color: '#f4f4f5' }}>{po.supplier_name || `Supplier #${po.supplier_id}`}</td>
        <td>{getStatusBadge(po.status)}</td>
        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{po.lines.length} items</td>
        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textAlign: 'right' }}>
          ${(po.total_amount_minor / 100).toFixed(2)}
        </td>
        <td style={{ textAlign: 'right' }}>
          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
            {po.status === 'DRAFT' && (
              <button
                className="btn btn-primary"
                style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                onClick={() => onApprove(po.id)}
              >
                <CheckCircle style={{ width: 12, height: 12 }} /> Approve
              </button>
            )}
            {(po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED') && (
              <button
                className="btn btn-primary"
                style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                onClick={() => onOpenReceiveModal(po)}
              >
                <PackageCheck style={{ width: 12, height: 12 }} /> Receive
              </button>
            )}
            {po.status === 'DRAFT' && (
              <button
                className="btn btn-danger"
                style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                onClick={() => onCancel(po.id)}
              >
                <Ban style={{ width: 12, height: 12 }} /> Cancel
              </button>
            )}
          </div>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={7} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#050507' }}>
            <table className="table" style={{ fontSize: '0.78rem' }}>
              <thead>
                <tr>
                  <th>Line SKU</th>
                  <th>Description</th>
                  <th>Destination</th>
                  <th style={{ textAlign: 'right' }}>Ordered</th>
                  <th style={{ textAlign: 'right' }}>Received</th>
                  <th style={{ textAlign: 'right' }}>Unit Cost</th>
                </tr>
              </thead>
              <tbody>
                {po.lines.map((line) => (
                  <tr key={line.id}>
                    <td><span className="sku-cell">{line.item_sku || `Item #${line.item_id}`}</span></td>
                    <td>{line.item_name || '—'}</td>
                    <td>{line.location_code || 'Central'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{line.qty_ordered}</td>
                    <td style={{ textAlign: 'right', color: line.qty_received >= line.qty_ordered ? '#34d399' : '#fbbf24' }}>
                      {line.qty_received}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      ${(line.unit_price_minor / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
};
