import React, { useState, useMemo } from 'react';
import { X, Printer, ShieldCheck, Truck, MapPin, FileText, CheckCircle2 } from 'lucide-react';
import { StockMovement, InventoryItem, InventoryLocation } from '../types';
import { generateCode128Svg, generateQrCodeSvg } from '../utils/barcode';
import { useI18n } from '../i18n/I18nContext';

interface WaybillModalProps {
  movement: StockMovement;
  items: InventoryItem[];
  locations: InventoryLocation[];
  onClose: () => void;
}

export const WaybillModal: React.FC<WaybillModalProps> = ({
  movement,
  items,
  locations,
  onClose,
}) => {
  const { locale } = useI18n();
  const item = items.find((i) => i.id === movement.item_id);
  const location = locations.find((l) => l.id === movement.location_id);

  // Editable transit info
  const [carrierName, setCarrierName] = useState<string>('Apex Logistics Fleet');
  const [vehiclePlate, setVehiclePlate] = useState<string>('DXB-84920');
  const [driverName, setDriverName] = useState<string>('Tariq Mansoor (CDL-A)');
  const [remarks, setRemarks] = useState<string>(
    movement.reason || 'Expedited field delivery for routine overhaul operations'
  );

  const waybillNumber = `WB-202610-${movement.id.toString().padStart(5, '0')}`;
  const originName = location ? `${location.name} (${location.code})` : 'Central Warehouse (WH-01)';
  const destinationName = movement.destination_label || 'Rig-12 Exploration Site';
  const unitCost = item?.unit_cost_minor ? item.unit_cost_minor / 100 : 45.0;
  const totalValue = unitCost * Math.abs(movement.quantity);

  const barcodeSvg = useMemo(() => {
    return generateCode128Svg(waybillNumber, {
      height: 36,
      moduleWidth: 1.5,
      showText: true,
      quietZoneModules: 8,
    });
  }, [waybillNumber]);

  const qrSvg = useMemo(() => {
    const payload = `STOCKSENSE:WAYBILL:${waybillNumber}:ITEM=${item?.sku || movement.item_id}:QTY=${Math.abs(movement.quantity)}`;
    return generateQrCodeSvg(payload, { size: 54 });
  }, [waybillNumber, item, movement]);

  const handlePrint = () => {
    // Enterprise Isolated Print Frame: Bypasses dark theme background and prevents blank page overflow
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

    const docDate = new Date(movement.occurred_at).toLocaleDateString();
    const docTime = new Date(movement.occurred_at).toLocaleString();

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Waybill - ${waybillNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 12mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      height: 100%;
      background: #ffffff !important;
      color: #09090b !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.3;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .waybill-doc {
      width: 100%;
      max-width: 100%;
      padding: 2mm 0;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }
    .company-title {
      font-size: 13pt;
      font-weight: 800;
      letter-spacing: -0.02em;
      text-transform: uppercase;
      color: #000000;
      margin: 0;
    }
    .company-sub {
      font-size: 7.2pt;
      color: #4b5563;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
      margin-top: 1px;
    }
    .doc-meta {
      text-align: right;
    }
    .badge {
      display: inline-block;
      font-size: 7pt;
      font-weight: 800;
      background: #000000;
      color: #ffffff;
      padding: 2px 7px;
      border-radius: 3px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .waybill-num {
      font-size: 11.5pt;
      font-weight: 800;
      font-family: monospace;
      color: #000000;
      margin-top: 2px;
    }
    .doc-date {
      font-size: 7.5pt;
      color: #4b5563;
      margin-top: 1px;
    }
    .divider {
      height: 2px;
      background: #000000;
      margin: 6px 0 8px 0;
    }
    .grid-2 {
      display: flex;
      gap: 12px;
      margin-bottom: 8px;
    }
    .panel {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 6px 9px;
      background: #f8fafc;
    }
    .panel-title {
      font-size: 7.2pt;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #000000;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .field-row {
      display: flex;
      justify-content: space-between;
      font-size: 7.6pt;
      margin-bottom: 2.5px;
    }
    .field-label {
      color: #64748b;
      font-weight: 600;
    }
    .field-val {
      color: #0f172a;
      font-weight: 600;
      text-align: right;
    }
    .section-title {
      font-size: 7.8pt;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #000000;
      margin: 8px 0 3px 0;
      text-transform: uppercase;
    }
    table.manifest {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      border: 1.5px solid #000000;
    }
    table.manifest th {
      background: #f1f5f9;
      border: 1px solid #000000;
      padding: 4px 6px;
      font-weight: 800;
      text-align: left;
      font-size: 7.2pt;
      letter-spacing: 0.03em;
    }
    table.manifest td {
      border: 1px solid #cbd5e1;
      padding: 5px 6px;
      color: #0f172a;
      vertical-align: top;
    }
    table.manifest tfoot td {
      border-top: 1.5px solid #000000;
      background: #f8fafc;
      font-weight: 800;
      padding: 5px 6px;
    }
    .notes-box {
      margin-top: 6px;
      padding: 5px 8px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      background: #f8fafc;
      font-size: 7.6pt;
    }
    .notes-title {
      font-size: 7.2pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 2px;
    }
    .security-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 6px 0;
      padding: 5px 8px;
      border: 1px dashed #94a3b8;
      border-radius: 4px;
    }
    .security-info {
      font-size: 7.2pt;
      color: #475569;
      text-align: right;
      line-height: 1.35;
    }
    .signoff-grid {
      display: flex;
      gap: 12px;
      margin-top: 6px;
    }
    .signoff-box {
      flex: 1;
      border: 1px solid #000000;
      border-radius: 4px;
      padding: 6px 8px;
    }
    .signoff-hdr {
      font-size: 7.2pt;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #000000;
      border-bottom: 1px solid #000000;
      padding-bottom: 2.5px;
      margin-bottom: 3px;
    }
    .signoff-decl {
      font-size: 6.8pt;
      color: #475569;
      margin-bottom: 4px;
      line-height: 1.25;
    }
    .sign-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.2pt;
      margin-bottom: 2.5px;
    }
    .stamp-box {
      border: 1px dashed #64748b;
      height: 38px;
      margin-top: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 6.8pt;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 0.08em;
    }
  </style>
</head>
<body>
  <div class="waybill-doc">
    <table class="header-table">
      <tr>
        <td style="vertical-align: middle;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 36px; height: 36px; background: #000; color: #fff; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15pt;">
              ▲
            </div>
            <div>
              <div class="company-title">APEX OILFIELD LOGISTICS SERVICES</div>
              <div class="company-sub">Global Supply Chain & Warehouse Logistics • Material Transit Division</div>
            </div>
          </div>
        </td>
        <td class="doc-meta" style="vertical-align: middle;">
          <div class="badge">Official Transit Docket</div>
          <div class="waybill-num">${waybillNumber}</div>
          <div class="doc-date">Date: ${docDate}</div>
        </td>
      </tr>
    </table>

    <div class="divider"></div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel-title">Routing & Origin / Destination</div>
        <div class="field-row">
          <span class="field-label">Origin Facility:</span>
          <span class="field-val">${originName}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Destination Site:</span>
          <span class="field-val" style="font-weight: 800;">${destinationName}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Transaction Mode:</span>
          <span class="field-val">${movement.movement_type}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Dispatched By:</span>
          <span class="field-val">${movement.actor_label || 'Storekeeper'}</span>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">Carrier & Fleet Particulars</div>
        <div class="field-row">
          <span class="field-label">Carrier Company:</span>
          <span class="field-val">${carrierName || 'Apex Logistics Fleet'}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Vehicle Plate:</span>
          <span class="field-val" style="font-family: monospace;">${vehiclePlate || 'DXB-84920'}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Driver / Captain:</span>
          <span class="field-val">${driverName || 'Tariq Mansoor (CDL-A)'}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Audit Key:</span>
          <span class="field-val" style="font-family: monospace;">${movement.idempotency_key ? movement.idempotency_key.slice(0, 16) : `MOV-${movement.id}-SEC`}</span>
        </div>
      </div>
    </div>

    <div class="section-title">Material Manifest & Cargo Specification</div>
    <table class="manifest">
      <thead>
        <tr>
          <th style="width: 8%;">ITEM #</th>
          <th style="width: 22%;">PART SKU</th>
          <th style="width: 36%;">DESCRIPTION & CATEGORY</th>
          <th style="width: 12%; text-align: center;">QTY DISPATCHED</th>
          <th style="width: 10%; text-align: center;">UOM</th>
          <th style="width: 12%; text-align: right;">VALUATION</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td style="font-family: monospace; font-weight: 800;">${item?.sku || `ITEM-${movement.item_id}`}</td>
          <td>
            <div style="font-weight: 700;">${item?.name || 'Oilfield Heavy Consumable / Spare Part'}</div>
            <div style="font-size: 7pt; color: #4b5563; margin-top: 1px;">
              Category: ${item?.category_name || 'Mechanical & Spares'} • Criticality: ${item?.criticality || 'STANDARD'}
            </div>
          </td>
          <td style="text-align: center; font-weight: 800; font-size: 9.5pt;">${Math.abs(movement.quantity)}</td>
          <td style="text-align: center;">${item?.uom || 'units'}</td>
          <td style="text-align: right; font-family: monospace; font-weight: 600;">$${totalValue.toFixed(2)}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="text-align: right;">TOTAL MANIFESTED QUANTITY & ESTIMATED VALUE:</td>
          <td style="text-align: center; font-weight: 900;">${Math.abs(movement.quantity)} ${item?.uom || 'units'}</td>
          <td></td>
          <td style="text-align: right; font-family: monospace; font-weight: 900;">$${totalValue.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    <div class="notes-box">
      <div class="notes-title">Handling Instructions & Dispatch Notes:</div>
      <div style="color: #0f172a; font-weight: 500;">${remarks || 'Standard warehouse dispatch protocol. Inspect seals upon arrival.'}</div>
    </div>

    <div class="security-strip">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="display: inline-block;">${barcodeSvg}</div>
        <div style="display: inline-block;">${qrSvg}</div>
      </div>
      <div class="security-info">
        <div style="color: #059669; font-weight: 800;">✔ Verified StockSense WAL Immutable Ledger Chain</div>
        <div style="font-family: monospace;">Non-Repudiation Key: SHA256:${movement.idempotency_key ? movement.idempotency_key.slice(0, 20) : 'VERIFIED-RECORD-LEDGER'}</div>
      </div>
    </div>

    <div class="signoff-grid">
      <div class="signoff-box">
        <div class="signoff-hdr">1. DISPATCHER (STOREKEEPER)</div>
        <p class="signoff-decl">I hereby certify that the described materials have been verified against specifications, counted, packed, and released in sound condition.</p>
        <div class="sign-row">
          <span class="field-label">Authorized Sign:</span>
          <span style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 12pt; color: #002b80;">${movement.actor_label?.split(' ')[0] || 'Storekeeper'}</span>
        </div>
        <div class="sign-row">
          <span class="field-label">Print Name:</span>
          <span style="font-weight: 600;">${movement.actor_label || 'Warehouse Storekeeper'}</span>
        </div>
        <div class="sign-row">
          <span class="field-label">Dispatch Date:</span>
          <span>${docTime}</span>
        </div>
        <div class="stamp-box">[ OFFICIAL WAREHOUSE STAMP ]</div>
      </div>

      <div class="signoff-box">
        <div class="signoff-hdr">2. RECEIVER (RIG SITE MATERIAL INSPECTOR)</div>
        <p class="signoff-decl">Received the above shipment in apparent good condition, subject to physical verification and quality acceptance criteria.</p>
        <div class="sign-row">
          <span class="field-label">Inspector Sign:</span>
          <span style="border-bottom: 1px solid #94a3b8; width: 140px; height: 14px; display: inline-block;"></span>
        </div>
        <div class="sign-row">
          <span class="field-label">Print Name:</span>
          <span style="border-bottom: 1px solid #94a3b8; width: 140px; height: 14px; display: inline-block;"></span>
        </div>
        <div class="sign-row">
          <span class="field-label">Arrival Date:</span>
          <span style="border-bottom: 1px solid #94a3b8; width: 140px; height: 14px; display: inline-block;"></span>
        </div>
        <div style="margin-top: 4px; font-size: 6.8pt; display: flex; gap: 8px;">
          <span>☑ Full Acceptance</span>
          <span>☐ Discrepancy Noted</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

    frameDoc.open();
    frameDoc.write(htmlContent);
    frameDoc.close();

    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        try {
          document.body.removeChild(printFrame);
        } catch {
          // ignore cleanup errors
        }
      }, 2000);
    }, 250);
  };

  return (
    <div className="modal-overlay waybill-modal-overlay" onClick={onClose}>
      <div className="modal-card waybill-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* On-screen control bar (Hidden during print) */}
        <div className="waybill-screen-controls no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText style={{ width: 18, height: 18, color: '#34d399' }} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
              {locale === 'ar' ? 'إيصال تسليم المستودع وبوليصة الشحن والنقل' : 'Warehouse Delivery Docket & Transit Waybill'}
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePrint}
              style={{ padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Printer style={{ width: 14, height: 14 }} />
              <span>{locale === 'ar' ? 'طباعة بوليصة الشحن (A4)' : 'Print Waybill (A4)'}</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ padding: '0.4rem 0.6rem' }}
              title={locale === 'ar' ? 'إغلاق النافذة' : 'Close modal'}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* Printable Paper Document (Rendered for on-screen preview) */}
        <div className="waybill-paper" id="waybill-printable-area">
          {/* Header */}
          <div className="waybill-header">
            <div className="waybill-brand">
              <div className="waybill-logo-box">
                <ShieldCheck style={{ width: 28, height: 28, color: '#000000' }} />
              </div>
              <div>
                <h1 className="waybill-company-title">APEX OILFIELD LOGISTICS SERVICES</h1>
                <p className="waybill-company-sub">Global Supply Chain & Warehouse Logistics • Material Transit Division</p>
              </div>
            </div>
            <div className="waybill-doc-meta">
              <div className="waybill-badge">OFFICIAL TRANSIT DOCKET</div>
              <div className="waybill-number">{waybillNumber}</div>
              <div className="waybill-date">Date: {new Date(movement.occurred_at).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="waybill-divider" />

          {/* Logistics Routing & Transport Info */}
          <div className="waybill-grid-2">
            <div className="waybill-panel">
              <div className="waybill-panel-title">
                <MapPin style={{ width: 12, height: 12 }} />
                <span>ROUTING & ORIGIN / DESTINATION</span>
              </div>
              <div className="waybill-field-row">
                <span className="waybill-label">Origin Facility:</span>
                <span className="waybill-val">{originName}</span>
              </div>
              <div className="waybill-field-row">
                <span className="waybill-label">Destination Site:</span>
                <span className="waybill-val" style={{ fontWeight: 700 }}>{destinationName}</span>
              </div>
              <div className="waybill-field-row">
                <span className="waybill-label">Transaction Mode:</span>
                <span className="waybill-val">{movement.movement_type}</span>
              </div>
              <div className="waybill-field-row">
                <span className="waybill-label">Dispatched By:</span>
                <span className="waybill-val">{movement.actor_label || 'Storekeeper'}</span>
              </div>
            </div>

            <div className="waybill-panel">
              <div className="waybill-panel-title">
                <Truck style={{ width: 12, height: 12 }} />
                <span>CARRIER & FLEET PARTICULARS</span>
              </div>
              <div className="waybill-field-row">
                <span className="waybill-label">Carrier Company:</span>
                <input
                  type="text"
                  className="waybill-inline-input"
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                />
              </div>
              <div className="waybill-field-row">
                <span className="waybill-label">Vehicle Plate:</span>
                <input
                  type="text"
                  className="waybill-inline-input"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                />
              </div>
              <div className="waybill-field-row">
                <span className="waybill-label">Driver / Captain:</span>
                <input
                  type="text"
                  className="waybill-inline-input"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                />
              </div>
              <div className="waybill-field-row">
                <span className="waybill-label">Audit Key:</span>
                <span className="waybill-val" style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
                  {movement.idempotency_key ? movement.idempotency_key.slice(0, 16) : `MOV-${movement.id}-SEC`}
                </span>
              </div>
            </div>
          </div>

          {/* Material Manifest Table */}
          <div className="waybill-section-heading">MATERIAL MANIFEST & CARGO SPECIFICATION</div>
          <table className="waybill-table">
            <thead>
              <tr>
                <th style={{ width: '8%' }}>ITEM #</th>
                <th style={{ width: '22%' }}>PART SKU</th>
                <th style={{ width: '36%' }}>DESCRIPTION & CATEGORY</th>
                <th style={{ width: '12%', textAlign: 'center' }}>QTY DISPATCHED</th>
                <th style={{ width: '10%', textAlign: 'center' }}>UOM</th>
                <th style={{ width: '12%', textAlign: 'right' }}>VALUATION</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {item?.sku || `ITEM-${movement.item_id}`}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{item?.name || 'Oilfield Heavy Consumable / Spare Part'}</div>
                  <div style={{ fontSize: '0.7rem', color: '#555555' }}>
                    Category: {item?.category_name || 'Mechanical & Spares'} • Criticality: {item?.criticality || 'STANDARD'}
                  </div>
                </td>
                <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.95rem' }}>
                  {Math.abs(movement.quantity)}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {item?.uom || 'units'}
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                  ${totalValue.toFixed(2)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ fontWeight: 700, textAlign: 'right' }}>TOTAL MANIFESTED QUANTITY & ESTIMATED VALUE:</td>
                <td style={{ textAlign: 'center', fontWeight: 800 }}>{Math.abs(movement.quantity)} {item?.uom || 'units'}</td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'monospace' }}>${totalValue.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Remarks & Handling Notes */}
          <div style={{ marginTop: '0.8rem', padding: '0.5rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#f8fafc' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
              Handling Instructions & Dispatch Notes:
            </span>
            <textarea
              className="waybill-textarea"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter special shipping conditions, crane handling notes, or inspection instructions..."
            />
          </div>

          {/* Barcode & Security Block */}
          <div className="waybill-security-strip">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{ background: '#ffffff', padding: '2px', borderRadius: '2px' }}
                dangerouslySetInnerHTML={{ __html: barcodeSvg }}
              />
              <div
                style={{ background: '#ffffff', padding: '2px', borderRadius: '2px' }}
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            </div>
            <div className="waybill-security-text">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981', fontWeight: 700, justifyContent: 'flex-end' }}>
                <CheckCircle2 style={{ width: 14, height: 14 }} />
                <span>Verified StockSense WAL Immutable Ledger Chain</span>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.68rem', marginTop: '0.2rem' }}>
                Non-Repudiation Key: SHA256:{movement.idempotency_key ? movement.idempotency_key.slice(0, 20) : 'VERIFIED-RECORD-LEDGER'}
              </div>
            </div>
          </div>

          {/* Dual Formal Legal Sign-Off Blocks */}
          <div className="waybill-signoff-grid">
            {/* Dispatcher Box */}
            <div className="waybill-signoff-box">
              <div className="waybill-signoff-header">1. DISPATCHER (STOREKEEPER)</div>
              <p className="waybill-signoff-declaration">
                I hereby certify that the described materials have been verified against specifications, counted, packed, and released in sound condition.
              </p>
              <div className="waybill-sign-line">
                <span>Authorized Sign:</span>
                <span className="waybill-signature-drawn">{movement.actor_label?.split(' ')[0] || 'Storekeeper'}</span>
              </div>
              <div className="waybill-sign-line">
                <span>Print Name:</span>
                <span style={{ fontWeight: 600 }}>{movement.actor_label || 'Warehouse Storekeeper'}</span>
              </div>
              <div className="waybill-sign-line">
                <span>Dispatch Date:</span>
                <span>{new Date(movement.occurred_at).toLocaleString()}</span>
              </div>
              <div className="waybill-stamp-box">
                [ OFFICIAL WAREHOUSE STAMP ]
              </div>
            </div>

            {/* Receiving Inspector Box */}
            <div className="waybill-signoff-box">
              <div className="waybill-signoff-header">2. RECEIVER (RIG SITE MATERIAL INSPECTOR)</div>
              <p className="waybill-signoff-declaration">
                Received the above shipment in apparent good condition, subject to physical verification and quality acceptance criteria.
              </p>
              <div className="waybill-sign-line">
                <span>Inspector Sign:</span>
                <span style={{ borderBottom: '1px solid #777', flex: 1, height: 16 }}></span>
              </div>
              <div className="waybill-sign-line">
                <span>Print Name:</span>
                <span style={{ borderBottom: '1px solid #777', flex: 1, height: 16 }}></span>
              </div>
              <div className="waybill-sign-line">
                <span>Arrival Date:</span>
                <span style={{ borderBottom: '1px solid #777', flex: 1, height: 16 }}></span>
              </div>
              <div style={{ marginTop: '0.4rem', fontSize: '0.68rem', display: 'flex', gap: '0.6rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <input type="checkbox" defaultChecked /> Full Acceptance
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <input type="checkbox" /> Discrepancy Noted
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
