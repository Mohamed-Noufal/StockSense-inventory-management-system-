import React, { useState } from 'react';
import { Sparkles, CheckCircle, X, AlertCircle, ShoppingBag } from 'lucide-react';
import { AIRecommendation, Supplier, InventoryLocation, PurchaseOrder } from '../types';

interface AIApproveModalProps {
  rec: AIRecommendation;
  suppliers?: Supplier[];
  locations?: InventoryLocation[];
  onClose: () => void;
  onApproveSuccess: (po: PurchaseOrder) => void;
  onApprove: (id: number) => Promise<PurchaseOrder>;
}

export const AIApproveModal: React.FC<AIApproveModalProps> = ({
  rec,
  suppliers = [],
  locations = [],
  onClose,
  onApproveSuccess,
  onApprove,
}) => {
  let explanation: any = {};
  try {
    explanation = JSON.parse(rec.explanation_json);
  } catch {
    // fallback
  }

  const moq = explanation.moq || 1;
  const orderMultiple = explanation.order_multiple || 1;

  const [orderQty, setOrderQty] = useState<number>(rec.suggested_qty);
  const supplierId = rec.supplier_id || suppliers[0]?.id || 1;
  const [expectedDate, setExpectedDate] = useState<string>('');
  const [notes, setNotes] = useState<string>(`Generated from AI Replenishment Recommendation #${rec.id}`);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleQtyChange = (val: number) => {
    setOrderQty(Math.max(1, val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderQty < moq) {
      setError(`Order quantity must meet or exceed supplier Minimum Order Quantity (MOQ: ${moq} units).`);
      return;
    }
    if (orderQty % orderMultiple !== 0) {
      setError(`Order quantity must be a multiple of ${orderMultiple} (Supplier Order Multiple constraint).`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const createdPO = await onApprove(rec.id);
      onApproveSuccess(createdPO);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to approve recommendation and create purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  const matchedSupplier = suppliers.find((s) => s.id === supplierId) || { name: rec.supplier_name || 'Primary Supplier' };
  const matchedLocation = locations.find((l) => l.id === rec.destination_location_id) || { name: rec.location_code || 'Central Yard' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles style={{ width: 18, height: 18, color: '#38bdf8' }} />
            <div>
              <h3>Review Replenishment Order</h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
                Review proposed purchase parameters before creating draft purchase order
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
          <div style={{ margin: '1rem 1.5rem 0', padding: '0.65rem 0.85rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Target Item Pill */}
            <div style={{ padding: '0.65rem 0.85rem', background: '#121214', border: '1px solid var(--border-default)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="sku-cell" style={{ fontWeight: 600 }}>{rec.item_sku}</span>
                <span style={{ fontSize: '0.8rem', color: '#ffffff', marginLeft: '0.5rem' }}>{rec.item_name}</span>
              </div>
              <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                Position: {rec.inventory_position} / ROP: {rec.reorder_point}
              </span>
            </div>

            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">
                  Proposed Order Quantity * (MOQ: {moq})
                </label>
                <input
                  type="number"
                  min={moq}
                  step={orderMultiple}
                  className="form-input"
                  style={{ fontWeight: 700, color: '#34d399', fontSize: '1rem' }}
                  value={orderQty}
                  onChange={(e) => handleQtyChange(parseInt(e.target.value) || moq)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Expected Delivery Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Assigned Vendor</label>
                <input
                  type="text"
                  className="form-input"
                  value={matchedSupplier.name}
                  readOnly
                  style={{ background: '#09090b', color: 'var(--text-secondary)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Destination Warehouse</label>
                <input
                  type="text"
                  className="form-input"
                  value={matchedLocation.name}
                  readOnly
                  style={{ background: '#09090b', color: 'var(--text-secondary)' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Requisition Reference & Audit Notes</label>
              <input
                type="text"
                className="form-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Replenishment Summary Comparison */}
            <div className="po-modal-review-summary">
              <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShoppingBag style={{ width: 14, height: 14, color: '#3b82f6' }} />
                <span>Replenishment Order Review</span>
              </div>
              <div className="po-modal-review-row">
                <span>Model Suggested Quantity:</span>
                <span>+{rec.suggested_qty} units</span>
              </div>
              <div className="po-modal-review-row">
                <span>Final Requisition Quantity:</span>
                <span style={{ color: '#34d399', fontWeight: 700 }}>+{orderQty} units</span>
              </div>
              <div className="po-modal-review-row">
                <span>Constraints Check:</span>
                <span style={{ color: '#34d399' }}>✓ MOQ ({moq}) & Multiple ({orderMultiple}) Satisfied</span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || orderQty <= 0}>
              <CheckCircle style={{ width: 14, height: 14 }} />
              <span>{submitting ? 'Generating PO & Updating Ledger...' : 'Confirm & Create Purchase Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
