import React from 'react';
import { CheckCircle2, Clock, CircleDot, Flag } from 'lucide-react';
import { Milestone } from '../types';

interface SprintViewProps {
  milestones: Milestone[];
}

export const SprintView: React.FC<SprintViewProps> = ({ milestones }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Flag style={{ width: 16, height: 16, color: '#ededed' }} />
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>Milestone Delivery Roadmap</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {milestones.map((m) => {
          const isDone = m.status === 'completed';
          const isActive = m.status === 'in_progress';
          return (
            <div
              key={m.id}
              className="card"
              style={{
                borderLeft: `3px solid ${isDone ? '#10b981' : isActive ? '#38bdf8' : 'var(--border-subtle)'}`,
                padding: '1.1rem 1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {isDone ? (
                    <CheckCircle2 style={{ width: 16, height: 16, color: '#10b981' }} />
                  ) : isActive ? (
                    <Clock style={{ width: 16, height: 16, color: '#38bdf8' }} />
                  ) : (
                    <CircleDot style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
                  )}
                  <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: '#ffffff' }}>{m.title}</h4>
                </div>
                <span
                  className={`badge ${isDone ? 'badge-success' : isActive ? 'badge-info' : ''}`}
                  style={{ textTransform: 'uppercase', fontSize: '0.68rem' }}
                >
                  {m.sprint} • {m.status.replace('_', ' ')}
                </span>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                {m.description}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {m.deliverables.map((d, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      padding: '0.15rem 0.45rem',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    ✓ {d}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
