import React, { useState } from 'react';
import { BarChart3, ArrowDownLeft, ArrowLeftRight, Package, ShieldCheck, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { OperationsStats } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface OperationsStatsCardProps {
  stats: OperationsStats | null;
  onTimeframeChange?: (days: number) => void;
}

export const OperationsStatsCard: React.FC<OperationsStatsCardProps> = ({ stats, onTimeframeChange }) => {
  const { t } = useI18n();
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(7);

  const handleSelectTimeframe = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const days = Number(e.target.value);
    setSelectedTimeframe(days);
    if (onTimeframeChange) onTimeframeChange(days);
  };

  const issues = stats ? stats.issues_count : 42;
  const issuesTrend = stats ? stats.issues_trend_pct : 12;

  const transfers = stats ? stats.transfers_count : 18;
  const transfersTrend = stats ? stats.transfers_trend_pct : 8;

  const receipts = stats ? stats.receipts_count : 27;
  const receiptsTrend = stats ? stats.receipts_trend_pct : 21;

  const adjustments = stats ? stats.adjustments_count : 3;
  const adjustmentsTrend = stats ? stats.adjustments_trend_pct : -50;

  return (
    <div className="card ops-side-card">
      <div className="ops-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 style={{ width: 16, height: 16, color: 'var(--text-secondary)' }} />
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            {t('operations.stats_title')}
          </h3>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <select
            className="ops-timeframe-select"
            value={selectedTimeframe}
            onChange={handleSelectTimeframe}
          >
            <option value={7}>{t('operations.last_7_days')}</option>
            <option value={14}>{t('operations.last_14_days')}</option>
            <option value={30}>{t('operations.last_30_days')}</option>
          </select>
          <ChevronDown style={{ width: 12, height: 12, color: 'var(--text-muted)', position: 'absolute', right: 8, pointerEvents: 'none' }} />
        </div>
      </div>

      <div className="ops-stats-grid">
        {/* Issues */}
        <div className="ops-stat-box">
          <div className="ops-stat-top">
            <div className="ops-stat-icon icon-issue">
              <ArrowDownLeft style={{ width: 13, height: 13 }} />
            </div>
            <span className="ops-stat-name">{t('operations.stat_issues')}</span>
          </div>
          <div className="ops-stat-value">{issues}</div>
          <div className="ops-stat-trend trend-up">
            <TrendingUp style={{ width: 11, height: 11 }} />
            <span>{issuesTrend > 0 ? `↑ ${issuesTrend}%` : `${issuesTrend}%`}</span>
          </div>
        </div>

        {/* Transfers */}
        <div className="ops-stat-box">
          <div className="ops-stat-top">
            <div className="ops-stat-icon icon-transfer">
              <ArrowLeftRight style={{ width: 13, height: 13 }} />
            </div>
            <span className="ops-stat-name">{t('operations.stat_transfers')}</span>
          </div>
          <div className="ops-stat-value">{transfers}</div>
          <div className="ops-stat-trend trend-up">
            <TrendingUp style={{ width: 11, height: 11 }} />
            <span>{transfersTrend > 0 ? `↑ ${transfersTrend}%` : `${transfersTrend}%`}</span>
          </div>
        </div>

        {/* Receipts */}
        <div className="ops-stat-box">
          <div className="ops-stat-top">
            <div className="ops-stat-icon icon-receive">
              <Package style={{ width: 13, height: 13 }} />
            </div>
            <span className="ops-stat-name">{t('operations.stat_receipts')}</span>
          </div>
          <div className="ops-stat-value">{receipts}</div>
          <div className="ops-stat-trend trend-up">
            <TrendingUp style={{ width: 11, height: 11 }} />
            <span>{receiptsTrend > 0 ? `↑ ${receiptsTrend}%` : `${receiptsTrend}%`}</span>
          </div>
        </div>

        {/* Adjustments */}
        <div className="ops-stat-box">
          <div className="ops-stat-top">
            <div className="ops-stat-icon icon-adjust">
              <ShieldCheck style={{ width: 13, height: 13 }} />
            </div>
            <span className="ops-stat-name">{t('operations.stat_adjustments')}</span>
          </div>
          <div className="ops-stat-value">{adjustments}</div>
          <div className={`ops-stat-trend ${adjustmentsTrend < 0 ? 'trend-down' : 'trend-up'}`}>
            {adjustmentsTrend < 0 ? (
              <TrendingDown style={{ width: 11, height: 11 }} />
            ) : (
              <TrendingUp style={{ width: 11, height: 11 }} />
            )}
            <span>{adjustmentsTrend < 0 ? `↓ ${Math.abs(adjustmentsTrend)}%` : `↑ ${adjustmentsTrend}%`}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
