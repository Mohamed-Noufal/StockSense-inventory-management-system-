import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Check, AlertCircle, ArrowRight, Printer } from 'lucide-react';
import { InventoryItem, InventoryLocation, Supplier, Category, ItemCreatePayload } from '../types';
import { api } from '../api/client';
import { soundEffects } from '../utils/audio';
import { useI18n } from '../i18n/I18nContext';
import { translateCategory, translateWarehouse } from '../i18n/translations';

interface NewItemModalProps {
  initialSku?: string;
  locations: InventoryLocation[];
  suppliers: Supplier[];
  onClose: () => void;
  onSuccess: (newItem: InventoryItem) => void;
  onPrintLabel?: (item: InventoryItem) => void;
}

export const NewItemModal: React.FC<NewItemModalProps> = ({
  initialSku = '',
  locations,
  suppliers,
  onClose,
  onSuccess,
  onPrintLabel,
}) => {
  const [sku, setSku] = useState<string>(initialSku.trim().toUpperCase());
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uom, setUom] = useState<string>('EA');
  const [unitCost, setUnitCost] = useState<string>('250.00');
  const [criticality, setCriticality] = useState<'CRITICAL' | 'STANDARD' | 'LOW'>('STANDARD');
  const [locationId, setLocationId] = useState<number>(locations[0]?.id || 1);
  const [initialStock, setInitialStock] = useState<number>(0);
  const [supplierId, setSupplierId] = useState<number | ''>(suppliers[0]?.id || '');
  const [supplierSku, setSupplierSku] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [createdItem, setCreatedItem] = useState<InventoryItem | null>(null);

  const { t, locale } = useI18n();

  // Fetch categories
  useEffect(() => {
    api.getCategories()
      .then((cats) => {
        if (cats && cats.length > 0) {
          setCategories(cats);
          setCategoryId(cats[0].id);
        }
      })
      .catch(() => {
        // Fallback default categories
        setCategories([
          { id: 1, name: 'Mechanical Parts' },
          { id: 2, name: 'Pipes & Tubes' },
          { id: 3, name: 'Valves & Fittings' },
          { id: 4, name: 'Chemicals' },
          { id: 5, name: 'Tools & Equipment' },
        ]);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanSku = sku.trim().toUpperCase();
    if (!cleanSku) {
      setError('SKU is required.');
      return;
    }
    if (!name.trim()) {
      setError('Part name is required.');
      return;
    }

    const costNum = parseFloat(unitCost);
    if (isNaN(costNum) || costNum < 0) {
      setError('Valid unit cost is required.');
      return;
    }

    setLoading(true);
    try {
      const payload: ItemCreatePayload = {
        sku: cleanSku,
        name: name.trim(),
        description: description.trim() || undefined,
        category_id: Number(categoryId),
        uom: uom.trim() || 'EA',
        unit_cost_minor: Math.round(costNum * 100),
        criticality,
        initial_location_id: Number(locationId),
        initial_stock: Number(initialStock) || 0,
        supplier_id: supplierId ? Number(supplierId) : undefined,
        supplier_sku: supplierSku.trim() || undefined,
      };

      const newItem = await api.createItem(payload);
      soundEffects.playScanSuccess();
      setCreatedItem(newItem);
      onSuccess(newItem);
    } catch (err: any) {
      setError(err.message || 'Failed to register catalog item.');
      soundEffects.playScanError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="label-modal-backdrop" onClick={onClose}>
      <div className="label-modal-container" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="label-modal-header">
          <div className="label-modal-title">
            <PackagePlus size={18} color="#38bdf8" />
            <span>{t('new_item.title')}</span>
          </div>
          <button className="btn-icon" onClick={onClose} title={t('common.close')}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        {createdItem ? (
          /* Success Step */
          <div className="label-modal-body" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <Check size={28} />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem' }}>
              {locale === 'ar' ? 'تم تسجيل الصنف بنجاح' : 'Item Successfully Registered'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#a1a1aa', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
              <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>{createdItem.sku}</strong> — {createdItem.name} {locale === 'ar' ? 'تمت إضافته إلى دليل المخزون وسجل القيد المزدوج.' : 'has been added to the master inventory catalog and double-entry ledger.'}
            </p>

            <div
              style={{
                background: '#121216',
                border: '1px solid #27272a',
                borderRadius: '8px',
                padding: '1rem',
                textAlign: locale === 'ar' ? 'right' : 'left',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.65rem', color: '#71717a', textTransform: 'uppercase' }}>
                  {locale === 'ar' ? 'الرصيد الافتتاحي' : 'Initial Stock'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981' }}>{createdItem.total_on_hand} {createdItem.uom}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#71717a', textTransform: 'uppercase' }}>
                  {locale === 'ar' ? 'سعر الوحدة' : 'Unit Valuation'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>${(createdItem.unit_cost_minor / 100).toFixed(2)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#71717a', textTransform: 'uppercase' }}>
                  {locale === 'ar' ? 'مستودع التخزين' : 'Storage Bay'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8' }}>
                  {translateWarehouse(createdItem.warehouse_name || 'Main Warehouse', locale)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              {onPrintLabel && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    onClose();
                    onPrintLabel(createdItem);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer size={15} />
                  <span>{locale === 'ar' ? 'طباعة ملصق الرف 4"×2"' : 'Print 4"×2" Shelf Label'}</span>
                </button>
              )}
              <button className="btn btn-secondary" onClick={onClose}>
                {locale === 'ar' ? 'تم والإغلاق' : 'Done & Close'}
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleSubmit}>
            <div className="label-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {error && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* SKU & Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '4px' }}>
                    {t('new_item.sku')} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SLV-VLV-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      background: '#121216',
                      border: '1px solid #333338',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      color: '#ffffff',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '4px' }}>
                    {t('new_item.name')} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mud Pump Choke Valve Assembly 2-1/16in"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#121216',
                      border: '1px solid #333338',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      color: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '4px' }}>
                  {locale === 'ar' ? 'الوصف الفني / المواصفات الهندسية' : 'Engineering Description / Spec'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10,000 PSI Working Pressure, API-6A Flanged, Grade 4140"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#121216',
                    border: '1px solid #333338',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Category & UOM */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '4px' }}>
                    {t('new_item.category')}
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: '#121216',
                      border: '1px solid #333338',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      color: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {translateCategory(c.name, locale)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '4px' }}>
                    {t('new_item.uom')}
                  </label>
                  <select
                    value={uom}
                    onChange={(e) => setUom(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#121216',
                      border: '1px solid #333338',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      color: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="EA">{locale === 'ar' ? 'EA (قطعة فردية)' : 'EA (Each)'}</option>
                    <option value="SET">{locale === 'ar' ? 'SET (طقم تجميعي)' : 'SET (Assembly)'}</option>
                    <option value="MTR">{locale === 'ar' ? 'MTR (أمتار)' : 'MTR (Meters)'}</option>
                    <option value="DRUM">{locale === 'ar' ? 'DRUM (برميل 55 جالون)' : 'DRUM (55 Gal)'}</option>
                    <option value="KG">{locale === 'ar' ? 'KG (كيلوجرام)' : 'KG (Kilograms)'}</option>
                  </select>
                </div>
              </div>

              {/* Unit Cost & Criticality */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '4px' }}>
                    {t('new_item.unit_cost')} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#121216',
                      border: '1px solid #333338',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      color: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '4px' }}>
                    {t('new_item.criticality')}
                  </label>
                  <select
                    value={criticality}
                    onChange={(e) => setCriticality(e.target.value as any)}
                    style={{
                      width: '100%',
                      background: '#121216',
                      border: '1px solid #333338',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      color: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="CRITICAL">{locale === 'ar' ? 'حرجة (حفر / صمامات تفريغ)' : 'CRITICAL (Drilling / BOP Spare)'}</option>
                    <option value="STANDARD">{locale === 'ar' ? 'قياسية (صيانة دورية)' : 'STANDARD (Routine Maintenance)'}</option>
                    <option value="LOW">{locale === 'ar' ? 'منخفضة (مستهلكات عامة)' : 'LOW (General Consumables)'}</option>
                  </select>
                </div>
              </div>

              {/* Storage Location & Initial Count */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '4px' }}>
                    {t('new_item.initial_loc')}
                  </label>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: '#121216',
                      border: '1px solid #333338',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      color: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {translateWarehouse(l.name, locale)} ({l.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '4px' }}>
                    {t('new_item.initial_stock')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={initialStock}
                    onChange={(e) => setInitialStock(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{
                      width: '100%',
                      background: '#121216',
                      border: '1px solid #333338',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      color: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Primary Supplier & Vendor Part # Alias */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '0.75rem', background: '#121216', borderRadius: '6px', border: '1px dashed #27272a' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '4px' }}>
                    {t('new_item.supplier')}
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}
                    style={{
                      width: '100%',
                      background: '#18181b',
                      border: '1px solid #333338',
                      borderRadius: '6px',
                      padding: '0.45rem 0.6rem',
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="">{locale === 'ar' ? 'بدون / تصنيع مباشر' : 'None / Direct Fabrication'}</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '4px' }}>
                    {t('new_item.vendor_sku')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CAM-7140-B"
                    value={supplierSku}
                    onChange={(e) => setSupplierSku(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#18181b',
                      border: '1px solid #333338',
                      borderRadius: '6px',
                      padding: '0.45rem 0.6rem',
                      color: '#ffffff',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="label-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>{loading ? t('new_item.saving_btn') : (locale === 'ar' ? 'تسجيل الصنف واعتماده' : 'Register SKU & Initialize')}</span>
                <ArrowRight size={14} style={{ transform: locale === 'ar' ? 'rotate(180deg)' : 'none' }} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
