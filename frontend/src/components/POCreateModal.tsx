import React, { useState } from 'react';
import { Plus, Trash2, ShoppingCart, X } from 'lucide-react';
import { Supplier, InventoryItem, InventoryLocation, POCreatePayload, POLineCreatePayload } from '../types';

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
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== idx));
    }
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <ShoppingCart style={{ width: 20, height: 20, color: 'var(--brand-primary)' }} />
            <span>Draft New Purchase Order</span>
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
            <label className="form-label">Vendor / Supplier</label>
            <select className="form-select" value={supplierId} onChange={(e) => setSupplierId(Number(e.target.value))}>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.country || 'Local'})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Procurement Notes / Requisition Ref</label>
            <input className="form-input" placeholder="e.g., Scheduled drilling maintenance restocking" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Order Line Items ({lines.length})</label>
              <button type="button" onClick={addLine} className="btn btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Plus style={{ width: 14, height: 14 }} /> Add Line
              </button>
            </div>

            {lines.map((l, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', marginBottom: '0.5rem', border: '1px solid var(--border-subtle)' }}>
                <select className="form-select" style={{ fontSize: '0.78rem', padding: '0.35rem' }} value={l.item_id} onChange={(e) => {
                  const itmId = Number(e.target.value);
                  const selected = items.find(it => it.id === itmId);
                  const newLines = [...lines];
                  newLines[idx].item_id = itmId;
                  if (selected?.unit_cost_minor) newLines[idx].unit_price_minor = selected.unit_cost_minor;
                  setLines(newLines);
                }}>
                  {items.map(it => <option key={it.id} value={it.id}>{it.sku} - {it.name}</option>)}
                </select>

                <select className="form-select" style={{ fontSize: '0.78rem', padding: '0.35rem' }} value={l.destination_location_id} onChange={(e) => {
                  const newLines = [...lines];
                  newLines[idx].destination_location_id = Number(e.target.value);
                  setLines(newLines);
                }}>
                  {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.code} ({loc.location_type})</option>)}
                </select>

                <input type="number" min="1" className="form-input" style={{ fontSize: '0.78rem', padding: '0.35rem' }} placeholder="Qty" value={l.qty_ordered} onChange={(e) => {
                  const newLines = [...lines];
                  newLines[idx].qty_ordered = Math.max(1, parseInt(e.target.value) || 1);
                  setLines(newLines);
                }} />

                <input type="number" min="0" step="100" className="form-input" style={{ fontSize: '0.78rem', padding: '0.35rem' }} placeholder="Unit Minor" value={l.unit_price_minor} onChange={(e) => {
                  const newLines = [...lines];
                  newLines[idx].unit_price_minor = Math.max(0, parseInt(e.target.value) || 0);
                  setLines(newLines);
                }} />

                <button type="button" onClick={() => removeLine(idx)} disabled={lines.length <= 1} style={{ background: 'none', border: 'none', color: lines.length > 1 ? '#ef4444' : 'var(--text-muted)', cursor: lines.length > 1 ? 'pointer' : 'default', padding: '0.25rem' }}>
                  <Trash2 style={{ width: 16, height: 16 }} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
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
