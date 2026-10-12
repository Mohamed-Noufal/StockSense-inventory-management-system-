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
      <div className="modal-card" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles style={{ width: 20, height: 20, color: 'var(--brand-primary)' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
              AI Replenishment Recommendation #{rec.id}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div style={{ padding: '0.85rem', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.82rem', lineHeight: '1.45' }}>
          <strong>Summary Rationale:</strong> {rec.summary_text}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
          <div style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)' }}>Target SKU & Part:</div>
            <div style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{rec.item_sku} — {rec.item_name}</div>
          </div>
          <div style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)' }}>Demand Pattern / Method:</div>
            <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{rec.demand_pattern || 'Intermittent'} ({rec.forecast_method || 'SBA'})</div>
          </div>
          <div style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)' }}>Stock Position (On-Hand + On-Order):</div>
            <div style={{ fontWeight: 600 }}>{rec.inventory_position} units ({rec.on_hand} on-hand, {rec.on_order} on-order)</div>
          </div>
          <div style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)' }}>Reorder Point Threshold (ROP):</div>
            <div style={{ fontWeight: 600, color: '#fbbf24' }}>{rec.reorder_point} units (SS: {explanation.safety_stock || 0})</div>
          </div>
        </div>

        <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Proposed Order Quantity:</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>
                {rec.suggested_qty} units
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
              <div>Supplier: {rec.supplier_name}</div>
              <div>Destination: {rec.location_code}</div>
            </div>
          </div>
        </div>

        {showDismissInput && (
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Audit Dismissal Reason</label>
            <input className="form-input" placeholder="e.g. Rig scheduled for shutdown, delay replenishment" value={dismissReason} onChange={(e) => setDismissReason(e.target.value)} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          {rec.status === 'OPEN' && !showDismissInput && (
            <>
              <button type="button" className="btn btn-secondary" style={{ color: '#f87171' }} onClick={() => setShowDismissInput(true)}>
                <Ban style={{ width: 14, height: 14, marginRight: '0.25rem' }} /> Dismiss
              </button>
              <button type="button" className="btn btn-primary" onClick={handleApprove} disabled={submitting}>
                <CheckCircle style={{ width: 14, height: 14, marginRight: '0.25rem' }} />
                {submitting ? 'Generating PO...' : 'Approve & Create PO'}
              </button>
            </>
          )}
          {showDismissInput && (
            <button type="button" className="btn btn-primary" style={{ background: '#ef4444' }} onClick={handleDismiss} disabled={submitting || !dismissReason.trim()}>
              Confirm Dismissal
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
