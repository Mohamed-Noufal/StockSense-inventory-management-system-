import React, { useState, useEffect } from 'react';
import {
  X, Building2, MapPin, RotateCcw, Plus,
  CheckCircle2, AlertTriangle, Loader2, Sparkles
} from 'lucide-react';
import { WorkspaceInfo, InventoryLocation, LocationCreatePayload } from '../types';
import { api } from '../api/client';
import { useI18n } from '../i18n/I18nContext';

interface WorkspaceModalProps {
  onClose: () => void;
  onWorkspaceUpdated: () => void;
  locations: InventoryLocation[];
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  onClose,
  onWorkspaceUpdated,
  locations,
}) => {
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState<'setup' | 'locations' | 'data'>('setup');
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo | null>(null);

  // Setup Clean Form State
  const [companyName, setCompanyName] = useState<string>('');
  const [warehouseName, setWarehouseName] = useState<string>('');
  const [warehouseCode, setWarehouseCode] = useState<string>('WH-01');
  const [showConfirmClean, setShowConfirmClean] = useState<boolean>(false);
  const [submittingClean, setSubmittingClean] = useState<boolean>(false);

  // Add Location Form State
  const [locCode, setLocCode] = useState<string>('');
  const [locName, setLocName] = useState<string>('');
  const [locType, setLocType] = useState<'WAREHOUSE' | 'YARD' | 'RIG_SITE'>('WAREHOUSE');
  const [isDefaultReplenishment, setIsDefaultReplenishment] = useState<boolean>(false);
  const [submittingLoc, setSubmittingLoc] = useState<boolean>(false);

  // Restore Demo State
  const [submittingRestore, setSubmittingRestore] = useState<boolean>(false);
  const [showConfirmRestore, setShowConfirmRestore] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchWorkspace = async () => {
    try {
      const info = await api.getWorkspaceInfo();
      setWorkspaceInfo(info);
      if (!companyName) setCompanyName(info.company_name);
    } catch (err: any) {
      console.error('Failed to load workspace info', err);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, []);

  const handleInitClean = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !warehouseName.trim() || !warehouseCode.trim()) {
      setError(locale === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please complete all required fields');
      return;
    }
    setError(null);
    setSubmittingClean(true);
    try {
      const res = await api.initCleanWorkspace({
        company_name: companyName.trim(),
        warehouse_name: warehouseName.trim(),
        warehouse_code: warehouseCode.trim().toUpperCase(),
      });
      setWorkspaceInfo(res);
      setSuccess(t('workspace.success_clean'));
      setShowConfirmClean(false);
      onWorkspaceUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize clean company workspace');
    } finally {
      setSubmittingClean(false);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locCode.trim() || !locName.trim()) {
      setError(locale === 'ar' ? 'رمز واسم الموقع مطلوبان' : 'Location code and name are required');
      return;
    }
    setError(null);
    setSubmittingLoc(true);
    try {
      const payload: LocationCreatePayload = {
        code: locCode.trim().toUpperCase(),
        name: locName.trim(),
        location_type: locType,
        is_default_replenishment: isDefaultReplenishment ? 1 : 0,
      };
      await api.createLocation(payload);
      setLocCode('');
      setLocName('');
      setIsDefaultReplenishment(false);
      setSuccess(t('workspace.success_location'));
      onWorkspaceUpdated();
      fetchWorkspace();
    } catch (err: any) {
      setError(err.message || 'Failed to create storage location');
    } finally {
      setSubmittingLoc(false);
    }
  };

  const handleRestoreDemo = async () => {
    setError(null);
    setSubmittingRestore(true);
    try {
      const res = await api.restoreDemoWorkspace();
      setWorkspaceInfo(res);
      setSuccess(t('workspace.success_demo'));
      setShowConfirmRestore(false);
      onWorkspaceUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to restore demo dataset');
    } finally {
      setSubmittingRestore(false);
    }
  };

  return (
    <div className="label-modal-backdrop" onClick={onClose}>
      <div
        className="label-modal-container"
        style={{ maxWidth: '680px', background: '#0e0e11', border: '1px solid rgba(255, 255, 255, 0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="label-modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div className="label-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <Building2 size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f4f4f5' }}>
                {t('workspace.modal_title')}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#71717a' }}>
                {workspaceInfo?.company_name || 'StockSense'}
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} title={t('common.close')}>
            <X size={16} />
          </button>
        </div>

        {/* Current Workspace Status Banner */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            background: 'rgba(18, 18, 22, 0.9)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.74rem',
                fontWeight: 600,
                color: workspaceInfo?.is_demo_dataset ? '#818cf8' : '#10b981',
                padding: '0.2rem 0.55rem',
                borderRadius: '9999px',
                background: workspaceInfo?.is_demo_dataset ? 'rgba(99, 102, 241, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${workspaceInfo?.is_demo_dataset ? 'rgba(99, 102, 241, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: workspaceInfo?.is_demo_dataset ? '#818cf8' : '#10b981',
                }}
              />
              {workspaceInfo?.is_demo_dataset
                ? t('workspace.demo_mode_badge')
                : t('workspace.custom_mode_badge')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: '#a1a1aa' }}>
            <div>
              <span style={{ color: '#71717a' }}>{t('workspace.items_count')}: </span>
              <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>
                {workspaceInfo?.total_items ?? '...'}
              </strong>
            </div>
            <div>
              <span style={{ color: '#71717a' }}>{t('workspace.locations_count')}: </span>
              <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>
                {workspaceInfo?.total_locations ?? locations.length}
              </strong>
            </div>
          </div>
        </div>

        {/* Tab Switcher (Vercel Style) */}
        <div
          style={{
            display: 'flex',
            padding: '0.5rem 1.25rem',
            gap: '0.35rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            background: '#09090b',
          }}
        >
          <button
            type="button"
            onClick={() => { setActiveTab('setup'); setError(null); setSuccess(null); }}
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: activeTab === 'setup' ? '#27272a' : 'transparent',
              color: activeTab === 'setup' ? '#ffffff' : '#71717a',
              transition: 'all 0.15s ease',
            }}
          >
            <Building2 size={14} />
            <span>{t('workspace.tab_setup')}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('locations'); setError(null); setSuccess(null); }}
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: activeTab === 'locations' ? '#27272a' : 'transparent',
              color: activeTab === 'locations' ? '#ffffff' : '#71717a',
              transition: 'all 0.15s ease',
            }}
          >
            <MapPin size={14} />
            <span>{t('workspace.tab_locations')}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('data'); setError(null); setSuccess(null); }}
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: activeTab === 'data' ? '#27272a' : 'transparent',
              color: activeTab === 'data' ? '#ffffff' : '#71717a',
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCcw size={14} />
            <span>{t('workspace.tab_data')}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="label-modal-body" style={{ padding: '1.25rem' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#fca5a5',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                marginBottom: '1rem',
              }}
            >
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#6ee7b7',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                marginBottom: '1rem',
              }}
            >
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}

          {/* TAB 1: Company Setup (Initialize Blank Workspace) */}
          {activeTab === 'setup' && (
            <div>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '1.15rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Building2 size={16} color="#10b981" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff' }}>
                    {t('workspace.init_clean_btn')}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#a1a1aa', lineHeight: 1.55, margin: 0 }}>
                  {t('workspace.init_clean_desc')}
                </p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setShowConfirmClean(true); }}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">{t('workspace.company_name_label')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={t('workspace.company_name_placeholder')}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">{t('workspace.wh_name_label')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={warehouseName}
                      onChange={(e) => setWarehouseName(e.target.value)}
                      placeholder={t('workspace.wh_name_placeholder')}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('workspace.wh_code_label')}</label>
                    <input
                      type="text"
                      className="form-input font-mono"
                      value={warehouseCode}
                      onChange={(e) => setWarehouseCode(e.target.value.toUpperCase())}
                      placeholder="WH-01"
                      required
                    />
                  </div>
                </div>

                {showConfirmClean ? (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fca5a5', marginBottom: '0.35rem' }}>
                      {t('workspace.init_confirm_title')}
                    </div>
                    <p style={{ fontSize: '0.76rem', color: '#d4d4d8', lineHeight: 1.45, marginBottom: '0.85rem' }}>
                      {t('workspace.init_confirm_desc')}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setShowConfirmClean(false)}
                        disabled={submittingClean}
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={handleInitClean}
                        className="btn-primary"
                        style={{ background: '#ef4444', borderColor: '#ef4444' }}
                        disabled={submittingClean}
                      >
                        {submittingClean ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>{t('common.loading')}</span>
                          </>
                        ) : (
                          <span>{t('workspace.init_clean_btn')}</span>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                  >
                    <Building2 size={15} />
                    <span>{t('workspace.init_clean_btn')}</span>
                  </button>
                )}
              </form>
            </div>
          )}

          {/* TAB 2: Warehouses & Locations */}
          {activeTab === 'locations' && (
            <div>
              {/* Existing Locations Table */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d4d4d8', marginBottom: '0.6rem' }}>
                  {t('inventory.all_locations')} ({locations.length})
                </div>
                <div
                  style={{
                    background: '#121214',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  {locations.map((loc, idx) => (
                    <div
                      key={loc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderBottom: idx < locations.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span
                          className="font-mono"
                          style={{
                            fontSize: '0.74rem',
                            padding: '0.15rem 0.4rem',
                            background: '#27272a',
                            borderRadius: '4px',
                            color: '#e4e4e7',
                          }}
                        >
                          {loc.code}
                        </span>
                        <span style={{ color: '#ffffff', fontWeight: 500 }}>{loc.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: '#a1a1aa',
                          }}
                        >
                          {loc.location_type}
                        </span>
                        {loc.is_default_replenishment === 1 && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                            }}
                          >
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Location Form */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '1.15rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
                  <Plus size={15} color="#10b981" />
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#ffffff' }}>
                    {t('workspace.add_location_title')}
                  </span>
                </div>

                <form onSubmit={handleAddLocation}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">{t('workspace.loc_code')}</label>
                      <input
                        type="text"
                        className="form-input font-mono"
                        value={locCode}
                        onChange={(e) => setLocCode(e.target.value.toUpperCase())}
                        placeholder="YARD-02"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('workspace.loc_name')}</label>
                      <input
                        type="text"
                        className="form-input"
                        value={locName}
                        onChange={(e) => setLocName(e.target.value)}
                        placeholder="e.g. Field Supply Yard Beta"
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
                    <div className="form-group">
                      <label className="form-label">{t('workspace.loc_type')}</label>
                      <select
                        className="form-select"
                        value={locType}
                        onChange={(e: any) => setLocType(e.target.value)}
                      >
                        <option value="WAREHOUSE">{t('workspace.type_warehouse')}</option>
                        <option value="YARD">{t('workspace.type_yard')}</option>
                        <option value="RIG_SITE">{t('workspace.type_rig')}</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.25rem' }}>
                      <input
                        type="checkbox"
                        id="loc-default-check"
                        checked={isDefaultReplenishment}
                        onChange={(e) => setIsDefaultReplenishment(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <label
                        htmlFor="loc-default-check"
                        style={{ fontSize: '0.76rem', color: '#d4d4d8', cursor: 'pointer' }}
                      >
                        {t('workspace.loc_default')}
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-secondary"
                    disabled={submittingLoc}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {submittingLoc ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>{t('common.loading')}</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>{t('workspace.add_location_btn')}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: Data & Demo State (Restore Demo) */}
          {activeTab === 'data' && (
            <div>
              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '10px',
                  padding: '1.15rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Sparkles size={16} color="#818cf8" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f4f4f5' }}>
                    {t('workspace.restore_demo_title')}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#a1a1aa', lineHeight: 1.55, margin: 0 }}>
                  {t('workspace.restore_demo_desc')}
                </p>
              </div>

              {showConfirmRestore ? (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '8px',
                    padding: '1rem',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fca5a5', marginBottom: '0.35rem' }}>
                    {t('workspace.restore_demo_title')}?
                  </div>
                  <p style={{ fontSize: '0.76rem', color: '#d4d4d8', lineHeight: 1.45, marginBottom: '0.85rem' }}>
                    {locale === 'ar'
                      ? 'سيتم استبدال الأصناف الحالية بـ 15 صنفاً نموذجياً لقطاع الطاقة مع 52 أسبوعاً من سجل الحركات وأوامر الشراء للتجربة.'
                      : 'This will repopulate 15 sample oilfield spares, 52-week demand history, and active purchase orders for demonstration.'}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowConfirmRestore(false)}
                      disabled={submittingRestore}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleRestoreDemo}
                      className="btn-primary"
                      disabled={submittingRestore}
                    >
                      {submittingRestore ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>{t('common.loading')}</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw size={14} />
                          <span>{t('workspace.restore_demo_btn')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowConfirmRestore(true)}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                >
                  <RotateCcw size={15} />
                  <span>{t('workspace.restore_demo_btn')}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="label-modal-footer"
          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'flex-end' }}
        >
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
