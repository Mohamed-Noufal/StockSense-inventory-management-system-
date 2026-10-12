import React from 'react';
import { Sparkles, Brain, CheckCircle, AlertTriangle } from 'lucide-react';
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
          <Sparkles className="metric-icon" style={{ color: 'var(--brand-primary)' }} />
        </div>
        <div className="metric-value">{openCount}</div>
        <div className="metric-sub">Awaiting procurement review</div>
      </div>
      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Stockout Alert SKUs</span>
          <AlertTriangle className="metric-icon" style={{ color: '#ef4444' }} />
        </div>
        <div className="metric-value">{criticalCount}</div>
        <div className="metric-sub">Zero stock / high stockout risk</div>
      </div>
      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Approved into POs</span>
          <CheckCircle className="metric-icon" style={{ color: '#34d399' }} />
        </div>
        <div className="metric-value">{approvedCount}</div>
        <div className="metric-sub">Converted directly to draft orders</div>
      </div>
      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Forecasting Engine</span>
          <Brain className="metric-icon" style={{ color: '#a855f7' }} />
        </div>
        <div className="metric-value" style={{ fontSize: '1.25rem' }}>Syntetos-Boylan</div>
        <div className="metric-sub">{runs.length} runs executed with cutoff safety</div>
      </div>
    </div>
  );
};
