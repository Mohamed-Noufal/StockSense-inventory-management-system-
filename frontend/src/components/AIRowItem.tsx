import React from 'react';
import { CheckCircle, Ban, ArrowUpRight, Check } from 'lucide-react';
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
        return <span className="badge badge-info">Routine Buffer</span>;
    }
  };

  const getPatternBadge = (pattern?: string) => {
    const p = (pattern || 'intermittent').toLowerCase();
    const colors: Record<string, string> = {
      intermittent: '#a1a1aa',
      lumpy: '#fbbf24',
      erratic: '#f87171',
      smooth: '#34d399',
    };
    return (
      <span
        className="badge"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          color: colors[p] || '#a1a1aa',
          border: `1px solid ${colors[p] ? colors[p] + '40' : 'rgba(255,255,255,0.1)'}`,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="sku-cell">{r.item_sku}</span>
          <span style={{ fontSize: '0.8rem', color: '#f4f4f5', fontWeight: 500 }}>{r.item_name}</span>
        </div>
      </td>
      <td style={{ color: 'var(--text-secondary)' }}>{r.location_code || 'Central Yard'}</td>
      <td>
        <div style={{ fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>
          Pos: <strong style={{ color: '#ffffff' }}>{r.inventory_position}</strong>{' '}
          <span style={{ color: 'var(--text-muted)' }}>(ROP: {r.reorder_point})</span>
        </div>
      </td>
      <td style={{ textAlign: 'right', fontWeight: 700, color: '#34d399', fontSize: '0.9rem', fontVariantNumeric: 'tabular-nums' }}>
        +{r.suggested_qty}
      </td>
      <td>
        {r.status === 'APPROVED' ? (
          <span className="badge badge-success">
            <CheckCircle style={{ width: 12, height: 12 }} /> {r.created_po_number || 'PO Converted'}
          </span>
        ) : r.status === 'DISMISSED' ? (
          <span className="badge badge-critical">
            <Ban style={{ width: 12, height: 12 }} /> Dismissed
          </span>
        ) : (
          <span className="badge badge-warning">Open Review</span>
        )}
      </td>
      <td style={{ textAlign: 'right' }}>
        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
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
              <Check style={{ width: 12, height: 12 }} /> Approve PO
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
