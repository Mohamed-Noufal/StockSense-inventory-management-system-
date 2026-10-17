import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X, Search, Scan, ArrowUpRight, ArrowDownLeft, Tag, Layers,
  AlertCircle, Camera, Check, ShieldCheck, CheckCircle2,
  PackagePlus
} from 'lucide-react';
import { InventoryItem, PurchaseOrder, Supplier } from '../types';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { soundEffects } from '../utils/audio';
import { useI18n } from '../i18n/I18nContext';
import { translateCategory, translateWarehouse } from '../i18n/translations';

interface BarcodeScannerModalProps {
  items: InventoryItem[];
  orders?: PurchaseOrder[];
  suppliers?: Supplier[];
  onClose: () => void;
  onQuickAction: (action: 'ISSUE' | 'RECEIPT', item: InventoryItem) => void;
  onPrintLabel: (item: InventoryItem) => void;
  onInspectItem: (item: InventoryItem) => void;
  onOnboardNewItem?: (scannedCode: string) => void;
  onReceivePOLine?: (po: PurchaseOrder, lineId: number, qty: number) => Promise<void>;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  items,
  orders = [],
  suppliers: _suppliers = [],
  onClose,
  onQuickAction,
  onPrintLabel,
  onInspectItem,
  onOnboardNewItem,
  onReceivePOLine,
}) => {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState<string>('');
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [matchedVendorSku, setMatchedVendorSku] = useState<string | null>(null);
  const [scannedPO, setScannedPO] = useState<PurchaseOrder | null>(null);
  const [selectedPoLineId, setSelectedPoLineId] = useState<number | null>(null);
  const [poReceiveQty, setPoReceiveQty] = useState<number>(1);
  const [poReceiving, setPoReceiving] = useState<boolean>(false);
  const [poSuccessMsg, setPoSuccessMsg] = useState<string | null>(null);

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

  // Universal Code Resolution Engine
  const handleResolveCode = useCallback((code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setQuery(trimmed);
    setAuditVerified(false);
    setScannedPO(null);
    setScannedItem(null);
    setMatchedVendorSku(null);
    setPoSuccessMsg(null);

    // 1. Check if scanned code is a Purchase Order docket
    if (orders && orders.length > 0) {
      const foundPO = orders.find(
        (o) => o.po_number.toUpperCase() === trimmed ||
               (trimmed.startsWith('PO-') && o.po_number.toUpperCase().includes(trimmed))
      );
      if (foundPO) {
        setScannedPO(foundPO);
        setIsError(false);
        setScanStatus(`Scanned PO: ${foundPO.po_number}`);
        soundEffects.playScanSuccess();
        if (foundPO.lines && foundPO.lines.length > 0) {
          const firstPending = foundPO.lines.find((l) => l.qty_received < l.qty_ordered) || foundPO.lines[0];
          setSelectedPoLineId(firstPending.id);
          setPoReceiveQty(Math.max(1, firstPending.qty_ordered - firstPending.qty_received));
        }
        return;
      }
    }

    // 2. Check internal SKU or Item ID
    const foundItem = items.find(
      (it) => it.sku.toUpperCase() === trimmed ||
              it.sku.toUpperCase().includes(trimmed) ||
              it.id.toString() === trimmed
    );
    if (foundItem) {
      setScannedItem(foundItem);
      setIsError(false);
      setScanStatus(`Scanned: ${foundItem.sku}`);
      soundEffects.playScanSuccess();
      return;
    }

    // 3. Check vendor part number alias (item_suppliers)
    const foundByVendor = items.find(
      (it) => it.supplier_skus && it.supplier_skus.some((s) => s.toUpperCase() === trimmed || s.toUpperCase().includes(trimmed))
    );
    if (foundByVendor) {
      setScannedItem(foundByVendor);
      setMatchedVendorSku(trimmed);
      setIsError(false);
      setScanStatus(`Resolved Vendor Part Alias: ${trimmed} → ${foundByVendor.sku}`);
      soundEffects.playScanSuccess();
      return;
    }

    // 4. Unknown barcode
    setScannedItem(null);
    setScannedPO(null);
    setIsError(true);
    setScanStatus(`Unknown Code: "${trimmed}"`);
    soundEffects.playScanError();
  }, [items, orders]);

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

      // Feature detect BarcodeDetector API
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
                  setScannerMode('gun');
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

  // Handle PO Line Inbound Receipt
  const handleExecutePoReceive = async () => {
    if (!scannedPO || !selectedPoLineId || !onReceivePOLine) return;
    setPoReceiving(true);
    try {
      await onReceivePOLine(scannedPO, selectedPoLineId, poReceiveQty);
      soundEffects.playScanSuccess();
      setPoSuccessMsg(`Successfully received ${poReceiveQty} units against ${scannedPO.po_number}!`);
    } catch (err: any) {
      soundEffects.playScanError();
    } finally {
      setPoReceiving(false);
    }
  };

  // Preset demonstration codes covering: Internal SKU, Vendor Part Number, and PO Number
  const samplePresets = [
    { label: 'SLV-SEAT-01 (SKU)', code: 'SLV-SEAT-01', type: 'Internal SKU' },
    { label: 'VND-SLV-SEAT-01 (Vendor Part)', code: 'VND-SLV-SEAT-01', type: 'Vendor Part Alias' },
    { label: 'PO-202610-001 (PO Docket)', code: 'PO-202610-001', type: 'Inbound PO' },
    { label: 'IMP-750-02 (SKU)', code: 'IMP-750-02', type: 'Internal SKU' },
    { label: 'PO-202610-005 (PO Docket)', code: 'PO-202610-005', type: 'Inbound PO' },
  ];

  return (
    <div className="scanner-modal-backdrop" onClick={onClose}>
      <div className="scanner-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="scanner-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Scan size={18} color="#ededed" />
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ededed' }}>
              {locale === 'ar' ? 'ماسح الباركود الضوئي وإشعارات الشحن الواردة' : 'Universal Optical Barcode & Delivery Docket Scanner'}
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
              <span>{scannerMode === 'camera' ? (locale === 'ar' ? 'الكاميرا نشطة' : 'Camera Active') : (locale === 'ar' ? 'مسح بالكاميرا' : 'Camera Scan')}</span>
            </button>

            <div className="scanner-status-pulse">
              <span className="pulse-dot" />
              <span>{locale === 'ar' ? 'القارئ الليزري جاهز' : 'USB Wedge Active'}</span>
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
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{locale === 'ar' ? 'الكاميرا غير متاحة' : 'Camera Unavailable'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#888888', marginTop: '4px' }}>
                    {cameraError}
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setScannerMode('gun')}
                    style={{ marginTop: '10px', fontSize: '0.75rem' }}
                  >
                    {locale === 'ar' ? 'العودة للقارئ اليدوي' : 'Return to USB Gun Wedge'}
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
                    <span>{locale === 'ar' ? 'وجّه الكاميرا نحو ملصق الباركود للصنف أو بوليصة أمر الشراء' : 'Point camera at printed SKU tag, vendor barcode, or PO waybill'}</span>
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
              placeholder={t('scanner.search_placeholder')}
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
                  setScannedPO(null);
                  setMatchedVendorSku(null);
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
              {t('scanner.presets_title')}
            </div>
            <div className="scanner-chips-row">
              {samplePresets.map((preset) => (
                <button
                  key={preset.code}
                  className="scanner-chip-btn"
                  onClick={() => handleResolveCode(preset.code)}
                  title={`Simulate scan of ${preset.type}: ${preset.code}`}
                >
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Output Zone: 1. Purchase Order Inbound Receiving HUD */}
          {scannedPO ? (
            <div className="scanned-item-card">
              <div className="scanned-item-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="scanned-sku-badge" style={{ color: '#38bdf8' }}>{scannedPO.po_number}</div>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                      }}
                    >
                      {t('scanner.inbound_docket')}
                    </span>
                  </div>
                  <div className="scanned-item-title">
                    {t('scanner.supplier')} {scannedPO.supplier_name || 'Apex Seals & Hydraulics Ltd'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#888888', marginTop: '2px' }}>
                    {t('scanner.expected')} {scannedPO.expected_date ? scannedPO.expected_date.split('T')[0] : (locale === 'ar' ? 'اليوم' : 'Today')} • {t('scanner.destination')} {translateWarehouse('Central Warehouse (Cairo Base)', locale)}
                  </div>
                </div>
                <div
                  className="status-pill"
                  style={{
                    backgroundColor: scannedPO.status === 'RECEIVED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                    color: scannedPO.status === 'RECEIVED' ? '#10b981' : '#38bdf8',
                    border: '1px solid currentColor',
                  }}
                >
                  {scannedPO.status}
                </div>
              </div>

              {/* PO Line Items Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0.75rem 0', borderTop: '1px solid #1f1f23', borderBottom: '1px solid #1f1f23' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>
                  {t('scanner.delivery_lines')}
                </div>
                {scannedPO.lines && scannedPO.lines.map((line) => {
                  const remaining = line.qty_ordered - line.qty_received;
                  const isDone = remaining <= 0;
                  const itm = items.find((i) => i.id === line.item_id);

                  return (
                    <div
                      key={line.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        background: selectedPoLineId === line.id ? '#1a1a22' : '#141418',
                        border: selectedPoLineId === line.id ? '1px solid #38bdf8' : '1px solid #27272a',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setSelectedPoLineId(line.id);
                        if (remaining > 0) setPoReceiveQty(remaining);
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', fontFamily: 'monospace' }}>
                          {line.item_sku || itm?.sku || `ITEM #${line.item_id}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                          {line.item_name || itm?.name || 'Oilfield Replacement Part'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isDone ? '#10b981' : '#f59e0b', fontFamily: 'monospace' }}>
                          {line.qty_received} / {line.qty_ordered} EA
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#71717a' }}>
                          {isDone ? (locale === 'ar' ? 'مكتمل' : 'Completed') : (locale === 'ar' ? `متبقي ${remaining}` : `${remaining} remaining`)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PO Inbound Receiving Actions */}
              {poSuccessMsg ? (
                <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', color: '#10b981', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} />
                    <span>{poSuccessMsg}</span>
                  </div>
                  {scannedPO.lines && scannedPO.lines[0] && (
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                      onClick={() => {
                        const targetItm = items.find((i) => i.id === scannedPO.lines[0].item_id);
                        if (targetItm) {
                          onClose();
                          onPrintLabel(targetItm);
                        }
                      }}
                    >
                      {locale === 'ar' ? 'طباعة ملصق الرف 4"x2"' : 'Print 4"x2" Shelf Tag'}
                    </button>
                  )}
                </div>
              ) : (
                scannedPO.status !== 'RECEIVED' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>{locale === 'ar' ? 'الكمية المستلمة:' : 'Receive Qty:'}</span>
                      <input
                        type="number"
                        min="1"
                        value={poReceiveQty}
                        onChange={(e) => setPoReceiveQty(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{
                          width: '70px',
                          background: '#18181b',
                          border: '1px solid #333338',
                          borderRadius: '4px',
                          color: '#ffffff',
                          padding: '4px 8px',
                          fontSize: '0.85rem',
                          fontFamily: 'monospace',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="scanned-action-btn issue"
                        onClick={handleExecutePoReceive}
                        disabled={poReceiving}
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        <Check size={14} color="#000000" />
                        <span>{poReceiving ? t('scanner.receiving_btn') : t('scanner.receive_btn')}</span>
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : scannedItem ? (
            /* Output Zone: 2. Resolved Inventory Item Card */
            <div className="scanned-item-card">
              <div className="scanned-item-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="scanned-sku-badge">{scannedItem.sku}</div>
                    {matchedVendorSku && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                        }}
                      >
                        {locale === 'ar' ? `كود القطعة لدى المورد: ${matchedVendorSku}` : `Vendor Part Alias: ${matchedVendorSku}`}
                      </span>
                    )}
                  </div>
                  <div className="scanned-item-title">{scannedItem.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#888888', marginTop: '2px' }}>
                    {translateCategory(scannedItem.category_name || 'General', locale)} • {locale === 'ar' ? 'المستودع:' : 'Warehouse:'} {translateWarehouse(scannedItem.warehouse_name || 'Central Warehouse (Cairo Base)', locale)}
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
                  {scannedItem.criticality === 'CRITICAL' ? (locale === 'ar' ? 'خطر حرج' : 'CRITICAL') : (locale === 'ar' ? 'قياسي' : 'STANDARD')}
                </div>
              </div>

              {/* 4-Stat HUD Grid */}
              <div className="scanned-item-stats">
                <div className="scanned-stat-box">
                  <span className="scanned-stat-label">{locale === 'ar' ? 'الرصيد الفعلي' : 'Stock On Hand'}</span>
                  <span className="scanned-stat-value" style={{ color: scannedItem.total_on_hand <= (scannedItem.reorder_point ?? 10) ? '#f59e0b' : '#10b981' }}>
                    {scannedItem.total_on_hand} {locale === 'ar' ? 'وحدة' : 'EA'}
                  </span>
                </div>
                <div className="scanned-stat-box">
                  <span className="scanned-stat-label">{locale === 'ar' ? 'حد الطلب' : 'Reorder Point'}</span>
                  <span className="scanned-stat-value">{scannedItem.reorder_point ?? 10} {locale === 'ar' ? 'وحدة' : 'EA'}</span>
                </div>
                <div className="scanned-stat-box">
                  <span className="scanned-stat-label">{locale === 'ar' ? 'سعر الوحدة' : 'Unit Cost'}</span>
                  <span className="scanned-stat-value">${(scannedItem.unit_cost_minor / 100).toFixed(2)}</span>
                </div>
                <div className="scanned-stat-box">
                  <span className="scanned-stat-label">{locale === 'ar' ? 'موقع الرف' : 'Storage Bin'}</span>
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
                  <span>{t('scanner.btn_issue')}</span>
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
                  <span>{t('scanner.btn_receive')}</span>
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
                  <span>{auditVerified ? (locale === 'ar' ? 'تم التحقق' : 'Count Verified') : (locale === 'ar' ? 'جرد فعلي' : 'Audit Count')}</span>
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
                  <span>{t('scanner.btn_print_tag')}</span>
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
                  <span>{t('scanner.btn_inspect')}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Output Zone: 3. Empty or Unknown Barcode State */
            <div className="scanner-empty-hud">
              {isError ? (
                <>
                  <AlertCircle size={32} color="#ef4444" />
                  <div style={{ color: '#ef4444', fontWeight: 600 }}>{scanStatus}</div>
                  <div style={{ fontSize: '0.75rem', color: '#888888', maxWidth: '420px' }}>
                    {locale === 'ar'
                      ? `لا يوجد صنف في الدليل أو أمر شراء مفتوح يطابق الكود "${query}".`
                      : `No catalog item, vendor part alias, or open Purchase Order matches code "${query}".`}
                  </div>
                  {onOnboardNewItem && (
                    <button
                      className="btn btn-primary"
                      onClick={() => onOnboardNewItem(query)}
                      style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <PackagePlus size={15} />
                      <span>{locale === 'ar' ? `+ تسجيل "${query}" كصنف جديد في الدليل` : `+ Onboard "${query}" as New Catalog Item`}</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <Layers size={32} />
                  <div style={{ fontWeight: 600, color: '#ededed' }}>
                    {locale === 'ar' ? 'اضغط زناد قارئ الباركود، أو وجّه الكاميرا، أو اختر نموذجاً تجريبياً' : 'Pull scanner gun trigger, scan camera, or select a preset'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#888888', maxWidth: '420px' }}>
                    {locale === 'ar'
                      ? 'يدعم القارئ الذكي رموز الأصناف الداخلية، أكواد الموردين، وبوالص أوامر الشراء تلقائياً.'
                      : 'Universal scanner accepts Internal SKUs, Supplier Part Numbers, or Inbound Purchase Order waybills with automatic cross-referencing.'}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="label-modal-footer">
          <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
            {locale === 'ar' ? (
              <>اختصار: اضغط <kbd style={{ background: '#1c1c20', padding: '2px 5px', borderRadius: '4px', border: '1px solid #333' }}>F2</kbd> في أي شاشة لفتح القارئ</>
            ) : (
              <>Shortcut: Press <kbd style={{ background: '#1c1c20', padding: '2px 5px', borderRadius: '4px', border: '1px solid #333' }}>F2</kbd> anywhere to open scanner</>
            )}
          </span>
          <button className="btn btn-secondary" onClick={onClose}>
            {locale === 'ar' ? 'إغلاق القارئ' : 'Close Scanner'}
          </button>
        </div>
      </div>
    </div>
  );
};
