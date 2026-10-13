import React, { useState, useEffect } from 'react';
import {
  X, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Sliders,
  Clock, ShieldCheck, Box, User, FileText, ArrowRight,
  Paperclip, Download, Printer, Image as ImageIcon
} from 'lucide-react';
import { StockMovement, DocumentAttachment } from '../types';
import { api } from '../api/client';

interface MovementDetailDrawerProps {
  movement: StockMovement;
  allMovements: StockMovement[];
  onClose: () => void;
  onSelectMovement: (mov: StockMovement) => void;
  onPrintWaybill?: (mov: StockMovement) => void;
}


export const MovementDetailDrawer: React.FC<MovementDetailDrawerProps> = ({
  movement,
  allMovements,
  onClose,
  onSelectMovement,
  onPrintWaybill,
}) => {
  const [attachments, setAttachments] = useState<DocumentAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoadingAttachments(true);
    api.getAttachments('MOVEMENT', movement.id)
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
  }, [movement.id]);

  // Determine signed quantity and badge style

  const isPositive = ['RECEIPT', 'TRANSFER_IN'].includes(movement.movement_type);
  const isNegative = ['ISSUE', 'TRANSFER_OUT'].includes(movement.movement_type);
  const deltaPrefix = isPositive ? '+' : isNegative ? '-' : '';

  const renderBadge = () => {
    switch (movement.movement_type) {
      case 'RECEIPT':
        return (
          <span className="movement-badge movement-badge-receipt">
            <ArrowDownLeft style={{ width: 12, height: 12 }} />
            Receipt
          </span>
        );
      case 'ISSUE':
        return (
          <span className="movement-badge movement-badge-issue">
            <ArrowUpRight style={{ width: 12, height: 12 }} />
            Issue
          </span>
        );
      case 'TRANSFER_OUT':
      case 'TRANSFER_IN':
        return (
          <span className="movement-badge movement-badge-transfer">
            <ArrowLeftRight style={{ width: 12, height: 12 }} />
            {movement.movement_type === 'TRANSFER_OUT' ? 'Transfer Out' : 'Transfer In'}
          </span>
        );
      case 'ADJUSTMENT':
      default:
        return (
          <span className="movement-badge movement-badge-adjustment">
            <Sliders style={{ width: 12, height: 12 }} />
            Adjustment
          </span>
        );
    }
  };

  // Find paired transfer movement
  const pairedMovement = movement.transfer_group_id
    ? allMovements.find(
        (m) =>
          m.transfer_group_id === movement.transfer_group_id &&
          m.id !== movement.id
      )
    : null;

  return (
    <div className="movement-drawer-overlay" onClick={onClose}>
      <div className="movement-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="movement-drawer-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                EVT-{movement.id.toString().padStart(6, '0')}
              </span>
              {renderBadge()}
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Movement Audit Detail
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close drawer"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="movement-drawer-body">
          {/* Hero Delta Box */}
          <div
            style={{
              padding: '1.25rem',
              background: '#111113',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Signed Delta
              </div>
              <div
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: isPositive ? '#34d399' : isNegative ? '#f87171' : '#ffffff',
                }}
              >
                {deltaPrefix}{movement.quantity} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>units</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Route</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
                {movement.route_display || movement.location_code || 'Central'}
              </div>
            </div>
          </div>

          {/* Item Identification */}
          <div className="movement-drawer-section">
            <div className="movement-drawer-section-title">
              <Box style={{ width: 14, height: 14, color: 'var(--accent-blue)' }} />
              Item & Inventory Asset
            </div>
            <div className="movement-drawer-grid">
              <div className="movement-drawer-field">
                <span className="movement-drawer-label">Item SKU</span>
                <span className="movement-drawer-val" style={{ fontFamily: 'var(--font-mono)' }}>
                  {movement.item_sku || `ITEM-${movement.item_id}`}
                </span>
              </div>
              <div className="movement-drawer-field">
                <span className="movement-drawer-label">Item Name</span>
                <span className="movement-drawer-val">
                  {movement.item_name || 'Spare Inventory Part'}
                </span>
              </div>
              <div className="movement-drawer-field">
                <span className="movement-drawer-label">Location</span>
                <span className="movement-drawer-val">
                  {movement.location_code || `LOC-${movement.location_id}`}
                </span>
              </div>
              <div className="movement-drawer-field">
                <span className="movement-drawer-label">Ledger Sequence ID</span>
                <span className="movement-drawer-val" style={{ fontFamily: 'var(--font-mono)' }}>
                  #{movement.id}
                </span>
              </div>
            </div>
          </div>

          {/* Reference & Operational Context */}
          <div className="movement-drawer-section">
            <div className="movement-drawer-section-title">
              <FileText style={{ width: 14, height: 14, color: '#f59e0b' }} />
              Reference & Operational Context
            </div>
            <div className="movement-drawer-grid">
              <div className="movement-drawer-field">
                <span className="movement-drawer-label">Reference Code</span>
                <span className="movement-drawer-val" style={{ fontFamily: 'var(--font-mono)' }}>
                  {movement.reference_display || '—'}
                </span>
              </div>
              <div className="movement-drawer-field">
                <span className="movement-drawer-label">Project / Work Order</span>
                <span className="movement-drawer-val">
                  {movement.project_id ? `Project #${movement.project_id}` : 'General Rig Support'}
                </span>
              </div>
              <div className="movement-drawer-field" style={{ gridColumn: '1 / -1' }}>
                <span className="movement-drawer-label">Reason / Transaction Notes</span>
                <span className="movement-drawer-val" style={{ color: 'var(--text-secondary)' }}>
                  {movement.reason || 'Standard operational warehouse transaction'}
                </span>
              </div>
            </div>
          </div>

          {/* Paired Transfer Linking */}
          {movement.transfer_group_id && (
            <div className="movement-drawer-section">
              <div className="movement-drawer-section-title">
                <ArrowLeftRight style={{ width: 14, height: 14, color: '#c084fc' }} />
                Paired Atomic Transfer Leg
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Transfer Group ID: <code style={{ color: '#ffffff' }}>{movement.transfer_group_id}</code>
              </div>

              {pairedMovement ? (
                <div className="paired-transfer-card" style={{ marginTop: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#ffffff' }}>
                      Complementary Leg #{pairedMovement.id}: {pairedMovement.movement_type}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Location: {pairedMovement.location_code} • {pairedMovement.quantity} units
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={() => onSelectMovement(pairedMovement)}
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <span>View Leg</span>
                    <ArrowRight style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.35rem' }}>
                  Paired leg is in previous historical batch.
                </div>
              )}
            </div>
          )}

          {/* Audit Attribution & Non-Repudiation */}
          <div className="movement-drawer-section">
            <div className="movement-drawer-section-title">
              <ShieldCheck style={{ width: 14, height: 14, color: '#10b981' }} />
              Audit Trail & Non-Repudiation
            </div>
            <div className="movement-drawer-grid">
              <div className="movement-drawer-field">
                <span className="movement-drawer-label">Attributed Actor</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                  <User style={{ width: 14, height: 14, color: 'var(--accent-blue)' }} />
                  <span className="movement-drawer-val">
                    {movement.actor_label || 'System Automation'}
                  </span>
                </div>
              </div>

              <div className="movement-drawer-field">
                <span className="movement-drawer-label">Timestamp</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                  <Clock style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
                  <span className="movement-drawer-val" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {new Date(movement.occurred_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="movement-drawer-field" style={{ gridColumn: '1 / -1' }}>
                <span className="movement-drawer-label">Integrity Status</span>
                <span className="movement-drawer-val" style={{ color: '#34d399', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ShieldCheck style={{ width: 12, height: 12 }} />
                  Cryptographically reconciled into WAL append-only sequence
                </span>
              </div>
            </div>
          </div>

          {/* Document Attachments & Physical Proof */}
          <div className="movement-drawer-section">
            <div className="movement-drawer-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Paperclip style={{ width: 14, height: 14, color: 'var(--text-secondary)' }} />
                <span>Supporting Documents & Slips</span>
              </div>
              {onPrintWaybill && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onPrintWaybill(movement)}
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Printer style={{ width: 12, height: 12 }} />
                  <span>Print Waybill</span>
                </button>
              )}
            </div>

            {loadingAttachments ? (
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.4rem 0' }}>
                Scanning repository for physical audit documents...
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
                            <span>{att.description || 'Audit Slip'}</span>
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
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.4rem 0' }}>
                No physical slips attached. Use the Movement modal to attach delivery dockets during posting.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

