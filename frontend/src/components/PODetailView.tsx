import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, PackageCheck, Ban, Sparkles, Paperclip, Download, FileText, Image as ImageIcon, Printer } from 'lucide-react';
import { PurchaseOrder, InventoryLocation, DocumentAttachment, Supplier, InventoryItem } from '../types';
import { api } from '../api/client';
import { POPrintModal } from './POPrintModal';
import { useI18n } from '../i18n/I18nContext';
import { translateWarehouse, translatePOStatus } from '../i18n/translations';

interface PODetailViewProps {
  po: PurchaseOrder;
  locations?: InventoryLocation[];
  suppliers?: Supplier[];
  items?: InventoryItem[];
  onBack: () => void;
  onOpenApproveModal: () => void;
  onOpenReceiveModal: () => void;
  onOpenCancelModal: () => void;
}

export const PODetailView: React.FC<PODetailViewProps> = ({
  po,
  locations = [],
  suppliers = [],
  items = [],
  onBack,
  onOpenApproveModal,
  onOpenReceiveModal,
  onOpenCancelModal,
}) => {
  const { locale } = useI18n();
  const [attachments, setAttachments] = useState<DocumentAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoadingAttachments(true);
    api.getAttachments('PURCHASE_ORDER', po.id)
      .then((data) => {
        if (isMounted) setAttachments(data);
      })
      .catch(() => {
        if (isMounted) setAttachments([]);
      })
      .finally(() => {
        if (isMounted) setLoadingAttachments(false);
      });
    return () => {
      isMounted = false;
    };
  }, [po.id]);

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

  const totalOrdered = po.lines.reduce((acc, l) => acc + l.qty_ordered, 0);
  const totalReceived = po.lines.reduce((acc, l) => acc + l.qty_received, 0);
  const totalRemaining = Math.max(0, totalOrdered - totalReceived);
  const overallFulfillmentPct = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

  const firstDestId = po.lines[0]?.destination_location_id;
  const destinationLoc = locations.find((l) => l.id === firstDestId);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return locale === 'ar'
      ? d.toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' })
      : d.toLocaleDateString();
  };

  return (
    <div className="po-detail-view">
      {/* Breadcrumb Navigation */}
      <button type="button" className="po-view-breadcrumb" onClick={onBack}>
        <ArrowLeft style={{ width: 14, height: 14 }} />
        <span>{locale === 'ar' ? 'العودة إلى أوامر الشراء' : 'Back to Purchase Orders'}</span>
      </button>

      {/* Hero Header Card */}
      <div className="po-detail-hero">
        <div className="po-detail-hero-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-mono)' }}>
                {po.po_number}
              </h1>
              {getStatusBadge(po.status)}
              {po.source_recommendation_id && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-default)', borderRadius: '4px', fontSize: '0.7rem', color: '#ffffff' }}>
                  <Sparkles style={{ width: 11, height: 11, color: '#38bdf8' }} />
                  {locale === 'ar' ? `توصية الذكاء الاصطناعي #${po.source_recommendation_id}` : `AI Recommendation #${po.source_recommendation_id}`}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              {locale === 'ar' ? 'المورّد:' : 'Supplier:'} <strong style={{ color: '#ffffff' }}>{po.supplier_name || (locale === 'ar' ? `مورّد #${po.supplier_id}` : `Supplier #${po.supplier_id}`)}</strong> • {locale === 'ar' ? 'تم الإنشاء:' : 'Created:'} {formatDate(po.created_at)}
            </p>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowPrintModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--border-default)' }}
              title={locale === 'ar' ? 'طباعة أو تصدير أمر شراء رسمي بصيغة PDF مع الرموز الشريطية' : 'Print or export official A4 Purchase Order PDF with barcodes and signature blocks'}
            >
              <Printer style={{ width: 14, height: 14, color: '#38bdf8' }} />
              <span>{locale === 'ar' ? 'طباعة أمر الشراء الرسمي' : 'Print Official PO'}</span>
            </button>

            {po.status === 'DRAFT' && (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onOpenApproveModal}
                >
                  <CheckCircle style={{ width: 14, height: 14 }} />
                  <span>{locale === 'ar' ? 'اعتماد أمر الشراء' : 'Approve Purchase Order'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ color: '#f87171' }}
                  onClick={onOpenCancelModal}
                >
                  <Ban style={{ width: 14, height: 14 }} />
                  <span>{locale === 'ar' ? 'إلغاء أمر الشراء' : 'Cancel PO'}</span>
                </button>
              </>
            )}

            {(po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED') && (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: '#10b981', borderColor: '#10b981' }}
                  onClick={onOpenReceiveModal}
                >
                  <PackageCheck style={{ width: 14, height: 14 }} />
                  <span>{locale === 'ar' ? 'استلام البضائع' : 'Receive Goods'}</span>
                </button>
                {po.lines.every((l) => l.qty_received === 0) && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ color: '#f87171' }}
                    onClick={onOpenCancelModal}
                  >
                    <Ban style={{ width: 14, height: 14 }} />
                    <span>{locale === 'ar' ? 'إلغاء أمر الشراء' : 'Cancel PO'}</span>
                  </button>
                )}
              </>
            )}

            {(po.status === 'RECEIVED' || po.status === 'CANCELLED') && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0.35rem 0.75rem', background: '#141416', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                {locale === 'ar'
                  ? `الطلب ${translatePOStatus(po.status, locale)} • سجل للقراءة فقط`
                  : `Order ${po.status.toLowerCase()} • Read-Only Record`}
              </div>
            )}
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="po-detail-meta-grid">
          <div className="po-meta-block">
            <span className="po-meta-label">{locale === 'ar' ? 'مستودع الوجهة' : 'Destination Warehouse'}</span>
            <span className="po-meta-value">
              {translateWarehouse(destinationLoc?.name || po.lines[0]?.location_code || 'Central Yard', locale)}
            </span>
          </div>

          <div className="po-meta-block">
            <span className="po-meta-label">{locale === 'ar' ? 'تاريخ التسليم المتوقع' : 'Expected Delivery'}</span>
            <span className="po-meta-value">
              {po.expected_date ? formatDate(po.expected_date) : (locale === 'ar' ? 'غير محدد' : 'Not Specified')}
            </span>
          </div>

          <div className="po-meta-block">
            <span className="po-meta-label">{locale === 'ar' ? 'إجمالي القيمة الملتزم بها' : 'Total Committed Value'}</span>
            <span className="po-meta-value" style={{ fontFamily: 'var(--font-mono)', color: '#34d399' }}>
              ${(po.total_amount_minor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="po-meta-block">
            <span className="po-meta-label">{locale === 'ar' ? 'حالة الإنجاز والتنفيذ' : 'Fulfillment Status'}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="po-meta-value">
                {locale === 'ar'
                  ? `${totalReceived} / ${totalOrdered} وحدة (${overallFulfillmentPct}%)`
                  : `${totalReceived} / ${totalOrdered} units (${overallFulfillmentPct}%)`}
              </span>
              <div className="po-fulfillment-track">
                <div
                  className="po-fulfillment-bar"
                  style={{ width: `${overallFulfillmentPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {po.notes && (
          <div style={{ padding: '0.65rem 0.85rem', background: '#121214', border: '1px solid var(--border-subtle)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: '#ffffff' }}>{locale === 'ar' ? 'الملاحظات:' : 'Notes:'}</strong> {po.notes}
          </div>
        )}
      </div>

      {/* Line Items Table Card */}
      <div className="po-section-card">
        <div className="po-section-title">
          <span>{locale === 'ar' ? `بنود أمر الشراء (${po.lines.length})` : `Purchase Order Line Items (${po.lines.length})`}</span>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            {totalRemaining > 0
              ? (locale === 'ar' ? `${totalRemaining} وحدة متبقية` : `${totalRemaining} units outstanding`)
              : (locale === 'ar' ? 'تم استلام جميع البنود بالكامل إلى المخزون' : 'All items fully received into stock')}
          </span>
        </div>

        <div className="table-container" style={{ margin: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{locale === 'ar' ? 'البند / رمز التخزين' : 'Item / SKU'}</th>
                <th>{locale === 'ar' ? 'الوجهة' : 'Destination'}</th>
                <th style={{ textAlign: 'right' }}>{locale === 'ar' ? 'المطلوب' : 'Ordered'}</th>
                <th style={{ textAlign: 'right' }}>{locale === 'ar' ? 'المستلم' : 'Received'}</th>
                <th style={{ textAlign: 'right' }}>{locale === 'ar' ? 'المتبقي' : 'Remaining'}</th>
                <th style={{ textAlign: 'right' }}>{locale === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</th>
                <th style={{ textAlign: 'right' }}>{locale === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</th>
                <th>{locale === 'ar' ? 'نسبة الاستلام' : 'Fulfillment Progress'}</th>
              </tr>
            </thead>
            <tbody>
              {po.lines.map((line) => {
                const remaining = Math.max(0, line.qty_ordered - line.qty_received);
                const linePct = Math.round((line.qty_received / line.qty_ordered) * 100);
                const subtotal = (line.qty_ordered * line.unit_price_minor) / 100;

                return (
                  <tr key={line.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="sku-cell">{line.item_sku || (locale === 'ar' ? `بند #${line.item_id}` : `Item #${line.item_id}`)}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          {line.item_name || (locale === 'ar' ? 'قطعة غيار' : 'Spare Part')}
                        </span>
                      </div>
                    </td>
                    <td>{translateWarehouse(line.location_code || 'Central', locale)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#ffffff' }}>
                      {line.qty_ordered}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: line.qty_received > 0 ? '#34d399' : 'var(--text-muted)' }}>
                      {line.qty_received}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: remaining > 0 ? '#fbbf24' : 'var(--text-muted)' }}>
                      {remaining}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      ${(line.unit_price_minor / 100).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ffffff' }}>
                      ${subtotal.toFixed(2)}
                    </td>
                    <td style={{ minWidth: 140 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="po-fulfillment-track" style={{ flex: 1, margin: 0 }}>
                          <div
                            className="po-fulfillment-bar"
                            style={{
                              width: `${linePct}%`,
                              backgroundColor: linePct >= 100 ? '#10b981' : '#f59e0b',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: 32, textAlign: 'right' }}>
                          {linePct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supporting Documents & Vendor Delivery Slips */}
      <div className="po-section-card">
        <div className="po-section-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Paperclip style={{ width: 14, height: 14, color: 'var(--text-secondary)' }} />
            <span>{locale === 'ar' ? 'وثائق المورّد وإيصالات التسليم' : 'Vendor Documentation & Delivery Slips'}</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {locale === 'ar'
              ? `${attachments.length} وثيقة مرفقة`
              : `${attachments.length} attached document${attachments.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {loadingAttachments ? (
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
            {locale === 'ar' ? 'جاري فحص مستودع وثائق التسليم...' : 'Scanning delivery attachments repository...'}
          </div>
        ) : attachments.length > 0 ? (
          <div className="attachment-list">
            {attachments.map((att) => {
              const isPdf = att.file_type.includes('pdf') || att.filename.endsWith('.pdf');
              return (
                <div key={att.id} className="attachment-card">
                  <div className="attachment-card-info">
                    <div className={`attachment-icon-box ${isPdf ? 'pdf' : 'image'}`}>
                      {isPdf ? <FileText style={{ width: 14, height: 14 }} /> : <ImageIcon style={{ width: 14, height: 14 }} />}
                    </div>
                    <div className="attachment-meta">
                      <span className="attachment-filename" title={att.filename}>
                        {att.filename}
                      </span>
                      <span className="attachment-subtext">
                        <span>{(att.file_size_bytes / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>{att.description || (locale === 'ar' ? 'إيصال استلام المورّد' : 'Vendor Packing Slip')}</span>
                        <span>•</span>
                        <span>{locale === 'ar' ? `تم الرفع بواسطة ${att.uploaded_by_name || 'أمين المستودع'}` : `Uploaded by ${att.uploaded_by_name || 'Storekeeper'}`}</span>
                      </span>
                    </div>
                  </div>
                  <div className="attachment-actions">
                    <a
                      href={att.download_url || `/api/v1/attachments/${att.id}/file`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="attachment-action-btn"
                      title={locale === 'ar' ? 'فتح أو تنزيل الوثيقة' : 'Open or download document'}
                    >
                      <Download style={{ width: 12, height: 12 }} />
                      <span>{locale === 'ar' ? 'عرض' : 'View'}</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
            {locale === 'ar'
              ? 'لا توجد وثائق تسليم مرفقة حتى الآن. يمكنك إرفاق إيصالات التسليم عبر نافذة استلام البضائع.'
              : 'No vendor delivery documents attached yet. Attach delivery slips using the Receive Goods modal.'}
          </div>
        )}
      </div>

      {showPrintModal && (
        <POPrintModal
          po={po}
          supplier={suppliers.find((s) => s.id === po.supplier_id)}
          items={items}
          locations={locations}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};

