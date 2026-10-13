import React, { useState, useMemo } from 'react';
import {
  Activity, ArrowUpDown, MoreHorizontal, ChevronLeft, ChevronRight,
  ArrowRight, Check, Copy, Printer, FileText
} from 'lucide-react';
import { StockMovement } from '../types';

interface OperationsTableProps {
  ledger: StockMovement[];
  onSelectMovement?: (movement: StockMovement) => void;
}

export const OperationsTable: React.FC<OperationsTableProps> = ({
  ledger,
  onSelectMovement
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'ISSUE' | 'TRANSFER' | 'RECEIPT' | 'ADJUSTMENT'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const pageSize = 8;

  // Filter out the paired TRANSFER_IN so we don't display duplicate rows for the same transfer operation
  const filteredList = useMemo(() => {
    let list = ledger.filter((m) => m.movement_type !== 'TRANSFER_IN');

    if (activeTab === 'ISSUE') {
      list = list.filter((m) => m.movement_type === 'ISSUE');
    } else if (activeTab === 'TRANSFER') {
      list = list.filter((m) => m.movement_type === 'TRANSFER_OUT' || m.movement_type === 'TRANSFER_IN');
    } else if (activeTab === 'RECEIPT') {
      list = list.filter((m) => m.movement_type === 'RECEIPT');
    } else if (activeTab === 'ADJUSTMENT') {
      list = list.filter((m) => m.movement_type === 'ADJUSTMENT');
    }

    list.sort((a, b) => {
      const timeA = new Date(a.occurred_at).getTime();
      const timeB = new Date(b.occurred_at).getTime();
      return sortAsc ? timeA - timeB : timeB - timeA;
    });

    return list;
  }, [ledger, activeTab, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const paginatedRows = filteredList.slice(pageStart, pageStart + pageSize);

  const formatDateTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      // Format as: "Oct 15, 2026 09:42 AM"
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getUTCMonth()];
      const day = d.getUTCDate();
      const year = d.getUTCFullYear();
      let hours = d.getUTCHours();
      const mins = d.getUTCMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const hoursStr = hours.toString().padStart(2, '0');
      return `${month} ${day}, ${year} ${hoursStr}:${mins} ${ampm}`;
    } catch {
      return isoStr;
    }
  };

  const handleCopy = (refText: string) => {
    navigator.clipboard?.writeText(refText);
    setCopiedRef(refText);
    setTimeout(() => setCopiedRef(null), 2000);
    setOpenActionMenuId(null);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'RECEIPT':
        return <span className="ops-pill ops-pill-receipt">Receipt</span>;
      case 'ISSUE':
        return <span className="ops-pill ops-pill-issue">Issue</span>;
      case 'TRANSFER_OUT':
      case 'TRANSFER_IN':
        return <span className="ops-pill ops-pill-transfer">Transfer</span>;
      case 'ADJUSTMENT':
        return <span className="ops-pill ops-pill-adjust">Adjustment</span>;
      default:
        return <span className="ops-pill ops-pill-neutral">{type}</span>;
    }
  };

  const formatSignedQty = (mov: StockMovement) => {
    const qty = mov.quantity;
    if (mov.movement_type === 'RECEIPT') {
      return <span style={{ color: '#34d399', fontWeight: 600 }}>+{Math.abs(qty)}</span>;
    } else if (mov.movement_type === 'ISSUE') {
      return <span style={{ color: '#f87171', fontWeight: 600 }}>-{Math.abs(qty)}</span>;
    } else if (mov.movement_type === 'TRANSFER_OUT' || mov.movement_type === 'TRANSFER_IN') {
      return <span style={{ color: '#38bdf8', fontWeight: 600 }}>-{Math.abs(qty)}</span>;
    } else if (mov.movement_type === 'ADJUSTMENT') {
      const isPositive = qty >= 0;
      return (
        <span style={{ color: isPositive ? '#34d399' : '#f87171', fontWeight: 600 }}>
          {isPositive ? `+${qty}` : qty}
        </span>
      );
    }
    return <span>{qty}</span>;
  };

  return (
    <div className="card ops-table-card">
      {/* Table Header Section */}
      <div className="ops-table-header-row">
        <div className="ops-table-title-area">
          <Activity style={{ width: 17, height: 17, color: '#38bdf8' }} />
          <h2 className="ops-table-title">Recent Operations</h2>
        </div>

        <button
          type="button"
          className="ops-link-btn"
          onClick={() => setActiveTab('ALL')}
          title="View all recorded operations"
        >
          <span>View all</span>
          <ArrowRight style={{ width: 13, height: 13 }} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="ops-filter-tabs">
        <button
          className={`ops-filter-tab ${activeTab === 'ALL' ? 'active' : ''}`}
          onClick={() => { setActiveTab('ALL'); setCurrentPage(1); }}
        >
          All
        </button>
        <button
          className={`ops-filter-tab ${activeTab === 'ISSUE' ? 'active' : ''}`}
          onClick={() => { setActiveTab('ISSUE'); setCurrentPage(1); }}
        >
          Issues
        </button>
        <button
          className={`ops-filter-tab ${activeTab === 'TRANSFER' ? 'active' : ''}`}
          onClick={() => { setActiveTab('TRANSFER'); setCurrentPage(1); }}
        >
          Transfers
        </button>
        <button
          className={`ops-filter-tab ${activeTab === 'RECEIPT' ? 'active' : ''}`}
          onClick={() => { setActiveTab('RECEIPT'); setCurrentPage(1); }}
        >
          Receipts
        </button>
        <button
          className={`ops-filter-tab ${activeTab === 'ADJUSTMENT' ? 'active' : ''}`}
          onClick={() => { setActiveTab('ADJUSTMENT'); setCurrentPage(1); }}
        >
          Adjustments
        </button>
      </div>

      {/* Main Data Table */}
      <div className="ops-table-wrap">
        <table className="ops-data-table">
          <thead>
            <tr>
              <th
                onClick={() => setSortAsc(!sortAsc)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title="Sort by date"
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>Date & Time</span>
                  <ArrowUpDown style={{ width: 12, height: 12, opacity: 0.7 }} />
                </div>
              </th>
              <th>Type</th>
              <th>Item</th>
              <th>SKU</th>
              <th style={{ textAlign: 'right' }}>Quantity</th>
              <th>From → To</th>
              <th>Reference</th>
              <th>Status</th>
              <th style={{ textAlign: 'center', width: 44 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  No operations match the selected filter.
                </td>
              </tr>
            ) : (
              paginatedRows.map((mov) => {
                const isOpenMenu = openActionMenuId === mov.id;
                return (
                  <tr key={mov.id} className="ops-table-row">
                    {/* Date & Time */}
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {formatDateTime(mov.occurred_at)}
                    </td>

                    {/* Type Badge */}
                    <td>{getTypeBadge(mov.movement_type)}</td>

                    {/* Item Name */}
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {mov.item_name || `Item #${mov.item_id}`}
                    </td>

                    {/* SKU */}
                    <td>
                      <span className="ops-sku-pill">{mov.item_sku || '—'}</span>
                    </td>

                    {/* Quantity */}
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                      {formatSignedQty(mov)}
                    </td>

                    {/* From -> To Route */}
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {mov.route_display || mov.location_code || 'WH-01'}
                    </td>

                    {/* Reference */}
                    <td>
                      <span className="ops-ref-text">{mov.reference_display || '—'}</span>
                    </td>

                    {/* Status */}
                    <td>
                      <div className="ops-status-indicator">
                        <span className="ops-status-dot" />
                        <span>Completed</span>
                      </div>
                    </td>

                    {/* Action Menu */}
                    <td style={{ textAlign: 'center', position: 'relative' }}>
                      <button
                        type="button"
                        className="ops-action-dots-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionMenuId(isOpenMenu ? null : mov.id);
                        }}
                        title="Operation options"
                      >
                        <MoreHorizontal style={{ width: 14, height: 14 }} />
                      </button>

                      {isOpenMenu && (
                        <div
                          className="ops-menu-popover"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="ops-menu-item"
                            onClick={() => {
                              if (onSelectMovement) onSelectMovement(mov);
                              setOpenActionMenuId(null);
                            }}
                          >
                            <FileText style={{ width: 13, height: 13 }} />
                            <span>Audit Details</span>
                          </button>

                          <button
                            type="button"
                            className="ops-menu-item"
                            onClick={() => handleCopy(mov.reference_display || `#${mov.id}`)}
                          >
                            {copiedRef === (mov.reference_display || `#${mov.id}`) ? (
                              <Check style={{ width: 13, height: 13, color: '#34d399' }} />
                            ) : (
                              <Copy style={{ width: 13, height: 13 }} />
                            )}
                            <span>Copy Reference</span>
                          </button>

                          <button
                            type="button"
                            className="ops-menu-item"
                            onClick={() => {
                              window.print();
                              setOpenActionMenuId(null);
                            }}
                          >
                            <Printer style={{ width: 13, height: 13 }} />
                            <span>Print Waybill</span>
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
      <div className="ops-pagination-bar">
        <div className="ops-pagination-info">
          Showing {filteredList.length === 0 ? 0 : pageStart + 1}–{Math.min(filteredList.length, pageStart + pageSize)} of {filteredList.length} operations
        </div>

        <div className="ops-pagination-controls">
          <button
            type="button"
            className="ops-page-btn"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            title="Previous page"
          >
            <ChevronLeft style={{ width: 14, height: 14 }} />
          </button>

          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
            <button
              key={pg}
              type="button"
              className={`ops-page-btn ${currentPage === pg ? 'active' : ''}`}
              onClick={() => setCurrentPage(pg)}
            >
              {pg}
            </button>
          ))}

          <button
            type="button"
            className="ops-page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            title="Next page"
          >
            <ChevronRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>
    </div>
  );
};
