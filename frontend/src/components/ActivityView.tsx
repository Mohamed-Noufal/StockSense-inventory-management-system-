import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Sliders,
  Download, Search, X, ShieldCheck, AlertTriangle, RefreshCw,
  User, ChevronRight
} from 'lucide-react';
import {
  StockMovement, IntegrityCheckResponse, InventoryItem,
  InventoryLocation, User as UserModel, AlertItem
} from '../types';
import { api } from '../api/client';
import { MovementDetailDrawer } from './MovementDetailDrawer';
import { AlertsTab } from './AlertsTab';
import { IntegrityTab } from './IntegrityTab';

export interface ActivityViewProps {
  ledger: StockMovement[];
  items?: InventoryItem[];
  locations?: InventoryLocation[];
  integrity: IntegrityCheckResponse | null;
  currentUser?: UserModel | null;
  onRefresh: () => void;
  onIntegrityUpdated?: (report: IntegrityCheckResponse) => void;
}

type TabType = 'LEDGER' | 'ALERTS' | 'INTEGRITY';
type DeltaFilterType = 'ALL' | 'POSITIVE' | 'NEGATIVE';

export const ActivityView: React.FC<ActivityViewProps> = ({
  ledger,
  locations = [],
  integrity,
  currentUser,
  onRefresh,
  onIntegrityUpdated,
}) => {
  // Tabs
  const [activeTab, setActiveTab] = useState<TabType>('LEDGER');

  // Drawer
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);

  // Filters for Stock Ledger
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [deltaFilter, setDeltaFilter] = useState<DeltaFilterType>('ALL');
  const [timeWindowDays, setTimeWindowDays] = useState<number>(30);

  // Active Alerts count for KPI cards
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const fetchAlertsSummary = async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(data);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchAlertsSummary();
  }, []);

  // 1. KPI Calculations
  const metrics = useMemo(() => {
    const totalTransactions = ledger.length;
    const activeAlertsCount = alerts.filter((a) => a.status !== 'RESOLVED').length;
    const criticalAlertsCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;
    const mismatches = integrity?.mismatches_count ?? 0;

    return {
      totalTransactions,
      activeAlertsCount,
      criticalAlertsCount,
      mismatches,
    };
  }, [ledger, alerts, integrity]);

  // 2. Filter Stock Ledger Movements
  const filteredLedger = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays);
    const cutoffIso = cutoffDate.toISOString();

    return ledger.filter((m) => {
      // Time cutoff
      if (timeWindowDays > 0 && m.occurred_at < cutoffIso) {
        return false;
      }

      // Movement Type
      if (movementTypeFilter !== 'ALL') {
        if (movementTypeFilter === 'TRANSFERS') {
          if (!['TRANSFER_OUT', 'TRANSFER_IN'].includes(m.movement_type)) return false;
        } else if (m.movement_type !== movementTypeFilter) {
          return false;
        }
      }

      // Location
      if (locationFilter !== 'ALL') {
        if (m.location_code !== locationFilter && String(m.location_id) !== locationFilter) {
          return false;
        }
      }

      // Delta (+ / -)
      const isPos = ['RECEIPT', 'TRANSFER_IN'].includes(m.movement_type);
      const isNeg = ['ISSUE', 'TRANSFER_OUT'].includes(m.movement_type);
      if (deltaFilter === 'POSITIVE' && !isPos) return false;
      if (deltaFilter === 'NEGATIVE' && !isNeg) return false;

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const skuMatch = (m.item_sku || '').toLowerCase().includes(q);
        const nameMatch = (m.item_name || '').toLowerCase().includes(q);
        const refMatch = (m.reference_display || '').toLowerCase().includes(q);
        const actorMatch = (m.actor_label || '').toLowerCase().includes(q);
        const idMatch = String(m.id).includes(q);
        if (!skuMatch && !nameMatch && !refMatch && !actorMatch && !idMatch) return false;
      }

      return true;
    });
  }, [ledger, timeWindowDays, movementTypeFilter, locationFilter, deltaFilter, searchQuery]);

  // 3. RFC 4180 CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Movement ID',
      'Occurred At',
      'Type',
      'Signed Quantity',
      'Item SKU',
      'Item Name',
      'Location Code',
      'Route',
      'Reference',
      'Actor Attribution',
      'Reason',
      'Transfer Group ID',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredLedger.map((m) => {
      const isPositive = ['RECEIPT', 'TRANSFER_IN'].includes(m.movement_type);
      const isNegative = ['ISSUE', 'TRANSFER_OUT'].includes(m.movement_type);
      const signedQty = isPositive ? `+${m.quantity}` : isNegative ? `-${m.quantity}` : `${m.quantity}`;

      return [
        m.id,
        m.occurred_at,
        m.movement_type,
        signedQty,
        m.item_sku || '',
        m.item_name || '',
        m.location_code || '',
        m.route_display || '',
        m.reference_display || '',
        m.actor_label || '',
        m.reason || '',
        m.transfer_group_id || '',
      ].map(escapeCsv).join(',');
    });

    const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `stocksense-ledger-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderBadge = (type: string) => {
    switch (type) {
      case 'RECEIPT':
        return (
          <span className="movement-badge movement-badge-receipt">
            <ArrowDownLeft style={{ width: 11, height: 11 }} />
            Receipt
          </span>
        );
      case 'ISSUE':
        return (
          <span className="movement-badge movement-badge-issue">
            <ArrowUpRight style={{ width: 11, height: 11 }} />
            Issue
          </span>
        );
      case 'TRANSFER_OUT':
      case 'TRANSFER_IN':
        return (
          <span className="movement-badge movement-badge-transfer">
            <ArrowLeftRight style={{ width: 11, height: 11 }} />
            {type === 'TRANSFER_OUT' ? 'Xfer Out' : 'Xfer In'}
          </span>
        );
      case 'ADJUSTMENT':
      default:
        return (
          <span className="movement-badge movement-badge-adjustment">
            <Sliders style={{ width: 11, height: 11 }} />
            Adjustment
          </span>
        );
    }
  };

  return (
    <div className="activity-workspace-container">
      {/* 1. Header Bar */}
      <div className="activity-header-bar">
        <div className="activity-header-title-box">
          <h1>
            <Activity style={{ width: 22, height: 22, color: 'var(--accent-blue)' }} />
            Activity &amp; Integrity Center
          </h1>
          <p>
            Immutable append-only audit ledger, operational exception alerts &amp; real-time mathematical balance verification
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            className="btn btn-secondary"
            onClick={handleExportCsv}
            style={{ padding: '0.55rem 0.95rem' }}
            title="Export RFC 4180 CSV audit file"
          >
            <Download style={{ width: 14, height: 14 }} />
            <span>Export CSV</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => {
              onRefresh();
              fetchAlertsSummary();
            }}
            style={{ padding: '0.55rem 0.75rem' }}
            title="Refresh ledger events"
          >
            <RefreshCw style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      {/* 2. 4 Summary Metric Cards */}
      <div className="activity-summary-grid">
        <div
          className={`activity-summary-card ${activeTab === 'LEDGER' ? 'active' : ''}`}
          onClick={() => setActiveTab('LEDGER')}
        >
          <div className="activity-summary-card-header">
            <span className="activity-summary-card-title">Total Ledger Events</span>
            <Activity style={{ width: 16, height: 16, color: 'var(--accent-blue)' }} />
          </div>
          <div className="activity-summary-card-value">{metrics.totalTransactions}</div>
          <div className="activity-summary-card-sub">
            Append-only physical transactions
          </div>
        </div>

        <div
          className={`activity-summary-card ${activeTab === 'ALERTS' ? 'active card-amber' : ''}`}
          onClick={() => setActiveTab('ALERTS')}
        >
          <div className="activity-summary-card-header">
            <span className="activity-summary-card-title">Active System Exceptions</span>
            <AlertTriangle style={{ width: 16, height: 16, color: '#f59e0b' }} />
          </div>
          <div className="activity-summary-card-value" style={{ color: metrics.activeAlertsCount > 0 ? '#f59e0b' : '#ffffff' }}>
            {metrics.activeAlertsCount}
          </div>
          <div className="activity-summary-card-sub">
            Pending operational review
          </div>
        </div>

        <div
          className={`activity-summary-card ${metrics.criticalAlertsCount > 0 ? 'card-red' : ''}`}
          onClick={() => setActiveTab('ALERTS')}
        >
          <div className="activity-summary-card-header">
            <span className="activity-summary-card-title">Critical Risk Alerts</span>
            <AlertTriangle style={{ width: 16, height: 16, color: '#ef4444' }} />
          </div>
          <div className="activity-summary-card-value" style={{ color: metrics.criticalAlertsCount > 0 ? '#ef4444' : '#ffffff' }}>
            {metrics.criticalAlertsCount}
          </div>
          <div className="activity-summary-card-sub">
            Stockout hazards &amp; safety breaches
          </div>
        </div>

        <div
          className={`activity-summary-card ${activeTab === 'INTEGRITY' ? 'active card-green' : ''}`}
          onClick={() => setActiveTab('INTEGRITY')}
        >
          <div className="activity-summary-card-header">
            <span className="activity-summary-card-title">Ledger Consistency</span>
            <ShieldCheck style={{ width: 16, height: 16, color: '#10b981' }} />
          </div>
          <div className="activity-summary-card-value" style={{ color: metrics.mismatches === 0 ? '#10b981' : '#ef4444' }}>
            {metrics.mismatches === 0 ? '100% PASS' : `${metrics.mismatches} Drift`}
          </div>
          <div className="activity-summary-card-sub">
            Zero mathematical balance drift
          </div>
        </div>
      </div>

      {/* 3. Three Workstation Tabs */}
      <div className="activity-tabs-nav">
        <button
          className={`activity-tab-btn ${activeTab === 'LEDGER' ? 'active' : ''}`}
          onClick={() => setActiveTab('LEDGER')}
        >
          <Activity style={{ width: 15, height: 15 }} />
          <span>Stock Ledger ({ledger.length})</span>
        </button>

        <button
          className={`activity-tab-btn ${activeTab === 'ALERTS' ? 'active' : ''}`}
          onClick={() => setActiveTab('ALERTS')}
        >
          <AlertTriangle style={{ width: 15, height: 15 }} />
          <span>Alerts &amp; Exceptions ({metrics.activeAlertsCount})</span>
        </button>

        <button
          className={`activity-tab-btn ${activeTab === 'INTEGRITY' ? 'active' : ''}`}
          onClick={() => setActiveTab('INTEGRITY')}
        >
          <ShieldCheck style={{ width: 15, height: 15 }} />
          <span>Integrity Diagnostic</span>
        </button>
      </div>

      {/* 4. Tab 1: Stock Ledger */}
      {activeTab === 'LEDGER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Controls Bar */}
          <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 260 }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
                <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter by SKU, name, reference, actor, or ID..."
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
              {/* Signed Delta Toggle */}
              <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center', background: '#09090b', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '0.4rem', paddingRight: '0.2rem' }}>Delta:</span>
                {(['ALL', 'POSITIVE', 'NEGATIVE'] as DeltaFilterType[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDeltaFilter(d)}
                    style={{
                      background: deltaFilter === d ? '#27272a' : 'transparent',
                      border: 'none',
                      color: d === 'POSITIVE' ? '#34d399' : d === 'NEGATIVE' ? '#f87171' : '#ffffff',
                      fontSize: '0.72rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontWeight: deltaFilter === d ? 700 : 400,
                    }}
                  >
                    {d === 'POSITIVE' ? '+ In' : d === 'NEGATIVE' ? '- Out' : 'All'}
                  </button>
                ))}
              </div>

              {/* Movement Type Filter */}
              <select
                className="form-select"
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem', background: '#09090b', color: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}
              >
                <option value="ALL">All Movement Types</option>
                <option value="RECEIPT">Receipts</option>
                <option value="ISSUE">Issues</option>
                <option value="TRANSFERS">Transfers (In/Out)</option>
                <option value="ADJUSTMENT">Adjustments</option>
              </select>

              {/* Location Filter */}
              <select
                className="form-select"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem', background: '#09090b', color: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}
              >
                <option value="ALL">All Facility Locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.code}>
                    {loc.code} — {loc.name}
                  </option>
                ))}
              </select>

              {/* Time Window */}
              <select
                className="form-select"
                value={timeWindowDays}
                onChange={(e) => setTimeWindowDays(Number(e.target.value))}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem', background: '#09090b', color: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}
              >
                <option value={1}>Last 24 Hours</option>
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
                <option value={0}>All Time History</option>
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '85px' }}>Event ID</th>
                  <th style={{ width: '130px' }}>Type</th>
                  <th style={{ width: '110px' }}>Signed Delta</th>
                  <th>Spare Item &amp; SKU</th>
                  <th>Location Route</th>
                  <th>Reference / Doc</th>
                  <th>Actor Attribution</th>
                  <th>Occurred At</th>
                  <th style={{ textAlign: 'right', width: '80px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                      No ledger transactions match the active filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((mov) => {
                    const isPositive = ['RECEIPT', 'TRANSFER_IN'].includes(mov.movement_type);
                    const isNegative = ['ISSUE', 'TRANSFER_OUT'].includes(mov.movement_type);
                    const deltaSign = isPositive ? '+' : isNegative ? '-' : '';

                    return (
                      <tr
                        key={mov.id}
                        onClick={() => setSelectedMovement(mov)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          #{mov.id.toString().padStart(5, '0')}
                        </td>

                        <td>{renderBadge(mov.movement_type)}</td>

                        <td>
                          <span className={`delta-pill ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
                            {deltaSign}{mov.quantity}
                          </span>
                        </td>

                        <td>
                          <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.82rem' }}>
                            {mov.item_name || 'Spare Part'}
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            {mov.item_sku || `ITEM-${mov.item_id}`}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 500 }}>
                            {mov.route_display || mov.location_code || 'Central'}
                          </div>
                          {mov.transfer_group_id && (
                            <span style={{ fontSize: '0.68rem', color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
                              Transfer Group
                            </span>
                          )}
                        </td>

                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          {mov.reference_display || '—'}
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.76rem', color: '#ffffff' }}>
                            <User style={{ width: 12, height: 12, color: 'var(--accent-blue)' }} />
                            <span>{mov.actor_label || 'Storekeeper'}</span>
                          </div>
                        </td>

                        <td style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                          {new Date(mov.occurred_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <ChevronRight style={{ width: 15, height: 15, color: 'var(--text-muted)', marginLeft: 'auto' }} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Alerts & Exceptions */}
      {activeTab === 'ALERTS' && (
        <AlertsTab
          currentUser={currentUser}
          onAlertUpdated={fetchAlertsSummary}
        />
      )}

      {/* 6. Tab 3: Integrity Diagnostic */}
      {activeTab === 'INTEGRITY' && (
        <IntegrityTab
          initialIntegrity={integrity}
          onAuditCompleted={(rep) => {
            onIntegrityUpdated?.(rep);
          }}
        />
      )}

      {/* 7. Movement Details Side Drawer */}
      {selectedMovement && (
        <MovementDetailDrawer
          movement={selectedMovement}
          allMovements={ledger}
          onClose={() => setSelectedMovement(null)}
          onSelectMovement={(mov) => setSelectedMovement(mov)}
        />
      )}
    </div>
  );
};
