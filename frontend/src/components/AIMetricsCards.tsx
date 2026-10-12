import React from 'react';
import { Sparkles, AlertTriangle, CheckCircle, Cpu } from 'lucide-react';
import { AIRecommendation, AIRun } from '../types';

interface AIMetricsCardsProps {
  recommendations: AIRecommendation[];
  runs: AIRun[];
}

export const AIMetricsCards: React.FC<AIMetricsCardsProps> = ({ recommendations, runs }) => {
  const openCount = recommendations.filter((r) => r.status === 'OPEN').length;
  const criticalCount = recommendations.filter((r) => r.urgency === 'CRITICAL' && r.status === 'OPEN').length;
  const approvedCount = recommendations.filter((r) => r.status === 'APPROVED').length;

  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Open AI Proposals</span>
          <Sparkles className="metric-icon" style={{ color: '#38bdf8' }} />
        </div>
        <div className="metric-value">{openCount}</div>
        <div className="metric-sub">Advisory replenishment queue</div>
      </div>
      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Stockout Alerts</span>
          <AlertTriangle className="metric-icon" style={{ color: '#ef4444' }} />
        </div>
        <div className="metric-value">{criticalCount}</div>
        <div className="metric-sub">Critical spare items under buffer target</div>
      </div>
      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Converted to Orders</span>
          <CheckCircle className="metric-icon" style={{ color: '#34d399' }} />
        </div>
        <div className="metric-value">{approvedCount}</div>
        <div className="metric-sub">Approved into draft purchase orders</div>
      </div>
      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Forecasting Engine</span>
          <Cpu className="metric-icon" style={{ color: '#a855f7' }} />
        </div>
        <div className="metric-value" style={{ fontSize: '1.25rem', paddingTop: '0.25rem' }}>Syntetos-Boylan</div>
        <div className="metric-sub">{runs.length} audit runs with chronological cutoff</div>
      </div>
    </div>
  );
};
