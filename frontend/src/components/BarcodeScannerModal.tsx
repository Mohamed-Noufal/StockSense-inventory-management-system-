import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X, Search, Scan, ArrowUpRight, ArrowDownLeft, Tag, Layers,
  AlertCircle, Camera, Check, ShieldCheck
} from 'lucide-react';
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
  const [scannerMode, setScannerMode] = useState<'gun' | 'camera'>('gun');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [auditVerified, setAuditVerified] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionAnimRef = useRef<number | null>(null);

  // Automatically focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Resolve barcode string to item
  const handleResolveCode = useCallback((code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setQuery(trimmed);
    setAuditVerified(false);

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

  // Global USB Barcode Scanner Wedge Hook (Keyboard Wedge Mode)
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

  // Camera Management
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (detectionAnimRef.current) {
      cancelAnimationFrame(detectionAnimRef.current);
      detectionAnimRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not available on this device/browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Feature detect BarcodeDetector API (modern Chrome/Edge/Android)
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['code_128', 'qr_code', 'ean_13', 'upc_a', 'data_matrix'],
        });

        const scanFrame = async () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const rawValue = barcodes[0].rawValue;
                if (rawValue) {
                  handleResolveCode(rawValue);
                  setScannerMode('gun'); // switch to resolved HUD card
                  stopCamera();
                  return;
                }
              }
            } catch {
              // Ignore frame decode errors
            }
          }
          detectionAnimRef.current = requestAnimationFrame(scanFrame);
        };
        detectionAnimRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      setCameraError(err.message || 'Unable to access device camera.');
    }
  }, [handleResolveCode, stopCamera]);

  useEffect(() => {
    if (scannerMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scannerMode, startCamera, stopCamera]);

  // Derived structured bin location for oilfield yards
  const storageBinDisplay = useMemo(() => {
    if (!scannedItem) return 'WH-MAIN';
    const wh = scannedItem.warehouse_name || 'Central';
    if (wh.includes('Central') || wh.includes('Cairo')) {
      return 'BAY-04 / RACK-B2';
    }
    if (wh.includes('Western')) {
      return 'YARD-01 / ROW-C';
    }
    return 'RIG-07 / BIN-03';
  }, [scannedItem]);

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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Camera / Gun Mode Switcher */}
            <button
              type="button"
              className="scanner-chip-btn"
              onClick={() => setScannerMode(scannerMode === 'camera' ? 'gun' : 'camera')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                backgroundColor: scannerMode === 'camera' ? '#2563eb' : '#18181b',
                color: scannerMode === 'camera' ? '#ffffff' : '#a1a1aa',
                borderColor: scannerMode === 'camera' ? '#3b82f6' : '#27272a',
              }}
              title="Toggle mobile device camera scanner"
            >
              <Camera size={13} />
              <span>{scannerMode === 'camera' ? 'Camera Mode' : 'Camera Scan'}</span>
            </button>

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
          {/* Camera Viewport (when active) */}
          {scannerMode === 'camera' && (
            <div className="camera-scanner-view">
              {cameraError ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#ef4444' }}>
                  <AlertCircle size={28} style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Camera Unavailable</div>
                  <div style={{ fontSize: '0.75rem', color: '#888888', marginTop: '4px' }}>
                    {cameraError}
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setScannerMode('gun')}
                    style={{ marginTop: '10px', fontSize: '0.75rem' }}
                  >
                    Return to USB Gun Wedge
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    className="camera-video-feed"
                    playsInline
                    muted
                  />
                  <div className="camera-laser-reticle">
                    <div className="camera-laser-line" />
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(0, 0, 0, 0.75)',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>Point camera at printed SKU tag or QR code</span>
                  </div>
                </>
              )}
            </div>
          )}

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
                  setAuditVerified(false);
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
                    {scannedItem.category_name} • Warehouse: {scannedItem.warehouse_name || 'Central Warehouse (Cairo Base)'}
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
                  <span className="scanned-stat-value" style={{ fontSize: '0.85rem', color: '#38bdf8' }}>
                    {storageBinDisplay}
                  </span>
                </div>
              </div>

              {/* Direct Quick Action Buttons */}
              <div className="scanned-actions-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                <button
                  className="scanned-action-btn issue"
                  onClick={() => {
                    onClose();
                    onQuickAction('ISSUE', scannedItem);
                  }}
                  title="Issue part to drilling rig or maintenance work order"
                >
                  <ArrowUpRight size={14} />
                  <span>Record Issue</span>
                </button>
                <button
                  className="scanned-action-btn receipt"
                  onClick={() => {
                    onClose();
                    onQuickAction('RECEIPT', scannedItem);
                  }}
                  title="Receive inbound shipment into warehouse stock"
                >
                  <ArrowDownLeft size={14} color="#10b981" />
                  <span>Record Receipt</span>
                </button>
                <button
                  className="scanned-action-btn label"
                  onClick={() => {
                    setAuditVerified(true);
                    soundEffects.playScanSuccess();
                  }}
                  style={{
                    backgroundColor: auditVerified ? 'rgba(16, 185, 129, 0.15)' : '#18181b',
                    borderColor: auditVerified ? '#10b981' : '#27272a',
                    color: auditVerified ? '#10b981' : '#ededed',
                  }}
                  title="Verify physical rack count matches system stock"
                >
                  {auditVerified ? <Check size={14} color="#10b981" /> : <ShieldCheck size={14} color="#38bdf8" />}
                  <span>{auditVerified ? 'Count Verified' : 'Audit Count'}</span>
                </button>
                <button
                  className="scanned-action-btn label"
                  onClick={() => {
                    onClose();
                    onPrintLabel(scannedItem);
                  }}
                  title="Print single-sheet 4x2 thermal shelf tag"
                >
                  <Tag size={14} color="#a1a1aa" />
                  <span>Print Tag</span>
                </button>
                <button
                  className="scanned-action-btn label"
                  onClick={() => {
                    onClose();
                    onInspectItem(scannedItem);
                  }}
                  title="Inspect 360-degree ledger history and safety stock"
                >
                  <Layers size={14} color="#a1a1aa" />
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
