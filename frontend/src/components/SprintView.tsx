import React from 'react';
import { Milestone } from '../types';

interface SprintViewProps {
  milestones: Milestone[];
}

export const SprintView: React.FC<SprintViewProps> = ({ milestones }) => {
  return (
    <div className="glass-card">
      <div className="card-header">
        <span className="card-title">Sprint Delivery Progress</span>
      </div>
      <div className="milestone-list">
        {milestones.map((m) => (
          <div
            key={m.id}
            className={`milestone-item ${
              m.status === 'completed' ? 'done' : m.status === 'in_progress' ? 'active' : 'pending'
            }`}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span
                  className={`milestone-badge ${
                    m.status === 'completed'
                      ? 'badge-done'
                      : m.status === 'in_progress'
                      ? 'badge-active'
                      : 'badge-pending'
                  }`}
                >
                  {m.status.toUpperCase()}
                </span>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{m.title}</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                {m.description}
              </p>
              <ul style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '1.25rem' }}>
                {m.deliverables.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
