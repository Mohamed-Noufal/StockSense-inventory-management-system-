import React, { useState, useMemo } from 'react';
import { Printer, X, Tag, Download, Check, Sparkles } from 'lucide-react';
import { InventoryItem, InventoryLocation } from '../types';
import { generateCode128Svg, generateQrCodeSvg } from '../utils/barcode';
import { useI18n } from '../i18n/I18nContext';

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
  const { locale } = useI18n();
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

  // Add body class for print scoping when modal is open
  React.useEffect(() => {
    document.body.classList.add('has-thermal-modal');
    return () => {
      document.body.classList.remove('has-thermal-modal');
    };
  }, []);

  const handlePrint = () => {
    const labelEl = document.getElementById('printable-thermal-label-element');
    if (!labelEl) {
      window.print();
      return;
    }

    // Enterprise Isolated Print Frame: Prevents page-break sprawl and background DOM bleed
    const printFrame = document.createElement('iframe');
    printFrame.setAttribute('aria-hidden', 'true');
    printFrame.style.position = 'fixed';
    printFrame.style.top = '-9999px';
    printFrame.style.left = '-9999px';
    printFrame.style.width = '0px';
    printFrame.style.height = '0px';
    printFrame.style.border = 'none';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) {
      window.print();
      return;
    }

    const widthIn = labelSize === '4x2' ? '4in' : '2in';
    const heightIn = labelSize === '4x2' ? '2in' : '1in';

    frameDoc.open();
    frameDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>StockSense Label - ${item.sku}</title>
  <style>
    @page {
      size: ${widthIn} ${heightIn};
      margin: 0;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: ${widthIn};
      height: ${heightIn};
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .printable-thermal-label {
      width: ${widthIn} !important;
      height: ${heightIn} !important;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: ${labelSize === '4x2' ? '0.12in 0.16in' : '0.06in 0.08in'} !important;
      page-break-after: avoid !important;
      page-break-inside: avoid !important;
      overflow: hidden;
    }
    .thermal-header-4x2 {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #000000;
      padding-bottom: 4px;
    }
    .thermal-bin-code {
      font-family: monospace;
      font-size: 1.35rem;
      font-weight: 900;
      letter-spacing: -0.5px;
      line-height: 1;
    }
    .thermal-company-sub {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #333333;
      margin-top: 2px;
    }
    .thermal-sku-box {
      text-align: right;
    }
    .thermal-sku-text {
      font-family: monospace;
      font-size: 1rem;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .thermal-crit-tag {
      display: inline-block;
      font-size: 0.6rem;
      font-weight: 800;
      text-transform: uppercase;
      border: 1px solid #000000;
      padding: 1px 4px;
      border-radius: 2px;
      margin-top: 2px;
    }
    .thermal-body-4x2 {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin: 4px 0;
    }
    .thermal-item-name {
      font-size: 0.8rem;
      font-weight: 700;
      line-height: 1.2;
      max-height: 2.4em;
      overflow: hidden;
    }
    .thermal-item-meta {
      font-size: 0.65rem;
      font-weight: 600;
      color: #444444;
      margin-top: 2px;
    }
    .thermal-barcode-box {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .thermal-barcode-box svg {
      max-width: 100%;
      height: auto;
    }
    .thermal-qr-box {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .thermal-qr-box svg {
      display: block;
    }
    .thermal-footer-4x2 {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #000000;
      padding-top: 4px;
      font-family: monospace;
      font-size: 0.625rem;
      font-weight: 600;
    }
    .thermal-compact-body {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
    }
    .thermal-compact-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #000000;
      padding-bottom: 2px;
    }
    .thermal-compact-bin {
      font-family: monospace;
      font-size: 0.95rem;
      font-weight: 900;
    }
    .thermal-compact-sku {
      font-family: monospace;
      font-size: 0.8rem;
      font-weight: 800;
    }
    .thermal-compact-name {
      font-size: 0.65rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }
    .thermal-compact-barcode {
      display: flex;
      justify-content: center;
      margin: 2px 0;
    }
  </style>
</head>
<body>
  ${labelEl.outerHTML}
</body>
</html>`);
    frameDoc.close();

    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 1500);
    }, 250);
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
            <span>{locale === 'ar' ? 'مُولّد ملصقات الأرفف والصناديق الحرارية' : 'Thermal Shelf & Bin Label Generator'}</span>
          </div>
          <button className="btn-icon" onClick={onClose} title={locale === 'ar' ? 'إغلاق (Esc)' : 'Close (Esc)'}>
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
              <span>{locale === 'ar' ? 'ملصق رفوف / صناديق 4" × 2" (معيار زيبرا)' : '4" × 2" Rack / Bin Tag (Zebra Standard)'}</span>
            </button>
            <button
              className={`label-size-btn ${labelSize === '2x1' ? 'active' : ''}`}
              onClick={() => setLabelSize('2x1')}
            >
              <span>{locale === 'ar' ? 'ملصق أجزاء مدمج 2" × 1"' : '2" × 1" Compact Part Sticker'}</span>
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
            <span>{locale === 'ar' ? 'رسومات شعاعية SVG نقية — طباعة عالية الوضوح بنسبة 100% بدون تشويش على الرؤوس الحرارية.' : 'Pure vector SVG — 100% crisp printing with zero anti-aliasing blur on thermal heads.'}</span>
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
            <span>
              {locale === 'ar'
                ? (downloaded ? 'تم تنزيل SVG' : 'تنزيل كـ SVG')
                : (downloaded ? 'Downloaded SVG' : 'Download SVG')}
            </span>
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              className="btn btn-primary"
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={15} />
              <span>{locale === 'ar' ? 'طباعة الملصق الحراري' : 'Print Thermal Tag'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
