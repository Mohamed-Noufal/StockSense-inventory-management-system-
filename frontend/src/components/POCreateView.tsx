import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, AlertCircle, Save } from 'lucide-react';
import { Supplier, InventoryItem, InventoryLocation, POCreatePayload, POLineCreatePayload } from '../types';

interface POCreateViewProps {
  suppliers: Supplier[];
  items: InventoryItem[];
  locations: InventoryLocation[];
  onBack: () => void;
  onSubmit: (payload: POCreatePayload) => Promise<number | void>;
}

export const POCreateView: React.FC<POCreateViewProps> = ({
  suppliers,
  items,
  locations,
  onBack,
  onSubmit,
}) => {
  const [supplierId, setSupplierId] = useState<number>(suppliers[0]?.id || 1);
  const [defaultLocId, setDefaultLocId] = useState<number>(
    locations.find((l) => l.is_default_replenishment === 1)?.id || locations[0]?.id || 1
  );
  const [expectedDate, setExpectedDate] = useState<string>('');
  const [internalRef, setInternalRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Line items state
  const [lines, setLines] = useState<Array<{
    itemId: number;
    destinationLocId: number;
    quantity: number;
    unitPriceDollars: number;
  }>>([
    {
      itemId: items[0]?.id || 1,
      destinationLocId: defaultLocId,
      quantity: 10,
      unitPriceDollars: (items[0]?.unit_cost_minor || 5000) / 100,
    },
  ]);

  const handleAddLine = () => {
    const defaultItem = items[0];
    setLines((prev) => [
      ...prev,
      {
        itemId: defaultItem?.id || 1,
        destinationLocId: defaultLocId,
        quantity: 5,
        unitPriceDollars: (defaultItem?.unit_cost_minor || 5000) / 100,
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length > 1) {
      setLines((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleLineItemChange = (idx: number, newItemId: number) => {
    const selectedItem = items.find((itm) => itm.id === newItemId);
    setLines((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        itemId: newItemId,
        unitPriceDollars: selectedItem ? selectedItem.unit_cost_minor / 100 : copy[idx].unitPriceDollars,
      };
      return copy;
    });
  };

  const handleLineQtyChange = (idx: number, qty: number) => {
    setLines((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], quantity: Math.max(1, qty) };
      return copy;
    });
  };

  const handleLinePriceChange = (idx: number, price: number) => {
    setLines((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], unitPriceDollars: Math.max(0, price) };
      return copy;
    });
  };

  const totalCalculated = lines.reduce(
    (sum, l) => sum + l.quantity * l.unitPriceDollars,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || lines.length === 0) {
      setError('Please select a supplier and add at least one line item.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const formattedLines: POLineCreatePayload[] = lines.map((l) => ({
      item_id: l.itemId,
      destination_location_id: l.destinationLocId || defaultLocId,
      qty_ordered: l.quantity,
      unit_price_minor: Math.round(l.unitPriceDollars * 100),
    }));

    const combinedNotes = [internalRef ? `Ref: ${internalRef}` : '', notes.trim()]
      .filter(Boolean)
      .join(' — ');

    try {
      await onSubmit({
        supplier_id: supplierId,
        expected_date: expectedDate || undefined,
        notes: combinedNotes || undefined,
        lines: formattedLines,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to save purchase order draft');
      setSubmitting(false);
    }
  };

  return (
    <div className="po-create-view">
      {/* Breadcrumb Navigation */}
      <button type="button" className="po-view-breadcrumb" onClick={onBack}>
        <ArrowLeft style={{ width: 14, height: 14 }} />
        <span>Back to Purchase Orders</span>
      </button>

      {/* Header */}
      <div className="procurement-header" style={{ marginBottom: '0.5rem' }}>
        <div className="procurement-header-title-box">
          <h1>Create Purchase Order</h1>
          <p>Create a draft supplier order for stock replenishment.</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle style={{ width: 16, height: 16 }} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Section 1 — Order Information */}
        <div className="po-section-card">
          <div className="po-section-title">
            <span>Section 1 — Order Information</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supplier & Delivery Route</span>
          </div>

          <div className="po-form-grid-2">
            <div className="form-group">
              <label className="form-label">Supplier Partner *</label>
              <select
                className="form-select"
                value={supplierId}
                onChange={(e) => setSupplierId(Number(e.target.value))}
                required
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.country || 'Domestic'}) {s.is_import ? '• Import' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Destination Warehouse *</label>
              <select
                className="form-select"
                value={defaultLocId}
                onChange={(e) => setDefaultLocId(Number(e.target.value))}
                required
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code}) {loc.is_default_replenishment ? '★ Default' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="po-form-grid-2">
            <div className="form-group">
              <label className="form-label">Expected Delivery Date (Optional)</label>
              <input
                type="date"
                className="form-input"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Internal Reference / Requisition Ref</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. REQ-2026-RIG12 or WO-0045"
                value={internalRef}
                onChange={(e) => setInternalRef(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Procurement Notes / Instructions</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="e.g. Urgent shipment required for drilling campaign replenishment"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Section 2 — Line Items Table */}
        <div className="po-section-card">
          <div className="po-section-title">
            <span>Section 2 — Purchase-Order Lines ({lines.length})</span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddLine}
              style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem' }}
            >
              <Plus style={{ width: 13, height: 13 }} />
              <span>Add Item Line</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 120px 120px 40px', gap: '0.75rem', padding: '0 0.85rem', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              <span>Inventory Item & SKU</span>
              <span style={{ textAlign: 'right' }}>Quantity</span>
              <span style={{ textAlign: 'right' }}>Unit Price ($)</span>
              <span style={{ textAlign: 'right' }}>Subtotal ($)</span>
              <span></span>
            </div>

            {lines.map((line, idx) => {
              const matchedItem = items.find((i) => i.id === line.itemId);
              const subtotal = line.quantity * line.unitPriceDollars;
              return (
                <div key={idx} className="po-line-item-row">
                  <div>
                    <select
                      className="form-select"
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                      value={line.itemId}
                      onChange={(e) => handleLineItemChange(idx, Number(e.target.value))}
                    >
                      {items.map((itm) => (
                        <option key={itm.id} value={itm.id}>
                          {itm.sku} — {itm.name} (Stock: {itm.total_on_hand})
                        </option>
                      ))}
                    </select>
                    {matchedItem && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Category: {matchedItem.category_name || 'General'} • Criticality: {matchedItem.criticality}
                      </div>
                    )}
                  </div>

                  <div>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      style={{ textAlign: 'right', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                      value={line.quantity}
                      onChange={(e) => handleLineQtyChange(idx, parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      style={{ textAlign: 'right', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                      value={line.unitPriceDollars}
                      onChange={(e) => handleLinePriceChange(idx, parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#ffffff' }}>
                    ${subtotal.toFixed(2)}
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem', border: 'none', background: 'transparent', color: lines.length > 1 ? '#f87171' : 'var(--text-muted)', cursor: lines.length > 1 ? 'pointer' : 'not-allowed' }}
                      onClick={() => handleRemoveLine(idx)}
                      disabled={lines.length <= 1}
                      title={lines.length <= 1 ? 'At least one line is required' : 'Remove Line'}
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Order Total Preview Footer */}
          <div className="po-estimated-footer">
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Estimated Order Lines
              </span>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff' }}>
                {lines.length} lines • {lines.reduce((acc, l) => acc + l.quantity, 0)} units total
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Estimated Order Value
              </span>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                ${totalCalculated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="po-footer-actions">
          <button type="button" className="btn btn-secondary" onClick={onBack} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting || lines.length === 0}>
            <Save style={{ width: 14, height: 14 }} />
            <span>{submitting ? 'Creating Draft PO...' : 'Save Draft Purchase Order'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
