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
    switch (urgency) {
      case 'CRITICAL':
        return <span className="urgency-badge urgency-badge-critical">Critical Risk</span>;
      case 'HIGH':
        return <span className="urgency-badge urgency-badge-high">High Urgency</span>;
      default:
        return <span className="urgency-badge urgency-badge-normal">Normal</span>;
    }
  };

  return (
    <div className="ai-workspace-container">
      {/* 1. Header Bar with Metadata Strip */}
      <div className="ai-header-bar">
        <div className="ai-header-title-box">
          <h1>
            <Sparkles style={{ width: 22, height: 22, color: 'var(--accent-blue)' }} />
            AI & Replenishment Intelligence
          </h1>
          <p>
            Autonomous demand pattern classification, Croston/SBA/TSB models & policy replenishment engine
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="ai-engine-meta-strip">
            <span className={`ai-status-pulse ${runningAi ? 'running' : ''}`} />
            <span style={{ fontWeight: 600, color: '#ffffff' }}>
              {runningAi ? 'RUNNING PIPELINE' : 'TSB ENGINE ACTIVE'}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span>
              {latestRun
                ? `Last Run #${latestRun.id} (${latestRun.status})`
                : 'No prior runs recorded'}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span
              style={{
                color: '#f59e0b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
              title="Historical movements originate from synthetic 52-week ledger"
            >
              <Info style={{ width: 12, height: 12 }} />
              Synthetic Dataset (34-40 wk zero demand)
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
            <span>{runningAi ? 'Analyzing Ledger...' : 'Run Forecast & Analysis'}</span>
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
            <span className="ai-summary-card-title">Open Recommendations</span>
            <Boxes style={{ width: 16, height: 16, color: 'var(--accent-blue)' }} />
          </div>
          <div className="ai-summary-card-value">{metrics.openCount}</div>
          <div className="ai-summary-card-sub">
            ${metrics.proposedSpend.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} estimated spend
          </div>
        </div>

        <div
          className={`ai-summary-card ${activeCardFilter === 'CRITICAL' ? 'active card-red' : ''}`}
          onClick={() => handleCardClick('CRITICAL')}
        >
          <div className="ai-summary-card-header">
            <span className="ai-summary-card-title">Critical Replenishment Risks</span>
            <AlertTriangle style={{ width: 16, height: 16, color: '#ef4444' }} />
          </div>
          <div className="ai-summary-card-value" style={{ color: metrics.criticalCount > 0 ? '#ef4444' : '#ffffff' }}>
            {metrics.criticalCount}
          </div>
          <div className="ai-summary-card-sub">
            Stockout imminent within current lead time
          </div>
        </div>

        <div
          className={`ai-summary-card ${activeCardFilter === 'BELOW_ROP' ? 'active card-amber' : ''}`}
          onClick={() => handleCardClick('BELOW_ROP')}
        >
          <div className="ai-summary-card-header">
            <span className="ai-summary-card-title">Items Below Reorder Point</span>
            <ShieldAlert style={{ width: 16, height: 16, color: '#f59e0b' }} />
          </div>
          <div className="ai-summary-card-value" style={{ color: metrics.belowRopCount > 0 ? '#f59e0b' : '#ffffff' }}>
            {metrics.belowRopCount}
          </div>
          <div className="ai-summary-card-sub">
            Inventory position &lt; safety stock + demand
          </div>
        </div>

        <div
          className={`ai-summary-card ${activeCardFilter === 'LOW_CONFIDENCE' ? 'active' : ''}`}
          onClick={() => handleCardClick('LOW_CONFIDENCE')}
        >
          <div className="ai-summary-card-header">
            <span className="ai-summary-card-title">Low-Confidence Forecasts</span>
            <TrendingUp style={{ width: 16, height: 16, color: '#8b5cf6' }} />
          </div>
          <div className="ai-summary-card-value" style={{ color: metrics.lowConfidenceCount > 0 ? '#a78bfa' : '#ffffff' }}>
            {metrics.lowConfidenceCount}
          </div>
          <div className="ai-summary-card-sub">
            Confidence &lt; 60% due to erratic zero counts
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
          <span>Recommendations ({recommendations.length})</span>
        </button>

        <button
          className={`ai-tab-btn ${activeTab === 'FORECASTS' ? 'active' : ''}`}
          onClick={() => setActiveTab('FORECASTS')}
        >
          <TrendingUp style={{ width: 15, height: 15 }} />
          <span>Forecasts & Observed Demand</span>
        </button>

        <button
          className={`ai-tab-btn ${activeTab === 'REPORT' ? 'active' : ''}`}
          onClick={() => setActiveTab('REPORT')}
        >
          <FileCheck style={{ width: 15, height: 15 }} />
          <span>AI Model Backtest Report</span>
        </button>
      </div>

      {/* 4. Tab 1: Recommendations Workstation */}
      {activeTab === 'RECOMMENDATIONS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Controls Bar */}
          <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 260 }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
                <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter by SKU, spare name, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#09090b',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.45rem 2rem 0.45rem 2rem',
                    fontSize: '0.8rem',
                    color: '#ffffff',
                    outline: 'none',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', background: '#09090b', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '0.5rem', paddingRight: '0.25rem' }}>Urgency:</span>
                {['ALL', 'CRITICAL', 'HIGH', 'NORMAL'].map((u) => (
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
                    {u}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', background: '#09090b', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '0.5rem', paddingRight: '0.25rem' }}>Status:</span>
                {['ALL', 'OPEN', 'APPROVED', 'DISMISSED'].map((st) => (
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
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Urgency</th>
                  <th>Spare Item & SKU</th>
                  <th>Demand Pattern</th>
                  <th>Stock Position vs ROP</th>
                  <th style={{ textAlign: 'right' }}>Suggested Order</th>
                  <th>Confidence</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', width: '200px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && recommendations.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      <RefreshCw className="animate-spin" style={{ width: 18, height: 18, margin: '0 auto 0.5rem' }} />
                      <div>Loading replenishment recommendations...</div>
                    </td>
                  </tr>
                ) : filteredRecs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '0.9rem', color: '#ffffff', marginBottom: '0.25rem' }}>
                        No recommendations match the active filter criteria.
                      </div>
                      <div style={{ fontSize: '0.76rem' }}>
                        Try clearing filters or click &apos;Run Forecast &amp; Analysis&apos; to evaluate live inventory positions.
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
                              {rec.location_code || 'Central Warehouse'}
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
                            {pattern}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 700, color: isBelowRop ? '#ef4444' : '#10b981', fontVariantNumeric: 'tabular-nums' }}>
                              {rec.on_hand}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>on hand</span>
                            {rec.on_order > 0 && (
                              <span style={{ fontSize: '0.72rem', color: '#f59e0b' }}>
                                (+{rec.on_order} ordered)
                              </span>
                            )}
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>/ ROP {rop}</span>
                          </div>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
                            {rec.suggested_qty} units
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            ~${estSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                              OPEN
                            </span>
                          )}
                          {rec.status === 'APPROVED' && (
                            <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: 4, background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                              PO CREATED
                            </span>
                          )}
                          {rec.status === 'DISMISSED' && (
                            <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: 4, background: 'rgba(113, 113, 122, 0.1)', color: '#a1a1aa', border: '1px solid rgba(113, 113, 122, 0.3)' }}>
                              DISMISSED
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
                              title="Why this item? Open full explanation drawer"
                            >
                              Explain
                            </button>

                            {rec.status === 'OPEN' && (
                              <>
                                <button
                                  className="btn btn-primary"
                                  onClick={() => setApprovingRec(rec)}
                                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                                >
                                  Approve
                                </button>
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => setDismissingRec(rec)}
                                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}
                                  title="Dismiss proposal"
                                >
                                  Dismiss
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
                                {rec.created_po_number ? rec.created_po_number : 'Approved'}
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
