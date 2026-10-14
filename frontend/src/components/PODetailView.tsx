import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, PackageCheck, Ban, Sparkles, Paperclip, Download, FileText, Image as ImageIcon, Printer } from 'lucide-react';
import { PurchaseOrder, InventoryLocation, DocumentAttachment, Supplier, InventoryItem } from '../types';
import { api } from '../api/client';
import { POPrintModal } from './POPrintModal';

interface PODetailViewProps {
  po: PurchaseOrder;
  locations?: InventoryLocation[];
  suppliers?: Supplier[];
  items?: InventoryItem[];
  onBack: () => void;
  onOpenApproveModal: () => void;
  onOpenReceiveModal: () => void;
  onOpenCancelModal: () => void;
}

export const PODetailView: React.FC<PODetailViewProps> = ({
  po,
  locations = [],
  suppliers = [],
  items = [],
  onBack,
  onOpenApproveModal,
  onOpenReceiveModal,
  onOpenCancelModal,
}) => {
  const [attachments, setAttachments] = useState<DocumentAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoadingAttachments(true);
    api.getAttachments('PURCHASE_ORDER', po.id)
      .then((data) => {
        if (isMounted) setAttachments(data);
      })
      .catch(() => {
        if (isMounted) setAttachments([]);
      })
      .finally(() => {
        if (isMounted) setLoadingAttachments(false);
      });
    return () => {
      isMounted = false;
    };
  }, [po.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="po-badge po-badge-draft">Draft</span>;
      case 'APPROVED':
        return <span className="po-badge po-badge-approved">Approved</span>;
      case 'PARTIALLY_RECEIVED':
        return <span className="po-badge po-badge-partial">Partially Received</span>;
      case 'RECEIVED':
        return <span className="po-badge po-badge-received">Received</span>;
      case 'CANCELLED':
        return <span className="po-badge po-badge-cancelled">Cancelled</span>;
      default:
        return <span className="po-badge">{status}</span>;
    }
  };

  const totalOrdered = po.lines.reduce((acc, l) => acc + l.qty_ordered, 0);
  const totalReceived = po.lines.reduce((acc, l) => acc + l.qty_received, 0);
  const totalRemaining = Math.max(0, totalOrdered - totalReceived);
  const overallFulfillmentPct = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

  const firstDestId = po.lines[0]?.destination_location_id;
  const destinationLoc = locations.find((l) => l.id === firstDestId);

  return (
    <div className="po-detail-view">
      {/* Breadcrumb Navigation */}
      <button type="button" className="po-view-breadcrumb" onClick={onBack}>
        <ArrowLeft style={{ width: 14, height: 14 }} />
        <span>Back to Purchase Orders</span>
      </button>

      {/* Hero Header Card */}
      <div className="po-detail-hero">
        <div className="po-detail-hero-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-mono)' }}>
                {po.po_number}
              </h1>
              {getStatusBadge(po.status)}
              {po.source_recommendation_id && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-default)', borderRadius: '4px', fontSize: '0.7rem', color: '#ffffff' }}>
                  <Sparkles style={{ width: 11, height: 11, color: '#38bdf8' }} />
                  AI Recommendation #{po.source_recommendation_id}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Supplier: <strong style={{ color: '#ffffff' }}>{po.supplier_name || `Supplier #${po.supplier_id}`}</strong> • Created: {new Date(po.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowPrintModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--border-default)' }}
              title="Print or export official A4 Purchase Order PDF with barcodes and signature blocks"
            >
              <Printer style={{ width: 14, height: 14, color: '#38bdf8' }} />
              <span>Print Official PO</span>
            </button>

            {po.status === 'DRAFT' && (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onOpenApproveModal}
                >
                  <CheckCircle style={{ width: 14, height: 14 }} />
                  <span>Approve Purchase Order</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ color: '#f87171' }}
                  onClick={onOpenCancelModal}
                >
                  <Ban style={{ width: 14, height: 14 }} />
                  <span>Cancel PO</span>
                </button>
              </>
            )}

            {(po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED') && (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: '#10b981', borderColor: '#10b981' }}
                  onClick={onOpenReceiveModal}
                >
                  <PackageCheck style={{ width: 14, height: 14 }} />
                  <span>Receive Goods</span>
                </button>
                {po.lines.every((l) => l.qty_received === 0) && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ color: '#f87171' }}
                    onClick={onOpenCancelModal}
                  >
                    <Ban style={{ width: 14, height: 14 }} />
                    <span>Cancel PO</span>
                  </button>
                )}
              </>
            )}

            {(po.status === 'RECEIVED' || po.status === 'CANCELLED') && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0.35rem 0.75rem', background: '#141416', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                Order {po.status.toLowerCase()} • Read-Only Record
              </div>
            )}
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="po-detail-meta-grid">
          <div className="po-meta-block">
            <span className="po-meta-label">Destination Warehouse</span>
            <span className="po-meta-value">
              {destinationLoc?.name || po.lines[0]?.location_code || 'Central Yard'}
            </span>
          </div>

          <div className="po-meta-block">
            <span className="po-meta-label">Expected Delivery</span>
            <span className="po-meta-value">
              {po.expected_date ? new Date(po.expected_date).toLocaleDateString() : 'Not Specified'}
            </span>
          </div>

          <div className="po-meta-block">
            <span className="po-meta-label">Total Committed Value</span>
            <span className="po-meta-value" style={{ fontFamily: 'var(--font-mono)', color: '#34d399' }}>
              ${(po.total_amount_minor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="po-meta-block">
            <span className="po-meta-label">Fulfillment Status</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="po-meta-value">
                {totalReceived} / {totalOrdered} units ({overallFulfillmentPct}%)
              </span>
              <div className="po-fulfillment-track">
                <div
                  className="po-fulfillment-bar"
                  style={{ width: `${overallFulfillmentPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {po.notes && (
          <div style={{ padding: '0.65rem 0.85rem', background: '#121214', border: '1px solid var(--border-subtle)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: '#ffffff' }}>Notes:</strong> {po.notes}
          </div>
        )}
      </div>

      {/* Line Items Table Card */}
      <div className="po-section-card">
        <div className="po-section-title">
          <span>Purchase Order Line Items ({po.lines.length})</span>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            {totalRemaining > 0 ? `${totalRemaining} units outstanding` : 'All items fully received into stock'}
          </span>
        </div>

        <div className="table-container" style={{ margin: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Item / SKU</th>
                <th>Destination</th>
                <th style={{ textAlign: 'right' }}>Ordered</th>
                <th style={{ textAlign: 'right' }}>Received</th>
                <th style={{ textAlign: 'right' }}>Remaining</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Subtotal</th>
                <th>Fulfillment Progress</th>
              </tr>
            </thead>
            <tbody>
              {po.lines.map((line) => {
                const remaining = Math.max(0, line.qty_ordered - line.qty_received);
                const linePct = Math.round((line.qty_received / line.qty_ordered) * 100);
                const subtotal = (line.qty_ordered * line.unit_price_minor) / 100;

                return (
                  <tr key={line.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="sku-cell">{line.item_sku || `Item #${line.item_id}`}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          {line.item_name || 'Spare Part'}
                        </span>
                      </div>
                    </td>
                    <td>{line.location_code || 'Central'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#ffffff' }}>
                      {line.qty_ordered}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: line.qty_received > 0 ? '#34d399' : 'var(--text-muted)' }}>
                      {line.qty_received}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: remaining > 0 ? '#fbbf24' : 'var(--text-muted)' }}>
                      {remaining}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      ${(line.unit_price_minor / 100).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ffffff' }}>
                      ${subtotal.toFixed(2)}
                    </td>
                    <td style={{ minWidth: 140 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="po-fulfillment-track" style={{ flex: 1, margin: 0 }}>
                          <div
                            className="po-fulfillment-bar"
                            style={{
                              width: `${linePct}%`,
                              backgroundColor: linePct >= 100 ? '#10b981' : '#f59e0b',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: 32, textAlign: 'right' }}>
                          {linePct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supporting Documents & Vendor Delivery Slips */}
      <div className="po-section-card">
        <div className="po-section-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Paperclip style={{ width: 14, height: 14, color: 'var(--text-secondary)' }} />
            <span>Vendor Documentation & Delivery Slips</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {attachments.length} attached document{attachments.length === 1 ? '' : 's'}
          </span>
        </div>

        {loadingAttachments ? (
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
            Scanning delivery attachments repository...
          </div>
        ) : attachments.length > 0 ? (
          <div className="attachment-list">
            {attachments.map((att) => {
              const isPdf = att.file_type.includes('pdf') || att.filename.endsWith('.pdf');
              return (
                <div key={att.id} className="attachment-card">
                  <div className="attachment-card-info">
                    <div className={`attachment-icon-box ${isPdf ? 'pdf' : 'image'}`}>
                      {isPdf ? <FileText style={{ width: 14, height: 14 }} /> : <ImageIcon style={{ width: 14, height: 14 }} />}
                    </div>
                    <div className="attachment-meta">
                      <span className="attachment-filename" title={att.filename}>
                        {att.filename}
                      </span>
                      <span className="attachment-subtext">
                        <span>{(att.file_size_bytes / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>{att.description || 'Vendor Packing Slip'}</span>
                        <span>•</span>
                        <span>Uploaded by {att.uploaded_by_name || 'Storekeeper'}</span>
                      </span>
                    </div>
                  </div>
                  <div className="attachment-actions">
                    <a
                      href={att.download_url || `/api/v1/attachments/${att.id}/file`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="attachment-action-btn"
                      title="Open or download document"
                    >
                      <Download style={{ width: 12, height: 12 }} />
                      <span>View</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
            No vendor delivery documents attached yet. Attach delivery slips using the Receive Goods modal.
          </div>
        )}
      </div>

      {showPrintModal && (
        <POPrintModal
          po={po}
          supplier={suppliers.find((s) => s.id === po.supplier_id)}
          items={items}
          locations={locations}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};

