import React, { useState } from 'react';
import { CheckCircle, X, ShieldAlert } from 'lucide-react';
import { PurchaseOrder } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface POApprovalModalProps {
  po: PurchaseOrder;
  onClose: () => void;
  onConfirm: (poId: number) => Promise<void>;
}

export const POApprovalModal: React.FC<POApprovalModalProps> = ({ po, onClose, onConfirm }) => {
  const { locale } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(po.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || (locale === 'ar' ? 'فشل اعتماد أمر الشراء' : 'Failed to approve purchase order'));
    } finally {
      setSubmitting(false);
    }
  };

  const formattedTotal = (po.total_amount_minor / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle style={{ width: 18, height: 18, color: '#3b82f6' }} />
            <h3>{locale === 'ar' ? 'اعتماد أمر الشراء؟' : 'Approve Purchase Order?'}</h3>
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
          <div style={{ background: '#121214', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>{locale === 'ar' ? 'رقم أمر الشراء:' : 'PO Identifier:'}</span>
              <span style={{ fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{po.po_number}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>{locale === 'ar' ? 'المورّد الشريك:' : 'Supplier Partner:'}</span>
              <span style={{ fontWeight: 500, color: '#ffffff' }}>{po.supplier_name || `Supplier #${po.supplier_id}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>{locale === 'ar' ? 'بنود الطلب:' : 'Line Items:'}</span>
              <span style={{ color: '#ffffff' }}>{po.lines.length} {locale === 'ar' ? 'بنود' : 'lines'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>{locale === 'ar' ? 'القيمة الإجمالية:' : 'Committed Value:'}</span>
              <span style={{ fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>{formattedTotal}</span>
            </div>
            {po.expected_date && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>{locale === 'ar' ? 'تاريخ الوصول المتوقع:' : 'Expected Arrival:'}</span>
                <span style={{ color: '#ffffff' }}>
                  {new Date(po.expected_date).toLocaleDateString(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US')}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '6px', color: '#fbbf24', fontSize: '0.78rem', lineHeight: '1.4' }}>
            <ShieldAlert style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
            <span>
              {locale === 'ar'
                ? 'يقوم هذا الإجراء بتحويل المسودة إلى مسار المشتريات المعتمد، مما يتيح تتبع شحنة المورّد ويصرّح لرصيف الاستلام في المستودع بقبول الشحنة الواردة.'
                : 'This action commits the draft into the approved purchasing workflow, notifying vendor tracking and authorizing receiving dock inbound.'}
            </span>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            {locale === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleApprove} disabled={submitting}>
            <CheckCircle style={{ width: 14, height: 14 }} />
            <span>{submitting ? (locale === 'ar' ? 'جارٍ الاعتماد...' : 'Approving...') : (locale === 'ar' ? 'تأكيد الاعتماد' : 'Confirm Approval')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
