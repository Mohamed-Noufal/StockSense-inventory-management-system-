import React from 'react';
import { Database } from 'lucide-react';
import { ReadyResponse } from '../types';

interface DiagnosticsViewProps {
  readiness: ReadyResponse | null;
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({ readiness }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="glass-card">
        <div className="card-header">
          <span className="card-title">
            <Database style={{ width: 16, height: 16 }} /> SQLite 17-Table Relational Schema
          </span>
        </div>
        <div className="terminal-box">
          {readiness?.table_counts ? (
            Object.entries(readiness.table_counts).map(([tbl, count]) => (
              <div key={tbl}>
                <span style={{ color: '#94a3b8' }}>table:</span>{' '}
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>{tbl.padEnd(24, ' ')}</span>{' '}
                <span style={{ color: '#34d399' }}>{count} rows</span>
              </div>
            ))
          ) : (
            <div>Connecting to database engine...</div>
          )}
        </div>
      </div>
    </div>
  );
};
