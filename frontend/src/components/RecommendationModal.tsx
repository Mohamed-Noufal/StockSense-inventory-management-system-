import React, { useState } from 'react';
import { Sparkles, CheckCircle, Ban, X } from 'lucide-react';
import { AIRecommendation } from '../types';

interface RecommendationModalProps {
  rec: AIRecommendation;
  onClose: () => void;
  onApprove: (id: number) => Promise<void>;
  onDismiss: (id: number, reason: string) => Promise<void>;
}

export const RecommendationModal: React.FC<RecommendationModalProps> = ({
  rec, onClose, onApprove, onDismiss,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [showDismissInput, setShowDismissInput] = useState(false);

  let explanation: any = {};
  try {
    explanation = JSON.parse(rec.explanation_json);
  } catch {
    // fallback
  }

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await onApprove(rec.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = async () => {
    if (!dismissReason.trim()) return;
    setSubmitting(true);
    try {
      await onDismiss(rec.id, dismissReason);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles style={{ width: 18, height: 18, color: '#38bdf8' }} />
            <h3>AI Replenishment Recommendation #{rec.id}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '0.75rem 0.85rem', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '6px', fontSize: '0.8rem', lineHeight: '1.45', color: '#e0f2fe' }}>
            <strong style={{ color: '#38bdf8' }}>AI Rationale:</strong> {rec.summary_text}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.8rem' }}>
            <div style={{ padding: '0.65rem', background: '#09090b', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Target Spare SKU</div>
              <div style={{ fontWeight: 600, color: '#f4f4f5', marginTop: '0.15rem' }}>{rec.item_sku} — {rec.item_name}</div>
            </div>
            <div style={{ padding: '0.65rem', background: '#09090b', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Demand Method</div>
              <div style={{ fontWeight: 600, color: '#f4f4f5', marginTop: '0.15rem' }}>{rec.demand_pattern || 'Intermittent'} ({rec.forecast_method || 'SBA'})</div>
            </div>
            <div style={{ padding: '0.65rem', background: '#09090b', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Current Position</div>
              <div style={{ fontWeight: 600, color: '#f4f4f5', marginTop: '0.15rem' }}>{rec.inventory_position} units ({rec.on_hand} on-hand, {rec.on_order} on-order)</div>
            </div>
            <div style={{ padding: '0.65rem', background: '#09090b', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Reorder Threshold (ROP)</div>
              <div style={{ fontWeight: 600, color: '#fbbf24', marginTop: '0.15rem' }}>{rec.reorder_point} units (SS: {explanation.safety_stock || 0})</div>
            </div>
          </div>

          <div style={{ padding: '0.75rem 1rem', background: '#09090b', borderRadius: '6px', border: '1px solid var(--border-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recommended Order Qty</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>
                +{rec.suggested_qty} units
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <div>Supplier: {rec.supplier_name || 'Primary Vendor'}</div>
              <div>Destination: {rec.location_code || 'Central Yard'}</div>
            </div>
          </div>

          {showDismissInput && (
            <div>
              <label className="form-label">Audit Dismissal Reason</label>
              <input className="form-input" placeholder="e.g. Rig scheduled for maintenance hiatus" value={dismissReason} onChange={(e) => setDismissReason(e.target.value)} />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          {rec.status === 'OPEN' && !showDismissInput && (
            <>
              <button type="button" className="btn btn-secondary" style={{ color: '#f87171' }} onClick={() => setShowDismissInput(true)}>
                <Ban style={{ width: 13, height: 13 }} /> Dismiss
              </button>
              <button type="button" className="btn btn-primary" onClick={handleApprove} disabled={submitting}>
                <CheckCircle style={{ width: 13, height: 13 }} />
                {submitting ? 'Generating PO...' : 'Approve & Draft PO'}
              </button>
            </>
          )}
          {showDismissInput && (
            <button type="button" className="btn btn-danger" onClick={handleDismiss} disabled={submitting || !dismissReason.trim()}>
              Confirm Dismissal
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
