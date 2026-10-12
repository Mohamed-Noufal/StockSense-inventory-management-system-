import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { InventoryItem } from '../types';

interface InventoryViewProps {
  items: InventoryItem[];
  onAction: (itemId: number, type: 'RECEIPT' | 'ISSUE' | 'TRANSFER') => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ items, onAction }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [critFilter, setCritFilter] = useState('ALL');

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCrit = critFilter === 'ALL' || item.criticality === critFilter;
    return matchesSearch && matchesCrit;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <Search style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search SKU or item name..."
            className="form-input"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.825rem' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Filter style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CRITICALITY:</span>
          {(['ALL', 'CRITICAL', 'STANDARD', 'LOW'] as const).map((crit) => (
            <button
              key={crit}
              className={`btn ${critFilter === crit ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.3rem 0.65rem', fontSize: '0.725rem' }}
              onClick={() => setCritFilter(crit)}
            >
              {crit}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Item Description</th>
              <th>Criticality</th>
              <th>On-Hand Balance</th>
              <th>Unit of Measure</th>
              <th>Unit Cost</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td className="sku-cell">{item.sku}</td>
                <td style={{ fontWeight: 600 }}>{item.name}</td>
                <td>
                  <span className={`badge badge-${item.criticality.toLowerCase()}`}>
                    {item.criticality}
                  </span>
                </td>
                <td style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  <span style={{ color: item.total_on_hand > 0 ? '#34d399' : '#f87171' }}>
                    {item.total_on_hand.toLocaleString()}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{item.uom}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>
                  ${(item.unit_cost_minor / 100).toFixed(2)}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                      onClick={() => onAction(item.id, 'ISSUE')}
                    >
                      Issue
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                      onClick={() => onAction(item.id, 'TRANSFER')}
                    >
                      Transfer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
