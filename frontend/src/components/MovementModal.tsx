import React from 'react';
import {
  PlusCircle, MinusCircle, ArrowRightLeft, ShieldCheck, X,
  TrendingUp, TrendingDown
} from 'lucide-react';
import { InventoryItem, InventoryLocation } from '../types';

interface MovementModalProps {
  modalType: 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT';
  setModalType: (type: 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT') => void;
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
  adjustmentDirection?: 'SURPLUS' | 'SHRINKAGE';
  setAdjustmentDirection?: (dir: 'SURPLUS' | 'SHRINKAGE') => void;
  destinationLabel?: string;
  setDestinationLabel?: (label: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const MovementModal: React.FC<MovementModalProps> = ({
  modalType,
  setModalType,
  items,
  locations,
  selectedItemId,
  setSelectedItemId,
  selectedLocId,
  setSelectedLocId,
  targetLocId,
  setTargetLocId,
  txQty,
  setTxQty,
  txReason,
  setTxReason,
  adjustmentDirection = 'SURPLUS',
  setAdjustmentDirection,
  destinationLabel = 'Rig-12',
  setDestinationLabel,
  onClose,
  onSubmit,
}) => {
  const selectedItem = items.find((i) => i.id === selectedItemId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            {modalType === 'RECEIPT' && <PlusCircle style={{ width: 18, height: 18, color: '#34d399' }} />}
            {modalType === 'ISSUE' && <MinusCircle style={{ width: 18, height: 18, color: '#f87171' }} />}
            {modalType === 'TRANSFER' && <ArrowRightLeft style={{ width: 18, height: 18, color: '#38bdf8' }} />}
            {modalType === 'ADJUSTMENT' && <ShieldCheck style={{ width: 18, height: 18, color: '#fbbf24' }} />}
            <h3>Record {modalType.charAt(0) + modalType.slice(1).toLowerCase()} Transaction</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="modal-body">
            {/* Movement Type Selector */}
            <div className="form-group">
              <label className="form-label">Transaction Mode</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                {(['RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT'] as const).map((t) => (
                  <button
                    type="button"
                    key={t}
                    className={`btn ${modalType === t ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      padding: '0.45rem 0.2rem',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      justifyContent: 'center',
                    }}
                    onClick={() => setModalType(t)}
                  >
                    {t === 'RECEIPT' && 'Receive'}
                    {t === 'ISSUE' && 'Issue'}
                    {t === 'TRANSFER' && 'Transfer'}
                    {t === 'ADJUSTMENT' && 'Adjust'}
                  </button>
                ))}
              </div>
            </div>

            {/* Item Selection */}
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

            {/* Warehouse Locations */}
            <div className="form-group">
              <label className="form-label">
                {modalType === 'TRANSFER' ? 'Source Warehouse (From)' : 'Warehouse Location'}
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

            {/* Destination for Transfers */}
            {modalType === 'TRANSFER' && (
              <div className="form-group">
                <label className="form-label">Destination Warehouse (To)</label>
                <select
                  className="form-select"
                  value={targetLocId}
                  onChange={(e) => setTargetLocId(Number(e.target.value))}
                >
                  {locations.filter((loc) => loc.id !== selectedLocId).map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.code} — {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Destination for Issues */}
            {modalType === 'ISSUE' && (
              <div className="form-group">
                <label className="form-label">Issue Destination (Project / Rig / Workshop)</label>
                <select
                  className="form-select"
                  value={destinationLabel}
                  onChange={(e) => setDestinationLabel && setDestinationLabel(e.target.value)}
                >
                  <option value="Rig-12">Rig-12 (Drilling Operation)</option>
                  <option value="Rig-07">Rig-07 (Workover Unit)</option>
                  <option value="Workshop">Central Maintenance Workshop</option>
                  <option value="Rig-01">Rig-01 (Offshore Platform)</option>
                  <option value="Field Support">Field Support Vehicle</option>
                </select>
              </div>
            )}

            {/* Adjustment Direction Toggle */}
            {modalType === 'ADJUSTMENT' && (
              <div className="form-group">
                <label className="form-label">Adjustment Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn ${adjustmentDirection === 'SURPLUS' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.45rem', fontSize: '0.75rem', gap: '0.4rem' }}
                    onClick={() => setAdjustmentDirection && setAdjustmentDirection('SURPLUS')}
                  >
                    <TrendingUp style={{ width: 14, height: 14, color: '#34d399' }} />
                    <span>Surplus (+) [Found Stock]</span>
                  </button>

                  <button
                    type="button"
                    className={`btn ${adjustmentDirection === 'SHRINKAGE' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.45rem', fontSize: '0.75rem', gap: '0.4rem' }}
                    onClick={() => setAdjustmentDirection && setAdjustmentDirection('SHRINKAGE')}
                  >
                    <TrendingDown style={{ width: 14, height: 14, color: '#f87171' }} />
                    <span>Shrinkage (-) [Damaged / Missing]</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="form-group">
              <label className="form-label">
                Quantity Units {selectedItem?.uom ? `(${selectedItem.uom})` : ''}
              </label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={txQty}
                onChange={(e) => setTxQty(Math.max(1, Number(e.target.value)))}
                required
              />
            </div>

            {/* Reference & Reason */}
            <div className="form-group">
              <label className="form-label">
                {modalType === 'RECEIPT' && 'Purchase Order or Delivery Reference'}
                {modalType === 'ISSUE' && 'Requisition Reference / Work Order'}
                {modalType === 'TRANSFER' && 'Transfer Waybill Reference'}
                {modalType === 'ADJUSTMENT' && 'Cycle Count Sheet / Audit Reference'}
              </label>
              <input
                type="text"
                placeholder={
                  modalType === 'RECEIPT' ? 'e.g. PO-1042 - Initial shipment' :
                  modalType === 'ISSUE' ? 'e.g. REQ-0034 - Scheduled overhaul' :
                  modalType === 'TRANSFER' ? 'e.g. TR-0078 - Inter-warehouse transfer' :
                  'e.g. CT-0012 - Physical cycle count reconciliation'
                }
                className="form-input"
                value={txReason}
                onChange={(e) => setTxReason(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${
                modalType === 'ISSUE' ? 'btn-issue' :
                modalType === 'RECEIPT' ? 'btn-receipt' :
                modalType === 'TRANSFER' ? 'btn-primary' : 'btn-adjust'
              }`}
              style={{ minWidth: 140 }}
            >
              Commit to Ledger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
