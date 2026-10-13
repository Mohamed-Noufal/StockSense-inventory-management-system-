import React, { useState } from 'react';
import { PackageCheck, X } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderLine, POReceivePayload, InventoryLocation } from '../types';

interface POReceiveModalProps {
  po: PurchaseOrder;
  locations?: InventoryLocation[];
  onClose: () => void;
  onSubmit: (poId: number, payload: POReceivePayload) => Promise<void>;
}

export const POReceiveModal: React.FC<POReceiveModalProps> = ({
  po, locations = [], onClose, onSubmit,
}) => {
  const openLines = po.lines.filter((l) => l.remaining_quantity > 0);
  const [selectedLineId, setSelectedLineId] = useState<number>(openLines[0]?.id || po.lines[0]?.id || 0);
  const activeLine: PurchaseOrderLine | undefined = po.lines.find((l) => l.id === selectedLineId);

  const [receiveQty, setReceiveQty] = useState<number>(activeLine?.remaining_quantity || 1);
  const [targetLocId, setTargetLocId] = useState<number>(
    activeLine?.destination_location_id || locations[0]?.id || 1
  );
  const [actorLabel, setActorLabel] = useState<string>('Dock Inspector');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLineChange = (lineId: number) => {
    setSelectedLineId(lineId);
    const line = po.lines.find((l) => l.id === lineId);
    if (line) {
      setReceiveQty(line.remaining_quantity);
      setTargetLocId(line.destination_location_id);
    }
  };

  const remaining = activeLine ? activeLine.remaining_quantity : 0;
  const afterReceiptRemaining = Math.max(0, remaining - receiveQty);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLineId || receiveQty <= 0) return;
    if (activeLine && receiveQty > activeLine.remaining_quantity) {
      setError(`Over-receipt rejected: cannot receive more than remaining ordered quantity (${activeLine.remaining_quantity} units).`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(po.id, {
        po_line_id: selectedLineId,
        quantity_received: receiveQty,
        destination_location_id: targetLocId,
        actor_label: actorLabel.trim() || 'Dock Inspector',
        idempotency_key: `rcv-${po.id}-${selectedLineId}-${Date.now()}`,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record receipt in stock ledger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PackageCheck style={{ width: 18, height: 18, color: '#34d399' }} />
            <div>
              <h3>Receive Goods</h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
                Record the quantity physically received from supplier for {po.po_number}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {error && (
          <div style={{ margin: '1rem 1.5rem 0', padding: '0.65rem 0.85rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Select PO Line for Inbound Receiving</label>
              <select
                className="form-select"
                value={selectedLineId}
                onChange={(e) => handleLineChange(Number(e.target.value))}
              >
                {po.lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.item_sku || `Item #${l.item_id}`} — Ordered: {l.qty_ordered}, Previously: {l.qty_received}, Remaining: {l.remaining_quantity}
                  </option>
                ))}
              </select>
            </div>

            {/* Line Receiving Status Card */}
            {activeLine && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: '#121214', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '0.75rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ordered</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginTop: 2 }}>{activeLine.qty_ordered}</div>
                </div>
                <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Prev Received</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24', marginTop: 2 }}>{activeLine.qty_received}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Remaining</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#60a5fa', marginTop: 2 }}>{activeLine.remaining_quantity}</div>
                </div>
              </div>
            )}

            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">
                  Quantity Received Now (Max: {remaining})
                </label>
                <input
                  type="number"
                  min="1"
                  max={remaining}
                  className="form-input"
                  value={receiveQty}
                  onChange={(e) => setReceiveQty(Math.max(1, parseInt(e.target.value) || 1))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Actual Receiving Warehouse</label>
                <select
                  className="form-select"
                  value={targetLocId}
                  onChange={(e) => setTargetLocId(Number(e.target.value))}
                >
                  {locations.length > 0 ? (
                    locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </option>
                    ))
                  ) : (
                    <option value={activeLine?.destination_location_id || 1}>
                      {activeLine?.location_code || 'Central Warehouse'}
                    </option>
                  )}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Dock Inspector / Receiver Identity</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Storekeeper / Receiving Lead"
                value={actorLabel}
                onChange={(e) => setActorLabel(e.target.value)}
              />
            </div>

            {/* Inbound Review Summary Card */}
            <div className="po-modal-review-summary">
              <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <PackageCheck style={{ width: 14, height: 14, color: '#10b981' }} />
                <span>Delivery Transaction Review</span>
              </div>
              <div className="po-modal-review-row">
                <span>Inbound Delivery:</span>
                <span style={{ color: '#34d399', fontWeight: 700 }}>+{receiveQty} units</span>
              </div>
              <div className="po-modal-review-row">
                <span>Outstanding After Receipt:</span>
                <span>{afterReceiptRemaining} units {afterReceiptRemaining === 0 ? '(Order Completed)' : '(Partial Delivery)'}</span>
              </div>
              <div className="po-modal-review-row">
                <span>Destination:</span>
                <span>{locations.find((l) => l.id === targetLocId)?.name || 'Default Warehouse'}</span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || remaining === 0 || receiveQty <= 0 || receiveQty > remaining}
            >
              {submitting ? 'Posting Ledger & Updating Stock...' : 'Confirm Inbound Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
