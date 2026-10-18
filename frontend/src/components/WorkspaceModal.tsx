import React, { useState, useEffect } from 'react';
import {
  X, Building2, MapPin, RotateCcw, Plus,
  CheckCircle2, AlertTriangle, Loader2, Sparkles, Trash2, Settings, ShieldAlert
} from 'lucide-react';
import { WorkspaceInfo, InventoryLocation, LocationCreatePayload, User } from '../types';
import { api } from '../api/client';
import { useI18n } from '../i18n/I18nContext';

interface WorkspaceModalProps {
  onClose: () => void;
  onWorkspaceUpdated: () => void;
  locations: InventoryLocation[];
  currentUser?: User | null;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  onClose,
  onWorkspaceUpdated,
  locations,
  currentUser,
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

  // User-Scoped Purge State
  const [showConfirmPurgeUser, setShowConfirmPurgeUser] = useState<boolean>(false);
  const [submittingPurgeUser, setSubmittingPurgeUser] = useState<boolean>(false);

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

  const handlePurgeUserData = async () => {
    setError(null);
    setSubmittingPurgeUser(true);
    try {
      const res = await api.purgeUserData(currentUser?.id);
      setSuccess(
        locale === 'ar'
          ? `تم مسح حركات ونشاطات المستخدم (${res.user_name}) بنجاح. تم الحفاظ على البيانات التجريبية وسجلات باقي المستخدمين.`
          : `Successfully deleted ${res.deleted_movements} movements and ${res.deleted_purchase_orders} POs for ${res.user_name}. Shared test data preserved.`
      );
      setShowConfirmPurgeUser(false);
      onWorkspaceUpdated();
      fetchWorkspace();
    } catch (err: any) {
      setError(err.message || 'Failed to purge user data');
    } finally {
      setSubmittingPurgeUser(false);
    }
  };

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
      className="settings-overlay"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="settings-header">
          <div className="settings-title-group">
            <div className="settings-icon-box">
              <Settings size={16} />
            </div>
            <div>
              <h2 className="settings-title">{t('workspace.modal_title')}</h2>
              <div className="settings-subtitle">
                {workspaceInfo?.company_name || 'StockSense'}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="settings-close-btn"
            onClick={onClose}
            title={t('common.close')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Status Strip */}
        <div className="settings-status-strip">
          <div className="settings-status-badge">
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: workspaceInfo?.is_demo_dataset ? '#818cf8' : '#10b981',
              }}
            />
            <span>
              {workspaceInfo?.is_demo_dataset
                ? t('workspace.demo_mode_badge')
                : t('workspace.custom_mode_badge')}
            </span>
          </div>

          <div className="settings-status-counts">
            <div>
              <span style={{ color: '#71717a' }}>{t('workspace.items_count')}: </span>
              <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono, monospace)' }}>
                {workspaceInfo?.total_items ?? '...'}
              </strong>
            </div>
            <div>
              <span style={{ color: '#71717a' }}>{t('workspace.locations_count')}: </span>
              <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono, monospace)' }}>
                {workspaceInfo?.total_locations ?? locations.length}
              </strong>
            </div>
          </div>
        </div>

        {/* Linear-style Navigation Tabs */}
        <div className="settings-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'profile'}
            className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => { setActiveTab('profile'); setError(null); setSuccess(null); }}
          >
            <Building2 size={14} />
            <span>{t('workspace.tab_profile')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'locations'}
            className={`settings-tab-btn ${activeTab === 'locations' ? 'active' : ''}`}
            onClick={() => { setActiveTab('locations'); setError(null); setSuccess(null); }}
          >
            <MapPin size={14} />
            <span>{t('workspace.tab_locations')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'data'}
            className={`settings-tab-btn ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => { setActiveTab('data'); setError(null); setSuccess(null); }}
          >
            <RotateCcw size={14} />
            <span>{t('workspace.tab_data')}</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="settings-body">
          {error && (
            <div className="settings-alert settings-alert-error" role="alert">
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="settings-alert settings-alert-success" role="status">
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}

          {/* TAB 1: Store & Company Profile */}
          {activeTab === 'profile' && (
            <div className="settings-section-card">
              <div className="settings-card-header">
                <Building2 size={15} />
                <span className="settings-card-title">{t('workspace.profile_heading')}</span>
              </div>
              <p className="settings-card-desc">{t('workspace.profile_desc')}</p>

              <form onSubmit={handleUpdateProfile}>
                <div className="settings-form-group">
                  <label className="settings-label">{t('workspace.company_name_label')}</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={t('workspace.company_name_placeholder')}
                    required
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-label">{t('workspace.industry_label')}</label>
                  <select
                    className="settings-select"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  >
                    <option value="GENERAL">{t('workspace.industry_general')}</option>
                    <option value="APPAREL">{t('workspace.industry_apparel')}</option>
                    <option value="ELECTRONICS">{t('workspace.industry_electronics')}</option>
                    <option value="INDUSTRIAL">{t('workspace.industry_industrial')}</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                  <button
                    type="submit"
                    className="settings-btn-primary"
                    disabled={submittingProfile}
                  >
                    {submittingProfile ? (
                      <>
                        <Loader2 size={13} className="spin" />
                        <span>{t('common.loading')}</span>
                      </>
                    ) : (
                      <span>{t('workspace.save_profile_btn')}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Warehouses & Stores */}
          {activeTab === 'locations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Existing Locations */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d4d4d8', marginBottom: '0.6rem' }}>
                  {t('inventory.all_locations')} ({locations.length})
                </div>

                <div className="settings-loc-list">
                  {locations.map((loc) => {
                    const isDeleting = deletingLocId === loc.id;
                    return (
                      <div key={loc.id} className="settings-loc-item">
                        <div className="settings-loc-left">
                          <span className="settings-loc-code">{loc.code}</span>
                          <span className="settings-loc-name">{loc.name}</span>
                        </div>
                        <div className="settings-loc-right">
                          <span className="settings-loc-type">{loc.location_type}</span>
                          {loc.is_default_replenishment === 1 && (
                            <span className="settings-loc-default">Default</span>
                          )}

                          {locations.length > 1 && (
                            <button
                              type="button"
                              className="settings-loc-delete"
                              onClick={() => handleDeleteLocation(loc.id, loc.name)}
                              disabled={isDeleting}
                              title={t('workspace.delete_location_btn')}
                            >
                              {isDeleting ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add New Location Card */}
              <div className="settings-section-card">
                <div className="settings-card-header">
                  <Plus size={15} />
                  <span className="settings-card-title">{t('workspace.add_location_title')}</span>
                </div>

                <form onSubmit={handleAddLocation}>
                  <div className="settings-form-row">
                    <div className="settings-form-group">
                      <label className="settings-label">{t('workspace.loc_code')}</label>
                      <input
                        type="text"
                        className="settings-input"
                        value={locCode}
                        onChange={(e) => setLocCode(e.target.value.toUpperCase())}
                        placeholder="STORE-02"
                        required
                      />
                    </div>
                    <div className="settings-form-group">
                      <label className="settings-label">{t('workspace.loc_name')}</label>
                      <input
                        type="text"
                        className="settings-input"
                        value={locName}
                        onChange={(e) => setLocName(e.target.value)}
                        placeholder="e.g. Downtown Retail Store"
                        required
                      />
                    </div>
                  </div>

                  <div className="settings-form-row" style={{ alignItems: 'center' }}>
                    <div className="settings-form-group">
                      <label className="settings-label">{t('workspace.loc_type')}</label>
                      <select
                        className="settings-select"
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
                        style={{ cursor: 'pointer', accentColor: '#ffffff' }}
                      />
                      <label
                        htmlFor="loc-default-check"
                        style={{ fontSize: '0.76rem', color: '#d4d4d8', cursor: 'pointer' }}
                      >
                        {t('workspace.loc_default')}
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.85rem' }}>
                    <button
                      type="submit"
                      className="settings-btn-secondary"
                      disabled={submittingLoc}
                    >
                      {submittingLoc ? (
                        <>
                          <Loader2 size={13} className="spin" />
                          <span>{t('common.loading')}</span>
                        </>
                      ) : (
                        <>
                          <Plus size={13} />
                          <span>{t('workspace.add_location_btn')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: Data & Reset (User Purge, Demo Data & Factory Reset) */}
          {activeTab === 'data' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Card 1: User-Scoped Deletion (Deletes ONLY by User ID, preserves test data) */}
              <div className="settings-section-card" style={{ border: '1px solid rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.03)' }}>
                <div className="settings-card-header">
                  <Trash2 size={15} color="#f87171" />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="settings-card-title">{t('workspace.purge_user_title')}</span>
                    {currentUser && (
                      <span className="badge badge-info" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                        {currentUser.full_name} (#{currentUser.id})
                      </span>
                    )}
                  </div>
                </div>
                <p className="settings-card-desc">{t('workspace.purge_user_desc')}</p>

                {showConfirmPurgeUser ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.78rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.08)', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      {locale === 'ar'
                        ? `هل أنت متأكد من مسح جميع الحركات وأوامر الشراء المسجلة باسم "${currentUser?.full_name || 'المستخدم'}"؟ البيانات التجريبية وسجلات باقي الموظفين ستبقى محفوظة بالكامل.`
                        : `Are you sure you want to delete movements and purchase orders logged by "${currentUser?.full_name || 'this user'}"? Baseline test data and other employees' data will remain intact.`}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="settings-btn-secondary"
                        onClick={() => setShowConfirmPurgeUser(false)}
                        disabled={submittingPurgeUser}
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={handlePurgeUserData}
                        className="settings-btn-danger"
                        disabled={submittingPurgeUser}
                      >
                        {submittingPurgeUser ? (
                          <>
                            <Loader2 size={13} className="spin" />
                            <span>{t('common.loading')}</span>
                          </>
                        ) : (
                          <>
                            <Trash2 size={13} />
                            <span>{t('workspace.purge_user_confirm_btn')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmPurgeUser(true)}
                    className="settings-btn-secondary"
                    style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}
                  >
                    <Trash2 size={14} />
                    <span>{t('workspace.purge_user_btn')} ({currentUser?.full_name || 'User'})</span>
                  </button>
                )}
              </div>

              {/* Card 2: Factory Clean Workspace (Admin Only - Wipes all catalog) */}
              <div className="settings-danger-card">
                <div className="settings-card-header">
                  <ShieldAlert size={15} color="#f87171" />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="settings-card-title">{t('workspace.clean_fresh_title')}</span>
                    <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>ADMIN ONLY</span>
                  </div>
                </div>
                <p className="settings-card-desc">{t('workspace.clean_fresh_desc')}</p>

                {showConfirmClean ? (
                  <form onSubmit={handleInitClean}>
                    <div className="settings-form-row">
                      <div className="settings-form-group">
                        <label className="settings-label">{t('workspace.company_name_label')}</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={cleanCompanyName}
                          onChange={(e) => setCleanCompanyName(e.target.value)}
                          placeholder="e.g. Zara Boutique"
                          required
                        />
                      </div>
                      <div className="settings-form-group">
                        <label className="settings-label">{t('workspace.industry_label')}</label>
                        <select
                          className="settings-select"
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

                    <div className="settings-form-row">
                      <div className="settings-form-group">
                        <label className="settings-label">{t('workspace.wh_name_label')}</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={cleanWarehouseName}
                          onChange={(e) => setCleanWarehouseName(e.target.value)}
                          placeholder="e.g. Main Store"
                          required
                        />
                      </div>
                      <div className="settings-form-group">
                        <label className="settings-label">{t('workspace.wh_code_label')}</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={cleanWarehouseCode}
                          onChange={(e) => setCleanWarehouseCode(e.target.value.toUpperCase())}
                          placeholder="WH-01"
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.85rem' }}>
                      <button
                        type="button"
                        className="settings-btn-secondary"
                        onClick={() => setShowConfirmClean(false)}
                        disabled={submittingClean}
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        className="settings-btn-danger"
                        disabled={submittingClean}
                      >
                        {submittingClean ? (
                          <>
                            <Loader2 size={13} className="spin" />
                            <span>{t('common.loading')}</span>
                          </>
                        ) : (
                          <>
                            <Trash2 size={13} />
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
                    className="settings-btn-danger"
                    style={{ width: '100%' }}
                  >
                    <Trash2 size={14} />
                    <span>{t('workspace.clean_fresh_btn')}</span>
                  </button>
                )}
              </div>

              {/* Card 2: Load Demo Products */}
              <div className="settings-section-card">
                <div className="settings-card-header">
                  <Sparkles size={15} />
                  <span className="settings-card-title">{t('workspace.restore_demo_title')}</span>
                </div>
                <p className="settings-card-desc">{t('workspace.restore_demo_desc')}</p>

                {showConfirmRestore ? (
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="settings-btn-secondary"
                      onClick={() => setShowConfirmRestore(false)}
                      disabled={submittingRestore}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleRestoreDemo}
                      className="settings-btn-primary"
                      disabled={submittingRestore}
                    >
                      {submittingRestore ? (
                        <>
                          <Loader2 size={13} className="spin" />
                          <span>{t('common.loading')}</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw size={13} />
                          <span>{t('workspace.restore_demo_btn')}</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmRestore(true)}
                    className="settings-btn-secondary"
                    style={{ width: '100%' }}
                  >
                    <RotateCcw size={14} />
                    <span>{t('workspace.restore_demo_btn')}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="settings-footer">
          <button type="button" className="settings-btn-secondary" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
