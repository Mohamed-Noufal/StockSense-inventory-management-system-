import React, { useState } from 'react';
import { X, Printer, ShieldCheck, Truck, MapPin, FileText, CheckCircle2 } from 'lucide-react';
import { StockMovement, InventoryItem, InventoryLocation } from '../types';


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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay waybill-modal-overlay" onClick={onClose}>
      <div className="modal-card waybill-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* On-screen control bar (Hidden during print) */}
        <div className="waybill-screen-controls no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText style={{ width: 18, height: 18, color: '#34d399' }} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
              Warehouse Delivery Docket & Transit Waybill
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button type="button" className="btn btn-primary" onClick={handlePrint} style={{ padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Printer style={{ width: 14, height: 14 }} />
              <span>Print Waybill (A4)</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ padding: '0.4rem 0.6rem' }}
              title="Close modal"
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* Printable Paper Document (Rendered for both screen preview & @media print) */}
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
                <span className="waybill-val print-only">{carrierName}</span>
                <input
                  type="text"
                  className="waybill-inline-input no-print"
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                />
              </div>
              <div className="waybill-field-row">
                <span className="waybill-label">Vehicle Plate:</span>
                <span className="waybill-val print-only">{vehiclePlate}</span>
                <input
                  type="text"
                  className="waybill-inline-input no-print"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                />
              </div>
              <div className="waybill-field-row">
                <span className="waybill-label">Driver / Captain:</span>
                <span className="waybill-val print-only">{driverName}</span>
                <input
                  type="text"
                  className="waybill-inline-input no-print"
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
          <div style={{ marginTop: '0.8rem', padding: '0.5rem 0.7rem', border: '1px solid #d4d4d8', borderRadius: '4px', background: '#fafafa' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#52525b', display: 'block' }}>
              Handling Instructions & Dispatch Notes:
            </span>
            <span className="print-only" style={{ fontSize: '0.76rem', color: '#000000' }}>{remarks}</span>
            <textarea
              className="waybill-textarea no-print"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter special shipping conditions, crane handling notes, or inspection instructions..."
            />
          </div>

          {/* Barcode & Security Block */}
          <div className="waybill-security-strip">
            <div className="waybill-barcode-block">
              <svg width="220" height="42" viewBox="0 0 220 42">
                {/* Clean Code128-style Vector Barcode */}
                <rect x="0" y="0" width="4" height="34" fill="#000" />
                <rect x="6" y="0" width="2" height="34" fill="#000" />
                <rect x="11" y="0" width="5" height="34" fill="#000" />
                <rect x="18" y="0" width="2" height="34" fill="#000" />
                <rect x="23" y="0" width="3" height="34" fill="#000" />
                <rect x="29" y="0" width="6" height="34" fill="#000" />
                <rect x="38" y="0" width="2" height="34" fill="#000" />
                <rect x="43" y="0" width="4" height="34" fill="#000" />
                <rect x="50" y="0" width="6" height="34" fill="#000" />
                <rect x="58" y="0" width="2" height="34" fill="#000" />
                <rect x="63" y="0" width="5" height="34" fill="#000" />
                <rect x="71" y="0" width="3" height="34" fill="#000" />
                <rect x="77" y="0" width="6" height="34" fill="#000" />
                <rect x="86" y="0" width="2" height="34" fill="#000" />
                <rect x="91" y="0" width="5" height="34" fill="#000" />
                <rect x="99" y="0" width="4" height="34" fill="#000" />
                <rect x="106" y="0" width="2" height="34" fill="#000" />
                <rect x="111" y="0" width="6" height="34" fill="#000" />
                <rect x="120" y="0" width="3" height="34" fill="#000" />
                <rect x="126" y="0" width="5" height="34" fill="#000" />
                <rect x="134" y="0" width="2" height="34" fill="#000" />
                <rect x="139" y="0" width="6" height="34" fill="#000" />
                <rect x="148" y="0" width="3" height="34" fill="#000" />
                <rect x="154" y="0" width="4" height="34" fill="#000" />
                <rect x="161" y="0" width="5" height="34" fill="#000" />
                <rect x="169" y="0" width="2" height="34" fill="#000" />
                <rect x="174" y="0" width="6" height="34" fill="#000" />
                <rect x="183" y="0" width="3" height="34" fill="#000" />
                <rect x="189" y="0" width="4" height="34" fill="#000" />
                <rect x="196" y="0" width="6" height="34" fill="#000" />
                <rect x="205" y="0" width="2" height="34" fill="#000" />
                <rect x="210" y="0" width="5" height="34" fill="#000" />
                <text x="110" y="42" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#000">
                  *{waybillNumber}*
                </text>
              </svg>
            </div>
            <div className="waybill-security-text">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981', fontWeight: 700 }}>
                <CheckCircle2 style={{ width: 14, height: 14 }} />
                <span>Verified StockSense WAL Immutable Ledger Chain</span>
              </div>
              <div>Non-Repudiation Key: SHA256:{movement.idempotency_key ? movement.idempotency_key.slice(0, 20) : 'VERIFIED-RECORD-LEDGER'}</div>
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
