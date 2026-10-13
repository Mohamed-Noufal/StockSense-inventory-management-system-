import React, { useState, useMemo } from 'react';
import { Printer, X, Tag, Download, Check, Sparkles } from 'lucide-react';
import { InventoryItem, InventoryLocation } from '../types';
import { generateCode128Svg, generateQrCodeSvg } from '../utils/barcode';

interface BinLabelModalProps {
  item: InventoryItem;
  location?: InventoryLocation;
  onClose: () => void;
}

export const BinLabelModal: React.FC<BinLabelModalProps> = ({
  item,
  location,
  onClose,
}) => {
  const [labelSize, setLabelSize] = useState<'4x2' | '2x1'>('4x2');
  const [downloaded, setDownloaded] = useState<boolean>(false);

  // Derived location string
  const binLocation = useMemo(() => {
    if (location?.code) return location.code;
    if (item.warehouse_name) {
      // Derive a realistic industrial rack-bin code from warehouse name
      return item.warehouse_name.toUpperCase().replace(/\s+/g, '-');
    }
    return 'WH-MAIN-A01-B03';
  }, [location, item]);

  // Code 128 SVG for SKU
  const barcodeSvg = useMemo(() => {
    return generateCode128Svg(item.sku, {
      height: labelSize === '4x2' ? 44 : 32,
      moduleWidth: labelSize === '4x2' ? 1.8 : 1.4,
      showText: true,
      quietZoneModules: 8,
    });
  }, [item.sku, labelSize]);

  // QR Code SVG
  const qrSvg = useMemo(() => {
    const payload = `stocksense://item/${item.sku}`;
    return generateQrCodeSvg(payload, {
      size: labelSize === '4x2' ? 70 : 45,
    });
  }, [item.sku, labelSize]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSvg = () => {
    const svgBlob = new Blob([barcodeSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `barcode_${item.sku}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  return (
    <div className="label-modal-backdrop" onClick={onClose}>
      <div className="label-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="label-modal-header">
          <div className="label-modal-title">
            <Tag size={16} />
            <span>Thermal Shelf & Bin Label Generator</span>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close (Esc)">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="label-modal-body">
          {/* Size Selector */}
          <div className="label-size-toggle">
            <button
              className={`label-size-btn ${labelSize === '4x2' ? 'active' : ''}`}
              onClick={() => setLabelSize('4x2')}
            >
              <span>4" × 2" Rack / Bin Tag (Zebra Standard)</span>
            </button>
            <button
              className={`label-size-btn ${labelSize === '2x1' ? 'active' : ''}`}
              onClick={() => setLabelSize('2x1')}
            >
              <span>2" × 1" Compact Part Sticker</span>
            </button>
          </div>

          {/* Physical Printable Label Container */}
          <div className="label-preview-wrapper">
            <div
              className={`printable-thermal-label size-${labelSize}`}
              id="printable-thermal-label-element"
            >
              {labelSize === '4x2' ? (
                <>
                  {/* Top Bar: Location & SKU */}
                  <div className="thermal-header-4x2">
                    <div>
                      <div className="thermal-bin-code">{binLocation}</div>
                      <div className="thermal-company-sub">StockSense Logistics • Bay 4</div>
                    </div>
                    <div className="thermal-sku-box">
                      <div className="thermal-sku-text">{item.sku}</div>
                      <div className="thermal-crit-tag">{item.criticality}</div>
                    </div>
                  </div>

                  {/* Body: Item Name & Barcode + QR */}
                  <div className="thermal-body-4x2">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="thermal-item-name">{item.name}</div>
                      <div className="thermal-item-meta">
                        {item.category_name} • Min ROP: {item.reorder_point ?? 10} • Stock: {item.total_on_hand} EA
                      </div>
                      <div
                        className="thermal-barcode-box"
                        dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                        style={{ marginTop: '6px' }}
                      />
                    </div>
                    <div
                      className="thermal-qr-box"
                      dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />
                  </div>

                  {/* Footer */}
                  <div className="thermal-footer-4x2">
                    <span>UNIT: ${(item.unit_cost_minor / 100).toFixed(2)}</span>
                    <span>TAG ID: {item.id.toString().padStart(6, '0')}</span>
                    <span>PRINTED: {todayStr}</span>
                  </div>
                </>
              ) : (
                /* 2x1 Compact Label Layout */
                <div className="thermal-compact-body">
                  <div className="thermal-compact-top">
                    <div className="thermal-compact-bin">{binLocation}</div>
                    <div className="thermal-compact-sku">{item.sku}</div>
                  </div>
                  <div className="thermal-compact-name">{item.name}</div>
                  <div
                    className="thermal-compact-barcode"
                    dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                  />
                  <div className="thermal-footer-4x2" style={{ border: 'none', paddingTop: 0 }}>
                    <span>{item.criticality}</span>
                    <span>{todayStr}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#888888' }}>
            <Sparkles size={14} color="#10b981" />
            <span>Pure vector SVG — 100% crisp printing with zero anti-aliasing blur on thermal heads.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="label-modal-footer">
          <button
            className="btn btn-secondary"
            onClick={handleDownloadSvg}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {downloaded ? <Check size={14} color="#10b981" /> : <Download size={14} />}
            <span>{downloaded ? 'Downloaded SVG' : 'Download SVG'}</span>
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={15} />
              <span>Print Thermal Tag</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
