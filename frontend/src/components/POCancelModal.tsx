import React, { useState } from 'react';
import { Ban, X, AlertTriangle } from 'lucide-react';
import { PurchaseOrder } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { translatePOStatus } from '../i18n/translations';

interface POCancelModalProps {
  po: PurchaseOrder;
  onClose: () => void;
  onConfirm: (poId: number) => Promise<void>;
}

export const POCancelModal: React.FC<POCancelModalProps> = ({ po, onClose, onConfirm }) => {
  const { locale } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasReceivedGoods = po.lines.some((l) => l.qty_received > 0);

  const handleCancel = async () => {
    if (hasReceivedGoods) {
      setError(
        locale === 'ar'
          ? 'لا يمكن إلغاء أمر الشراء: تم استلام بضائع فعلية في المخزون بالفعل.'
          : 'Cannot cancel purchase order: physical items have already been received into inventory.'
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(po.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || (locale === 'ar' ? 'فشل إلغاء أمر الشراء' : 'Failed to cancel purchase order'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Ban style={{ width: 18, height: 18, color: '#ef4444' }} />
            <h3>{locale === 'ar' ? 'إلغاء أمر الشراء؟' : 'Cancel Purchase Order?'}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {error && (
          <div style={{ margin: '1rem 1.25rem 0', padding: '0.65rem 0.85rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem' }}>
            {error}
          </div>
        )}

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
            {locale === 'ar' ? (
              <>هل أنت متأكد من رغبتك في إلغاء أمر الشراء <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{po.po_number}</strong>؟</>
            ) : (
              <>Are you sure you want to cancel purchase order <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{po.po_number}</strong>?</>
            )}
          </p>

          <div style={{ background: '#121214', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '0.75rem 1rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>{locale === 'ar' ? 'المورّد:' : 'Vendor:'}</span>
              <span style={{ color: '#ffffff' }}>{po.supplier_name || `Supplier #${po.supplier_id}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>{locale === 'ar' ? 'الحالة الحالية:' : 'Current Status:'}</span>
              <span style={{ color: '#ffffff' }}>{translatePOStatus(po.status, locale)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>{locale === 'ar' ? 'إجمالي البنود:' : 'Total Lines:'}</span>
              <span style={{ color: '#ffffff' }}>{po.lines.length} {locale === 'ar' ? 'بنود' : 'lines'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', color: '#f87171', fontSize: '0.78rem', lineHeight: '1.4' }}>
            <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
            <span>
              {locale === 'ar'
                ? 'إلغاء أمر الشراء نهائي ولا يمكن التراجع عنه. بمجرد الإلغاء، لا يمكن استلام البضائع أو إعادة فتح هذا الأمر. ولا يمكن إلغاء الأوامر التي تم استلام بضائع منها بالفعل.'
                : 'Cancellation is irrevocable. Once cancelled, this order cannot receive goods or be re-opened. Orders with posted receipts cannot be cancelled.'}
            </span>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            {locale === 'ar' ? 'الاحتفاظ بأمر الشراء' : 'Keep Purchase Order'}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleCancel}
            disabled={submitting || hasReceivedGoods}
          >
            <Ban style={{ width: 14, height: 14 }} />
            <span>{submitting ? (locale === 'ar' ? 'جارٍ الإلغاء...' : 'Cancelling...') : (locale === 'ar' ? 'تأكيد الإلغاء' : 'Confirm Cancellation')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
