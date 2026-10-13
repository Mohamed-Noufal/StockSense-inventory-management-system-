import React, { useState } from 'react';
import { Ban, X } from 'lucide-react';
import { AIRecommendation } from '../types';

interface AIDismissModalProps {
  rec: AIRecommendation;
  onClose: () => void;
  onDismiss: (id: number, reason: string) => Promise<void>;
}

const DISMISSAL_REASONS = [
  'Purchase already planned with vendor',
  'Demand forecast is not relevant (project hiatus)',
  'Supplier unavailable / lead time excessive',
  'Item scheduled for phased obsolescence',
  'Alternative substitute spare available on-site',
  'Other operator discretion',
];

export const AIDismissModal: React.FC<AIDismissModalProps> = ({ rec, onClose, onDismiss }) => {
  const [selectedReason, setSelectedReason] = useState<string>(DISMISSAL_REASONS[0]);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customNotes.trim()
      ? `${selectedReason} — Notes: ${customNotes.trim()}`
      : selectedReason;

    setSubmitting(true);
    setError(null);
    try {
      await onDismiss(rec.id, finalReason);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to dismiss recommendation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Ban style={{ width: 18, height: 18, color: '#f87171' }} />
            <h3>Dismiss Recommendation #{rec.id}?</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {error && (
          <div style={{ margin: '1rem 1.5rem 0', padding: '0.65rem 0.85rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: '1.45', margin: 0 }}>
              Dismissing will mark this replenishment proposal as dismissed for audit purposes. A formal purchase order will <strong>not</strong> be created.
            </p>

            <div style={{ padding: '0.65rem 0.85rem', background: '#121214', border: '1px solid var(--border-default)', borderRadius: '6px', fontSize: '0.8rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Spare Part</div>
              <div style={{ fontWeight: 600, color: '#ffffff', marginTop: 2 }}>{rec.item_sku} — {rec.item_name}</div>
            </div>

            <div className="form-group">
              <label className="form-label">Mandatory Audit Reason *</label>
              <select
                className="form-select"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                required
              >
                {DISMISSAL_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Additional Operator Notes (Optional)</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="e.g. Rig supervisor confirmed enough inventory until next overhaul"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger" disabled={submitting}>
              <Ban style={{ width: 13, height: 13 }} />
              <span>{submitting ? 'Dismissing...' : 'Confirm Dismissal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
