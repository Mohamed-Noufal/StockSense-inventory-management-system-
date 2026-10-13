import React from 'react';
import { Package, Layers, AlertTriangle, ClipboardList, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface InventoryKpiCardsProps {
  totalItems?: number;
  totalValue?: number;
  lowStockCount?: number;
  openPOCount?: number;
}

export const InventoryKpiCards: React.FC<InventoryKpiCardsProps> = ({
  totalItems = 248,
  totalValue = 482350,
  lowStockCount = 18,
  openPOCount = 7,
}) => {
  // Format monetary value cleanly
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(totalValue);

  return (
    <div className="inventory-kpi-grid">
      {/* 1. Total Items */}
      <div className="inventory-kpi-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="kpi-icon-badge">
            <Package style={{ width: 18, height: 18, color: '#ffffff' }} />
          </div>
          <div>
            <div className="kpi-label">Total Items</div>
            <div className="kpi-value">{totalItems}</div>
          </div>
        </div>
        <div className="kpi-trend-pill trend-positive">
          <ArrowUpRight style={{ width: 13, height: 13 }} />
          <span>12%</span>
          <span className="trend-context">vs. last month</span>
        </div>
      </div>

      {/* 2. Total Stock Value */}
      <div className="inventory-kpi-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="kpi-icon-badge kpi-icon-green">
            <Layers style={{ width: 18, height: 18, color: '#34d399' }} />
          </div>
          <div>
            <div className="kpi-label">Total Stock Value</div>
            <div className="kpi-value">{formattedValue}</div>
          </div>
        </div>
        <div className="kpi-trend-pill trend-positive">
          <ArrowUpRight style={{ width: 13, height: 13 }} />
          <span>8%</span>
          <span className="trend-context">vs. last month</span>
        </div>
      </div>

      {/* 3. Low Stock Items */}
      <div className="inventory-kpi-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="kpi-icon-badge kpi-icon-amber">
            <AlertTriangle style={{ width: 18, height: 18, color: '#fbbf24' }} />
          </div>
          <div>
            <div className="kpi-label">Low Stock Items</div>
            <div className="kpi-value">{lowStockCount}</div>
          </div>
        </div>
        <div className="kpi-trend-pill trend-positive">
          <ArrowDownRight style={{ width: 13, height: 13 }} />
          <span>32%</span>
          <span className="trend-context">vs. last month</span>
        </div>
      </div>

      {/* 4. Open POs */}
      <div className="inventory-kpi-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="kpi-icon-badge kpi-icon-purple">
            <ClipboardList style={{ width: 18, height: 18, color: '#c084fc' }} />
          </div>
          <div>
            <div className="kpi-label">Open POs</div>
            <div className="kpi-value">{openPOCount}</div>
          </div>
        </div>
        <div className="kpi-trend-pill trend-positive">
          <ArrowUpRight style={{ width: 13, height: 13 }} />
          <span>2%</span>
          <span className="trend-context">vs. last week</span>
        </div>
      </div>
    </div>
  );
};
