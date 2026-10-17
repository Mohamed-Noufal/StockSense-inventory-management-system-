import React, { useState } from 'react';
import { Play, X, RefreshCw, Sparkles } from 'lucide-react';
import { AIRunTriggerPayload } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface AIRunModalProps {
  onClose: () => void;
  onExecute: (payload: AIRunTriggerPayload) => Promise<void>;
  running: boolean;
}

export const AIRunModal: React.FC<AIRunModalProps> = ({ onClose, onExecute, running }) => {
  const { locale } = useI18n();
  const [serviceLevel, setServiceLevel] = useState<number>(0.95);
  const [method, setMethod] = useState<string>('tsb');
  const [seed, setSeed] = useState<number>(42);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onExecute({
        service_level: serviceLevel,
        default_method: method,
        random_seed: seed,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || (locale === 'ar' ? 'فشل تشغيل خوارزميات التنبؤ' : 'Failed to trigger AI forecasting run'));
    }
  };

  return (
    <div className="modal-overlay" onClick={running ? undefined : onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles style={{ width: 18, height: 18, color: '#38bdf8' }} />
            <div>
              <h3>{locale === 'ar' ? 'تشغيل التحليل وخوارزميات التنبؤ' : 'Run Forecast & Analysis'}</h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
                {locale === 'ar'
                  ? 'تنفيذ خوارزميات الطلب المتقطع وحساب سياسات ومستويات إعادة الطلب'
                  : 'Execute intermittent demand algorithms and compute replenishment policies'}
              </p>
            </div>
          </div>
          {!running && (
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>
          )}
        </div>

        {error && (
          <div style={{ margin: '1rem 1.5rem 0', padding: '0.65rem 0.85rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.75rem 0.85rem', background: '#121214', border: '1px solid var(--border-default)', borderRadius: '6px', fontSize: '0.8rem', lineHeight: '1.45', color: 'var(--text-secondary)' }}>
              {locale === 'ar'
                ? 'يقوم هذا المسار بأخذ لقطة فورية من سجل حركات المخزون حتى الحد الزمني المحدد، وينفذ النماذج الإحصائية للطلب المتقطع (TSB, SBA, Croston)، ويقيم مستويات مخزون الأمان لقطع الغيار بطيئة الحركة.'
                : 'This pipeline snapshots the active stock movements ledger up to the temporal cutoff, executes intermittent statistical models (TSB, SBA, Croston), and evaluates safety stock levels for slow-moving parts.'}
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  {locale === 'ar' ? `مستوى الخدمة المستهدف: ${(serviceLevel * 100).toFixed(1)}%` : `Target Cycle Service Level: ${(serviceLevel * 100).toFixed(1)}%`}
                </label>
                <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                  {locale === 'ar' ? 'الافتراضي: 95.0%' : 'Normal: 95.0%'}
                </span>
              </div>
              <input
                type="range"
                min="0.90"
                max="0.99"
                step="0.01"
                value={serviceLevel}
                onChange={(e) => setServiceLevel(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
                disabled={running}
              />
            </div>

            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">{locale === 'ar' ? 'خوارزمية الطلب المتقطع' : 'Intermittent Method'}</label>
                <select
                  className="form-select"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  disabled={running}
                >
                  <option value="tsb">TSB (Teunter-Syntetos-Babai)</option>
                  <option value="sba">SBA (Syntetos-Boylan Approx)</option>
                  <option value="croston">Croston's Method</option>
                  <option value="ma8">{locale === 'ar' ? 'المتوسط المتحرك (MA8)' : 'Moving Average (MA8)'}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{locale === 'ar' ? 'بذرة المحاكاة (Seed)' : 'Simulation Seed'}</label>
                <input
                  type="number"
                  className="form-input"
                  value={seed}
                  onChange={(e) => setSeed(parseInt(e.target.value) || 42)}
                  disabled={running}
                />
              </div>
            </div>

            <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '6px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {locale === 'ar' ? (
                <>نطاق البيانات: <strong>بيانات افتراضية تجريبية (قطع غيار نفطية)</strong> • الثابت: عزل تام لمنع تسرب البيانات المستقبلية</>
              ) : (
                <>Dataset Scope: <strong>Synthetic Demo Data (Oilfield Spares)</strong> • Invariant: Zero Future Leakage</>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={running}>
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={running}>
              {running ? (
                <>
                  <RefreshCw className="animate-spin" style={{ width: 14, height: 14 }} />
                  <span>{locale === 'ar' ? 'جارٍ حساب النماذج والسياسات...' : 'Computing Models & Policies...'}</span>
                </>
              ) : (
                <>
                  <Play style={{ width: 14, height: 14, fill: '#000000' }} />
                  <span>{locale === 'ar' ? 'بدء تشغيل الذكاء الاصطناعي' : 'Start AI Run'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
