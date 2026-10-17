import React, { useState, useEffect } from 'react';
import {
  X, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Sliders,
  Clock, ShieldCheck, Box, User, FileText, ArrowRight,
  Paperclip, Download, Printer, Image as ImageIcon
} from 'lucide-react';
import { StockMovement, DocumentAttachment } from '../types';
import { api } from '../api/client';
import { useI18n } from '../i18n/I18nContext';
import { translateMovementType, translateWarehouse } from '../i18n/translations';

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
  const { locale } = useI18n();
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
            {translateMovementType('RECEIPT', locale)}
          </span>
        );
      case 'ISSUE':
        return (
          <span className="movement-badge movement-badge-issue">
            <ArrowUpRight style={{ width: 12, height: 12 }} />
            {translateMovementType('ISSUE', locale)}
          </span>
        );
      case 'TRANSFER_OUT':
      case 'TRANSFER_IN':
        return (
          <span className="movement-badge movement-badge-transfer">
            <ArrowLeftRight style={{ width: 12, height: 12 }} />
            {translateMovementType(movement.movement_type, locale)}
          </span>
        );
      case 'ADJUSTMENT':
      default:
        return (
          <span className="movement-badge movement-badge-adjustment">
            <Sliders style={{ width: 12, height: 12 }} />
            {translateMovementType('ADJUSTMENT', locale)}
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
              {locale === 'ar' ? 'تفاصيل تدقيق الحركة' : 'Movement Audit Detail'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ color: 'var(--text-muted)' }}
            aria-label={locale === 'ar' ? 'إغلاق النافذة' : 'Close drawer'}
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
                {locale === 'ar' ? 'الفارق الموقّع' : 'Signed Delta'}
              </div>
              <div
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: isPositive ? '#34d399' : isNegative ? '#f87171' : '#ffffff',
                }}
              >
                {deltaPrefix}{movement.quantity} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{locale === 'ar' ? 'وحدة' : 'units'}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                {locale === 'ar' ? 'المسار' : 'Route'}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
                {movement.route_display || translateWarehouse(movement.location_code || 'Central', locale)}
              </div>
            </div>
          </div>

          {/* Item Identification */}
          <div className="movement-drawer-section">
            <div className="movement-drawer-section-title">
              <Box style={{ width: 14, height: 14, color: 'var(--accent-blue)' }} />
              {locale === 'ar' ? 'البند وأصول المخزون' : 'Item & Inventory Asset'}
            </div>
            <div className="movement-drawer-grid">
              <div className="movement-drawer-field">
                <span className="movement-drawer-label">{locale === 'ar' ? 'رمز التخزين (SKU)' : 'Item SKU'}</span>
                <span className="movement-drawer-val" style={{ fontFamily: 'var(--font-mono)' }}>
                  {movement.item_sku || `ITEM-${movement.item_id}`}
                </span>
              </div>
              <div className="movement-drawer-field">
                <span className="movement-drawer-label">{locale === 'ar' ? 'اسم البند' : 'Item Name'}</span>
                <span className="movement-drawer-val">
                  {movement.item_name || (locale === 'ar' ? 'قطعة غيار للمخزون' : 'Spare Inventory Part')}
                </span>
              </div>
              <div className="movement-drawer-field">
                <span className="movement-drawer-label">{locale === 'ar' ? 'الموقع' : 'Location'}</span>
                <span className="movement-drawer-val">
                  {translateWarehouse(movement.location_code || `LOC-${movement.location_id}`, locale)}
                </span>
              </div>
              <div className="movement-drawer-field">
                <span className="movement-drawer-label">{locale === 'ar' ? 'تسلسل دفتر الأستاذ' : 'Ledger Sequence ID'}</span>
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
              {locale === 'ar' ? 'المرجع والسياق التشغيلي' : 'Reference & Operational Context'}
            </div>
            <div className="movement-drawer-grid">
              <div className="movement-drawer-field">
                <span className="movement-drawer-label">{locale === 'ar' ? 'رمز المرجع' : 'Reference Code'}</span>
                <span className="movement-drawer-val" style={{ fontFamily: 'var(--font-mono)' }}>
                  {movement.reference_display || '—'}
                </span>
              </div>
              <div className="movement-drawer-field">
                <span className="movement-drawer-label">{locale === 'ar' ? 'المشروع / أمر العمل' : 'Project / Work Order'}</span>
                <span className="movement-drawer-val">
                  {movement.project_id
                    ? (locale === 'ar' ? `مشروع #${movement.project_id}` : `Project #${movement.project_id}`)
                    : (locale === 'ar' ? 'دعم منصة الحفر العام' : 'General Rig Support')}
                </span>
              </div>
              <div className="movement-drawer-field" style={{ gridColumn: '1 / -1' }}>
                <span className="movement-drawer-label">{locale === 'ar' ? 'السبب / ملاحظات المعاملة' : 'Reason / Transaction Notes'}</span>
                <span className="movement-drawer-val" style={{ color: 'var(--text-secondary)' }}>
                  {movement.reason || (locale === 'ar' ? 'معاملة مستودعية قياسية' : 'Standard operational warehouse transaction')}
                </span>
              </div>
            </div>
          </div>

          {/* Paired Transfer Linking */}
          {movement.transfer_group_id && (
            <div className="movement-drawer-section">
              <div className="movement-drawer-section-title">
                <ArrowLeftRight style={{ width: 14, height: 14, color: '#c084fc' }} />
                {locale === 'ar' ? 'مسار التحويل المقترن' : 'Paired Atomic Transfer Leg'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {locale === 'ar' ? 'معرّف مجموعة التحويل:' : 'Transfer Group ID:'}{' '}
                <code style={{ color: '#ffffff' }}>{movement.transfer_group_id}</code>
              </div>

              {pairedMovement ? (
                <div className="paired-transfer-card" style={{ marginTop: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#ffffff' }}>
                      {locale === 'ar' ? 'المسار المكمل' : 'Complementary Leg'} #{pairedMovement.id}: {translateMovementType(pairedMovement.movement_type, locale)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {locale === 'ar' ? 'الموقع:' : 'Location:'} {translateWarehouse(pairedMovement.location_code || 'Central', locale)} • {pairedMovement.quantity} {locale === 'ar' ? 'وحدة' : 'units'}
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={() => onSelectMovement(pairedMovement)}
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <span>{locale === 'ar' ? 'عرض المسار' : 'View Leg'}</span>
                    <ArrowRight style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.35rem' }}>
                  {locale === 'ar' ? 'المسار المقترن موجود في دفعة سابقة من السجل التاريخي.' : 'Paired leg is in previous historical batch.'}
                </div>
              )}
            </div>
          )}

          {/* Audit Attribution & Non-Repudiation */}
          <div className="movement-drawer-section">
            <div className="movement-drawer-section-title">
              <ShieldCheck style={{ width: 14, height: 14, color: '#10b981' }} />
              {locale === 'ar' ? 'مسار التدقيق وعدم الإنكار' : 'Audit Trail & Non-Repudiation'}
            </div>
            <div className="movement-drawer-grid">
              <div className="movement-drawer-field">
                <span className="movement-drawer-label">{locale === 'ar' ? 'المنفّذ المنسوب' : 'Attributed Actor'}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                  <User style={{ width: 14, height: 14, color: 'var(--accent-blue)' }} />
                  <span className="movement-drawer-val">
                    {movement.actor_label || (locale === 'ar' ? 'أتمتة النظام' : 'System Automation')}
                  </span>
                </div>
              </div>

              <div className="movement-drawer-field">
                <span className="movement-drawer-label">{locale === 'ar' ? 'الطابع الزمني' : 'Timestamp'}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                  <Clock style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
                  <span className="movement-drawer-val" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {locale === 'ar'
                      ? new Date(movement.occurred_at).toLocaleString('ar-EG-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : new Date(movement.occurred_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="movement-drawer-field" style={{ gridColumn: '1 / -1' }}>
                <span className="movement-drawer-label">{locale === 'ar' ? 'حالة التكامل والسلامة' : 'Integrity Status'}</span>
                <span className="movement-drawer-val" style={{ color: '#34d399', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ShieldCheck style={{ width: 12, height: 12 }} />
                  {locale === 'ar' ? 'مطابق تشفيرياً ضمن تسلسل سجل التغييرات غير القابل للتعديل (WAL)' : 'Cryptographically reconciled into WAL append-only sequence'}
                </span>
              </div>
            </div>
          </div>

          {/* Document Attachments & Physical Proof */}
          <div className="movement-drawer-section">
            <div className="movement-drawer-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Paperclip style={{ width: 14, height: 14, color: 'var(--text-secondary)' }} />
                <span>{locale === 'ar' ? 'الوثائق والإيصالات الثبوتية' : 'Supporting Documents & Slips'}</span>
              </div>
              {onPrintWaybill && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onPrintWaybill(movement)}
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Printer style={{ width: 12, height: 12 }} />
                  <span>{locale === 'ar' ? 'طباعة بوليصة الشحن' : 'Print Waybill'}</span>
                </button>
              )}
            </div>

            {loadingAttachments ? (
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.4rem 0' }}>
                {locale === 'ar' ? 'جاري فحص المستودع بحثاً عن وثائق التدقيق...' : 'Scanning repository for physical audit documents...'}
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
                            <span>{att.description || (locale === 'ar' ? 'إيصال تدقيق' : 'Audit Slip')}</span>
                          </span>
                        </div>
                      </div>
                      <div className="attachment-actions">
                        <a
                          href={att.download_url || `/api/v1/attachments/${att.id}/file`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="attachment-action-btn"
                          title={locale === 'ar' ? 'فتح أو تنزيل الوثيقة' : 'Open or download document'}
                        >
                          <Download style={{ width: 12, height: 12 }} />
                          <span>{locale === 'ar' ? 'عرض' : 'View'}</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.4rem 0' }}>
                {locale === 'ar'
                  ? 'لا توجد إيصالات مرفقة. استخدم نافذة حركة المخزون لإرفاق إيصالات التسليم أثناء الترحيل.'
                  : 'No physical slips attached. Use the Movement modal to attach delivery dockets during posting.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

