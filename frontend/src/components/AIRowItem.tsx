import React from 'react';
import { CheckCircle, Ban, ArrowUpRight } from 'lucide-react';
import { AIRecommendation } from '../types';

interface AIRowItemProps {
  recommendation: AIRecommendation;
  onInspect: (rec: AIRecommendation) => void;
  onQuickApprove: (id: number) => Promise<void>;
}

export const AIRowItem: React.FC<AIRowItemProps> = ({
  recommendation: r,
  onInspect,
  onQuickApprove,
}) => {
  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return <span className="badge badge-critical">Critical Risk</span>;
      case 'HIGH':
        return <span className="badge badge-warning">High Priority</span>;
      default:
        return <span className="badge badge-info">Normal</span>;
    }
  };

  const getPatternBadge = (pattern?: string) => {
    const p = (pattern || 'intermittent').toLowerCase();
    const colors: Record<string, string> = {
      intermittent: '#38bdf8',
      lumpy: '#fbbf24',
      erratic: '#f87171',
      smooth: '#34d399',
    };
    return (
      <span
        className="badge"
        style={{
          background: 'rgba(255,255,255,0.05)',
          color: colors[p] || '#cbd5e1',
          border: `1px solid ${colors[p] || '#475569'}`,
        }}
      >
        {p.toUpperCase()}
      </span>
    );
  };

  return (
    <tr>
      <td>{getUrgencyBadge(r.urgency)}</td>
      <td>{getPatternBadge(r.demand_pattern)}</td>
      <td>
        <div style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{r.item_sku}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.item_name}</div>
      </td>
      <td>{r.location_code || 'Central'}</td>
      <td>
        <div style={{ fontSize: '0.82rem' }}>
          Position: <strong>{r.inventory_position}</strong> <span style={{ color: 'var(--text-muted)' }}>(ROP: {r.reorder_point})</span>
        </div>
      </td>
      <td style={{ fontWeight: 700, color: '#34d399', fontSize: '0.95rem' }}>
        +{r.suggested_qty} units
      </td>
      <td>
        {r.status === 'APPROVED' ? (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
            <CheckCircle style={{ width: 12, height: 12 }} /> {r.created_po_number || 'PO Drafted'}
          </span>
        ) : r.status === 'DISMISSED' ? (
          <span className="badge badge-critical" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
            <Ban style={{ width: 12, height: 12 }} /> Dismissed
          </span>
        ) : (
          <span className="badge badge-warning">Open Review</span>
        )}
      </td>
      <td style={{ textAlign: 'right' }}>
        <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
            onClick={() => onInspect(r)}
          >
            Inspect <ArrowUpRight style={{ width: 12, height: 12 }} />
          </button>
          {r.status === 'OPEN' && (
            <button
              className="btn btn-primary"
              style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
              onClick={() => onQuickApprove(r.id)}
            >
              Approve & PO
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
