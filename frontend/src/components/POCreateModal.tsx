import React, { useState } from 'react';
import { Plus, ShoppingBag, X } from 'lucide-react';
import { Supplier, InventoryItem, InventoryLocation, POCreatePayload, POLineCreatePayload } from '../types';
import { POCreateLineItem } from './POCreateLineItem';

interface POCreateModalProps {
  suppliers: Supplier[];
  items: InventoryItem[];
  locations: InventoryLocation[];
  onClose: () => void;
  onSubmit: (payload: POCreatePayload) => Promise<void>;
}

export const POCreateModal: React.FC<POCreateModalProps> = ({
  suppliers, items, locations, onClose, onSubmit,
}) => {
  const [supplierId, setSupplierId] = useState<number>(suppliers[0]?.id || 0);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<POLineCreatePayload[]>([
    {
      item_id: items[0]?.id || 0,
      destination_location_id: locations[0]?.id || 0,
      qty_ordered: 10,
      unit_price_minor: items[0]?.unit_cost_minor || 5000,
    },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLine = () => {
    setLines([
      ...lines,
      {
        item_id: items[0]?.id || 0,
        destination_location_id: locations[0]?.id || 0,
        qty_ordered: 5,
        unit_price_minor: items[0]?.unit_cost_minor || 5000,
      },
    ]);
  };

  const removeLine = (idx: number) => {
    if (lines.length > 1) setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, updated: POLineCreatePayload) => {
    const copy = [...lines];
    copy[idx] = updated;
    setLines(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || lines.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ supplier_id: supplierId, notes, lines });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag style={{ width: 18, height: 18, color: '#ededed' }} />
            <h3>Draft Purchase Order</h3>
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
              <label className="form-label">Vendor / Approved Supplier</label>
              <select className="form-select" value={supplierId} onChange={(e) => setSupplierId(Number(e.target.value))}>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.country || 'Domestic'})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Procurement Reference / Notes</label>
              <input className="form-input" placeholder="e.g. Urgent drilling spare replenishment" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Order Line Items ({lines.length})</label>
                <button type="button" onClick={addLine} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}>
                  <Plus style={{ width: 12, height: 12 }} /> Add Line
                </button>
              </div>

              {lines.map((l, idx) => (
                <POCreateLineItem
                  key={idx}
                  line={l}
                  idx={idx}
                  items={items}
                  locations={locations}
                  canRemove={lines.length > 1}
                  onUpdate={updateLine}
                  onRemove={removeLine}
                />
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Submit Draft Requisition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
