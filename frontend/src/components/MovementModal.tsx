import React from 'react';
import { PlusCircle, MinusCircle, ArrowRightLeft } from 'lucide-react';
import { InventoryItem, InventoryLocation } from '../types';

interface MovementModalProps {
  modalType: 'RECEIPT' | 'ISSUE' | 'TRANSFER';
  setModalType: (type: 'RECEIPT' | 'ISSUE' | 'TRANSFER') => void;
  items: InventoryItem[];
  locations: InventoryLocation[];
  selectedItemId: number;
  setSelectedItemId: (id: number) => void;
  selectedLocId: number;
  setSelectedLocId: (id: number) => void;
  targetLocId: number;
  setTargetLocId: (id: number) => void;
  txQty: number;
  setTxQty: (qty: number) => void;
  txReason: string;
  setTxReason: (reason: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const MovementModal: React.FC<MovementModalProps> = ({
  modalType, setModalType, items, locations, selectedItemId, setSelectedItemId,
  selectedLocId, setSelectedLocId, targetLocId, setTargetLocId, txQty, setTxQty,
  txReason, setTxReason, onClose, onSubmit,
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {modalType === 'RECEIPT' && <PlusCircle style={{ width: 20, height: 20, color: '#34d399' }} />}
          {modalType === 'ISSUE' && <MinusCircle style={{ width: 20, height: 20, color: '#fbbf24' }} />}
          {modalType === 'TRANSFER' && <ArrowRightLeft style={{ width: 20, height: 20, color: '#c084fc' }} />}
          <span>Execute {modalType} Transaction</span>
        </h3>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Transaction Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {(['RECEIPT', 'ISSUE', 'TRANSFER'] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  className={`btn ${modalType === t ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.45rem', fontSize: '0.75rem' }}
                  onClick={() => setModalType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Item / Spare Part SKU</label>
            <select
              className="form-select"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(Number(e.target.value))}
            >
              {items.map((itm) => (
                <option key={itm.id} value={itm.id}>
                  {itm.sku} — {itm.name} (On-Hand: {itm.total_on_hand})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              {modalType === 'TRANSFER' ? 'Source Location' : 'Location'}
            </label>
            <select
              className="form-select"
              value={selectedLocId}
              onChange={(e) => setSelectedLocId(Number(e.target.value))}
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.code} — {loc.name}
                </option>
              ))}
            </select>
          </div>

          {modalType === 'TRANSFER' && (
            <div className="form-group">
              <label className="form-label">Destination Location</label>
              <select
                className="form-select"
                value={targetLocId}
                onChange={(e) => setTargetLocId(Number(e.target.value))}
              >
                {locations
                  .filter((loc) => loc.id !== selectedLocId)
                  .map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.code} — {loc.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input
              type="number"
              min="1"
              className="form-input"
              value={txQty}
              onChange={(e) => setTxQty(Math.max(1, Number(e.target.value)))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Reference Note</label>
            <input
              type="text"
              placeholder="e.g., Rig mud pump maintenance issue"
              className="form-input"
              value={txReason}
              onChange={(e) => setTxReason(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
