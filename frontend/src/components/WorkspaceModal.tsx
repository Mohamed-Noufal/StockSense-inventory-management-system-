import React, { useState, useEffect } from 'react';
import {
  X, Building2, MapPin, RotateCcw, Plus,
  CheckCircle2, AlertTriangle, Loader2, Sparkles, Trash2, Settings, ShieldAlert
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
  const [activeTab, setActiveTab] = useState<'profile' | 'locations' | 'data'>('profile');
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo | null>(null);

  // Profile Form State
  const [companyName, setCompanyName] = useState<string>('');
  const [industry, setIndustry] = useState<string>('GENERAL');
  const [submittingProfile, setSubmittingProfile] = useState<boolean>(false);

  // Setup Clean Form State
  const [cleanCompanyName, setCleanCompanyName] = useState<string>('');
  const [cleanWarehouseName, setCleanWarehouseName] = useState<string>('');
  const [cleanWarehouseCode, setCleanWarehouseCode] = useState<string>('WH-01');
  const [cleanIndustry, setCleanIndustry] = useState<string>('GENERAL');
  const [showConfirmClean, setShowConfirmClean] = useState<boolean>(false);
  const [submittingClean, setSubmittingClean] = useState<boolean>(false);

  // Add Location Form State
  const [locCode, setLocCode] = useState<string>('');
  const [locName, setLocName] = useState<string>('');
  const [locType, setLocType] = useState<'WAREHOUSE' | 'YARD' | 'RIG_SITE'>('WAREHOUSE');
  const [isDefaultReplenishment, setIsDefaultReplenishment] = useState<boolean>(false);
  const [submittingLoc, setSubmittingLoc] = useState<boolean>(false);
  const [deletingLocId, setDeletingLocId] = useState<number | null>(null);

  // Restore Demo State
  const [submittingRestore, setSubmittingRestore] = useState<boolean>(false);
  const [showConfirmRestore, setShowConfirmRestore] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchWorkspace = async () => {
    try {
      const info = await api.getWorkspaceInfo();
      setWorkspaceInfo(info);
      setCompanyName(info.company_name);
      setIndustry(info.industry || 'GENERAL');
      if (!cleanCompanyName) setCleanCompanyName(info.company_name);
    } catch (err: any) {
      console.error('Failed to load workspace info', err);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError(locale === 'ar' ? 'اسم الشركة / المتجر مطلوب' : 'Company or store name is required');
      return;
    }
    setError(null);
    setSubmittingProfile(true);
    try {
      const updated = await api.updateWorkspaceProfile({
        company_name: companyName.trim(),
        industry,
      });
      setWorkspaceInfo(updated);
      setSuccess(locale === 'ar' ? 'تم حفظ تفاصيل المتجر بنجاح!' : 'Store details saved successfully!');
      onWorkspaceUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update store profile');
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleInitClean = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cleanCompanyName.trim() || !cleanWarehouseName.trim() || !cleanWarehouseCode.trim()) {
      setError(locale === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    setError(null);
    setSubmittingClean(true);
    try {
      const res = await api.initCleanWorkspace({
        company_name: cleanCompanyName.trim(),
        warehouse_name: cleanWarehouseName.trim(),
        warehouse_code: cleanWarehouseCode.trim().toUpperCase(),
        industry: cleanIndustry,
      });
      setWorkspaceInfo(res);
      setCompanyName(res.company_name);
      setIndustry(res.industry || 'GENERAL');
      setSuccess(
        locale === 'ar'
          ? 'تم تفريغ المستودع وبدء متجر نظيف بنجاح! تم الحفاظ على حسابات المستخدمين.'
          : 'Clean workspace initialized! 0 items, ready for your products. User accounts preserved.'
      );
      setShowConfirmClean(false);
      onWorkspaceUpdated();
      fetchWorkspace();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize clean workspace');
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
      setSuccess(
        locale === 'ar'
          ? 'تمت إضافة موقع التخزين بنجاح!'
          : 'Storage location added successfully!'
      );
      onWorkspaceUpdated();
      fetchWorkspace();
    } catch (err: any) {
      setError(err.message || 'Failed to create storage location');
    } finally {
      setSubmittingLoc(false);
    }
  };

  const handleDeleteLocation = async (locId: number, locName: string) => {
    setError(null);
    setDeletingLocId(locId);
    try {
      await api.deleteLocation(locId);
      setSuccess(
        locale === 'ar'
          ? `تم حذف الموقع "${locName}" بنجاح.`
          : `Location "${locName}" removed successfully.`
      );
      onWorkspaceUpdated();
      fetchWorkspace();
    } catch (err: any) {
      setError(err.message || 'Failed to remove location');
    } finally {
      setDeletingLocId(null);
    }
  };

  const handleRestoreDemo = async () => {
    setError(null);
    setSubmittingRestore(true);
    try {
      const res = await api.restoreDemoWorkspace();
      setWorkspaceInfo(res);
      setCompanyName(res.company_name);
      setSuccess(
        locale === 'ar'
          ? 'تم تحميل المنتجات وسجل الحركات التجريبية بنجاح!'
          : 'Demo products and 52-week ledger history restored successfully!'
      );
      setShowConfirmRestore(false);
      onWorkspaceUpdated();
      fetchWorkspace();
    } catch (err: any) {
      setError(err.message || 'Failed to restore demo dataset');
    } finally {
      setSubmittingRestore(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '660px',
          maxHeight: '88vh',
          backgroundColor: '#0c0c0e',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: '#111113',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
              <Settings size={16} />
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
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            title={t('common.close')}
            style={{ color: '#a1a1aa' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Current Workspace Status Banner */}
        <div
          style={{
            padding: '0.75rem 1.25rem',
            background: 'rgba(18, 18, 22, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: workspaceInfo?.is_demo_dataset ? '#818cf8' : '#10b981',
                padding: '0.2rem 0.55rem',
                borderRadius: '9999px',
                background: workspaceInfo?.is_demo_dataset ? 'rgba(99, 102, 241, 0.12)' : 'rgba(16, 185, 129, 0.12)',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.76rem', color: '#a1a1aa' }}>
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
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => { setActiveTab('profile'); setError(null); setSuccess(null); }}
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: activeTab === 'profile' ? '#27272a' : 'transparent',
              color: activeTab === 'profile' ? '#ffffff' : '#71717a',
              transition: 'all 0.15s ease',
            }}
          >
            <Building2 size={14} />
            <span>{t('workspace.tab_profile')}</span>
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
              display: 'inline-flex',
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
              display: 'inline-flex',
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

        {/* Scrollable Modal Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.5rem',
          }}
        >
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

          {/* TAB 1: Store & Company Profile */}
          {activeTab === 'profile' && (
            <div>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Building2 size={16} color="#10b981" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff' }}>
                    {t('workspace.profile_heading')}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#a1a1aa', lineHeight: 1.5, margin: 0 }}>
                  {t('workspace.profile_desc')}
                </p>
              </div>

              <form onSubmit={handleUpdateProfile}>
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

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">{t('workspace.industry_label')}</label>
                  <select
                    className="form-select"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  >
                    <option value="GENERAL">{t('workspace.industry_general')}</option>
                    <option value="APPAREL">{t('workspace.industry_apparel')}</option>
                    <option value="ELECTRONICS">{t('workspace.industry_electronics')}</option>
                    <option value="INDUSTRIAL">{t('workspace.industry_industrial')}</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submittingProfile}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
                  >
                    {submittingProfile ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>{t('common.loading')}</span>
                      </>
                    ) : (
                      <>
                        <Building2 size={14} />
                        <span>{t('workspace.save_profile_btn')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Warehouses & Stores */}
          {activeTab === 'locations' && (
            <div>
              {/* Existing Locations with Scroll & Delete */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d4d4d8', marginBottom: '0.6rem' }}>
                  {t('inventory.all_locations')} ({locations.length})
                </div>

                <div
                  style={{
                    background: '#121214',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    maxHeight: '220px',
                    overflowY: 'auto',
                  }}
                >
                  {locations.map((loc, idx) => {
                    const isDeleting = deletingLocId === loc.id;
                    return (
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                          <span
                            className="font-mono"
                            style={{
                              fontSize: '0.74rem',
                              padding: '0.15rem 0.4rem',
                              background: '#27272a',
                              borderRadius: '4px',
                              color: '#e4e4e7',
                              flexShrink: 0,
                            }}
                          >
                            {loc.code}
                          </span>
                          <span style={{ color: '#ffffff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {loc.name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
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

                          {locations.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteLocation(loc.id, loc.name)}
                              disabled={isDeleting}
                              title={t('workspace.delete_location_btn')}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#71717a',
                                cursor: 'pointer',
                                padding: '0.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 0.15s ease',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
                            >
                              {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add New Location Card */}
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
                        placeholder="STORE-02"
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
                        placeholder="e.g. Downtown Retail Store"
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
                    className="btn btn-secondary"
                    disabled={submittingLoc}
                    style={{ width: '100%', justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
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

          {/* TAB 3: Data & Reset (Empty Store / Load Demo) */}
          {activeTab === 'data' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Card 1: Clear All Data (Start Fresh) */}
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.03)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '10px',
                  padding: '1.15rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <ShieldAlert size={16} color="#ef4444" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff' }}>
                    {t('workspace.clean_fresh_title')}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#a1a1aa', lineHeight: 1.55, margin: '0 0 1rem 0' }}>
                  {t('workspace.clean_fresh_desc')}
                </p>

                {showConfirmClean ? (
                  <form onSubmit={handleInitClean}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">{t('workspace.company_name_label')}</label>
                        <input
                          type="text"
                          className="form-input"
                          value={cleanCompanyName}
                          onChange={(e) => setCleanCompanyName(e.target.value)}
                          placeholder="e.g. Zara Boutique"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{t('workspace.industry_label')}</label>
                        <select
                          className="form-select"
                          value={cleanIndustry}
                          onChange={(e) => setCleanIndustry(e.target.value)}
                        >
                          <option value="GENERAL">{t('workspace.industry_general')}</option>
                          <option value="APPAREL">{t('workspace.industry_apparel')}</option>
                          <option value="ELECTRONICS">{t('workspace.industry_electronics')}</option>
                          <option value="INDUSTRIAL">{t('workspace.industry_industrial')}</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">{t('workspace.wh_name_label')}</label>
                        <input
                          type="text"
                          className="form-input"
                          value={cleanWarehouseName}
                          onChange={(e) => setCleanWarehouseName(e.target.value)}
                          placeholder="e.g. Main Store"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{t('workspace.wh_code_label')}</label>
                        <input
                          type="text"
                          className="form-input font-mono"
                          value={cleanWarehouseCode}
                          onChange={(e) => setCleanWarehouseCode(e.target.value.toUpperCase())}
                          placeholder="WH-01"
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowConfirmClean(false)}
                        disabled={submittingClean}
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ background: '#ef4444', borderColor: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                        disabled={submittingClean}
                      >
                        {submittingClean ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>{t('common.loading')}</span>
                          </>
                        ) : (
                          <>
                            <Trash2 size={14} />
                            <span>{t('workspace.clean_fresh_confirm_btn')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCleanCompanyName(companyName || 'My Company');
                      setCleanWarehouseName(locale === 'ar' ? 'المستودع الرئيسي' : 'Main Warehouse');
                      setShowConfirmClean(true);
                    }}
                    className="btn btn-secondary"
                    style={{
                      borderColor: 'rgba(239, 68, 68, 0.4)',
                      color: '#f87171',
                      width: '100%',
                      justifyContent: 'center',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem',
                    }}
                  >
                    <Trash2 size={15} />
                    <span>{t('workspace.clean_fresh_btn')}</span>
                  </button>
                )}
              </div>

              {/* Card 2: Load Demo Products (Preview) */}
              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.04)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '10px',
                  padding: '1.15rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Sparkles size={16} color="#818cf8" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f4f4f5' }}>
                    {t('workspace.restore_demo_title')}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#a1a1aa', lineHeight: 1.55, margin: '0 0 1rem 0' }}>
                  {t('workspace.restore_demo_desc')}
                </p>

                {showConfirmRestore ? (
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowConfirmRestore(false)}
                      disabled={submittingRestore}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleRestoreDemo}
                      className="btn btn-primary"
                      disabled={submittingRestore}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
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
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmRestore(true)}
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem',
                      borderColor: 'rgba(99, 102, 241, 0.3)',
                      color: '#a5b4fc',
                    }}
                  >
                    <RotateCcw size={15} />
                    <span>{t('workspace.restore_demo_btn')}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: '#09090b',
            display: 'flex',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
