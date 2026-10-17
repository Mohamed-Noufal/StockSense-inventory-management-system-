import React, { useState } from 'react';
import { Ban, X } from 'lucide-react';
import { AIRecommendation } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface AIDismissModalProps {
  rec: AIRecommendation;
  onClose: () => void;
  onDismiss: (id: number, reason: string) => Promise<void>;
}

const DISMISSAL_REASONS = [
  { en: 'Purchase already planned with vendor', ar: 'تم التخطيط للشراء مسبقاً مع المورّد' },
  { en: 'Demand forecast is not relevant (project hiatus)', ar: 'تنبؤ الطلب غير ملائم (توقف المشروع أو المنصة مؤقتاً)' },
  { en: 'Supplier unavailable / lead time excessive', ar: 'المورّد غير متاح حالياً / فترة التوريد مفرطة' },
  { en: 'Item scheduled for phased obsolescence', ar: 'الصنف مجدول للاستبعاد والإحلال التدريجي' },
  { en: 'Alternative substitute spare available on-site', ar: 'تتوفر قطعة غيار بديلة مطابقة في الموقع' },
  { en: 'Other operator discretion', ar: 'تقدير تشغيلي أو إداري آخر' },
];

export const AIDismissModal: React.FC<AIDismissModalProps> = ({ rec, onClose, onDismiss }) => {
  const { locale } = useI18n();
  const [selectedReason, setSelectedReason] = useState<string>(DISMISSAL_REASONS[0].en);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const reasonText = locale === 'ar'
      ? (DISMISSAL_REASONS.find(r => r.en === selectedReason)?.ar || selectedReason)
      : selectedReason;

    const finalReason = customNotes.trim()
      ? `${reasonText} — Notes: ${customNotes.trim()}`
      : reasonText;

    setSubmitting(true);
    setError(null);
    try {
      await onDismiss(rec.id, finalReason);
      onClose();
    } catch (err: any) {
      setError(err?.message || (locale === 'ar' ? 'فشل استبعاد المقترح' : 'Failed to dismiss recommendation'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Ban style={{ width: 18, height: 18, color: '#f87171' }} />
            <h3>
              {locale === 'ar' ? `استبعاد المقترح رقم #${rec.id}؟` : `Dismiss Recommendation #${rec.id}?`}
            </h3>
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
          <div style={{ margin: '1rem 1.5rem 0', padding: '0.65rem 0.85rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: '1.45', margin: 0 }}>
              {locale === 'ar'
                ? 'سيؤدي استبعاد هذا المقترح إلى تسجيله كمستبعد لأغراض التدقيق والمحاسبة. لن يتم إنشاء أمر شراء رسمي.'
                : 'Dismissing will mark this replenishment proposal as dismissed for audit purposes. A formal purchase order will not be created.'}
            </p>

            <div style={{ padding: '0.65rem 0.85rem', background: '#121214', border: '1px solid var(--border-default)', borderRadius: '6px', fontSize: '0.8rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                {locale === 'ar' ? 'صنف قطعة الغيار' : 'Spare Part'}
              </div>
              <div style={{ fontWeight: 600, color: '#ffffff', marginTop: 2 }}>{rec.item_sku} — {rec.item_name}</div>
            </div>

            <div className="form-group">
              <label className="form-label">
                {locale === 'ar' ? 'سبب الاستبعاد الإلزامي للتدقيق *' : 'Mandatory Audit Reason *'}
              </label>
              <select
                className="form-select"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                required
              >
                {DISMISSAL_REASONS.map((r) => (
                  <option key={r.en} value={r.en}>
                    {locale === 'ar' ? r.ar : r.en}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                {locale === 'ar' ? 'ملاحظات المشغل الإضافية (اختياري)' : 'Additional Operator Notes (Optional)'}
              </label>
              <textarea
                className="form-input"
                rows={2}
                placeholder={locale === 'ar' ? 'مثال: أكد مشرف المنصة توفر رصيد كافٍ حتى موعد العمرة القادمة' : 'e.g. Rig supervisor confirmed enough inventory until next overhaul'}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button type="submit" className="btn btn-danger" disabled={submitting}>
              <Ban style={{ width: 13, height: 13 }} />
              <span>{submitting ? (locale === 'ar' ? 'جارٍ الاستبعاد...' : 'Dismissing...') : (locale === 'ar' ? 'تأكيد الاستبعاد' : 'Confirm Dismissal')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
