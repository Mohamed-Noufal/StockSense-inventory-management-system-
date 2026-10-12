import React, { useState } from 'react';
import { Search, SlidersHorizontal, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: '240px' }}>
          <Search style={{ width: 15, height: 15, color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Filter by SKU or part name..."
            className="form-input"
            style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem', background: 'transparent', border: 'none' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SlidersHorizontal style={{ width: 13, height: 13, color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>PRIORITY:</span>
          {(['ALL', 'CRITICAL', 'STANDARD', 'LOW'] as const).map((crit) => (
            <button
              key={crit}
              className={`btn ${critFilter === crit ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
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
              <th>Part SKU</th>
              <th>Item Description</th>
              <th>Criticality</th>
              <th style={{ textAlign: 'right' }}>On-Hand Stock</th>
              <th>UOM</th>
              <th style={{ textAlign: 'right' }}>Unit Cost</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No inventory items match your current filter.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="sku-cell">{item.sku}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f4f4f5' }}>{item.name}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${item.criticality.toLowerCase()}`}>
                      {item.criticality}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ color: item.total_on_hand > 0 ? '#34d399' : '#f87171' }}>
                      {item.total_on_hand.toLocaleString()}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.uom}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                    ${(item.unit_cost_minor / 100).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                        onClick={() => onAction(item.id, 'ISSUE')}
                      >
                        <ArrowUpRight style={{ width: 12, height: 12 }} />
                        <span>Issue</span>
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                        onClick={() => onAction(item.id, 'TRANSFER')}
                      >
                        <ArrowLeftRight style={{ width: 12, height: 12 }} />
                        <span>Transfer</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
