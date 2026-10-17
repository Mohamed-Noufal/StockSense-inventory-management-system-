import React, { useState, useEffect, useMemo } from 'react';
import { Building2, PackagePlus, Sparkles, Settings } from 'lucide-react';
import { InventoryItem, StockMovement, PurchaseOrder } from '../types';
import { api } from '../api/client';
import { useI18n } from '../i18n/I18nContext';
import { InventoryKpiCards } from './InventoryKpiCards';
import { InventoryToolbar } from './InventoryToolbar';
import { InventoryTable } from './InventoryTable';
import { InventoryItemDetail } from './InventoryItemDetail';

interface InventoryViewProps {
  items: InventoryItem[];
  orders?: PurchaseOrder[];
  loading?: boolean;
  onAction: (itemId: number, type: 'RECEIPT' | 'ISSUE' | 'TRANSFER') => void;
  onNavigateTab?: (tab: any) => void;
  onPrintLabel?: (item: InventoryItem) => void;
  onAddNewItem?: () => void;
  onOpenWorkspace?: () => void;
}

// Items loaded from live database

export const InventoryView: React.FC<InventoryViewProps> = ({
  items: backendItems,
  orders = [],
  loading = false,
  onAction,
  onNavigateTab = () => {},
  onPrintLabel,
  onAddNewItem,
  onOpenWorkspace,
}) => {
  const { t } = useI18n();
  // Use real backend items directly from database
  const allItems = useMemo(() => {
    return backendItems || [];
  }, [backendItems]);

  // Selected item state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(allItems[0] || null);

  // Sync selectedItem when allItems loads
  useEffect(() => {
    if (allItems.length > 0) {
      setSelectedItem((prev) => {
        if (!prev) return allItems[0];
        const match = allItems.find((i) => i.id === prev.id);
        return match || allItems[0];
      });
    }
  }, [allItems]);

  // Ledger movements for selected item
  const [itemMovements, setItemMovements] = useState<StockMovement[]>([]);

  // Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Extract unique categories and locations
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach((i) => {
      if (i.category_name) set.add(i.category_name);
    });
    return Array.from(set).sort();
  }, [allItems]);

  const availableLocations = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach((i) => {
      if (i.warehouse_name) set.add(i.warehouse_name);
    });
    return Array.from(set).sort();
  }, [allItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));

      // 2. Category Filter
      const matchesCat =
        categoryFilter === 'ALL' || item.category_name === categoryFilter;

      // 3. Location Filter
      const matchesLoc =
        locationFilter === 'ALL' || item.warehouse_name === locationFilter;

      // 4. Status Filter
      let matchesStatus = true;
      const onHand = item.total_on_hand ?? 0;
      const rop = item.reorder_point ?? 10;
      if (statusFilter === 'IN_STOCK') {
        matchesStatus = onHand > rop;
      } else if (statusFilter === 'LOW_STOCK') {
        matchesStatus = onHand > 0 && onHand <= rop;
      } else if (statusFilter === 'OUT_OF_STOCK') {
        matchesStatus = onHand <= 0;
      }

      return matchesSearch && matchesCat && matchesLoc && matchesStatus;
    });
  }, [allItems, searchQuery, categoryFilter, locationFilter, statusFilter]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Fetch movements whenever selected item changes
  useEffect(() => {
    if (!selectedItem) return;
    let isMounted = true;
    api
      .getLedger(10, 0, undefined, selectedItem.id)
      .then((movs) => {
        if (isMounted && movs && movs.length > 0) {
          setItemMovements(movs);
        }
      })
      .catch(() => {
        // Fallback gracefully to default movements
      });
    return () => {
      isMounted = false;
    };
  }, [selectedItem]);

  // Handle Export to CSV
  const handleExportCSV = () => {
    const headers = ['SKU', 'Item Name', 'Category', 'Warehouse', 'On Hand', 'Reserved', 'Available', 'Status', 'Unit Cost USD'];
    const rows = filteredItems.map((item) => {
      const onHand = item.total_on_hand ?? 0;
      const reserved = item.reserved_qty ?? 0;
      const available = item.available_qty ?? Math.max(0, onHand - reserved);
      const rop = item.reorder_point ?? 10;
      const status = onHand <= 0 ? 'Out of Stock' : onHand <= rop ? 'Low Stock' : 'In Stock';
      const cost = (item.unit_cost_minor / 100).toFixed(2);
      return [
        `"${item.sku}"`,
        `"${item.name}"`,
        `"${item.category_name || ''}"`,
        `"${item.warehouse_name || ''}"`,
        onHand,
        reserved,
        available,
        `"${status}"`,
        cost,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stocksense_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Live KPI aggregates computed from authoritative items and orders
  const totalItemsCount = backendItems.length;

  const totalStockValue = backendItems.reduce(
    (sum, itm) => sum + (itm.total_on_hand * itm.unit_cost_minor) / 100,
    0
  );

  const lowStockCount = backendItems.filter(
    (itm) => itm.total_on_hand <= (itm.reorder_point ?? 10)
  ).length;

  const openPOCount = orders.filter((o) => o.status === 'DRAFT' || o.status === 'APPROVED').length;

  return (
    <div className="inventory-view-root">
      {/* Top Metric KPI Cards (4 cards) */}
      <InventoryKpiCards
        totalItems={totalItemsCount}
        totalValue={totalStockValue}
        lowStockCount={lowStockCount}
        openPOCount={openPOCount}
        loading={loading}
      />

      {/* 3. Split Layout Workstation OR Clean Workspace Empty State */}
      {!loading && backendItems.length === 0 ? (
        <div className="empty-workspace-view">
          <div className="empty-workspace-card">
            <div className="empty-workspace-icon">
              <Building2 style={{ width: 32, height: 32, color: '#10b981' }} />
            </div>
            <h2 className="empty-workspace-title">{t('workspace.empty_inventory_title')}</h2>
            <p className="empty-workspace-desc">{t('workspace.empty_inventory_desc')}</p>
            <div className="empty-workspace-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={onAddNewItem}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
              >
                <PackagePlus style={{ width: 16, height: 16 }} />
                <span>{t('workspace.register_first_btn')}</span>
              </button>
              {onOpenWorkspace && (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onOpenWorkspace}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
                  >
                    <Sparkles style={{ width: 15, height: 15, color: '#818cf8' }} />
                    <span>{t('workspace.load_sample_btn')}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onOpenWorkspace}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
                    title={t('workspace.manage_btn')}
                  >
                    <Settings style={{ width: 15, height: 15, color: '#10b981' }} />
                    <span>{t('workspace.manage_btn')}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="inventory-split-layout">
          {/* Left Column: Toolbar + Data Table (~68% width) */}
          <div className="inventory-left-column">
            <InventoryToolbar
              searchQuery={searchQuery}
              onSearchChange={(q) => {
                setSearchQuery(q);
                setCurrentPage(1);
              }}
              categoryFilter={categoryFilter}
              onCategoryChange={(c) => {
                setCategoryFilter(c);
                setCurrentPage(1);
              }}
              locationFilter={locationFilter}
              onLocationChange={(l) => {
                setLocationFilter(l);
                setCurrentPage(1);
              }}
              statusFilter={statusFilter}
              onStatusChange={(s) => {
                setStatusFilter(s);
                setCurrentPage(1);
              }}
              categories={availableCategories}
              locations={availableLocations}
              onExport={handleExportCSV}
              onAddNewItem={onAddNewItem}
            />

            <InventoryTable
              items={paginatedItems}
              selectedItem={selectedItem || allItems[0]}
              onSelectItem={(item) => setSelectedItem(item)}
              onAction={onAction}
              currentPage={currentPage}
              onPageChange={(p) => setCurrentPage(p)}
              pageSize={pageSize}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
              totalItemsCount={totalItemsCount}
            />
          </div>

          {/* Right Column: Selected Item Inspection & Movement (~32% width) */}
          <div className="inventory-right-column">
            {selectedItem && (
              <InventoryItemDetail
                item={selectedItem}
                movements={itemMovements}
                onNavigateTab={onNavigateTab}
                onCreateMovement={(itemId) => onAction(itemId, 'ISSUE')}
                onPrintLabel={onPrintLabel}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
