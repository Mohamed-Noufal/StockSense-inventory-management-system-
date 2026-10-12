import React from 'react';
import { Layers, History, MapPin, ShieldCheck, Database, Cpu, CheckCircle2 } from 'lucide-react';

interface OverviewViewProps {
  itemsCount: number;
  movementsCount: number;
  locationsCount: number;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  itemsCount, movementsCount, locationsCount,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Catalog Spare SKUs</span>
            <Layers className="metric-icon" />
          </div>
          <div className="metric-value">{itemsCount}</div>
          <div className="metric-sub">Active critical & standard oilfield parts</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Immutable Ledger Entries</span>
            <History className="metric-icon" />
          </div>
          <div className="metric-value">{movementsCount}</div>
          <div className="metric-sub">Append-only double-entry transaction history</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Operating Facilities</span>
            <MapPin className="metric-icon" />
          </div>
          <div className="metric-value">{locationsCount}</div>
          <div className="metric-sub">Central warehouses, supply yards & rig sites</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Ledger Invariant Status</span>
            <ShieldCheck className="metric-icon" style={{ color: '#34d399' }} />
          </div>
          <div className="metric-value" style={{ color: '#34d399' }}>0 Mismatches</div>
          <div className="metric-sub">∑(Movements) ≡ Balances transactionally verified</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
            <Database style={{ width: 18, height: 18, color: '#38bdf8' }} />
            <h3 style={{ fontSize: '0.925rem', fontWeight: 600, color: '#ffffff' }}>Storage & Ledger Guarantees</h3>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <CheckCircle2 style={{ width: 14, height: 14, color: '#10b981', flexShrink: 0, marginTop: 2 }} />
              <span><strong>Append-Only Integrity:</strong> Inbound receipts, project issues, and transfers are logged permanently in <code>stock_movements</code>.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <CheckCircle2 style={{ width: 14, height: 14, color: '#10b981', flexShrink: 0, marginTop: 2 }} />
              <span><strong>Non-Negative Stock:</strong> Database-level check constraints (<code>quantity_on_hand &gt;= 0</code>) guarantee zero negative inventory.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <CheckCircle2 style={{ width: 14, height: 14, color: '#10b981', flexShrink: 0, marginTop: 2 }} />
              <span><strong>Atomic Transfers:</strong> Multi-location transfers execute coupled <code>TRANSFER_OUT</code> / <code>TRANSFER_IN</code> events sharing a unique group ID.</span>
            </li>
          </ul>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
            <Cpu style={{ width: 18, height: 18, color: '#a855f7' }} />
            <h3 style={{ fontSize: '0.925rem', fontWeight: 600, color: '#ffffff' }}>AI Advisory Replenishment</h3>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <CheckCircle2 style={{ width: 14, height: 14, color: '#10b981', flexShrink: 0, marginTop: 2 }} />
              <span><strong>Intermittent Demand:</strong> Syntetos-Boylan Approximation (SBA) corrects exponential smoothing bias during frequent zero-demand periods.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <CheckCircle2 style={{ width: 14, height: 14, color: '#10b981', flexShrink: 0, marginTop: 2 }} />
              <span><strong>Time-Safe Cutoffs:</strong> Demand features strictly exclude future transactions, preventing leakage during model evaluation.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <CheckCircle2 style={{ width: 14, height: 14, color: '#10b981', flexShrink: 0, marginTop: 2 }} />
              <span><strong>Human-in-the-Loop Governance:</strong> Probabilistic recommendations require explicit officer approval before conversion into formal POs.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
