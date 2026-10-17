import React from 'react';
import { Package, Layers, AlertTriangle, ClipboardList, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

interface InventoryKpiCardsProps {
  totalItems?: number;
  totalValue?: number;
  lowStockCount?: number;
  openPOCount?: number;
  loading?: boolean;
}

export const InventoryKpiCards: React.FC<InventoryKpiCardsProps> = ({
  totalItems = 0,
  totalValue = 0,
  lowStockCount = 0,
  openPOCount = 0,
  loading = false,
}) => {
  const { t } = useI18n();

  // Format monetary value cleanly (Standard Western digits: $1,111,184)
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
            <Package style={{ width: 18, height: 18, color: '#ededed' }} />
          </div>
          <div>
            <div className="kpi-label">{t('inventory.total_items')}</div>
            <div className="kpi-value">{loading && totalItems === 0 ? '—' : totalItems}</div>
          </div>
        </div>
        <div className="kpi-trend-pill trend-positive">
          <ArrowUpRight style={{ width: 13, height: 13 }} />
          <span>12%</span>
          <span className="trend-context">{t('inventory.vs_last_month')}</span>
        </div>
      </div>

      {/* 2. Total Stock Value */}
      <div className="inventory-kpi-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="kpi-icon-badge">
            <Layers style={{ width: 18, height: 18, color: '#ededed' }} />
          </div>
          <div>
            <div className="kpi-label">{t('inventory.total_value')}</div>
            <div className="kpi-value">{loading && totalItems === 0 ? '—' : formattedValue}</div>
          </div>
        </div>
        <div className="kpi-trend-pill trend-positive">
          <ArrowUpRight style={{ width: 13, height: 13 }} />
          <span>8%</span>
          <span className="trend-context">{t('inventory.vs_last_month')}</span>
        </div>
      </div>

      {/* 3. Low Stock Items */}
      <div className="inventory-kpi-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="kpi-icon-badge">
            <AlertTriangle style={{ width: 18, height: 18, color: '#ededed' }} />
          </div>
          <div>
            <div className="kpi-label">{t('inventory.low_stock')}</div>
            <div className="kpi-value">{loading && totalItems === 0 ? '—' : lowStockCount}</div>
          </div>
        </div>
        <div className="kpi-trend-pill trend-positive">
          <ArrowDownRight style={{ width: 13, height: 13 }} />
          <span>32%</span>
          <span className="trend-context">{t('inventory.vs_last_month')}</span>
        </div>
      </div>

      {/* 4. Open POs */}
      <div className="inventory-kpi-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="kpi-icon-badge">
            <ClipboardList style={{ width: 18, height: 18, color: '#ededed' }} />
          </div>
          <div>
            <div className="kpi-label">{t('inventory.open_pos')}</div>
            <div className="kpi-value">{loading && totalItems === 0 ? '—' : openPOCount}</div>
          </div>
        </div>
        <div className="kpi-trend-pill trend-positive">
          <ArrowUpRight style={{ width: 13, height: 13 }} />
          <span>2%</span>
          <span className="trend-context">{t('inventory.vs_last_week')}</span>
        </div>
      </div>
    </div>
  );
};
