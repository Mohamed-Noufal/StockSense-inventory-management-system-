import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, Scan, ArrowUpRight, ArrowDownLeft, Tag, Layers, AlertCircle } from 'lucide-react';
import { InventoryItem } from '../types';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { soundEffects } from '../utils/audio';

interface BarcodeScannerModalProps {
  items: InventoryItem[];
  onClose: () => void;
  onQuickAction: (action: 'ISSUE' | 'RECEIPT', item: InventoryItem) => void;
  onPrintLabel: (item: InventoryItem) => void;
  onInspectItem: (item: InventoryItem) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  items,
  onClose,
  onQuickAction,
  onPrintLabel,
  onInspectItem,
}) => {
  const [query, setQuery] = useState<string>('');
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [scanStatus, setScanStatus] = useState<string>('Ready for input');
  const [isError, setIsError] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Automatically focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Resolve barcode string to item
  const handleResolveCode = useCallback((code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setQuery(trimmed);

    // Exact or prefix match against SKU or ID
    const found = items.find(
      (it) => it.sku.toUpperCase() === trimmed ||
              it.sku.toUpperCase().includes(trimmed) ||
              it.id.toString() === trimmed
    );

    if (found) {
      setScannedItem(found);
      setIsError(false);
      setScanStatus(`Scanned: ${found.sku}`);
      soundEffects.playScanSuccess();
    } else {
      setScannedItem(null);
      setIsError(true);
      setScanStatus(`Unknown Barcode: "${trimmed}"`);
      soundEffects.playScanError();
    }
  }, [items]);

  // Global USB Barcode Scanner Wedge Hook
  useBarcodeScanner({
    onScan: (code) => {
      handleResolveCode(code);
    },
    enabled: true,
  });

  const handleManualKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleResolveCode(query);
    }
  };

  // Sample quick test presets for demonstration
  const samplePresets = items.slice(0, 5);

  return (
    <div className="scanner-modal-backdrop" onClick={onClose}>
      <div className="scanner-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="scanner-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Scan size={18} color="#ededed" />
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ededed' }}>
              Optical Barcode & SKU Scanner
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="scanner-status-pulse">
              <span className="pulse-dot" />
              <span>USB Wedge Active</span>
            </div>
            <button className="btn-icon" onClick={onClose} title="Close (Esc)">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="scanner-modal-body">
          {/* Active Input Search Bar */}
          <div className="scanner-input-box">
            <Search size={16} color="#71717a" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Scan barcode with USB gun, or type SKU..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.length >= 3) {
                  handleResolveCode(e.target.value);
                }
              }}
              onKeyDown={handleManualKeyDown}
            />
            {query && (
              <button
                className="btn-icon"
                onClick={() => {
                  setQuery('');
                  setScannedItem(null);
                  setScanStatus('Ready for input');
                  setIsError(false);
                  inputRef.current?.focus();
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Test Presets (Interview Demo Facilitator) */}
          <div className="scanner-presets-section">
            <div className="scanner-presets-label">
              Interview Demonstration Presets (Click to Simulate Hardware Scan):
            </div>
            <div className="scanner-chips-row">
              {samplePresets.map((preset) => (
                <button
                  key={preset.id}
                  className="scanner-chip-btn"
                  onClick={() => handleResolveCode(preset.sku)}
                  title={`Simulate scan of ${preset.name}`}
                >
                  <span>{preset.sku}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scanner Output Zone */}
          {scannedItem ? (
            <div className="scanned-item-card">
              <div className="scanned-item-header">
                <div>
                  <div className="scanned-sku-badge">{scannedItem.sku}</div>
                  <div className="scanned-item-title">{scannedItem.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#888888', marginTop: '2px' }}>
                    {scannedItem.category_name} • Warehouse: {scannedItem.warehouse_name || 'Main Warehouse'}
                  </div>
                </div>
                <div
                  className="status-pill"
                  style={{
                    backgroundColor: scannedItem.criticality === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: scannedItem.criticality === 'CRITICAL' ? '#ef4444' : '#10b981',
                    border: '1px solid currentColor',
                  }}
                >
                  {scannedItem.criticality}
                </div>
              </div>

              {/* 4-Stat HUD Grid */}
              <div className="scanned-item-stats">
                <div className="scanned-stat-box">
                  <span className="scanned-stat-label">Stock On Hand</span>
                  <span className="scanned-stat-value" style={{ color: scannedItem.total_on_hand <= (scannedItem.reorder_point ?? 10) ? '#f59e0b' : '#10b981' }}>
                    {scannedItem.total_on_hand} EA
                  </span>
                </div>
                <div className="scanned-stat-box">
                  <span className="scanned-stat-label">Reorder Point</span>
                  <span className="scanned-stat-value">{scannedItem.reorder_point ?? 10} EA</span>
                </div>
                <div className="scanned-stat-box">
                  <span className="scanned-stat-label">Unit Cost</span>
                  <span className="scanned-stat-value">${(scannedItem.unit_cost_minor / 100).toFixed(2)}</span>
                </div>
                <div className="scanned-stat-box">
                  <span className="scanned-stat-label">Storage Bin</span>
                  <span className="scanned-stat-value" style={{ fontSize: '0.85rem' }}>
                    {scannedItem.warehouse_name ? scannedItem.warehouse_name.toUpperCase().slice(0, 10) : 'WH-MAIN'}
                  </span>
                </div>
              </div>

              {/* Direct Quick Action Buttons */}
              <div className="scanned-actions-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <button
                  className="scanned-action-btn issue"
                  onClick={() => {
                    onClose();
                    onQuickAction('ISSUE', scannedItem);
                  }}
                >
                  <ArrowUpRight size={15} />
                  <span>Record Issue</span>
                </button>
                <button
                  className="scanned-action-btn receipt"
                  onClick={() => {
                    onClose();
                    onQuickAction('RECEIPT', scannedItem);
                  }}
                >
                  <ArrowDownLeft size={15} color="#10b981" />
                  <span>Record Receipt</span>
                </button>
                <button
                  className="scanned-action-btn label"
                  onClick={() => {
                    onClose();
                    onPrintLabel(scannedItem);
                  }}
                >
                  <Tag size={15} color="#a1a1aa" />
                  <span>Print Tag</span>
                </button>
                <button
                  className="scanned-action-btn label"
                  onClick={() => {
                    onClose();
                    onInspectItem(scannedItem);
                  }}
                >
                  <Layers size={15} color="#a1a1aa" />
                  <span>Inspect</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="scanner-empty-hud">
              {isError ? (
                <>
                  <AlertCircle size={32} color="#ef4444" />
                  <div style={{ color: '#ef4444', fontWeight: 600 }}>{scanStatus}</div>
                  <div style={{ fontSize: '0.75rem', color: '#888888' }}>
                    No inventory part matches this code. Try scanning another barcode or click a preset above.
                  </div>
                </>
              ) : (
                <>
                  <Layers size={32} />
                  <div style={{ fontWeight: 600, color: '#ededed' }}>
                    Pull scanner gun trigger or select a preset
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#888888' }}>
                    Hardware keystroke sequences will automatically populate this workstation with instant audio feedback.
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="label-modal-footer">
          <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
            Shortcut: Press <kbd style={{ background: '#1c1c20', padding: '2px 5px', borderRadius: '4px', border: '1px solid #333' }}>F2</kbd> anywhere to open scanner
          </span>
          <button className="btn btn-secondary" onClick={onClose}>
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
