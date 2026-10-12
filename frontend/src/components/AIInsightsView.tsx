import React, { useState } from 'react';
import { RefreshCw, Play } from 'lucide-react';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <AIMetricsCards recommendations={recommendations} runs={runs} />

      <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {['ALL', 'OPEN', 'APPROVED', 'DISMISSED'].map((st) => (
            <button
              key={st}
              className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
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
        >
          {runningAi ? (
            <RefreshCw className="animate-spin" style={{ width: 14, height: 14 }} />
          ) : (
            <Play style={{ width: 14, height: 14, fill: '#000000' }} />
          )}
          <span>{runningAi ? 'Calculating Intermittent Policies...' : 'Execute AI Replenishment Run'}</span>
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Urgency</th>
              <th>Pattern</th>
              <th>Spare Item</th>
              <th>Destination</th>
              <th>Position vs ROP</th>
              <th style={{ textAlign: 'right' }}>Suggested Qty</th>
              <th>Review Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && recommendations.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  Loading replenishment recommendations...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No recommendations match this filter. Click 'Execute AI Replenishment Run' to evaluate ledger positions.
                </td>
              </tr>
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
