import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { AIRecommendation, AIRun } from '../types';
import { AIMetricsCards } from './AIMetricsCards';
import { AIRowItem } from './AIRowItem';

interface AIInsightsViewProps {
  recommendations: AIRecommendation[];
  runs: AIRun[];
  onTriggerRun: () => Promise<void>;
  onInspectRec: (rec: AIRecommendation) => void;
  onQuickApprove: (id: number) => Promise<void>;
  loading: boolean;
  runningAi: boolean;
}

export const AIInsightsView: React.FC<AIInsightsViewProps> = ({
  recommendations, runs, onTriggerRun, onInspectRec, onQuickApprove, loading, runningAi,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = recommendations.filter((r) => statusFilter === 'ALL' || r.status === statusFilter);

  return (
    <div>
      <AIMetricsCards recommendations={recommendations} runs={runs} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['ALL', 'OPEN', 'APPROVED', 'DISMISSED'].map((st) => (
            <button
              key={st}
              className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
        <button
          className="btn btn-primary"
          onClick={onTriggerRun}
          disabled={runningAi}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' }}
        >
          <RefreshCw className={runningAi ? 'animate-spin' : ''} style={{ width: 16, height: 16 }} />
          <span>{runningAi ? 'Analyzing Intermittent Ledger...' : 'Run Replenishment Analysis'}</span>
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Urgency</th>
              <th>Pattern</th>
              <th>Part / Spare Item</th>
              <th>Destination</th>
              <th>Position vs ROP</th>
              <th>Suggested Qty</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && recommendations.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading AI recommendations...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No recommendations match this filter. Click 'Run Replenishment Analysis' to evaluate current stock positions.</td></tr>
            ) : (
              filtered.map((r) => (
                <AIRowItem
                  key={r.id}
                  recommendation={r}
                  onInspect={onInspectRec}
                  onQuickApprove={onQuickApprove}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
