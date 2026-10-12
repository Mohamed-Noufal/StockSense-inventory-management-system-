import React, { useState } from 'react';
import { PackageCheck, X } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderLine, POReceivePayload } from '../types';

interface POReceiveModalProps {
  po: PurchaseOrder;
  onClose: () => void;
  onSubmit: (poId: number, payload: POReceivePayload) => Promise<void>;
}

export const POReceiveModal: React.FC<POReceiveModalProps> = ({
  po, onClose, onSubmit,
}) => {
  const openLines = po.lines.filter((l) => l.remaining_quantity > 0);
  const [selectedLineId, setSelectedLineId] = useState<number>(openLines[0]?.id || 0);
  const activeLine: PurchaseOrderLine | undefined = po.lines.find((l) => l.id === selectedLineId);
  const [receiveQty, setReceiveQty] = useState<number>(activeLine?.remaining_quantity || 1);
  const [actorLabel, setActorLabel] = useState('Central Receiving');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLineChange = (lineId: number) => {
    setSelectedLineId(lineId);
    const line = po.lines.find((l) => l.id === lineId);
    if (line) setReceiveQty(line.remaining_quantity);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLineId || receiveQty <= 0) return;
    if (activeLine && receiveQty > activeLine.remaining_quantity) {
      setError(`Cannot receive more than remaining quantity (${activeLine.remaining_quantity} units)`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(po.id, {
        po_line_id: selectedLineId,
        quantity_received: receiveQty,
        actor_label: actorLabel,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record receipt');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <PackageCheck style={{ width: 20, height: 20, color: '#34d399' }} />
            <span>Receive Goods: {po.po_number}</span>
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '6px', color: '#fca5a5', fontSize: '0.8rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Select PO Line to Receive</label>
            <select className="form-select" value={selectedLineId} onChange={(e) => handleLineChange(Number(e.target.value))}>
              {openLines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.item_sku} — Ordered: {l.qty_ordered}, Received: {l.qty_received}, Remaining: {l.remaining_quantity}
                </option>
              ))}
            </select>
          </div>

          {activeLine && (
            <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', marginBottom: '1rem', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Item Name:</span>
                <span style={{ fontWeight: 600 }}>{activeLine.item_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Destination Warehouse:</span>
                <span style={{ fontWeight: 600 }}>{activeLine.location_code}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pending Delivery:</span>
                <span style={{ color: '#34d399', fontWeight: 700 }}>{activeLine.remaining_quantity} units</span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Delivery Quantity to Receive</label>
            <input
              type="number"
              className="form-input"
              min="1"
              max={activeLine?.remaining_quantity || 1}
              value={receiveQty}
              onChange={(e) => setReceiveQty(parseInt(e.target.value) || 0)}
              required
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Over-receipt is blocked by ledger invariant check. Max: {activeLine?.remaining_quantity || 0}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Receiving Inspector / Storekeeper</label>
            <input className="form-input" value={actorLabel} onChange={(e) => setActorLabel(e.target.value)} required />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting || openLines.length === 0}>
              {submitting ? 'Recording Receipt...' : 'Confirm Goods Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
