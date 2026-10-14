import React, { useMemo, useEffect, useRef } from 'react';
import {
  PlusCircle, MinusCircle, ArrowRightLeft, ShieldCheck, X,
  TrendingUp, TrendingDown, Paperclip, UploadCloud, FileText, Trash2,
  AlertCircle, AlertTriangle, CheckCircle2, ArrowUpRight
} from 'lucide-react';
import { InventoryItem, InventoryLocation, StockBalance } from '../types';

interface MovementModalProps {
  modalType: 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT';
  setModalType: (type: 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT') => void;
  items: InventoryItem[];
  locations: InventoryLocation[];
  balances: StockBalance[];
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
  attachedFile?: File | null;
  setAttachedFile?: (file: File | null) => void;
  modalError?: string | null;
  setModalError?: (err: string | null) => void;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}


export const MovementModal: React.FC<MovementModalProps> = ({
  modalType,
  setModalType,
  items,
  locations,
  balances,
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
  attachedFile,
  setAttachedFile,
  modalError,
  setModalError,
  isSubmitting = false,
  onClose,
  onSubmit,
}) => {
  const selectedItem = items.find((i) => i.id === selectedItemId);
  const selectedLoc = locations.find((l) => l.id === selectedLocId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute all balances across locations for the currently selected item
  const itemBalances = useMemo(() => {
    return balances.filter((b) => b.item_id === selectedItemId);
  }, [balances, selectedItemId]);

  const getLocBalance = (locId: number): number => {
    const b = itemBalances.find((bal) => bal.location_id === locId);
    return b ? b.quantity_on_hand : 0;
  };

  const currentLocBalance = getLocBalance(selectedLocId);

  // Identify other warehouses that hold positive inventory for this item
  const otherStockLocations = useMemo(() => {
    return itemBalances
      .filter((b) => b.location_id !== selectedLocId && b.quantity_on_hand > 0)
      .map((b) => {
        const loc = locations.find((l) => l.id === b.location_id);
        return {
          locationId: b.location_id,
          code: loc?.code || b.location_code || `WH-${b.location_id}`,
          name: loc?.name || 'Warehouse',
          qty: b.quantity_on_hand,
        };
      });
  }, [itemBalances, selectedLocId, locations]);

  // Intelligent auto-switch: if issuing/transferring and current warehouse has 0 stock,
  // but another location has stock, switch to that location
  useEffect(() => {
    if ((modalType === 'ISSUE' || modalType === 'TRANSFER') && currentLocBalance === 0) {
      if (otherStockLocations.length > 0) {
        setSelectedLocId(otherStockLocations[0].locationId);
      }
    }
  }, [selectedItemId, modalType]);

  // Adjust default target location for transfers if same as selected
  useEffect(() => {
    if (modalType === 'TRANSFER' && selectedLocId === targetLocId) {
      const alt = locations.find((l) => l.id !== selectedLocId);
      if (alt) setTargetLocId(alt.id);
    }
  }, [selectedLocId, targetLocId, modalType, locations, setTargetLocId]);

  const isDepletingMode =
    modalType === 'ISSUE' ||
    modalType === 'TRANSFER' ||
    (modalType === 'ADJUSTMENT' && adjustmentDirection === 'SHRINKAGE');

  const isZeroStock = isDepletingMode && currentLocBalance <= 0;
  const isOverStock = isDepletingMode && txQty > currentLocBalance;
  const isInvalidTransfer = modalType === 'TRANSFER' && selectedLocId === targetLocId;
  const isFormInvalid = isZeroStock || isOverStock || isInvalidTransfer || txQty <= 0;

  const handleModeChange = (t: 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT') => {
    if (setModalError) setModalError(null);
    setModalType(t);
  };

  const handleItemChange = (itemId: number) => {
    if (setModalError) setModalError(null);
    setSelectedItemId(itemId);
  };

  const handleLocChange = (locId: number) => {
    if (setModalError) setModalError(null);
    setSelectedLocId(locId);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            {modalType === 'RECEIPT' && <PlusCircle style={{ width: 18, height: 18, color: '#34d399' }} />}
            {modalType === 'ISSUE' && <MinusCircle style={{ width: 18, height: 18, color: '#f87171' }} />}
            {modalType === 'TRANSFER' && <ArrowRightLeft style={{ width: 18, height: 18, color: '#ffffff' }} />}
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

        {/* Server Rejection Alert Banner (Shows 400 Bad Request directly inside modal) */}
        {modalError && (
          <div
            style={{
              margin: '0.85rem 1.25rem 0 1.25rem',
              padding: '0.75rem 0.95rem',
              background: 'rgba(239, 68, 68, 0.16)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 'var(--radius-md)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.55rem',
              fontSize: '0.82rem',
              lineHeight: 1.45,
            }}
          >
            <AlertCircle style={{ width: 17, height: 17, flexShrink: 0, marginTop: 2, color: '#ef4444' }} />
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', color: '#fca5a5', marginBottom: '0.2rem' }}>
                Transaction Rejected by Server
              </strong>
              <span>{modalError}</span>
            </div>
          </div>
        )}

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
                    onClick={() => handleModeChange(t)}
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
                onChange={(e) => handleItemChange(Number(e.target.value))}
              >
                {items.map((itm) => (
                  <option key={itm.id} value={itm.id}>
                    {itm.sku} — {itm.name} (Total On-Hand: {itm.total_on_hand} {itm.uom || 'EA'})
                  </option>
                ))}
              </select>
            </div>

            {/* Warehouse Locations with on-hand reflection */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  {modalType === 'TRANSFER' ? 'Source Warehouse (From)' : 'Warehouse Location'}
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Per-location inventory
                </span>
              </div>
              <select
                className="form-select"
                value={selectedLocId}
                onChange={(e) => handleLocChange(Number(e.target.value))}
              >
                {locations.map((loc) => {
                  const bal = getLocBalance(loc.id);
                  return (
                    <option key={loc.id} value={loc.id}>
                      {loc.code} — {loc.name} {modalType !== 'RECEIPT' ? `(${bal} ${selectedItem?.uom || 'EA'} available)` : ''}
                    </option>
                  );
                })}
              </select>

              {/* Warehouse Stock Status Breakdown Card */}
              <div
                style={{
                  marginTop: '0.45rem',
                  padding: '0.6rem 0.8rem',
                  background: currentLocBalance > 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.09)',
                  border: `1px solid ${currentLocBalance > 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.78rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Available Stock at {selectedLoc?.code || 'Selected Location'}:
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: currentLocBalance > 0 ? '#34d399' : '#f87171',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    {currentLocBalance > 0 ? (
                      <>
                        <CheckCircle2 style={{ width: 13, height: 13 }} />
                        {currentLocBalance} {selectedItem?.uom || 'EA'} on-hand
                      </>
                    ) : (
                      <>
                        <AlertCircle style={{ width: 13, height: 13 }} />
                        0 {selectedItem?.uom || 'EA'} (Out of Stock here)
                      </>
                    )}
                  </span>
                </div>

                {/* Show other warehouses where this item is in stock with 1-click switch */}
                {otherStockLocations.length > 0 && (
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      borderTop: '1px dashed rgba(255, 255, 255, 0.08)',
                      paddingTop: '0.35rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>Also stocked in:</span>
                    {otherStockLocations.map((other) => (
                      <button
                        key={other.locationId}
                        type="button"
                        onClick={() => handleLocChange(other.locationId)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          color: '#e2e8f0',
                          padding: '0.12rem 0.45rem',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          transition: 'all 0.15s ease',
                        }}
                        title={`Switch source to ${other.name} (${other.qty} ${selectedItem?.uom || 'EA'})`}
                      >
                        <span>{other.code}: <strong>{other.qty}</strong></span>
                        <ArrowUpRight style={{ width: 10, height: 10, color: 'var(--text-muted)' }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Destination for Transfers */}
            {modalType === 'TRANSFER' && (
              <div className="form-group">
                <label className="form-label">Destination Warehouse (To)</label>
                <select
                  className="form-select"
                  value={targetLocId}
                  onChange={(e) => {
                    if (setModalError) setModalError(null);
                    setTargetLocId(Number(e.target.value));
                  }}
                >
                  {locations
                    .filter((loc) => loc.id !== selectedLocId)
                    .map((loc) => {
                      const destBal = getLocBalance(loc.id);
                      return (
                        <option key={loc.id} value={loc.id}>
                          {loc.code} — {loc.name} ({destBal} {selectedItem?.uom || 'EA'} currently on-hand)
                        </option>
                      );
                    })}
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
                    onClick={() => {
                      if (setModalError) setModalError(null);
                      setAdjustmentDirection && setAdjustmentDirection('SURPLUS');
                    }}
                  >
                    <TrendingUp style={{ width: 14, height: 14, color: '#34d399' }} />
                    <span>Surplus (+) [Found Stock]</span>
                  </button>

                  <button
                    type="button"
                    className={`btn ${adjustmentDirection === 'SHRINKAGE' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.45rem', fontSize: '0.75rem', gap: '0.4rem' }}
                    onClick={() => {
                      if (setModalError) setModalError(null);
                      setAdjustmentDirection && setAdjustmentDirection('SHRINKAGE');
                    }}
                  >
                    <TrendingDown style={{ width: 14, height: 14, color: '#f87171' }} />
                    <span>Shrinkage (-) [Damaged / Missing]</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quantity with live bounds, Max button, and real-time over-issue detection */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Quantity Units {selectedItem?.uom ? `(${selectedItem.uom})` : ''}
                </label>

                {isDepletingMode && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Available at {selectedLoc?.code}:{' '}
                      <strong style={{ color: currentLocBalance > 0 ? '#34d399' : '#f87171' }}>
                        {currentLocBalance}
                      </strong>
                    </span>
                    {currentLocBalance > 0 && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{
                          padding: '0.15rem 0.45rem',
                          fontSize: '0.68rem',
                          height: 'auto',
                          lineHeight: 1.2,
                          borderRadius: '4px',
                          color: '#34d399',
                          borderColor: 'rgba(52, 211, 153, 0.35)',
                        }}
                        onClick={() => {
                          if (setModalError) setModalError(null);
                          setTxQty(currentLocBalance);
                        }}
                        title={`Auto-fill maximum available quantity (${currentLocBalance})`}
                      >
                        Set Max ({currentLocBalance})
                      </button>
                    )}
                  </div>
                )}
              </div>

              <input
                type="number"
                min="1"
                max={isDepletingMode && currentLocBalance > 0 ? currentLocBalance : undefined}
                className="form-input"
                style={{
                  borderColor: isOverStock ? '#ef4444' : undefined,
                  boxShadow: isOverStock ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : undefined,
                  background: isOverStock ? 'rgba(239, 68, 68, 0.06)' : undefined,
                }}
                value={txQty}
                onChange={(e) => {
                  if (setModalError) setModalError(null);
                  setTxQty(Math.max(1, Number(e.target.value)));
                }}
                required
              />

              {/* Real-time over-issue warning banner */}
              {isOverStock && (
                <div
                  style={{
                    marginTop: '0.4rem',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#f87171',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontWeight: 500,
                  }}
                >
                  <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
                  <span>
                    Cannot {modalType.toLowerCase()} {txQty} {selectedItem?.uom || 'EA'}. Requested quantity exceeds available stock at {selectedLoc?.code || 'this location'} (Max: {currentLocBalance} {selectedItem?.uom || 'EA'}).
                  </span>
                </div>
              )}

              {/* Zero stock warning */}
              {isZeroStock && (
                <div
                  style={{
                    marginTop: '0.4rem',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#f87171',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
                  <span>
                    Warehouse {selectedLoc?.code} has 0 stock of this item. Select another warehouse location with stock or receive new inventory first.
                  </span>
                </div>
              )}
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
                onChange={(e) => {
                  if (setModalError) setModalError(null);
                  setTxReason(e.target.value);
                }}
              />
            </div>

            {/* Document Attachment Dropzone */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Paperclip style={{ width: 13, height: 13, color: 'var(--text-muted)' }} />
                  Physical Document Proof (PDF / Images)
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Optional • Audit Verification</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.txt"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0] && setAttachedFile) {
                    setAttachedFile(e.target.files[0]);
                  }
                }}
              />

              {attachedFile ? (
                <div className="attachment-file-chip" style={{ justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                    <FileText style={{ width: 14, height: 14, color: '#34d399', flexShrink: 0 }} />
                    <span className="attachment-file-chip-name">{attachedFile.name}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      ({(attachedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  {setAttachedFile && (
                    <button
                      type="button"
                      className="attachment-file-chip-remove"
                      onClick={() => setAttachedFile(null)}
                      title="Remove file"
                    >
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className="attachment-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0] && setAttachedFile) {
                      setAttachedFile(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <UploadCloud className="attachment-dropzone-icon" />
                  <div className="attachment-dropzone-text">
                    Click or drop physical delivery docket, bill of lading, or inspection photo
                  </div>
                  <div className="attachment-dropzone-hint">
                    Supports PDF, PNG, JPG up to 15MB
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFormInvalid || isSubmitting}
              className={`btn ${
                modalType === 'ISSUE' ? 'btn-issue' :
                modalType === 'RECEIPT' ? 'btn-receipt' :
                modalType === 'TRANSFER' ? 'btn-primary' : 'btn-adjust'
              }`}
              style={{
                minWidth: 160,
                opacity: (isFormInvalid || isSubmitting) ? 0.6 : 1,
                cursor: (isFormInvalid || isSubmitting) ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                  <span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} />
                  Recording Movement...
                </span>
              ) : isZeroStock ? (
                'Zero Stock at Location'
              ) : isOverStock ? (
                `Exceeds Available (${currentLocBalance})`
              ) : (
                'Commit to Ledger'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
