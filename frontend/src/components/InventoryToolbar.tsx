import React from 'react';
import { Search, ChevronDown, Download, PackagePlus } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { translateCategory, translateWarehouse } from '../i18n/translations';

interface InventoryToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  locationFilter: string;
  onLocationChange: (loc: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  categories: string[];
  locations: string[];
  onExport: () => void;
  onAddNewItem?: () => void;
}

export const InventoryToolbar: React.FC<InventoryToolbarProps> = ({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  locationFilter,
  onLocationChange,
  statusFilter,
  onStatusChange,
  categories,
  locations,
  onExport,
  onAddNewItem,
}) => {
  const { t, locale } = useI18n();

  return (
    <div className="inventory-toolbar-card">
      {/* 1. Search Bar */}
      <div className="toolbar-search-box">
        <Search style={{ width: 15, height: 15, color: '#94a3b8', flexShrink: 0 }} />
        <input
          type="text"
          className="toolbar-search-input"
          placeholder={t('inventory.search_placeholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* 2. Filter Dropdowns Group */}
      <div className="toolbar-filters-group">
        {/* Category Select */}
        <div className="toolbar-select-wrapper">
          <select
            className="toolbar-select"
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="ALL">{t('inventory.all_categories')}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {translateCategory(c, locale)}
              </option>
            ))}
          </select>
          <ChevronDown className="select-chevron" />
        </div>

        {/* Location Select */}
        <div className="toolbar-select-wrapper">
          <select
            className="toolbar-select"
            value={locationFilter}
            onChange={(e) => onLocationChange(e.target.value)}
          >
            <option value="ALL">{t('inventory.all_locations')}</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {translateWarehouse(l, locale)}
              </option>
            ))}
          </select>
          <ChevronDown className="select-chevron" />
        </div>

        {/* Status Select */}
        <div className="toolbar-select-wrapper">
          <select
            className="toolbar-select"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="ALL">{t('inventory.all_status')}</option>
            <option value="IN_STOCK">{t('inventory.in_stock')}</option>
            <option value="LOW_STOCK">{t('inventory.low_stock_pill')}</option>
            <option value="OUT_OF_STOCK">{t('inventory.out_of_stock')}</option>
          </select>
          <ChevronDown className="select-chevron" />
        </div>

        {/* 3. Export Button */}
        <button
          className="toolbar-export-btn"
          onClick={onExport}
          title="Export filtered items to CSV"
        >
          <Download style={{ width: 14, height: 14 }} />
          <span>{t('inventory.export')}</span>
        </button>

        {/* 4. Register New Item Button */}
        {onAddNewItem && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onAddNewItem}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.45rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '6px',
            }}
            title="Register new catalog SKU into master inventory"
          >
            <PackagePlus style={{ width: 14, height: 14 }} />
            <span>{t('inventory.register_item')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
