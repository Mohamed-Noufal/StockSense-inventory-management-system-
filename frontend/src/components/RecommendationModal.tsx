import React, { useState } from 'react';
import { Sparkles, CheckCircle, Ban, X } from 'lucide-react';
import { AIRecommendation } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { translateDemandPattern, translateWarehouse, translateRecommendationSummary } from '../i18n/translations';

interface RecommendationModalProps {
  rec: AIRecommendation;
  onClose: () => void;
  onApprove: (id: number) => Promise<void>;
  onDismiss: (id: number, reason: string) => Promise<void>;
}

export const RecommendationModal: React.FC<RecommendationModalProps> = ({
  rec, onClose, onApprove, onDismiss,
}) => {
  const { locale } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [showDismissInput, setShowDismissInput] = useState(false);

  let explanation: any = {};
  try {
    explanation = JSON.parse(rec.explanation_json);
  } catch {
    // fallback
  }

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await onApprove(rec.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = async () => {
    if (!dismissReason.trim()) return;
    setSubmitting(true);
    try {
      await onDismiss(rec.id, dismissReason);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles style={{ width: 18, height: 18, color: '#ffffff' }} />
            <h3>
              {locale === 'ar' ? `مقترح التوريد بالذكاء الاصطناعي #${rec.id}` : `AI Replenishment Recommendation #${rec.id}`}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '0.75rem 0.85rem', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-default)', borderRadius: '6px', fontSize: '0.8rem', lineHeight: '1.45', color: 'var(--text-primary)' }}>
            <strong style={{ color: '#ffffff' }}>{locale === 'ar' ? 'التحليل التبريري للذكاء الاصطناعي:' : 'AI Rationale:'}</strong> {translateRecommendationSummary(rec, locale)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.8rem' }}>
            <div style={{ padding: '0.65rem', background: '#09090b', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                {locale === 'ar' ? 'رمز الصنف المستهدف' : 'Target Spare SKU'}
              </div>
              <div style={{ fontWeight: 600, color: '#f4f4f5', marginTop: '0.15rem' }}>{rec.item_sku} — {rec.item_name}</div>
            </div>
            <div style={{ padding: '0.65rem', background: '#09090b', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                {locale === 'ar' ? 'نمط وخوارزمية الطلب' : 'Demand Method'}
              </div>
              <div style={{ fontWeight: 600, color: '#f4f4f5', marginTop: '0.15rem' }}>
                {translateDemandPattern(rec.demand_pattern || 'Intermittent', locale)} ({rec.forecast_method || 'SBA'})
              </div>
            </div>
            <div style={{ padding: '0.65rem', background: '#09090b', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                {locale === 'ar' ? 'موقف المخزون الفعلي' : 'Current Position'}
              </div>
              <div style={{ fontWeight: 600, color: '#f4f4f5', marginTop: '0.15rem' }}>
                {rec.inventory_position} {locale === 'ar' ? 'وحدة' : 'units'} ({rec.on_hand} {locale === 'ar' ? 'متاح' : 'on-hand'}, {rec.on_order} {locale === 'ar' ? 'قيد الطلب' : 'on-order'})
              </div>
            </div>
            <div style={{ padding: '0.65rem', background: '#09090b', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                {locale === 'ar' ? 'نقطة إعادة الطلب (ROP)' : 'Reorder Threshold (ROP)'}
              </div>
              <div style={{ fontWeight: 600, color: '#fbbf24', marginTop: '0.15rem' }}>
                {rec.reorder_point} {locale === 'ar' ? 'وحدة' : 'units'} ({locale === 'ar' ? 'مخزون الأمان' : 'SS'}: {explanation.safety_stock || 0})
              </div>
            </div>
          </div>

          <div style={{ padding: '0.75rem 1rem', background: '#09090b', borderRadius: '6px', border: '1px solid var(--border-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {locale === 'ar' ? 'كمية الطلب المقترحة' : 'Recommended Order Qty'}
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>
                +{rec.suggested_qty} {locale === 'ar' ? 'وحدة' : 'units'}
              </div>
            </div>
            <div style={{ textAlign: locale === 'ar' ? 'left' : 'right', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <div>{locale === 'ar' ? 'المورّد:' : 'Supplier:'} {rec.supplier_name || (locale === 'ar' ? 'المورّد الرئيسي' : 'Primary Vendor')}</div>
              <div>{locale === 'ar' ? 'الوجهة:' : 'Destination:'} {translateWarehouse(rec.location_code || 'Central Yard', locale)}</div>
            </div>
          </div>

          {showDismissInput && (
            <div>
              <label className="form-label">{locale === 'ar' ? 'سبب استبعاد التوصية للتدقيق *' : 'Audit Dismissal Reason *'}</label>
              <input
                className="form-input"
                placeholder={locale === 'ar' ? 'مثال: المنصة في فترة صيانة دورية أو تم الشراء مسبقاً' : 'e.g. Rig scheduled for maintenance hiatus'}
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {locale === 'ar' ? 'إغلاق' : 'Close'}
          </button>
          {rec.status === 'OPEN' && !showDismissInput && (
            <>
              <button type="button" className="btn btn-secondary" style={{ color: '#f87171' }} onClick={() => setShowDismissInput(true)}>
                <Ban style={{ width: 13, height: 13 }} /> {locale === 'ar' ? 'استبعاد المقترح' : 'Dismiss'}
              </button>
              <button type="button" className="btn btn-primary" onClick={handleApprove} disabled={submitting}>
                <CheckCircle style={{ width: 13, height: 13 }} />
                {submitting ? (locale === 'ar' ? 'جارٍ إنشاء أمر الشراء...' : 'Generating PO...') : (locale === 'ar' ? 'اعتماد وإنشاء مسودة أمر شراء' : 'Approve & Draft PO')}
              </button>
            </>
          )}
          {showDismissInput && (
            <button type="button" className="btn btn-danger" onClick={handleDismiss} disabled={submitting || !dismissReason.trim()}>
              {locale === 'ar' ? 'تأكيد الاستبعاد' : 'Confirm Dismissal'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
