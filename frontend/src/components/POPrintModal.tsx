import React, { useMemo } from 'react';
import { X, Printer, FileText } from 'lucide-react';
import { PurchaseOrder, Supplier, InventoryItem, InventoryLocation } from '../types';
import { generateCode128Svg, generateQrCodeSvg } from '../utils/barcode';

interface POPrintModalProps {
  po: PurchaseOrder;
  supplier?: Supplier;
  items?: InventoryItem[];
  locations?: InventoryLocation[];
  onClose: () => void;
}

export const POPrintModal: React.FC<POPrintModalProps> = ({
  po,
  supplier,
  items = [],
  locations = [],
  onClose,
}) => {
  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const poNumber = po.po_number || `PO-${po.id.toString().padStart(6, '0')}`;
  const totalAmountFormatted = (po.total_amount_minor / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const orderDateFormatted = po.order_date
    ? new Date(po.order_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : po.created_at
    ? new Date(po.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Pending Approval';

  const expectedDateFormatted = po.expected_date
    ? new Date(po.expected_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Standard Delivery (14 Business Days)';

  const primaryDestId = po.lines[0]?.destination_location_id;
  const destinationLoc = locations.find((l) => l.id === primaryDestId);
  const warehouseName = destinationLoc ? `${destinationLoc.name} (${destinationLoc.code})` : 'Central Receiving Yard (WH-01)';

  // Barcode & QR code generation
  const barcodeSvg = useMemo(() => {
    return generateCode128Svg(poNumber, {
      height: 38,
      moduleWidth: 1.5,
      showText: true,
      quietZoneModules: 8,
    });
  }, [poNumber]);

  const qrSvg = useMemo(() => {
    const payload = `STOCKSENSE:PO:${poNumber}:SUPPLIER=${po.supplier_id}:VAL=${po.total_amount_minor}:STATUS=${po.status}`;
    return generateQrCodeSvg(payload, { size: 56 });
  }, [poNumber, po]);

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

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Purchase Order - ${poNumber}</title>
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
      font-size: 9.5pt;
      line-height: 1.3;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .po-doc {
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
      margin-top: 2px;
    }
    .doc-meta {
      text-align: right;
      vertical-align: top;
    }
    .badge {
      display: inline-block;
      padding: 2px 7px;
      font-size: 7.2pt;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border: 1.5px solid #000000;
      border-radius: 3px;
      background: #f8fafc;
      color: #000000;
      margin-bottom: 3px;
    }
    .po-num {
      font-size: 12.5pt;
      font-weight: 800;
      font-family: monospace;
      color: #000000;
      letter-spacing: 0.02em;
    }
    .doc-date {
      font-size: 7.8pt;
      color: #4b5563;
      margin-top: 1px;
    }
    .divider {
      height: 2px;
      background: #000000;
      margin: 4px 0 8px 0;
    }
    .grid-2 {
      display: table;
      width: 100%;
      table-layout: fixed;
      margin-bottom: 8px;
    }
    .panel {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      border: 1px solid #94a3b8;
      padding: 6px 8px;
      background: #ffffff;
    }
    .panel:first-child {
      border-right: none;
    }
    .panel-title {
      font-size: 7.5pt;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #000000;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3px;
      margin-bottom: 4px;
    }
    .field-row {
      font-size: 7.8pt;
      margin-bottom: 2.5px;
      display: flex;
      justify-content: space-between;
    }
    .field-label {
      color: #64748b;
      font-weight: 600;
      width: 42%;
      display: inline-block;
    }
    .field-val {
      color: #0f172a;
      font-weight: 600;
      width: 58%;
      display: inline-block;
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
      font-size: 7.5pt;
    }
    .notes-title {
      font-size: 7.2pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 2px;
    }
    .terms-box {
      margin-top: 6px;
      padding: 5px 8px;
      border: 1px dashed #94a3b8;
      border-radius: 4px;
      background: #ffffff;
      font-size: 6.8pt;
      color: #475569;
      line-height: 1.35;
    }
    .signoff-grid {
      display: table;
      width: 100%;
      table-layout: fixed;
      margin-top: 8px;
    }
    .signoff-box {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      border: 1px solid #000000;
      padding: 6px 8px;
      background: #ffffff;
    }
    .signoff-box:first-child {
      border-right: none;
    }
    .signoff-hdr {
      font-size: 7.5pt;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #000000;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 2px;
      margin-bottom: 4px;
    }
    .signoff-decl {
      font-size: 6.8pt;
      color: #64748b;
      margin-bottom: 5px;
      font-style: italic;
    }
    .sign-row {
      font-size: 7.4pt;
      margin-bottom: 3.5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .stamp-box {
      margin-top: 6px;
      height: 38px;
      border: 1.5px dashed #000000;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 6.8pt;
      color: #000000;
      letter-spacing: 0.08em;
      font-weight: 700;
      text-transform: uppercase;
      background: #f8fafc;
    }
    .footer-bar {
      margin-top: 8px;
      border-top: 1px solid #cbd5e1;
      padding-top: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 6.8pt;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="po-doc">
    <table class="header-table">
      <tr>
        <td style="vertical-align: middle;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 36px; height: 36px; background: #0f172a; color: #ffffff; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15pt;">
              ◆
            </div>
            <div>
              <div class="company-title">STOCKSENSE INDUSTRIAL SERVICES</div>
              <div class="company-sub">Global Procurement & Field Material Logistics • Commercial Division</div>
            </div>
          </div>
        </td>
        <td class="doc-meta" style="vertical-align: middle;">
          <div class="badge">${po.status === 'DRAFT' ? 'DRAFT PROCUREMENT PROPOSAL' : 'OFFICIAL PURCHASE ORDER'}</div>
          <div class="po-num">${poNumber}</div>
          <div class="doc-date">Order Date: ${orderDateFormatted}</div>
        </td>
      </tr>
    </table>

    <div class="divider"></div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel-title">VENDOR / SUPPLIER (ISSUED TO)</div>
        <div class="field-row">
          <span class="field-label">Vendor Name:</span>
          <span class="field-val" style="font-weight: 800;">${po.supplier_name || supplier?.name || `Vendor #${po.supplier_id}`}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Vendor ID:</span>
          <span class="field-val" style="font-family: monospace;">VEND-${po.supplier_id.toString().padStart(4, '0')}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Contact Email:</span>
          <span class="field-val">${supplier?.contact_email || 'orders@supplier.com'}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Origin / Country:</span>
          <span class="field-val">${supplier?.country || 'Domestic Territory'}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Payment Terms:</span>
          <span class="field-val">Net 30 Days (Tax Invoice)</span>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">SHIP TO / RECEIVING DESTINATION</div>
        <div class="field-row">
          <span class="field-label">Consignee:</span>
          <span class="field-val">StockSense Industrial Supply</span>
        </div>
        <div class="field-row">
          <span class="field-label">Destination Facility:</span>
          <span class="field-val" style="font-weight: 800;">${warehouseName}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Receiving Dock:</span>
          <span class="field-val">Inbound Freight Bay 4</span>
        </div>
        <div class="field-row">
          <span class="field-label">Expected Arrival:</span>
          <span class="field-val" style="font-weight: 700; color: #0284c7;">${expectedDateFormatted}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Shipping Terms:</span>
          <span class="field-val">DDP (Delivered Duty Paid)</span>
        </div>
      </div>
    </div>

    <div class="section-title">COMMERCIAL PROCUREMENT MANIFEST & ITEM SPECIFICATIONS</div>
    <table class="manifest">
      <thead>
        <tr>
          <th style="width: 5%;">#</th>
          <th style="width: 18%;">Part / SKU</th>
          <th style="width: 37%;">Description & Specification</th>
          <th style="width: 10%; text-align: right;">Qty</th>
          <th style="width: 15%; text-align: right;">Unit Price (USD)</th>
          <th style="width: 15%; text-align: right;">Line Total (USD)</th>
        </tr>
      </thead>
      <tbody>
        ${po.lines
          .map((line, idx) => {
            const item = itemMap.get(line.item_id);
            const lineSku = line.item_sku || item?.sku || `ITEM-${line.item_id}`;
            const lineName = line.item_name || item?.name || 'Industrial Material Component';
            const lineTotal = ((line.qty_ordered * line.unit_price_minor) / 100).toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
            });
            const unitPrice = (line.unit_price_minor / 100).toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
            });
            return `
            <tr>
              <td style="font-family: monospace; font-size: 7.2pt;">${idx + 1}</td>
              <td style="font-family: monospace; font-weight: 700;">${lineSku}</td>
              <td>
                <div style="font-weight: 600;">${lineName}</div>
                <div style="font-size: 6.8pt; color: #64748b;">Target Whse: ${line.location_code || 'Central'}</div>
              </td>
              <td style="text-align: right; font-weight: 700; font-family: monospace;">${line.qty_ordered}</td>
              <td style="text-align: right; font-family: monospace;">${unitPrice}</td>
              <td style="text-align: right; font-weight: 700; font-family: monospace;">${lineTotal}</td>
            </tr>
          `;
          })
          .join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="text-align: right; font-size: 7.5pt; text-transform: uppercase;">
            Order Total (${po.lines.length} Line Items • ${po.lines.reduce((s, l) => s + l.qty_ordered, 0)} Units):
          </td>
          <td style="text-align: right; font-family: monospace;">${po.lines.reduce((s, l) => s + l.qty_ordered, 0)}</td>
          <td style="text-align: right; font-size: 7.2pt; color: #64748b;">TOTAL COMMITTED:</td>
          <td style="text-align: right; font-size: 9.5pt; font-family: monospace; color: #0f172a; font-weight: 900;">
            ${totalAmountFormatted}
          </td>
        </tr>
      </tfoot>
    </table>

    ${
      po.notes
        ? `
      <div class="notes-box">
        <div class="notes-title">Commercial & Operational Notes:</div>
        <div>${po.notes}</div>
      </div>
    `
        : ''
    }

    <div class="terms-box">
      <strong>Standard Commercial Purchase Terms:</strong> (1) All deliveries must reference this Purchase Order Number on freight waybills and commercial invoices. (2) StockSense reserves the right to reject defective or non-compliant parts upon receiving dock inspection. (3) 3-Way Reconciliation (PO vs Physical Goods Receipt vs Vendor Invoice) must occur prior to payment disbursement.
    </div>

    <div class="signoff-grid">
      <div class="signoff-box">
        <div class="signoff-hdr">1. AUTHORIZED PURCHASING OFFICER (STOCKSENSE)</div>
        <p class="signoff-decl">Approved under commercial delegation of authority. Budget allocation certified and commitment recorded.</p>
        <div class="sign-row">
          <span class="field-label">Approver Signature:</span>
          <span style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 13pt; color: #002b80;">
            ${po.status === 'DRAFT' ? '— Pending —' : 'M. Al-Farhan'}
          </span>
        </div>
        <div class="sign-row">
          <span class="field-label">Print Name & Title:</span>
          <span style="font-weight: 600;">M. Al-Farhan (Inventory & Procurement Manager)</span>
        </div>
        <div class="sign-row">
          <span class="field-label">Authorization Date:</span>
          <span>${orderDateFormatted}</span>
        </div>
        <div class="stamp-box">
          ${po.status === 'DRAFT' ? '[ DRAFT - AWAITING APPROVAL STAMP ]' : '[ ★ OFFICIAL PROCUREMENT AUDIT SEAL ★ ]'}
        </div>
      </div>

      <div class="signoff-box">
        <div class="signoff-hdr">2. VENDOR ACKNOWLEDGMENT & ACCEPTANCE</div>
        <p class="signoff-decl">Supplier agrees to deliver specified parts in compliance with pricing, schedule, and quality standards.</p>
        <div class="sign-row">
          <span class="field-label">Vendor Signature:</span>
          <span style="border-bottom: 1px solid #94a3b8; width: 140px; height: 14px; display: inline-block;"></span>
        </div>
        <div class="sign-row">
          <span class="field-label">Authorized Rep:</span>
          <span style="border-bottom: 1px solid #94a3b8; width: 140px; height: 14px; display: inline-block;"></span>
        </div>
        <div class="sign-row">
          <span class="field-label">Acceptance Date:</span>
          <span style="border-bottom: 1px solid #94a3b8; width: 140px; height: 14px; display: inline-block;"></span>
        </div>
        <div class="stamp-box">[ VENDOR CORPORATE SEAL ]</div>
      </div>
    </div>

    <div class="footer-bar">
      <div style="display: flex; align-items: center; gap: 8px;">
        <div>${barcodeSvg}</div>
        <div style="font-size: 6.5pt; font-family: monospace; color: #64748b;">
          DOC-ID: SS-PO-${po.id}-${po.supplier_id}<br/>
          SYSTEM: StockSense Cloud ERP Invariant Engine
        </div>
      </div>
      <div>
        ${qrSvg}
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
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '840px',
          width: '95vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          background: '#09090b',
          border: '1px solid var(--border-default)',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
        }}
      >
        {/* Modal Action Header */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#121214',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FileText style={{ width: 18, height: 18, color: '#38bdf8' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#ffffff' }}>
                  Official Purchase Order Document
                </h3>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    padding: '0.15rem 0.5rem',
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '4px',
                    color: '#38bdf8',
                  }}
                >
                  {poNumber}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    background: po.status === 'DRAFT' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: po.status === 'DRAFT' ? '#facc15' : '#34d399',
                    border: po.status === 'DRAFT' ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  {po.status}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Legal Commercial Procurement Docket • A4 Print & PDF Export Ready
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                fontSize: '0.82rem',
                background: '#10b981',
                borderColor: '#10b981',
              }}
            >
              <Printer style={{ width: 15, height: 15 }} />
              <span>Print Official PO (PDF)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.35rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>

        {/* Paper Document Preview Frame */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem',
            background: '#18181b',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '750px',
              background: '#ffffff',
              color: '#09090b',
              padding: '24px 28px',
              borderRadius: '4px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
              fontSize: '9pt',
              lineHeight: 1.35,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 34, height: 34, background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, borderRadius: 4, fontSize: '14pt' }}>
                  ◆
                </div>
                <div>
                  <div style={{ fontSize: '12pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#000' }}>
                    StockSense Industrial Services
                  </div>
                  <div style={{ fontSize: '7pt', color: '#4b5563', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                    Global Procurement & Field Material Logistics • Commercial Division
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-block', padding: '2px 6px', fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', border: '1px solid #000', background: '#f8fafc', marginBottom: 2 }}>
                  {po.status === 'DRAFT' ? 'Draft Proposal' : 'Official Purchase Order'}
                </div>
                <div style={{ fontSize: '11pt', fontWeight: 800, fontFamily: 'monospace' }}>{poNumber}</div>
                <div style={{ fontSize: '7.5pt', color: '#4b5563' }}>Date: {orderDateFormatted}</div>
              </div>
            </div>

            {/* Vendor & Shipping Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div style={{ border: '1px solid #cbd5e1', padding: '8px', borderRadius: 4, background: '#f8fafc' }}>
                <div style={{ fontSize: '7.5pt', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: 3, marginBottom: 4 }}>
                  Vendor / Supplier (Issued To)
                </div>
                <div style={{ fontSize: '7.8pt', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div><strong>Name:</strong> {po.supplier_name || supplier?.name || `Vendor #${po.supplier_id}`}</div>
                  <div><strong>Vendor ID:</strong> VEND-{po.supplier_id.toString().padStart(4, '0')}</div>
                  <div><strong>Email:</strong> {supplier?.contact_email || 'orders@supplier.com'}</div>
                  <div><strong>Origin:</strong> {supplier?.country || 'Domestic Territory'}</div>
                  <div><strong>Payment Terms:</strong> Net 30 Days (Tax Invoice)</div>
                </div>
              </div>

              <div style={{ border: '1px solid #cbd5e1', padding: '8px', borderRadius: 4, background: '#f8fafc' }}>
                <div style={{ fontSize: '7.5pt', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: 3, marginBottom: 4 }}>
                  Ship To / Delivery Destination
                </div>
                <div style={{ fontSize: '7.8pt', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div><strong>Consignee:</strong> StockSense Industrial Supply</div>
                  <div><strong>Destination:</strong> {warehouseName}</div>
                  <div><strong>Dock:</strong> Inbound Freight Bay 4</div>
                  <div><strong>Expected Arrival:</strong> <span style={{ color: '#0284c7', fontWeight: 700 }}>{expectedDateFormatted}</span></div>
                  <div><strong>Incoterms:</strong> DDP (Delivered Duty Paid)</div>
                </div>
              </div>
            </div>

            {/* Line items table */}
            <div style={{ fontSize: '7.5pt', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
              Commercial Procurement Manifest & Item Specifications
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.8pt', marginBottom: '10px', border: '1px solid #000' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #000' }}>
                  <th style={{ padding: '4px 6px', textAlign: 'left', width: '5%' }}>#</th>
                  <th style={{ padding: '4px 6px', textAlign: 'left', width: '20%' }}>Part / SKU</th>
                  <th style={{ padding: '4px 6px', textAlign: 'left', width: '35%' }}>Description</th>
                  <th style={{ padding: '4px 6px', textAlign: 'right', width: '12%' }}>Qty</th>
                  <th style={{ padding: '4px 6px', textAlign: 'right', width: '13%' }}>Unit Price</th>
                  <th style={{ padding: '4px 6px', textAlign: 'right', width: '15%' }}>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {po.lines.map((l, i) => {
                  const item = itemMap.get(l.item_id);
                  const lineSku = l.item_sku || item?.sku || `ITEM-${l.item_id}`;
                  const lineName = l.item_name || item?.name || 'Industrial Material Component';
                  return (
                    <tr key={l.id || i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '4px 6px', fontFamily: 'monospace' }}>{i + 1}</td>
                      <td style={{ padding: '4px 6px', fontWeight: 700, fontFamily: 'monospace' }}>{lineSku}</td>
                      <td style={{ padding: '4px 6px' }}>
                        <div style={{ fontWeight: 600 }}>{lineName}</div>
                        <div style={{ fontSize: '6.8pt', color: '#64748b' }}>Target: {l.location_code || 'WH-01'}</div>
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>{l.qty_ordered}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'monospace' }}>
                        {(l.unit_price_minor / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>
                        {((l.qty_ordered * l.unit_price_minor) / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc', borderTop: '1px solid #000', fontWeight: 800 }}>
                  <td colSpan={3} style={{ padding: '5px 6px', textAlign: 'right', textTransform: 'uppercase', fontSize: '7.2pt' }}>
                    Order Total ({po.lines.length} lines • {po.lines.reduce((s, l) => s + l.qty_ordered, 0)} units):
                  </td>
                  <td style={{ padding: '5px 6px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {po.lines.reduce((s, l) => s + l.qty_ordered, 0)}
                  </td>
                  <td style={{ padding: '5px 6px', textAlign: 'right', fontSize: '7.2pt', color: '#64748b' }}>
                    TOTAL:
                  </td>
                  <td style={{ padding: '5px 6px', textAlign: 'right', fontFamily: 'monospace', fontSize: '9pt', color: '#0f172a' }}>
                    {totalAmountFormatted}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Notes if present */}
            {po.notes && (
              <div style={{ padding: '6px 8px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 4, marginBottom: '8px', fontSize: '7.5pt' }}>
                <strong style={{ color: '#475569' }}>Notes: </strong>{po.notes}
              </div>
            )}

            {/* Terms */}
            <div style={{ padding: '5px 8px', border: '1px dashed #cbd5e1', borderRadius: 4, fontSize: '6.8pt', color: '#64748b', marginBottom: '10px' }}>
              <strong>Standard Terms:</strong> (1) All deliveries must reference PO Number on waybills and invoices. (2) Material subject to dock inspection upon arrival. (3) 3-Way Reconciliation (PO vs Physical Goods Receipt vs Vendor Invoice) required prior to payment release.
            </div>

            {/* Dual Signatures & Stamp */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
              <div style={{ border: '1px solid #000', padding: '6px 8px', borderRadius: 4 }}>
                <div style={{ fontSize: '7.2pt', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: 2, marginBottom: 4 }}>
                  1. Authorized Approver (StockSense)
                </div>
                <div style={{ fontSize: '7pt', color: '#64748b', marginBottom: 4 }}>
                  Approved under commercial authority. Budget allocated and committed.
                </div>
                <div style={{ fontSize: '7.2pt', display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ color: '#64748b' }}>Sign:</span>
                  <span style={{ fontFamily: "'Brush Script MT', cursive, sans-serif", fontSize: '11pt', color: '#002b80' }}>
                    {po.status === 'DRAFT' ? '— Pending —' : 'M. Al-Farhan'}
                  </span>
                </div>
                <div style={{ fontSize: '7.2pt', display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ color: '#64748b' }}>Officer:</span>
                  <span style={{ fontWeight: 600 }}>M. Al-Farhan (Inventory Manager)</span>
                </div>
                <div style={{ fontSize: '7.2pt', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Date:</span>
                  <span>{orderDateFormatted}</span>
                </div>
                <div style={{ marginTop: 6, height: 32, border: '1px dashed #000', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6.5pt', fontWeight: 700, letterSpacing: '0.06em', background: '#f8fafc' }}>
                  {po.status === 'DRAFT' ? '[ AWAITING APPROVAL STAMP ]' : '[ ★ OFFICIAL PROCUREMENT AUDIT SEAL ★ ]'}
                </div>
              </div>

              <div style={{ border: '1px solid #000', padding: '6px 8px', borderRadius: 4 }}>
                <div style={{ fontSize: '7.2pt', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: 2, marginBottom: 4 }}>
                  2. Vendor Acknowledgment
                </div>
                <div style={{ fontSize: '7pt', color: '#64748b', marginBottom: 4 }}>
                  Supplier acknowledges order specifications, pricing, and arrival schedule.
                </div>
                <div style={{ fontSize: '7.2pt', display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ color: '#64748b' }}>Sign:</span>
                  <span style={{ borderBottom: '1px solid #94a3b8', width: 110, height: 12, display: 'inline-block' }}></span>
                </div>
                <div style={{ fontSize: '7.2pt', display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ color: '#64748b' }}>Name:</span>
                  <span style={{ borderBottom: '1px solid #94a3b8', width: 110, height: 12, display: 'inline-block' }}></span>
                </div>
                <div style={{ fontSize: '7.2pt', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Date:</span>
                  <span style={{ borderBottom: '1px solid #94a3b8', width: 110, height: 12, display: 'inline-block' }}></span>
                </div>
                <div style={{ marginTop: 6, height: 32, border: '1px dashed #000', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6.5pt', fontWeight: 700, letterSpacing: '0.06em', background: '#f8fafc' }}>
                  [ VENDOR CORPORATE SEAL ]
                </div>
              </div>
            </div>

            {/* Bottom Barcodes */}
            <div style={{ marginTop: '10px', paddingTop: '6px', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
                <div style={{ fontSize: '6.5pt', fontFamily: 'monospace', color: '#64748b' }}>
                  DOC-ID: SS-PO-{po.id}-{po.supplier_id}<br />
                  STOCKSENSE DETERMINISTIC LEDGER
                </div>
              </div>
              <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
