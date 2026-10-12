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
  const [actorLabel, setActorLabel] = useState('Dock Inspector');
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
      setError(`Cannot receive more than remaining ordered balance (${activeLine.remaining_quantity} units)`);
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
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PackageCheck style={{ width: 18, height: 18, color: '#34d399' }} />
            <h3>Receive Inbound Goods — {po.po_number}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {error && (
          <div style={{ margin: '1rem 1.5rem 0', padding: '0.65rem 0.85rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Purchase Order Line Item</label>
              <select className="form-select" value={selectedLineId} onChange={(e) => handleLineChange(Number(e.target.value))}>
                {openLines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.item_sku} — Ordered: {l.qty_ordered}, Pending: {l.remaining_quantity}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Quantity to Inbound Stock (Remaining: {activeLine?.remaining_quantity || 0})
              </label>
              <input
                type="number"
                min="1"
                max={activeLine?.remaining_quantity}
                className="form-input"
                value={receiveQty}
                onChange={(e) => setReceiveQty(Math.max(1, parseInt(e.target.value) || 1))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Dock Inspector / Receiver Identity</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Warehouse Yard Supervisor"
                value={actorLabel}
                onChange={(e) => setActorLabel(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Posting Ledger...' : 'Confirm Goods Inbound'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
