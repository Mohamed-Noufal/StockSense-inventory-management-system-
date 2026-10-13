import React, { useState, useEffect } from 'react';
import { Box, Calendar, ChevronDown, X } from 'lucide-react';
import { StockMovement, OperationsStats, InventoryItem, InventoryLocation } from '../types';
import { api } from '../api/client';
import { OperationsActionCards } from './OperationsActionCards';
import { OperationsTable } from './OperationsTable';
import { OperationsStatsCard } from './OperationsStatsCard';
import { OperationsActivityFeed } from './OperationsActivityFeed';

interface OperationsViewProps {
  ledger: StockMovement[];
  items?: InventoryItem[];
  locations?: InventoryLocation[];
  onRefresh?: () => void;
  onOpenMovementModal: (type: 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT') => void;
  onPrintWaybill?: (movement: StockMovement) => void;
}

export const OperationsView: React.FC<OperationsViewProps> = ({
  ledger,
  onOpenMovementModal,
  onPrintWaybill,
}) => {

  const [stats, setStats] = useState<OperationsStats | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);
  const [dateRangeText, setDateRangeText] = useState<string>('Oct 1, 2026 – Oct 15, 2026');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);

  const fetchStats = async (days = 7) => {
    try {
      const data = await api.getOperationsStats(days);
      setStats(data);
    } catch {
      // Use fallback baseline
    }
  };

  useEffect(() => {
    fetchStats(7);
  }, [ledger.length]);

  const handleSelectDateRange = (label: string) => {
    setDateRangeText(label);
    setIsDatePickerOpen(false);
  };

  return (
    <div className="ops-view-container">
      {/* 1. Header Bar with Title and Date Range Picker */}
      <div className="ops-header-bar">
        <div className="ops-header-title-box">
          <div className="ops-header-icon-square">
            <Box style={{ width: 20, height: 20, color: '#ffffff' }} />
          </div>
          <h1 className="ops-title">Operations</h1>
        </div>

        {/* Date Filter Picker */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="ops-date-picker-btn"
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
          >
            <Calendar style={{ width: 14, height: 14, color: 'var(--text-secondary)' }} />
            <span>{dateRangeText}</span>
            <ChevronDown style={{ width: 13, height: 13, color: 'var(--text-muted)' }} />
          </button>

          {isDatePickerOpen && (
            <div className="ops-date-dropdown">
              <button
                type="button"
                className="ops-date-opt"
                onClick={() => handleSelectDateRange('Oct 1, 2026 – Oct 15, 2026')}
              >
                Current Sprint (Oct 1 – Oct 15, 2026)
              </button>
              <button
                type="button"
                className="ops-date-opt"
                onClick={() => handleSelectDateRange('Last 7 Days (Oct 8 – Oct 15, 2026)')}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                className="ops-date-opt"
                onClick={() => handleSelectDateRange('Last 30 Days (Sep 15 – Oct 15, 2026)')}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                className="ops-date-opt"
                onClick={() => handleSelectDateRange('All Operations (Full Ledger)')}
              >
                All Operations (Full Ledger)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Top 4 Action Cards */}
      <OperationsActionCards onOpenAction={onOpenMovementModal} />

      {/* 3. Main Split Section (~68% Table, ~32% Right Rail) */}
      <div className="ops-content-layout">
        {/* Left Column: Recent Operations Table */}
        <div className="ops-left-column">
          <OperationsTable
            ledger={ledger}
            onSelectMovement={(m) => setSelectedMovement(m)}
            onPrintWaybill={onPrintWaybill}
          />
        </div>


        {/* Right Column: Operation Stats + Recent Activity Feed */}
        <div className="ops-right-column">
          <OperationsStatsCard stats={stats} onTimeframeChange={(d) => fetchStats(d)} />
          <OperationsActivityFeed movements={ledger} />
        </div>
      </div>

      {/* 4. Movement Audit Detail Modal */}
      {selectedMovement && (
        <div className="modal-overlay" onClick={() => setSelectedMovement(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Box style={{ width: 18, height: 18, color: '#ffffff' }} />
                <h3>Movement Audit Ledger #{selectedMovement.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMovement(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="card" style={{ padding: '0.65rem 0.85rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Item SKU & Name</div>
                  <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.88rem', marginTop: 2 }}>
                    {selectedMovement.item_sku || '—'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {selectedMovement.item_name || 'Stock item'}
                  </div>
                </div>

                <div className="card" style={{ padding: '0.65rem 0.85rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Movement Type</div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', marginTop: 2 }}>
                    {selectedMovement.movement_type}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: selectedMovement.quantity >= 0 ? '#34d399' : '#f87171' }}>
                    Signed Delta: {selectedMovement.quantity >= 0 ? `+${selectedMovement.quantity}` : selectedMovement.quantity}
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '0.75rem 0.85rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Route & Execution Path</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: 2 }}>
                  {selectedMovement.route_display || selectedMovement.location_code || 'WH-01'}
                </div>
              </div>

              <div className="card" style={{ padding: '0.75rem 0.85rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Audit Actor & Reference</div>
                <div style={{ fontSize: '0.82rem', marginTop: 2 }}>
                  Recorded by: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{selectedMovement.actor_label}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Reference: <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedMovement.reference_display || selectedMovement.reason || 'Manual'}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Timestamp: {new Date(selectedMovement.occurred_at).toUTCString()}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedMovement(null)}
              >
                Close Audit Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
