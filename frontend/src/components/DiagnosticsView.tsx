import React from 'react';
import { Database, CheckCircle2 } from 'lucide-react';
import { ReadyResponse } from '../types';

interface DiagnosticsViewProps {
  readiness: ReadyResponse | null;
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({ readiness }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database style={{ width: 16, height: 16, color: '#38bdf8' }} />
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>Storage Engine & 17-Table Relational Schema</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#34d399' }}>
          <CheckCircle2 style={{ width: 14, height: 14 }} />
          <span>PRAGMA journal_mode = WAL • foreign_keys = ON</span>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Table Name</th>
              <th>Schema Category</th>
              <th style={{ textAlign: 'right' }}>Active Row Count</th>
              <th style={{ textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {!readiness?.table_counts ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  Connecting to storage engine...
                </td>
              </tr>
            ) : (
              Object.entries(readiness.table_counts).map(([tbl, count]) => {
                const isLedger = tbl === 'stock_movements' || tbl === 'stock_balances';
                const isAI = tbl.startsWith('ai_') || tbl === 'item_policies' || tbl === 'recommendations';
                const isPO = tbl.startsWith('purchase_order');
                const category = isLedger ? 'Inventory Ledger' : isAI ? 'AI Replenishment' : isPO ? 'Procurement' : 'Master Data';
                return (
                  <tr key={tbl}>
                    <td>
                      <span className="sku-cell">{tbl}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{category}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: count > 0 ? '#34d399' : 'var(--text-muted)' }}>
                      {count} rows
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                        Operational
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
