import React, { useState, useMemo } from 'react';
import {
  Sparkles, Play, RefreshCw, AlertTriangle, TrendingUp, Boxes,
  FileCheck, Search, X, ShieldAlert, CheckCircle, Info
} from 'lucide-react';
import {
  AIRecommendation, AIRun, InventoryItem, Supplier,
  InventoryLocation, AIRunTriggerPayload, PurchaseOrder
} from '../types';
import { AIDrawer } from './AIDrawer';
import { AIApproveModal } from './AIApproveModal';
import { AIDismissModal } from './AIDismissModal';
import { AIRunModal } from './AIRunModal';
import { AIForecastsTab } from './AIForecastsTab';
import { AIModelReportTab } from './AIModelReportTab';
import { useI18n } from '../i18n/I18nContext';
import { translateUrgency, translateDemandPattern, translateWarehouse } from '../i18n/translations';

export interface AIInsightsViewProps {
  recommendations: AIRecommendation[];
  runs: AIRun[];
  items?: InventoryItem[];
  suppliers?: Supplier[];
  locations?: InventoryLocation[];
  onTriggerRun: (payload?: AIRunTriggerPayload) => Promise<void>;
  onInspectRec?: (rec: AIRecommendation) => void;
  onQuickApprove: (id: number) => Promise<PurchaseOrder>;
  onDismissRec?: (id: number, reason: string) => Promise<void>;
  onNavigateToPO?: (poId: number) => void;
  loading: boolean;
  runningAi: boolean;
}

type TabType = 'RECOMMENDATIONS' | 'FORECASTS' | 'REPORT';
type CardFilterType = 'ALL' | 'OPEN' | 'CRITICAL' | 'BELOW_ROP' | 'LOW_CONFIDENCE';

export const AIInsightsView: React.FC<AIInsightsViewProps> = ({
  recommendations,
  runs,
  items = [],
  suppliers = [],
  locations = [],
  onTriggerRun,
  onInspectRec,
  onQuickApprove,
  onDismissRec,
  onNavigateToPO,
  loading,
  runningAi,
}) => {
  const { t, locale } = useI18n();

  // Tabs
  const [activeTab, setActiveTab] = useState<TabType>('RECOMMENDATIONS');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeCardFilter, setActiveCardFilter] = useState<CardFilterType>('ALL');

  // Modals & Drawer State
  const [inspectingRec, setInspectingRec] = useState<AIRecommendation | null>(null);
  const [approvingRec, setApprovingRec] = useState<AIRecommendation | null>(null);
  const [dismissingRec, setDismissingRec] = useState<AIRecommendation | null>(null);
  const [showRunModal, setShowRunModal] = useState<boolean>(false);

  // Latest Run
  const latestRun = runs.length > 0 ? runs[0] : null;

  // 1. KPI Calculations
  const metrics = useMemo(() => {
    let openCount = 0;
    let criticalCount = 0;
    let belowRopCount = 0;
    let lowConfidenceCount = 0;
    let proposedSpend = 0;

    recommendations.forEach((r) => {
      let explanation: any = {};
      try {
        explanation = JSON.parse(r.explanation_json);
      } catch {
        // fallback
      }

      const rop = r.reorder_point ?? explanation.reorder_point ?? (r.on_hand + r.suggested_qty);
      const unitPrice = explanation.unit_price || 25.0;
      const confidence = explanation.confidence_score ?? explanation.confidence ?? 0.85;

      if (r.status === 'OPEN') {
        openCount += 1;
        proposedSpend += r.suggested_qty * unitPrice;
      }
      if (r.urgency === 'CRITICAL') {
        criticalCount += 1;
      }
      if (r.on_hand + r.on_order < rop) {
        belowRopCount += 1;
      }
      if (confidence < 0.6) {
        lowConfidenceCount += 1;
      }
    });

    return {
      openCount,
      criticalCount,
      belowRopCount,
      lowConfidenceCount,
      proposedSpend,
    };
  }, [recommendations]);

  // Card filter click handler
  const handleCardClick = (cardType: CardFilterType) => {
    if (activeCardFilter === cardType) {
      setActiveCardFilter('ALL');
      setStatusFilter('ALL');
      setUrgencyFilter('ALL');
    } else {
      setActiveCardFilter(cardType);
      if (cardType === 'OPEN') {
        setStatusFilter('OPEN');
        setUrgencyFilter('ALL');
      } else if (cardType === 'CRITICAL') {
        setUrgencyFilter('CRITICAL');
        setStatusFilter('ALL');
      } else {
        setStatusFilter('ALL');
        setUrgencyFilter('ALL');
      }
    }
  };

  // Filter recommendations
  const filteredRecs = useMemo(() => {
    return recommendations.filter((r) => {
      let explanation: any = {};
      try {
        explanation = JSON.parse(r.explanation_json);
      } catch {
        // fallback
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const skuMatch = (r.item_sku || '').toLowerCase().includes(q);
        const nameMatch = (r.item_name || '').toLowerCase().includes(q);
        const locMatch = (r.location_code || '').toLowerCase().includes(q);
        if (!skuMatch && !nameMatch && !locMatch) return false;
      }

      // Urgency filter
      if (urgencyFilter !== 'ALL' && r.urgency !== urgencyFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && r.status !== statusFilter) {
        return false;
      }

      // Additional card filters
      if (activeCardFilter === 'BELOW_ROP') {
        const rop = r.reorder_point ?? explanation.reorder_point ?? (r.on_hand + r.suggested_qty);
        if (r.on_hand + r.on_order >= rop) return false;
      }

      if (activeCardFilter === 'LOW_CONFIDENCE') {
        const confidence = explanation.confidence_score ?? explanation.confidence ?? 0.85;
        if (confidence >= 0.6) return false;
      }

      return true;
    });
  }, [recommendations, searchQuery, urgencyFilter, statusFilter, activeCardFilter]);

  // Urgency badge helper
  const renderUrgencyBadge = (urgency: string) => {
    const label = translateUrgency(urgency, locale);
    switch (urgency) {
      case 'CRITICAL':
        return <span className="urgency-badge urgency-badge-critical">{label}</span>;
      case 'HIGH':
        return <span className="urgency-badge urgency-badge-high">{label}</span>;
      default:
        return <span className="urgency-badge urgency-badge-normal">{label}</span>;
    }
  };

  return (
    <div className="ai-workspace-container">
      {/* 1. Header Bar with Metadata Strip */}
      <div className="ai-header-bar">
        <div className="ai-header-title-box">
          <h1>
            <Sparkles style={{ width: 22, height: 22, color: 'var(--accent-blue)' }} />
            {t('ai.title')}
          </h1>
          <p>
            {t('ai.subtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="ai-engine-meta-strip">
            <span className={`ai-status-pulse ${runningAi ? 'running' : ''}`} />
            <span style={{ fontWeight: 600, color: '#ffffff' }}>
              {runningAi ? t('ai.running_pipeline') : t('ai.engine_active')}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span>
              {latestRun
                ? (locale === 'ar' ? `آخر تحليل #${latestRun.id} (${latestRun.status})` : `Last Run #${latestRun.id} (${latestRun.status})`)
                : (locale === 'ar' ? 'لا توجد تحليلات سابقة' : 'No prior runs recorded')}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span
              style={{
                color: '#f59e0b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
              title={locale === 'ar' ? 'الحركات التاريخية مستمدة من سجل نموذجي يمتد لـ 52 أسبوعاً' : 'Historical movements originate from synthetic 52-week ledger'}
            >
              <Info style={{ width: 12, height: 12 }} />
              {locale === 'ar' ? 'بيانات تاريخية (نموذج 52 أسبوعاً)' : 'Synthetic Dataset (34-40 wk zero demand)'}
            </span>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setShowRunModal(true)}
            disabled={runningAi}
            style={{ padding: '0.55rem 0.95rem' }}
          >
            {runningAi ? (
              <RefreshCw className="animate-spin" style={{ width: 14, height: 14 }} />
            ) : (
              <Play style={{ width: 14, height: 14, fill: '#000000' }} />
            )}
            <span>{runningAi ? t('ai.analyzing') : t('ai.run_btn')}</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Summary Metric Cards with Click-to-Filter */}
      <div className="ai-summary-grid">
        <div
          className={`ai-summary-card ${activeCardFilter === 'OPEN' ? 'active' : ''}`}
          onClick={() => handleCardClick('OPEN')}
        >
          <div className="ai-summary-card-header">
            <span className="ai-summary-card-title">{t('ai.open_recs')}</span>
            <Boxes style={{ width: 16, height: 16, color: 'var(--accent-blue)' }} />
          </div>
          <div className="ai-summary-card-value">{metrics.openCount}</div>
          <div className="ai-summary-card-sub">
            ${metrics.proposedSpend.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {locale === 'ar' ? 'قيمة شراء مقترحة' : 'estimated spend'}
          </div>
        </div>

        <div
          className={`ai-summary-card ${activeCardFilter === 'CRITICAL' ? 'active card-red' : ''}`}
          onClick={() => handleCardClick('CRITICAL')}
        >
          <div className="ai-summary-card-header">
            <span className="ai-summary-card-title">{t('ai.critical_risks')}</span>
            <AlertTriangle style={{ width: 16, height: 16, color: '#ef4444' }} />
          </div>
          <div className="ai-summary-card-value" style={{ color: metrics.criticalCount > 0 ? '#ef4444' : '#ffffff' }}>
            {metrics.criticalCount}
          </div>
          <div className="ai-summary-card-sub">
            {t('ai.critical_risks_sub')}
          </div>
        </div>

        <div
          className={`ai-summary-card ${activeCardFilter === 'BELOW_ROP' ? 'active card-amber' : ''}`}
          onClick={() => handleCardClick('BELOW_ROP')}
        >
          <div className="ai-summary-card-header">
            <span className="ai-summary-card-title">{t('ai.below_rop')}</span>
            <ShieldAlert style={{ width: 16, height: 16, color: '#f59e0b' }} />
          </div>
          <div className="ai-summary-card-value" style={{ color: metrics.belowRopCount > 0 ? '#f59e0b' : '#ffffff' }}>
            {metrics.belowRopCount}
          </div>
          <div className="ai-summary-card-sub">
            {t('ai.below_rop_sub')}
          </div>
        </div>

        <div
          className={`ai-summary-card ${activeCardFilter === 'LOW_CONFIDENCE' ? 'active' : ''}`}
          onClick={() => handleCardClick('LOW_CONFIDENCE')}
        >
          <div className="ai-summary-card-header">
            <span className="ai-summary-card-title">{t('ai.low_conf')}</span>
            <TrendingUp style={{ width: 16, height: 16, color: '#8b5cf6' }} />
          </div>
          <div className="ai-summary-card-value" style={{ color: metrics.lowConfidenceCount > 0 ? '#a78bfa' : '#ffffff' }}>
            {metrics.lowConfidenceCount}
          </div>
          <div className="ai-summary-card-sub">
            {t('ai.low_conf_sub')}
          </div>
        </div>
      </div>

      {/* 3. Three Workstation Tabs */}
      <div className="ai-tabs-nav">
        <button
          className={`ai-tab-btn ${activeTab === 'RECOMMENDATIONS' ? 'active' : ''}`}
          onClick={() => setActiveTab('RECOMMENDATIONS')}
        >
          <Boxes style={{ width: 15, height: 15 }} />
          <span>{t('ai.tab_recs')} ({recommendations.length})</span>
        </button>

        <button
          className={`ai-tab-btn ${activeTab === 'FORECASTS' ? 'active' : ''}`}
          onClick={() => setActiveTab('FORECASTS')}
        >
          <TrendingUp style={{ width: 15, height: 15 }} />
          <span>{t('ai.tab_forecasts')}</span>
        </button>

        <button
          className={`ai-tab-btn ${activeTab === 'REPORT' ? 'active' : ''}`}
          onClick={() => setActiveTab('REPORT')}
        >
          <FileCheck style={{ width: 15, height: 15 }} />
          <span>{t('ai.tab_report')}</span>
        </button>
      </div>

      {/* 4. Tab 1: Recommendations Workstation */}
      {activeTab === 'RECOMMENDATIONS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Controls Bar */}
          <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 260 }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
                <Search style={{ position: 'absolute', left: locale === 'ar' ? undefined : 10, right: locale === 'ar' ? 10 : undefined, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder={t('ai.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#09090b',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: locale === 'ar' ? '0.45rem 2rem 0.45rem 0.75rem' : '0.45rem 0.75rem 0.45rem 2rem',
                    fontSize: '0.8rem',
                    color: '#ffffff',
                    outline: 'none',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: locale === 'ar' ? undefined : 8, left: locale === 'ar' ? 8 : undefined, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', background: '#09090b', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '0.5rem', paddingRight: '0.25rem' }}>{t('ai.urgency_label')}</span>
                {['ALL', 'CRITICAL', 'HIGH', 'NORMAL'].map((u) => {
                  const label = u === 'ALL'
                    ? (locale === 'ar' ? 'الكل' : 'ALL')
                    : translateUrgency(u, locale);
                  return (
                    <button
                      key={u}
                      onClick={() => { setUrgencyFilter(u); setActiveCardFilter('ALL'); }}
                      style={{
                        background: urgencyFilter === u ? '#27272a' : 'transparent',
                        border: 'none',
                        color: urgencyFilter === u ? '#ffffff' : 'var(--text-secondary)',
                        fontSize: '0.72rem',
                        padding: '0.25rem 0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontWeight: urgencyFilter === u ? 600 : 400,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', background: '#09090b', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '0.5rem', paddingRight: '0.25rem' }}>{t('ai.status_label')}</span>
                {['ALL', 'OPEN', 'APPROVED', 'DISMISSED'].map((st) => {
                  const label = st === 'ALL'
                    ? (locale === 'ar' ? 'الكل' : 'ALL')
                    : st === 'OPEN'
                    ? (locale === 'ar' ? 'مفتوح' : 'OPEN')
                    : st === 'APPROVED'
                    ? (locale === 'ar' ? 'معتمد' : 'APPROVED')
                    : (locale === 'ar' ? 'مستبعد' : 'DISMISSED');
                  return (
                    <button
                      key={st}
                      onClick={() => { setStatusFilter(st); setActiveCardFilter('ALL'); }}
                      style={{
                        background: statusFilter === st ? '#27272a' : 'transparent',
                        border: 'none',
                        color: statusFilter === st ? '#ffffff' : 'var(--text-secondary)',
                        fontSize: '0.72rem',
                        padding: '0.25rem 0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontWeight: statusFilter === st ? 600 : 400,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recommendations Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>{t('ai.col_urgency')}</th>
                  <th>{t('ai.col_item')}</th>
                  <th>{t('ai.col_pattern')}</th>
                  <th>{t('ai.col_stock_vs_rop')}</th>
                  <th style={{ textAlign: 'right' }}>{t('ai.col_suggested')}</th>
                  <th>{t('ai.col_confidence')}</th>
                  <th>{t('ai.col_status')}</th>
                  <th style={{ textAlign: 'right', width: '200px' }}>{t('ai.col_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading && recommendations.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      <RefreshCw className="animate-spin" style={{ width: 18, height: 18, margin: '0 auto 0.5rem' }} />
                      <div>{t('ai.analyzing')}</div>
                    </td>
                  </tr>
                ) : filteredRecs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '0.9rem', color: '#ffffff', marginBottom: '0.25rem' }}>
                        {t('ai.empty_filter')}
                      </div>
                      <div style={{ fontSize: '0.76rem' }}>
                        {t('ai.empty_filter_sub')}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecs.map((rec) => {
                    let explanation: any = {};
                    try {
                      explanation = JSON.parse(rec.explanation_json);
                    } catch {
                      // fallback
                    }

                    const rop = rec.reorder_point ?? explanation.reorder_point ?? (rec.on_hand + rec.suggested_qty);
                    const unitPrice = explanation.unit_price || 25.0;
                    const estSpend = rec.suggested_qty * unitPrice;
                    const isBelowRop = (rec.on_hand + rec.on_order) < rop;
                    const confidence = explanation.confidence_score ?? explanation.confidence ?? 0.85;
                    const pattern = rec.demand_pattern || explanation.demand_pattern || 'INTERMITTENT';

                    return (
                      <tr
                        key={rec.id}
                        onClick={() => {
                          setInspectingRec(rec);
                          onInspectRec?.(rec);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{renderUrgencyBadge(rec.urgency)}</td>

                        <td>
                          <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.84rem' }}>
                            {rec.item_name || 'Spare Item'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              {rec.item_sku || 'SKU'}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>•</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {translateWarehouse(rec.location_code || 'Central Warehouse (Cairo Base)', locale)}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: '0.72rem',
                              fontFamily: 'var(--font-mono)',
                              padding: '0.15rem 0.45rem',
                              borderRadius: 3,
                              background: '#18181b',
                              border: '1px solid var(--border-default)',
                              color: 'var(--accent-blue)',
                            }}
                          >
                            {translateDemandPattern(pattern, locale)}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 700, color: isBelowRop ? '#ef4444' : '#10b981', fontVariantNumeric: 'tabular-nums' }}>
                              {rec.on_hand}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'رصيد حالي' : 'on hand'}</span>
                            {rec.on_order > 0 && (
                              <span style={{ fontSize: '0.72rem', color: '#f59e0b' }}>
                                (+{rec.on_order} {locale === 'ar' ? 'قيد التوريد' : 'ordered'})
                              </span>
                            )}
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>/ {locale === 'ar' ? 'حد الطلب' : 'ROP'} {rop}</span>
                          </div>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
                            {rec.suggested_qty} {locale === 'ar' ? 'وحدة' : 'units'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            ~${estSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <div
                              style={{
                                width: 36,
                                height: 5,
                                background: '#27272a',
                                borderRadius: 3,
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.round(confidence * 100)}%`,
                                  height: '100%',
                                  background: confidence >= 0.8 ? '#10b981' : confidence >= 0.6 ? '#f59e0b' : '#ef4444',
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '0.74rem', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
                              {Math.round(confidence * 100)}%
                            </span>
                          </div>
                        </td>

                        <td>
                          {rec.status === 'OPEN' && (
                            <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: 4, background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                              {locale === 'ar' ? 'مفتوح' : 'OPEN'}
                            </span>
                          )}
                          {rec.status === 'APPROVED' && (
                            <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: 4, background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                              {locale === 'ar' ? 'تم إنشاء أمر الشراء' : 'PO CREATED'}
                            </span>
                          )}
                          {rec.status === 'DISMISSED' && (
                            <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: 4, background: 'rgba(113, 113, 122, 0.1)', color: '#a1a1aa', border: '1px solid rgba(113, 113, 122, 0.3)' }}>
                              {locale === 'ar' ? 'مستبعد' : 'DISMISSED'}
                            </span>
                          )}
                        </td>

                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            <button
                              className="btn btn-secondary"
                              onClick={() => {
                                setInspectingRec(rec);
                                onInspectRec?.(rec);
                              }}
                              style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                              title={locale === 'ar' ? 'لماذا هذا الصنف؟ فتح تفاصيل التفسير والنموذج' : 'Why this item? Open full explanation drawer'}
                            >
                              {t('ai.btn_explain')}
                            </button>

                            {rec.status === 'OPEN' && (
                              <>
                                <button
                                  className="btn btn-primary"
                                  onClick={() => setApprovingRec(rec)}
                                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                                >
                                  {t('ai.btn_approve')}
                                </button>
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => setDismissingRec(rec)}
                                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}
                                  title={locale === 'ar' ? 'استبعاد المقترح' : 'Dismiss proposal'}
                                >
                                  {t('ai.btn_dismiss')}
                                </button>
                              </>
                            )}

                            {rec.status === 'APPROVED' && (
                              <button
                                className="btn btn-secondary"
                                onClick={() => {
                                  if (rec.created_po_id && onNavigateToPO) {
                                    onNavigateToPO(rec.created_po_id);
                                  }
                                }}
                                style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <CheckCircle style={{ width: 13, height: 13 }} />
                                {rec.created_po_number ? rec.created_po_number : (locale === 'ar' ? 'معتمد' : 'Approved')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Forecasts Workstation */}
      {activeTab === 'FORECASTS' && (
        <AIForecastsTab items={items} />
      )}

      {/* 6. Tab 3: Model Report Workstation */}
      {activeTab === 'REPORT' && (
        <AIModelReportTab />
      )}

      {/* 7. Explainability Drawer */}
      {inspectingRec && (
        <AIDrawer
          rec={inspectingRec}
          onClose={() => setInspectingRec(null)}
          onOpenApproveModal={() => {
            setApprovingRec(inspectingRec);
          }}
          onOpenDismissModal={() => {
            setDismissingRec(inspectingRec);
          }}
        />
      )}

      {/* 8. Window A: Approve Recommendation Modal */}
      {approvingRec && (
        <AIApproveModal
          rec={approvingRec}
          suppliers={suppliers}
          locations={locations}
          onClose={() => setApprovingRec(null)}
          onApproveSuccess={(po) => {
            setApprovingRec(null);
            setInspectingRec(null);
            onNavigateToPO?.(po.id);
          }}
          onApprove={onQuickApprove}
        />
      )}

      {/* 9. Window B: Dismiss Modal */}
      {dismissingRec && (
        <AIDismissModal
          rec={dismissingRec}
          onClose={() => setDismissingRec(null)}
          onDismiss={async (id, reason) => {
            if (onDismissRec) {
              await onDismissRec(id, reason);
            }
            setDismissingRec(null);
            setInspectingRec(null);
          }}
        />
      )}

      {/* 10. Window C: Run Analysis Modal */}
      {showRunModal && (
        <AIRunModal
          onClose={() => setShowRunModal(false)}
          onExecute={async (payload) => {
            await onTriggerRun(payload);
            setShowRunModal(false);
          }}
          running={runningAi}
        />
      )}
    </div>
  );
};
