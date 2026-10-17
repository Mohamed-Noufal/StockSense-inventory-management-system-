import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, Download, Search, X, ShoppingBag, Clock, Truck,
  AlertTriangle, CheckCircle, PackageCheck, Sparkles, Printer
} from 'lucide-react';
import { PurchaseOrder, Supplier, InventoryItem, InventoryLocation, POCreatePayload, POReceivePayload } from '../types';
import { POCreateView } from './POCreateView';
import { PODetailView } from './PODetailView';
import { POApprovalModal } from './POApprovalModal';
import { POReceiveModal } from './POReceiveModal';
import { POCancelModal } from './POCancelModal';
import { POPrintModal } from './POPrintModal';
import { useI18n } from '../i18n/I18nContext';
import { translatePOStatus } from '../i18n/translations';

interface ProcurementViewProps {
  orders: PurchaseOrder[];
  suppliers: Supplier[];
  items: InventoryItem[];
  locations: InventoryLocation[];
  onCreatePO: (payload: POCreatePayload) => Promise<PurchaseOrder>;
  onApprove: (poId: number) => Promise<void>;
  onReceive: (poId: number, payload: POReceivePayload) => Promise<void>;
  onCancel: (poId: number) => Promise<void>;
  loading: boolean;
  initialPoId?: number | null;
  onClearInitialPoId?: () => void;
}

type CardFilterType = 'ALL' | 'OPEN' | 'AWAITING' | 'PARTIAL' | 'OVERDUE';

export const ProcurementView: React.FC<ProcurementViewProps> = ({
  orders,
  suppliers,
  items,
  locations,
  onCreatePO,
  onApprove,
  onReceive,
  onCancel,
  loading,
  initialPoId,
  onClearInitialPoId,
}) => {
  const { t, locale } = useI18n();
  // Navigation Workstation Mode
  const [viewMode, setViewMode] = useState<'LIST' | 'CREATE' | 'DETAIL'>('LIST');
  const [selectedPoId, setSelectedPoId] = useState<number | null>(null);

  useEffect(() => {
    if (initialPoId) {
      setSelectedPoId(initialPoId);
      setViewMode('DETAIL');
      onClearInitialPoId?.();
    }
  }, [initialPoId, onClearInitialPoId]);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');
  const [activeCardFilter, setActiveCardFilter] = useState<CardFilterType>('ALL');

  // Modals state
  const [approvingPO, setApprovingPO] = useState<PurchaseOrder | null>(null);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
  const [cancellingPO, setCancellingPO] = useState<PurchaseOrder | null>(null);
  const [printingPO, setPrintingPO] = useState<PurchaseOrder | null>(null);

  const todayIso = new Date().toISOString().split('T')[0];

  // 1. Calculate KPI Metrics for Summary Cards
  const openOrdersCount = useMemo(() => {
    return orders.filter((o) => ['DRAFT', 'APPROVED', 'PARTIALLY_RECEIVED'].includes(o.status)).length;
  }, [orders]);

  const awaitingApprovalCount = useMemo(() => {
    return orders.filter((o) => o.status === 'DRAFT').length;
  }, [orders]);

  const partiallyReceivedCount = useMemo(() => {
    return orders.filter((o) => o.status === 'PARTIALLY_RECEIVED').length;
  }, [orders]);

  const overdueDeliveriesCount = useMemo(() => {
    return orders.filter((o) => {
      if (!o.expected_date) return false;
      const isOpen = ['DRAFT', 'APPROVED', 'PARTIALLY_RECEIVED'].includes(o.status);
      return isOpen && o.expected_date < todayIso;
    }).length;
  }, [orders, todayIso]);

  // Card click handler: applies corresponding filter or toggles off
  const handleCardClick = (cardType: CardFilterType) => {
    if (activeCardFilter === cardType) {
      setActiveCardFilter('ALL');
      setStatusFilter('ALL');
    } else {
      setActiveCardFilter(cardType);
      if (cardType === 'AWAITING') setStatusFilter('DRAFT');
      else if (cardType === 'PARTIAL') setStatusFilter('PARTIALLY_RECEIVED');
      else setStatusFilter('ALL');
    }
  };

  // Filter orders according to all active criteria
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Search matching PO number or supplier name
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const numMatch = o.po_number.toLowerCase().includes(query);
        const supMatch = (o.supplier_name || '').toLowerCase().includes(query);
        if (!numMatch && !supMatch) return false;
      }

      // Status pill filter
      if (statusFilter !== 'ALL' && o.status !== statusFilter) {
        return false;
      }

      // Supplier filter
      if (supplierFilter !== 'ALL' && String(o.supplier_id) !== supplierFilter) {
        return false;
      }

      // Card-specific filters
      if (activeCardFilter === 'OPEN') {
        if (!['DRAFT', 'APPROVED', 'PARTIALLY_RECEIVED'].includes(o.status)) return false;
      } else if (activeCardFilter === 'AWAITING') {
        if (o.status !== 'DRAFT') return false;
      } else if (activeCardFilter === 'PARTIAL') {
        if (o.status !== 'PARTIALLY_RECEIVED') return false;
      } else if (activeCardFilter === 'OVERDUE') {
        const isOpen = ['DRAFT', 'APPROVED', 'PARTIALLY_RECEIVED'].includes(o.status);
        if (!isOpen || !o.expected_date || o.expected_date >= todayIso) return false;
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter, supplierFilter, activeCardFilter, todayIso]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setSupplierFilter('ALL');
    setActiveCardFilter('ALL');
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'ALL' || supplierFilter !== 'ALL' || activeCardFilter !== 'ALL';

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['PO Number', 'Supplier', 'Status', 'Lines Count', 'Total Amount USD', 'Order Date', 'Expected Date'];
    const rows = filteredOrders.map((o) => [
      `"${o.po_number}"`,
      `"${o.supplier_name || `Supplier #${o.supplier_id}`}"`,
      `"${o.status}"`,
      o.lines.length,
      (o.total_amount_minor / 100).toFixed(2),
      `"${o.order_date || o.created_at || ''}"`,
      `"${o.expected_date || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stocksense-purchase-orders-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    const label = translatePOStatus(status, locale);
    switch (status) {
      case 'DRAFT':
        return <span className="po-badge po-badge-draft">{label}</span>;
      case 'APPROVED':
        return <span className="po-badge po-badge-approved">{label}</span>;
      case 'PARTIALLY_RECEIVED':
        return <span className="po-badge po-badge-partial">{label}</span>;
      case 'RECEIVED':
        return <span className="po-badge po-badge-received">{label}</span>;
      case 'CANCELLED':
        return <span className="po-badge po-badge-cancelled">{label}</span>;
      default:
        return <span className="po-badge">{label}</span>;
    }
  };

  // If in CREATE view mode, render Dedicated Window A
  if (viewMode === 'CREATE') {
    return (
      <POCreateView
        suppliers={suppliers}
        items={items}
        locations={locations}
        onBack={() => setViewMode('LIST')}
        onSubmit={async (payload) => {
          const newPo = await onCreatePO(payload);
          if (newPo && newPo.id) {
            setSelectedPoId(newPo.id);
            setViewMode('DETAIL');
          } else {
            setViewMode('LIST');
          }
        }}
      />
    );
  }

  // If in DETAIL view mode, render Dedicated Window B
  if (viewMode === 'DETAIL' && selectedPoId !== null) {
    const activePO = orders.find((o) => o.id === selectedPoId);
    if (activePO) {
      return (
        <>
          <PODetailView
            po={activePO}
            locations={locations}
            suppliers={suppliers}
            items={items}
            onBack={() => {
              setSelectedPoId(null);
              setViewMode('LIST');
            }}
            onOpenApproveModal={() => setApprovingPO(activePO)}
            onOpenReceiveModal={() => setReceivingPO(activePO)}
            onOpenCancelModal={() => setCancellingPO(activePO)}
          />

          {approvingPO && (
            <POApprovalModal
              po={approvingPO}
              onClose={() => setApprovingPO(null)}
              onConfirm={async (id) => {
                await onApprove(id);
              }}
            />
          )}

          {receivingPO && (
            <POReceiveModal
              po={receivingPO}
              locations={locations}
              onClose={() => setReceivingPO(null)}
              onSubmit={async (id, payload) => {
                await onReceive(id, payload);
              }}
            />
          )}

          {cancellingPO && (
            <POCancelModal
              po={cancellingPO}
              onClose={() => setCancellingPO(null)}
              onConfirm={async (id) => {
                await onCancel(id);
              }}
            />
          )}
        </>
      );
    }
  }

  // Otherwise render Main Purchase Orders List Page
  return (
    <div className="procurement-container">
      {/* Page Heading */}
      <div className="procurement-header">
        <div className="procurement-header-title-box">
          <h1>{t('procurement.title')}</h1>
          <p>{t('procurement.subtitle')}</p>
        </div>

        <div className="procurement-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCSV}
            title={locale === 'ar' ? 'تصدير أوامر الشراء كملف CSV' : 'Export filtered purchase orders as CSV'}
          >
            <Download style={{ width: 14, height: 14 }} />
            <span>{t('procurement.export_csv')}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setViewMode('CREATE')}
          >
            <Plus style={{ width: 14, height: 14 }} />
            <span>{t('procurement.create_po')}</span>
          </button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="po-summary-grid">
        <div
          className={`po-summary-card ${activeCardFilter === 'OPEN' ? 'active' : ''}`}
          onClick={() => handleCardClick('OPEN')}
          title={locale === 'ar' ? 'تصفية أوامر الشراء المفتوحة' : 'Click to filter by open purchase orders'}
        >
          <div className="po-summary-card-header">
            <span className="po-summary-card-title">{t('procurement.open_orders')}</span>
            <ShoppingBag className="po-summary-card-icon" />
          </div>
          <div className="po-summary-card-value">{openOrdersCount}</div>
          <div className="po-summary-card-sub">{t('procurement.open_orders_sub')}</div>
        </div>

        <div
          className={`po-summary-card card-amber ${activeCardFilter === 'AWAITING' ? 'active' : ''}`}
          onClick={() => handleCardClick('AWAITING')}
          title={locale === 'ar' ? 'تصفية الأوامر بانتظار الاعتماد' : 'Click to filter by draft orders awaiting approval'}
        >
          <div className="po-summary-card-header">
            <span className="po-summary-card-title">{t('procurement.awaiting_approval')}</span>
            <Clock className="po-summary-card-icon" style={{ color: '#fbbf24' }} />
          </div>
          <div className="po-summary-card-value" style={{ color: '#fbbf24' }}>{awaitingApprovalCount}</div>
          <div className="po-summary-card-sub">{t('procurement.awaiting_approval_sub')}</div>
        </div>

        <div
          className={`po-summary-card ${activeCardFilter === 'PARTIAL' ? 'active' : ''}`}
          onClick={() => handleCardClick('PARTIAL')}
          title={locale === 'ar' ? 'تصفية الأوامر المستلمة جزئياً' : 'Click to filter by partially delivered purchase orders'}
        >
          <div className="po-summary-card-header">
            <span className="po-summary-card-title">{t('procurement.partially_received')}</span>
            <Truck className="po-summary-card-icon" style={{ color: '#60a5fa' }} />
          </div>
          <div className="po-summary-card-value">{partiallyReceivedCount}</div>
          <div className="po-summary-card-sub">{t('procurement.partially_received_sub')}</div>
        </div>

        <div
          className={`po-summary-card card-red ${activeCardFilter === 'OVERDUE' ? 'active' : ''}`}
          onClick={() => handleCardClick('OVERDUE')}
          title={locale === 'ar' ? 'تصفية الأوامر المتأخرة عن موعدها' : 'Click to filter by overdue open orders'}
        >
          <div className="po-summary-card-header">
            <span className="po-summary-card-title">{t('procurement.overdue_deliveries')}</span>
            <AlertTriangle className="po-summary-card-icon" style={{ color: '#f87171' }} />
          </div>
          <div className="po-summary-card-value" style={{ color: overdueDeliveriesCount > 0 ? '#f87171' : '#ffffff' }}>
            {overdueDeliveriesCount}
          </div>
          <div className="po-summary-card-sub">{t('procurement.overdue_sub')}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="po-filter-bar">
        <div className="po-search-box">
          <Search style={{ width: 14, height: 14, position: 'absolute', left: locale === 'ar' ? undefined : '0.65rem', right: locale === 'ar' ? '0.65rem' : undefined, color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="po-search-input"
            placeholder={t('procurement.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: locale === 'ar' ? undefined : '0.5rem', left: locale === 'ar' ? '0.5rem' : undefined, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X style={{ width: 13, height: 13 }} />
            </button>
          )}
        </div>

        <div className="po-filter-group">
          {/* Status Pills */}
          <div className="po-status-pills">
            {['ALL', 'DRAFT', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'].map((st) => {
              const label = st === 'ALL'
                ? (locale === 'ar' ? 'الكل' : 'All')
                : translatePOStatus(st, locale);
              return (
                <button
                  key={st}
                  type="button"
                  className={`po-status-pill-btn ${statusFilter === st ? 'active' : ''}`}
                  onClick={() => {
                    setStatusFilter(st);
                    setActiveCardFilter('ALL');
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Supplier Dropdown */}
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
          >
            <option value="ALL">
              {locale === 'ar' ? `جميع الموردين (${suppliers.length})` : `All Suppliers (${suppliers.length})`}
            </option>
            {suppliers.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={clearFilters}
              style={{ fontSize: '0.74rem', padding: '0.3rem 0.6rem' }}
              title={locale === 'ar' ? 'إعادة ضبط عوامل التصفية' : 'Reset all active filters'}
            >
              <X style={{ width: 12, height: 12 }} />
              <span>{t('procurement.btn_clear')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Purchase-Order Table */}
      <div className="po-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('procurement.col_po_number')}</th>
              <th>{t('procurement.col_supplier')}</th>
              <th>{t('procurement.col_created')}</th>
              <th>{t('procurement.col_expected')}</th>
              <th style={{ textAlign: 'right' }}>{t('procurement.col_items')}</th>
              <th style={{ textAlign: 'right' }}>{t('procurement.col_total')}</th>
              <th>{t('procurement.col_destination')}</th>
              <th>{t('procurement.col_source')}</th>
              <th>{t('procurement.col_status')}</th>
              <th style={{ textAlign: 'right' }}>{t('procurement.col_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading && orders.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  {t('procurement.loading_msg')}
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  {t('procurement.empty_msg')}
                </td>
              </tr>
            ) : (
              filteredOrders.map((po) => {
                const totalValue = (po.total_amount_minor / 100).toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                });
                const firstLine = po.lines[0];
                const destLoc = locations.find((l) => l.id === firstLine?.destination_location_id);
                const isOverdue = po.expected_date && ['DRAFT', 'APPROVED', 'PARTIALLY_RECEIVED'].includes(po.status) && po.expected_date < todayIso;

                return (
                  <tr
                    key={po.id}
                    className="po-clickable-row"
                    onClick={() => {
                      setSelectedPoId(po.id);
                      setViewMode('DETAIL');
                    }}
                  >
                    <td>
                      <span className="sku-cell" style={{ fontWeight: 600 }}>
                        {po.po_number}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, color: '#f4f4f5' }}>
                        {po.supplier_name || `Supplier #${po.supplier_id}`}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {po.order_date ? new Date(po.order_date).toLocaleDateString() : (po.created_at ? new Date(po.created_at).toLocaleDateString() : '—')}
                    </td>
                    <td style={{ fontSize: '0.78rem' }}>
                      {po.expected_date ? (
                        <span style={{ color: isOverdue ? '#f87171' : 'var(--text-secondary)', fontWeight: isOverdue ? 600 : 400 }}>
                          {new Date(po.expected_date).toLocaleDateString()} {isOverdue ? '⚠️' : ''}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>
                      {po.lines.length} {locale === 'ar' ? 'بنود' : (po.lines.length === 1 ? 'line' : 'lines')}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ffffff' }}>
                      {totalValue}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {destLoc?.code || firstLine?.location_code || 'WH-01'}
                      </span>
                    </td>
                    <td>
                      {po.source_recommendation_id ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.7rem', color: '#38bdf8' }}>
                          <Sparkles style={{ width: 11, height: 11 }} /> {locale === 'ar' ? 'توصية ذكية' : 'AI Rec'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'يدوي' : 'Manual'}</span>
                      )}
                    </td>
                    <td>{getStatusBadge(po.status)}</td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        {po.status === 'DRAFT' && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                            onClick={() => setApprovingPO(po)}
                          >
                            <CheckCircle style={{ width: 12, height: 12 }} /> {t('procurement.btn_approve')}
                          </button>
                        )}
                        {(po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED') && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', background: '#10b981', borderColor: '#10b981' }}
                            onClick={() => setReceivingPO(po)}
                          >
                            <PackageCheck style={{ width: 12, height: 12 }} /> {t('procurement.btn_receive')}
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                          title={locale === 'ar' ? 'طباعة مستند أمر الشراء الرسمي' : 'Print Official PO Docket'}
                          onClick={() => setPrintingPO(po)}
                        >
                          <Printer style={{ width: 12, height: 12, color: '#38bdf8' }} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                          onClick={() => {
                            setSelectedPoId(po.id);
                            setViewMode('DETAIL');
                          }}
                        >
                          {t('procurement.btn_view')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Main Page Modals */}
      {approvingPO && (
        <POApprovalModal
          po={approvingPO}
          onClose={() => setApprovingPO(null)}
          onConfirm={async (id) => {
            await onApprove(id);
          }}
        />
      )}

      {receivingPO && (
        <POReceiveModal
          po={receivingPO}
          locations={locations}
          onClose={() => setReceivingPO(null)}
          onSubmit={async (id, payload) => {
            await onReceive(id, payload);
          }}
        />
      )}

      {cancellingPO && (
        <POCancelModal
          po={cancellingPO}
          onClose={() => setCancellingPO(null)}
          onConfirm={async (id) => {
            await onCancel(id);
          }}
        />
      )}

      {printingPO && (
        <POPrintModal
          po={printingPO}
          supplier={suppliers.find((s) => s.id === printingPO.supplier_id)}
          items={items}
          locations={locations}
          onClose={() => setPrintingPO(null)}
        />
      )}
    </div>
  );
};
