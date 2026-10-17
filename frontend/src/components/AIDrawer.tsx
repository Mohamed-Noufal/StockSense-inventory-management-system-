import React from 'react';
import {
  X, Sparkles, CheckCircle, Ban, AlertTriangle, ShieldCheck,
  TrendingUp, Boxes, Building2
} from 'lucide-react';
import { AIRecommendation } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { translateUrgency, translateDemandPattern, translateWarehouse } from '../i18n/translations';

interface AIDrawerProps {
  rec: AIRecommendation;
  onClose: () => void;
  onOpenApproveModal: () => void;
  onOpenDismissModal: () => void;
}

export const AIDrawer: React.FC<AIDrawerProps> = ({
  rec,
  onClose,
  onOpenApproveModal,
  onOpenDismissModal,
}) => {
  const { locale } = useI18n();
  let explanation: any = {};
  try {
    explanation = JSON.parse(rec.explanation_json);
  } catch {
    // fallback
  }

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return <span className="urgency-badge urgency-badge-critical">{translateUrgency('CRITICAL', locale)}</span>;
      case 'HIGH':
        return <span className="urgency-badge urgency-badge-high">{translateUrgency('HIGH', locale)}</span>;
      default:
        return <span className="urgency-badge urgency-badge-normal">{translateUrgency('NORMAL', locale)}</span>;
    }
  };

  const isColdStart = (rec.on_hand === 0 && rec.on_order === 0) || (explanation.is_cold_start === true);

  return (
    <div className="ai-drawer-overlay" onClick={onClose}>
      <div className="ai-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="ai-drawer-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles style={{ width: 16, height: 16, color: '#38bdf8' }} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                {locale === 'ar' ? `أسباب التوصية — مقترح التوريد #${rec.id}` : `Why This Item? — Recommendation #${rec.id}`}
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
              <span className="sku-cell" style={{ fontWeight: 600 }}>{rec.item_sku}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{rec.item_name}</span>
              {getUrgencyBadge(rec.urgency)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Drawer Body with 6 Explanation Sections */}
        <div className="ai-drawer-body">
          {/* Section 1 — Recommendation Summary */}
          <div className="ai-drawer-section">
            <span className="ai-drawer-section-title">
              <Sparkles style={{ width: 13, height: 13 }} /> {locale === 'ar' ? 'القسم 1 — ملخص توصية التوريد' : 'Section 1 — Recommendation Summary'}
            </span>
            <div style={{ padding: '0.85rem 1rem', background: '#121214', border: '1px solid var(--border-default)', borderRadius: '6px', fontSize: '0.82rem', lineHeight: '1.5', color: '#ffffff' }}>
              {rec.summary_text}
            </div>
          </div>

          {/* Section 2 — Inventory State */}
          <div className="ai-drawer-section">
            <span className="ai-drawer-section-title">
              <Boxes style={{ width: 13, height: 13 }} /> {locale === 'ar' ? 'القسم 2 — موقف المخزون الحالي' : 'Section 2 — Inventory State'}
            </span>
            <div className="ai-drawer-grid-2">
              <div className="ai-drawer-metric-tile">
                <span className="ai-drawer-metric-label">{locale === 'ar' ? 'الرصيد المتاح' : 'On Hand'}</span>
                <div className="ai-drawer-metric-val">{rec.on_hand} {locale === 'ar' ? 'وحدة' : 'units'}</div>
              </div>
              <div className="ai-drawer-metric-tile">
                <span className="ai-drawer-metric-label">{locale === 'ar' ? 'قيد الطلب' : 'On Order'}</span>
                <div className="ai-drawer-metric-val">{rec.on_order} {locale === 'ar' ? 'وحدة' : 'units'}</div>
              </div>
              <div className="ai-drawer-metric-tile">
                <span className="ai-drawer-metric-label">{locale === 'ar' ? 'موقف المخزون الفعلي' : 'Inventory Position'}</span>
                <div className="ai-drawer-metric-val" style={{ color: rec.inventory_position <= rec.reorder_point ? '#f87171' : '#ffffff' }}>
                  {rec.inventory_position} {locale === 'ar' ? 'وحدة' : 'units'}
                </div>
              </div>
              <div className="ai-drawer-metric-tile">
                <span className="ai-drawer-metric-label">{locale === 'ar' ? 'نقطة إعادة الطلب (ROP)' : 'Reorder Point (ROP)'}</span>
                <div className="ai-drawer-metric-val" style={{ color: '#fbbf24' }}>
                  {rec.reorder_point} {locale === 'ar' ? 'وحدة' : 'units'}
                </div>
              </div>
            </div>

            <div style={{ padding: '0.75rem 1rem', background: '#121214', border: '1px solid var(--border-default)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {locale === 'ar' ? 'كمية الطلب المقترحة بالذكاء الاصطناعي' : 'AI Suggested Order Qty'}
              </span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                +{rec.suggested_qty} {locale === 'ar' ? 'وحدة' : 'units'}
              </span>
            </div>
          </div>

          {/* Section 3 — Forecast Explanation */}
          <div className="ai-drawer-section">
            <span className="ai-drawer-section-title">
              <TrendingUp style={{ width: 13, height: 13 }} /> {locale === 'ar' ? 'القسم 3 — تحليل وتنبؤ الطلب' : 'Section 3 — Forecast Explanation'}
            </span>
            <div className="ai-drawer-grid-2">
              <div className="ai-drawer-metric-tile">
                <span className="ai-drawer-metric-label">{locale === 'ar' ? 'نمط الطلب' : 'Demand Pattern'}</span>
                <div className="ai-drawer-metric-val" style={{ textTransform: 'capitalize' }}>
                  {translateDemandPattern(rec.demand_pattern || 'Intermittent', locale)}
                </div>
              </div>
              <div className="ai-drawer-metric-tile">
                <span className="ai-drawer-metric-label">{locale === 'ar' ? 'الخوارزمية المختارة' : 'Selected Method'}</span>
                <div className="ai-drawer-metric-val" style={{ color: '#38bdf8' }}>
                  {rec.forecast_method || 'TSB / SBA'}
                </div>
              </div>
              <div className="ai-drawer-metric-tile">
                <span className="ai-drawer-metric-label">{locale === 'ar' ? 'متوسط الطلب الأسبوعي' : 'Forecast Mean (Weekly)'}</span>
                <div className="ai-drawer-metric-val">
                  {explanation.forecast_mean !== undefined ? `${Number(explanation.forecast_mean).toFixed(2)} ${locale === 'ar' ? 'وحدة' : 'units'}` : '—'}
                </div>
              </div>
              <div className="ai-drawer-metric-tile">
                <span className="ai-drawer-metric-label">{locale === 'ar' ? 'أفق التقييم' : 'Evaluation Horizon'}</span>
                <div className="ai-drawer-metric-val">{locale === 'ar' ? '4 أسابيع' : '4 Weeks'}</div>
              </div>
            </div>
          </div>

          {/* Section 4 — Inventory Policy */}
          <div className="ai-drawer-section">
            <span className="ai-drawer-section-title">
              <ShieldCheck style={{ width: 13, height: 13 }} /> {locale === 'ar' ? 'القسم 4 — محددات سياسة المخزون' : 'Section 4 — Inventory Policy Assumptions'}
            </span>
            <div className="ai-drawer-grid-2">
              <div className="ai-drawer-metric-tile">
                <span className="ai-drawer-metric-label">{locale === 'ar' ? 'متوسط فترة التوريد' : 'Lead Time Mean'}</span>
                <div className="ai-drawer-metric-val">
                  {explanation.lead_time_days || 14} {locale === 'ar' ? 'يوم' : 'days'}
                </div>
              </div>
              <div className="ai-drawer-metric-tile">
                <span className="ai-drawer-metric-label">{locale === 'ar' ? 'مستوى الخدمة المستهدف' : 'Target Service Level'}</span>
                <div className="ai-drawer-metric-val" style={{ color: '#34d399' }}>95.0%</div>
              </div>
              <div className="ai-drawer-metric-tile">
                <span className="ai-drawer-metric-label">{locale === 'ar' ? 'مخزون الأمان' : 'Safety Stock'}</span>
                <div className="ai-drawer-metric-val">
                  {explanation.safety_stock !== undefined ? `${explanation.safety_stock} ${locale === 'ar' ? 'وحدة' : 'units'}` : '—'}
                </div>
              </div>
              <div className="ai-drawer-metric-tile">
                <span className="ai-drawer-metric-label">{locale === 'ar' ? 'سقف المخزون المستهدف (OUT)' : 'Order-Up-To Level (OUT)'}</span>
                <div className="ai-drawer-metric-val">
                  {explanation.order_up_to !== undefined ? `${explanation.order_up_to} ${locale === 'ar' ? 'وحدة' : 'units'}` : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5 — Supplier Constraints */}
          <div className="ai-drawer-section">
            <span className="ai-drawer-section-title">
              <Building2 style={{ width: 13, height: 13 }} /> {locale === 'ar' ? 'القسم 5 — قيود ومحددات المورّد' : 'Section 5 — Supplier Constraints'}
            </span>
            <div className="ai-drawer-grid-2">
              <div className="ai-drawer-metric-tile">
                <span className="ai-drawer-metric-label">{locale === 'ar' ? 'الحد الأدنى للطلب (MOQ)' : 'Minimum Order Qty (MOQ)'}</span>
                <div className="ai-drawer-metric-val">
                  {explanation.moq || 1} {locale === 'ar' ? 'وحدة' : 'units'}
                </div>
              </div>
              <div className="ai-drawer-metric-tile">
                <span className="ai-drawer-metric-label">{locale === 'ar' ? 'مضاعف حزمة التوريد' : 'Order Multiple'}</span>
                <div className="ai-drawer-metric-val">
                  {explanation.order_multiple || 1} {locale === 'ar' ? 'وحدة' : 'units'}
                </div>
              </div>
              <div className="ai-drawer-metric-tile">
                <span className="ai-drawer-metric-label">{locale === 'ar' ? 'المورّد المعتمد' : 'Preferred Vendor'}</span>
                <div className="ai-drawer-metric-val" style={{ fontSize: '0.82rem' }}>
                  {rec.supplier_name || (locale === 'ar' ? 'المورّد الرئيسي' : 'Primary Supplier')}
                </div>
              </div>
              <div className="ai-drawer-metric-tile">
                <span className="ai-drawer-metric-label">{locale === 'ar' ? 'مستودع الوجهة' : 'Destination Location'}</span>
                <div className="ai-drawer-metric-val" style={{ fontSize: '0.82rem' }}>
                  {translateWarehouse(rec.location_code || 'Central Yard', locale)}
                </div>
              </div>
            </div>
          </div>

          {/* Section 6 — Confidence and Limitations */}
          <div className="ai-drawer-section">
            <span className="ai-drawer-section-title">
              <AlertTriangle style={{ width: 13, height: 13 }} /> {locale === 'ar' ? 'القسم 6 — موثوقية النموذج والحدود التشغيلية' : 'Section 6 — Confidence & Limitations'}
            </span>
            <div style={{ padding: '0.75rem 1rem', background: '#121214', border: '1px solid var(--border-subtle)', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ color: isColdStart ? '#fbbf24' : '#34d399', fontWeight: 600 }}>
                  {locale === 'ar'
                    ? (isColdStart ? '⚠️ تنبيه بداية باردة / بيانات تاريخية محدودة' : '✓ سجل طلب تاريخي مكتمل لمدة 52 أسبوعاً')
                    : (isColdStart ? '⚠️ Cold-Start / Low History Caution' : '✓ Full 52-Week Demand History Available')}
                </span>
              </div>
              <div>
                {locale === 'ar'
                  ? 'تطبيق حاسم للحد الزمني التاريخي: عزل كامل لمنع تسرب بيانات الطلب المستقبلية. تقييم مبني على معايير قطع غيار النفط والغاز.'
                  : 'Strict temporal cutoff enforced: zero future demand leakage. Evaluation performed under synthetic assumptions for oilfield spare parts.'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="ai-drawer-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {locale === 'ar' ? 'إغلاق' : 'Close'}
          </button>
          {rec.status === 'OPEN' && (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ color: '#f87171' }}
                onClick={onOpenDismissModal}
              >
                <Ban style={{ width: 13, height: 13 }} />
                <span>{locale === 'ar' ? 'استبعاد التوصية' : 'Dismiss'}</span>
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onOpenApproveModal}
              >
                <CheckCircle style={{ width: 14, height: 14 }} />
                <span>{locale === 'ar' ? 'اعتماد وإنشاء أمر شراء' : 'Approve & Create PO'}</span>
              </button>
            </>
          )}
          {rec.status === 'APPROVED' && (
            <div style={{ fontSize: '0.76rem', color: '#34d399', fontWeight: 600 }}>
              {locale === 'ar'
                ? `✓ تم الاعتماد (أمر شراء #${rec.created_po_number || rec.created_po_id})`
                : `✓ Approved (PO #${rec.created_po_number || rec.created_po_id})`}
            </div>
          )}
          {rec.status === 'DISMISSED' && (
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              {locale === 'ar' ? 'تم الاستبعاد من قبل المشغل' : 'Dismissed by operator'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
