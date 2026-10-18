import React, { useState, useEffect } from 'react';
import {
  MoreHorizontal, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUpRight, ArrowLeftRight, Check,
} from 'lucide-react';
import { InventoryItem } from '../types';
import { ItemPartThumbnail } from './ItemPartThumbnail';
import { useI18n } from '../i18n/I18nContext';
import { translateCategory, translateWarehouse } from '../i18n/translations';

interface InventoryTableProps {
  items: InventoryItem[];
  selectedItem: InventoryItem | null;
  onSelectItem: (item: InventoryItem) => void;
  onAction: (itemId: number, type: 'RECEIPT' | 'ISSUE' | 'TRANSFER') => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  totalItemsCount: number;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  selectedItem,
  onSelectItem,
  onAction,
  currentPage,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalItemsCount,
}) => {
  const { t, locale } = useI18n();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [actionMenuOpenId, setActionMenuOpenId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<string>('name');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Close action dropdown on click outside
  useEffect(() => {
    if (actionMenuOpenId === null) return;
    const handleDocumentClick = () => {
      setActionMenuOpenId(null);
    };
    window.addEventListener('click', handleDocumentClick);
    return () => {
      window.removeEventListener('click', handleDocumentClick);
    };
  }, [actionMenuOpenId]);

  // Toggle single row selection
  const handleToggleSelectRow = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle select all on current page
  const handleToggleSelectAll = () => {
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Sorting
  const sortedItems = [...items].sort((a, b) => {
    let aVal: any = (a as any)[sortField];
    let bVal: any = (b as any)[sortField];
    if (typeof aVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
  });

  const allSelected = items.length > 0 && selectedIds.size === items.length;

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(totalItemsCount / pageSize));
  const startItemIndex = (currentPage - 1) * pageSize + 1;
  const endItemIndex = Math.min(totalItemsCount, currentPage * pageSize);

  const getStatusBadge = (item: InventoryItem) => {
    const onHand = item.total_on_hand ?? 0;
    const rop = item.reorder_point ?? 10;
    if (onHand <= 0) {
      return <span className="status-pill status-out">{t('inventory.out_of_stock')}</span>;
    }
    if (onHand <= rop) {
      return <span className="status-pill status-low">{t('inventory.low_stock_pill')}</span>;
    }
    return <span className="status-pill status-in">{t('inventory.in_stock')}</span>;
  };

  return (
    <div className="inventory-table-container">
      <div className="table-scroll-wrapper">
        <table className="inventory-data-table">
          <thead>
            <tr>
              {/* Checkbox */}
              <th style={{ width: '40px', textAlign: 'center', paddingLeft: '0.75rem', paddingRight: '0.25rem' }}>
                <input
                  type="checkbox"
                  className="table-checkbox"
                  checked={allSelected}
                  onChange={handleToggleSelectAll}
                  aria-label="Select all items on this page"
                />
              </th>

              {/* Item */}
              <th onClick={() => handleSort('name')} className="sortable-th" style={{ minWidth: '180px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>{t('inventory.col_item')}</span>
                  <ArrowUpDown style={{ width: 12, height: 12, opacity: sortField === 'name' ? 1 : 0.4 }} />
                </div>
              </th>

              {/* Category */}
              <th onClick={() => handleSort('category_name')} className="sortable-th" style={{ minWidth: '130px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>{t('inventory.col_category')}</span>
                  <ArrowUpDown style={{ width: 12, height: 12, opacity: sortField === 'category_name' ? 1 : 0.4 }} />
                </div>
              </th>

              {/* Warehouse */}
              <th style={{ minWidth: '120px' }}>{t('inventory.col_warehouse')}</th>

              {/* On Hand */}
              <th onClick={() => handleSort('total_on_hand')} className="sortable-th" style={{ textAlign: 'right', minWidth: '85px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end', width: '100%' }}>
                  <span>{t('inventory.col_on_hand')}</span>
                  <ArrowUpDown style={{ width: 12, height: 12, opacity: sortField === 'total_on_hand' ? 1 : 0.4 }} />
                </div>
              </th>

              {/* Reserved */}
              <th onClick={() => handleSort('reserved_qty')} className="sortable-th" style={{ textAlign: 'right', minWidth: '85px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end', width: '100%' }}>
                  <span>{t('inventory.col_reserved')}</span>
                  <ArrowUpDown style={{ width: 12, height: 12, opacity: sortField === 'reserved_qty' ? 1 : 0.4 }} />
                </div>
              </th>

              {/* Available */}
              <th onClick={() => handleSort('available_qty')} className="sortable-th" style={{ textAlign: 'right', minWidth: '85px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end', width: '100%' }}>
                  <span>{t('inventory.col_available')}</span>
                  <ArrowUpDown style={{ width: 12, height: 12, opacity: sortField === 'available_qty' ? 1 : 0.4 }} />
                </div>
              </th>

              {/* Status */}
              <th style={{ minWidth: '100px', textAlign: 'center' }}>{t('inventory.col_status')}</th>

              {/* Actions */}
              <th style={{ width: '50px', textAlign: 'center' }}>{t('inventory.col_actions')}</th>
            </tr>
          </thead>

          <tbody>
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8' }}>
                  No items match your active filters.
                </td>
              </tr>
            ) : (
              sortedItems.map((item, index) => {
                const isSelected = selectedItem?.id === item.id;
                const isChecked = selectedIds.has(item.id);
                const onHand = item.total_on_hand ?? 0;
                const reserved = item.reserved_qty ?? (onHand > 5 ? Math.max(1, Math.floor(onHand * 0.12)) : (onHand > 2 ? 1 : 0));
                const available = item.available_qty ?? Math.max(0, onHand - reserved);
                const isNearBottom = index >= sortedItems.length - 2 && sortedItems.length > 2;

                return (
                  <tr
                    key={item.id}
                    className={`inventory-table-row ${isSelected ? 'row-active' : ''}`}
                    onClick={() => onSelectItem(item)}
                  >
                    {/* Checkbox */}
                    <td style={{ textAlign: 'center', paddingLeft: '0.75rem', paddingRight: '0.25rem' }}>
                      <input
                        type="checkbox"
                        className="table-checkbox"
                        checked={isChecked}
                        onClick={(e) => handleToggleSelectRow(item.id, e)}
                        onChange={() => {}}
                        aria-label={`Select ${item.name}`}
                      />
                    </td>

                    {/* Item with Thumbnail, Name & SKU */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <ItemPartThumbnail
                          sku={item.sku}
                          name={item.name}
                          category={item.category_name}
                          size="md"
                        />
                        <div style={{ minWidth: 0 }}>
                          <div className="table-item-name">{item.name}</div>
                          <div className="table-item-sku">{item.sku}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <span className="table-category-label">
                        {translateCategory(item.category_name || 'Mechanical Parts', locale)}
                      </span>
                    </td>

                    {/* Warehouse */}
                    <td>
                      <span className="table-warehouse-label">
                        {translateWarehouse(item.warehouse_name || 'Central Warehouse (Cairo Base)', locale)}
                      </span>
                    </td>

                    {/* On Hand */}
                    <td style={{ textAlign: 'right' }}>
                      <span className="table-number-cell">{onHand}</span>
                    </td>

                    {/* Reserved */}
                    <td style={{ textAlign: 'right' }}>
                      <span className="table-number-cell" style={{ color: '#94a3b8' }}>{reserved}</span>
                    </td>

                    {/* Available */}
                    <td style={{ textAlign: 'right' }}>
                      <span className="table-number-cell" style={{ fontWeight: 600 }}>{available}</span>
                    </td>

                    {/* Status */}
                    <td style={{ textAlign: 'center' }}>
                      {getStatusBadge(item)}
                    </td>

                    {/* Actions Dropdown */}
                    <td style={{ textAlign: 'center', position: 'relative' }}>
                      <button
                        className="table-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionMenuOpenId(actionMenuOpenId === item.id ? null : item.id);
                        }}
                        title={t('inventory.col_actions')}
                      >
                        <MoreHorizontal style={{ width: 14, height: 14 }} />
                      </button>

                      {/* Dropdown Menu */}
                      {actionMenuOpenId === item.id && (
                        <div
                          className={`table-actions-menu ${isNearBottom ? 'open-upward' : ''}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="actions-menu-item"
                            onClick={() => {
                              setActionMenuOpenId(null);
                              onAction(item.id, 'ISSUE');
                            }}
                          >
                            <ArrowUpRight style={{ width: 12, height: 12, color: '#ef4444' }} />
                            <span>{t('inventory.quick_issue')}</span>
                          </button>
                          <button
                            className="actions-menu-item"
                            onClick={() => {
                              setActionMenuOpenId(null);
                              onAction(item.id, 'TRANSFER');
                            }}
                          >
                            <ArrowLeftRight style={{ width: 12, height: 12, color: 'var(--text-secondary)' }} />
                            <span>{t('inventory.transfer_stock')}</span>
                          </button>
                          <button
                            className="actions-menu-item"
                            onClick={() => {
                              setActionMenuOpenId(null);
                              onAction(item.id, 'RECEIPT');
                            }}
                          >
                            <Check style={{ width: 12, height: 12, color: '#10b981' }} />
                            <span>{t('inventory.receive_stock')}</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="table-pagination-footer">
        <div className="pagination-info">
          {locale === 'ar'
            ? `عرض ${items.length > 0 ? startItemIndex : 0} - ${endItemIndex} من إجمالي ${totalItemsCount} صنفاً`
            : `Showing ${items.length > 0 ? startItemIndex : 0} - ${endItemIndex} of ${totalItemsCount} items`}
        </div>

        <div className="pagination-controls">
          {/* Previous Page */}
          <button
            className="pagination-btn"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Previous Page"
          >
            <ChevronLeft style={{ width: 14, height: 14 }} />
          </button>

          {/* Page Numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((pg) => (
            <button
              key={pg}
              className={`pagination-num-btn ${currentPage === pg ? 'active' : ''}`}
              onClick={() => onPageChange(pg)}
            >
              {pg}
            </button>
          ))}

          {/* Next Page */}
          <button
            className="pagination-btn"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Next Page"
          >
            <ChevronRight style={{ width: 14, height: 14 }} />
          </button>

          {/* Page Size Select */}
          <select
            className="page-size-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Items per page"
          >
            <option value={10}>10 {t('inventory.per_page')}</option>
            <option value={20}>20 {t('inventory.per_page')}</option>
            <option value={50}>50 {t('inventory.per_page')}</option>
          </select>
        </div>
      </div>
    </div>
  );
};
