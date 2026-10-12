import React from 'react';
import { Trash2 } from 'lucide-react';
import { InventoryItem, InventoryLocation, POLineCreatePayload } from '../types';

interface POCreateLineItemProps {
  line: POLineCreatePayload;
  idx: number;
  items: InventoryItem[];
  locations: InventoryLocation[];
  canRemove: boolean;
  onUpdate: (idx: number, updated: POLineCreatePayload) => void;
  onRemove: (idx: number) => void;
}

export const POCreateLineItem: React.FC<POCreateLineItemProps> = ({
  line: l, idx, items, locations, canRemove, onUpdate, onRemove,
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 0.65rem', background: '#09090b', borderRadius: '6px', marginBottom: '0.45rem', border: '1px solid var(--border-subtle)' }}>
      <select
        className="form-select"
        style={{ fontSize: '0.78rem', padding: '0.35rem 0.5rem' }}
        value={l.item_id}
        onChange={(e) => {
          const itmId = Number(e.target.value);
          const selected = items.find((it) => it.id === itmId);
          onUpdate(idx, {
            ...l,
            item_id: itmId,
            unit_price_minor: selected?.unit_cost_minor || l.unit_price_minor,
          });
        }}
      >
        {items.map((it) => (
          <option key={it.id} value={it.id}>
            {it.sku} — {it.name}
          </option>
        ))}
      </select>

      <select
        className="form-select"
        style={{ fontSize: '0.78rem', padding: '0.35rem 0.5rem' }}
        value={l.destination_location_id}
        onChange={(e) => onUpdate(idx, { ...l, destination_location_id: Number(e.target.value) })}
      >
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.code} ({loc.location_type})
          </option>
        ))}
      </select>

      <input
        type="number"
        min="1"
        className="form-input"
        style={{ fontSize: '0.78rem', padding: '0.35rem 0.5rem' }}
        placeholder="Qty"
        value={l.qty_ordered}
        onChange={(e) => onUpdate(idx, { ...l, qty_ordered: Math.max(1, parseInt(e.target.value) || 1) })}
      />

      <input
        type="number"
        min="0"
        step="100"
        className="form-input"
        style={{ fontSize: '0.78rem', padding: '0.35rem 0.5rem' }}
        placeholder="Unit Minor"
        value={l.unit_price_minor}
        onChange={(e) => onUpdate(idx, { ...l, unit_price_minor: Math.max(0, parseInt(e.target.value) || 0) })}
      />

      <button
        type="button"
        onClick={() => onRemove(idx)}
        disabled={!canRemove}
        style={{ background: 'none', border: 'none', color: canRemove ? '#ef4444' : 'var(--text-muted)', cursor: canRemove ? 'pointer' : 'default', padding: '0.2rem' }}
      >
        <Trash2 style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
};
