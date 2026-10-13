import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, AlertOctagon, Info, CheckCircle2, ShieldCheck,
  RefreshCw, Check, CheckCheck, Clock, Search, X
} from 'lucide-react';
import { AlertItem, User as UserModel } from '../types';
import { api } from '../api/client';

interface AlertsTabProps {
  currentUser?: UserModel | null;
  onAlertUpdated?: () => void;
}

export const AlertsTab: React.FC<AlertsTabProps> = ({ currentUser, onAlertUpdated }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Action states
  const [actionAlertId, setActionAlertId] = useState<number | null>(null);
  const [resolveNotes, setResolveNotes] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAlerts(severityFilter, statusFilter);
      setAlerts(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch system alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, statusFilter]);

  const handleAcknowledge = async (id: number) => {
    try {
      setSubmittingAction(true);
      await api.acknowledgeAlert(id, {
        user_id: currentUser?.id,
        notes: `Acknowledged by ${currentUser?.full_name || 'Operator'}`,
      });
      await fetchAlerts();
      onAlertUpdated?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to acknowledge alert');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      setSubmittingAction(true);
      await api.resolveAlert(id, {
        user_id: currentUser?.id,
        resolution_notes: resolveNotes || `Resolved by ${currentUser?.full_name || 'Operator'}`,
      });
      setActionAlertId(null);
      setResolveNotes('');
      await fetchAlerts();
      onAlertUpdated?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to resolve alert');
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const msgMatch = a.message.toLowerCase().includes(q);
      const skuMatch = (a.item_sku || '').toLowerCase().includes(q);
      const locMatch = (a.location_code || '').toLowerCase().includes(q);
      if (!msgMatch && !skuMatch && !locMatch) return false;
    }
    return true;
  });

  const renderSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="severity-badge severity-badge-critical">
            <AlertOctagon style={{ width: 12, height: 12 }} />
            Critical
          </span>
        );
      case 'WARNING':
        return (
          <span className="severity-badge severity-badge-warning">
            <AlertTriangle style={{ width: 12, height: 12 }} />
            Warning
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="severity-badge severity-badge-info">
            <Info style={{ width: 12, height: 12 }} />
            Info
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Controls Bar */}
      <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Filter alerts by text, SKU, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: '#09090b',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.45rem 2rem 0.45rem 2rem',
                fontSize: '0.8rem',
                color: '#ffffff',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Severity filter */}
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', background: '#09090b', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '0.5rem', paddingRight: '0.25rem' }}>Severity:</span>
            {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                style={{
                  background: severityFilter === sev ? '#27272a' : 'transparent',
                  border: 'none',
                  color: severityFilter === sev ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.72rem',
                  padding: '0.25rem 0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: severityFilter === sev ? 600 : 400,
                }}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', background: '#09090b', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '0.5rem', paddingRight: '0.25rem' }}>Status:</span>
            {['ALL', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? '#27272a' : 'transparent',
                  border: 'none',
                  color: statusFilter === st ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.72rem',
                  padding: '0.25rem 0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: statusFilter === st ? 600 : 400,
                }}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            className="btn btn-secondary"
            onClick={fetchAlerts}
            disabled={loading}
            style={{ padding: '0.45rem 0.65rem' }}
            title="Refresh alerts"
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem' }}>
          {error}
        </div>
      )}

      {/* Alerts Stream List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loading && alerts.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw className="animate-spin" style={{ width: 20, height: 20, margin: '0 auto 0.5rem' }} />
            <div>Loading system alerts and exceptions...</div>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="card" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <ShieldCheck style={{ width: 28, height: 28, color: '#10b981', margin: '0 auto 0.5rem' }} />
            <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.9rem' }}>
              Zero exceptions found matching current filter
            </div>
            <div style={{ fontSize: '0.76rem', marginTop: '0.25rem' }}>
              All inventory safety buffers and ledger checkpoints are operating within nominal limits.
            </div>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            let details: any = null;
            if (alert.details_json) {
              try {
                details = JSON.parse(alert.details_json);
              } catch {
                // ignore
              }
            }

            return (
              <div
                key={alert.id}
                className="card"
                style={{
                  padding: '1.15rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  borderLeft:
                    alert.severity === 'CRITICAL'
                      ? '3px solid #ef4444'
                      : alert.severity === 'WARNING'
                      ? '3px solid #f59e0b'
                      : '3px solid #3b82f6',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {renderSeverityBadge(alert.severity)}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      ALT-{alert.id.toString().padStart(5, '0')}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>•</span>
                    <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {alert.alert_type}
                    </span>
                    {alert.location_code && (
                      <>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>•</span>
                        <span style={{ fontSize: '0.76rem', color: '#60a5fa' }}>
                          Location: {alert.location_code}
                        </span>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {alert.status === 'OPEN' && (
                      <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        OPEN
                      </span>
                    )}
                    {alert.status === 'ACKNOWLEDGED' && (
                      <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        ACKNOWLEDGED
                      </span>
                    )}
                    {alert.status === 'RESOLVED' && (
                      <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        RESOLVED
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff', lineHeight: 1.4 }}>
                  {alert.message}
                </div>

                {/* Details Breakdown */}
                {details && (
                  <div
                    style={{
                      background: '#09090b',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      fontSize: '0.74rem',
                    }}
                  >
                    {Object.entries(details).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', gap: '0.35rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{k.replace(/_/g, ' ')}:</span>
                        <span style={{ color: '#ffffff', fontWeight: 600, fontFamily: typeof v === 'number' ? 'var(--font-mono)' : 'inherit' }}>
                          {String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer attribution and actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock style={{ width: 12, height: 12 }} />
                      <span>{new Date(alert.created_at).toLocaleString()}</span>
                    </div>

                    {alert.acknowledged_by_name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#fbbf24' }}>
                        <Check style={{ width: 12, height: 12 }} />
                        <span>Ack: {alert.acknowledged_by_name}</span>
                      </div>
                    )}

                    {alert.resolved_by_name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#34d399' }}>
                        <CheckCheck style={{ width: 12, height: 12 }} />
                        <span>Resolved: {alert.resolved_by_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  {alert.status !== 'RESOLVED' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {alert.status === 'OPEN' && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleAcknowledge(alert.id)}
                          disabled={submittingAction}
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.74rem' }}
                        >
                          <Check style={{ width: 13, height: 13 }} />
                          <span>Acknowledge</span>
                        </button>
                      )}

                      {actionAlertId === alert.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <input
                            type="text"
                            placeholder="Resolution note..."
                            value={resolveNotes}
                            onChange={(e) => setResolveNotes(e.target.value)}
                            style={{
                              background: '#18181b',
                              border: '1px solid var(--border-default)',
                              color: '#ffffff',
                              padding: '0.3rem 0.6rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.74rem',
                            }}
                          />
                          <button
                            className="btn btn-primary"
                            onClick={() => handleResolve(alert.id)}
                            disabled={submittingAction}
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.74rem' }}
                          >
                            Confirm
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setActionAlertId(null)}
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.74rem' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-primary"
                          onClick={() => setActionAlertId(alert.id)}
                          disabled={submittingAction}
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.74rem' }}
                        >
                          <CheckCircle2 style={{ width: 13, height: 13 }} />
                          <span>Resolve</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
