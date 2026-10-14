import React from 'react';
import { Search, ChevronDown, Download, PackagePlus } from 'lucide-react';

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
  return (
    <div className="inventory-toolbar-card">
      {/* 1. Search Bar */}
      <div className="toolbar-search-box">
        <Search style={{ width: 15, height: 15, color: '#94a3b8', flexShrink: 0 }} />
        <input
          type="text"
          className="toolbar-search-input"
          placeholder="Search items by name or SKU..."
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
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
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
            <option value="ALL">All Locations</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
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
            <option value="ALL">All Stock Status</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
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
          <span>Export</span>
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
            <span>+ Register Item</span>
          </button>
        )}
      </div>
    </div>
  );
};
