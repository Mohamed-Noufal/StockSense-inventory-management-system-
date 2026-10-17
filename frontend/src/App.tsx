import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { api } from './api/client';
import {
  HealthResponse, InventoryItem, InventoryLocation, StockBalance,
  StockMovement, IntegrityCheckResponse, PurchaseOrder,
  Supplier, POCreatePayload, POReceivePayload, AIRun, AIRecommendation, User,
  AIRunTriggerPayload, AlertItem
} from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { InventoryView } from './components/InventoryView';
import { OperationsView } from './components/OperationsView';
import { OverviewView } from './components/OverviewView';
import { ProcurementView } from './components/ProcurementView';
import { AIInsightsView } from './components/AIInsightsView';
import { ActivityView } from './components/ActivityView';
import { UsersView } from './components/UsersView';
import { MovementModal } from './components/MovementModal';
import { POCreateModal } from './components/POCreateModal';
import { POReceiveModal } from './components/POReceiveModal';
import { RecommendationModal } from './components/RecommendationModal';
import { WaybillModal } from './components/WaybillModal';
import { BinLabelModal } from './components/BinLabelModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { NewItemModal } from './components/NewItemModal';
import { LoginView } from './components/LoginView';
import { useBarcodeScanner } from './hooks/useBarcodeScanner';

const VALID_TABS = ['overview', 'inventory', 'ledger', 'procurement', 'ai', 'activity', 'users'] as const;
type TabType = typeof VALID_TABS[number];

const getInitialTab = (): TabType => {
  if (typeof window !== 'undefined') {
    const rawHash = window.location.hash.replace(/^#\/?/, '').toLowerCase() as TabType;
    if (VALID_TABS.includes(rawHash)) {
      return rawHash;
    }
    const saved = localStorage.getItem('stocksense_active_tab') as TabType;
    if (saved && VALID_TABS.includes(saved)) {
      return saved;
    }
  }
  return 'overview';
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = `#/${tab}`;
      localStorage.setItem('stocksense_active_tab', tab);
    }
  };

  useEffect(() => {
    const onHashChange = () => {
      const rawHash = window.location.hash.replace(/^#\/?/, '').toLowerCase() as TabType;
      if (VALID_TABS.includes(rawHash)) {
        setActiveTab(rawHash);
        localStorage.setItem('stocksense_active_tab', rawHash);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    // Ensure initial hash is present
    if (!window.location.hash) {
      window.location.hash = `#/${activeTab}`;
    }
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [activeTab]);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [ledger, setLedger] = useState<StockMovement[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [aiRuns, setAiRuns] = useState<AIRun[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!(typeof window !== 'undefined' && localStorage.getItem('stocksense_token'));
  });
  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(true);

  const handleLogout = () => {
    localStorage.removeItem('stocksense_token');
    localStorage.removeItem('stocksense_current_user_id');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSuccessMsg('You have signed out successfully.');
  };
  const [integrity, setIntegrity] = useState<IntegrityCheckResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningAi, setRunningAi] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmittingTx, setIsSubmittingTx] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [showNewItemModal, setShowNewItemModal] = useState<boolean>(false);
  const [newItemInitialSku, setNewItemInitialSku] = useState<string>('');

  const handleOpenNewItemModal = (initialSku = '') => {
    setNewItemInitialSku(initialSku);
    setShowNewItemModal(true);
  };

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('stocksense_sidebar_collapsed') === 'true';
  });

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      localStorage.setItem('stocksense_sidebar_collapsed', String(!prev));
      return !prev;
    });
  };

  const handleSelectUser = async (user: User) => {
    try {
      const res = await api.demoLogin({ user_id: user.id });
      localStorage.setItem('stocksense_token', res.access_token);
      localStorage.setItem('stocksense_current_user_id', String(user.id));
      setCurrentUser(res.user);
      setIsAuthenticated(true);
      setSuccessMsg(`Authenticated as ${res.user.full_name} (${res.user.role}) — JWT Issued`);
    } catch {
      setCurrentUser(user);
      localStorage.setItem('stocksense_current_user_id', String(user.id));
      setSuccessMsg(`Active identity switched to ${user.full_name} (${user.role})`);
    }
  };

  // Modals
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT'>('RECEIPT');
  const [adjDirection, setAdjDirection] = useState<'SURPLUS' | 'SHRINKAGE'>('SURPLUS');
  const [destinationLabel, setDestinationLabel] = useState<string>('Rig-12');
  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [selectedLocId, setSelectedLocId] = useState<number>(0);
  const [targetLocId, setTargetLocId] = useState<number>(0);
  const [txQty, setTxQty] = useState<number>(1);
  const [txReason, setTxReason] = useState<string>('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const handleOpenMovementModal = (type: 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT' = 'RECEIPT', itemId?: number) => {
    setModalError(null);
    setModalType(type);
    if (itemId !== undefined) {
      setSelectedItemId(itemId);
    }
    setTxQty(1);
    setShowModal(true);
  };

  const [showPOCreateModal, setShowPOCreateModal] = useState<boolean>(false);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
  const [inspectingRec, setInspectingRec] = useState<AIRecommendation | null>(null);
  const [navPoId, setNavPoId] = useState<number | null>(null);
  const [waybillMovement, setWaybillMovement] = useState<StockMovement | null>(null);
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
  const [labelPrintItem, setLabelPrintItem] = useState<InventoryItem | null>(null);

  // Global F2 hotkey to toggle optical scanner modal
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setShowScannerModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Hardware barcode wedge listener: automatically opens scanner when USB gun fires
  useBarcodeScanner({
    onScan: (_code) => {
      setShowScannerModal(true);
    },
    enabled: !showScannerModal,
  });

  const fetchData = async () => {
    // Only set blocking loading on initial cold mount
    if (items.length === 0) setLoading(true);
    setError(null);
    try {
      // Tier 1: Core Operational Inventory (Renders Overview & Cards in ~30ms)
      const [itmData, locData, balancesData, poData, ledgData] = await Promise.all([
        api.getItems().catch(() => []),
        api.getLocations().catch(() => []),
        api.getBalances().catch(() => []),
        api.getPurchaseOrders().catch(() => []),
        api.getLedger(30).catch(() => []),
      ]);

      setItems(itmData);
      setLocations(locData);
      setBalances(balancesData);
      setOrders(poData);
      setLedger(ledgData);

      if (itmData.length > 0 && selectedItemId === 0) setSelectedItemId(itmData[0].id);
      if (locData.length > 0 && selectedLocId === 0) {
        setSelectedLocId(locData[0].id);
        if (locData.length > 1) setTargetLocId(locData[1].id);
      }

      // Unblock UI immediately so metrics and cards render instantly
      setLoading(false);

      // Tier 2: Supporting Subsystems (AI, Health, Users, Alerts, Integrity)
      const [hData, supData, recData, runData, usersData, alertsData, integData] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getSuppliers().catch(() => []),
        api.getAIRecommendations().catch(() => []),
        api.getAIRuns().catch(() => []),
        api.getUsers().catch(() => []),
        api.getAlerts().catch(() => []),
        api.getIntegrityCheck().catch(() => null),
      ]);

      setHealth(hData);
      setSuppliers(supData);
      setRecommendations(recData);
      setAiRuns(runData);
      setUsers(usersData);
      setAlerts(alertsData);
      setIntegrity(integData);

      if (usersData && usersData.length > 0) {
        setUsers(usersData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory data');
      setLoading(false);
    }
  };

  useEffect(() => {
    const initSession = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('stocksense_token') : null;
      if (token) {
        try {
          const me = await api.getAuthMe();
          setCurrentUser(me);
          setIsAuthenticated(true);
          await fetchData();
        } catch {
          localStorage.removeItem('stocksense_token');
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
      setIsVerifyingSession(false);
    };

    initSession();
  }, []);

  // Auto-dismiss success notification banner after 5 seconds
  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => {
      setSuccessMsg(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  // Auto-dismiss general error banner after 8 seconds
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => {
      setError(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setModalError(null);
    setSuccessMsg(null);
    setIsSubmittingTx(true);
    const actorLabel = currentUser ? `${currentUser.full_name} (${currentUser.role})` : 'Storekeeper (STOREKEEPER)';
    try {
      if (modalType === 'TRANSFER') {
        const res = await api.transferStock({
          item_id: selectedItemId, from_location_id: selectedLocId,
          to_location_id: targetLocId, quantity: txQty,
          reason: txReason || 'Field site transfer',
          actor_label: actorLabel,
        });
        setSuccessMsg(`Transfer of ${res.quantity} units executed! Group: ${res.transfer_group_id.slice(0, 8)}`);
      } else {
        const res = await api.postMovement({
          item_id: selectedItemId, location_id: selectedLocId,
          movement_type: modalType, quantity: txQty,
          adjustment_direction: modalType === 'ADJUSTMENT' ? adjDirection : undefined,
          destination_label: modalType === 'ISSUE' ? destinationLabel : undefined,
          reason: txReason || `Manual ${modalType.toLowerCase()}`,
          actor_label: actorLabel,
        });
        setSuccessMsg(`Movement #${res.id} (${res.movement_type} ${res.quantity} units) recorded by ${currentUser?.full_name || 'Storekeeper'}!`);
        if (attachedFile && res?.id) {
          try {
            await api.uploadAttachment(attachedFile, 'MOVEMENT', res.id, txReason || 'Physical Delivery Slip / Waybill', actorLabel);
          } catch (attErr) {
            console.warn('Failed to upload movement document attachment:', attErr);
          }
        }
      }
      setShowModal(false);
      setModalError(null);
      setTxQty(1);
      setTxReason('');
      setAttachedFile(null);
      await fetchData();
    } catch (err: any) {
      const msg = err.message || 'Transaction failed';
      setModalError(msg);
      setError(msg);
    } finally {
      setIsSubmittingTx(false);
    }
  };


  const handleCreatePO = async (payload: POCreatePayload): Promise<PurchaseOrder> => {
    setError(null);
    const po = await api.createPurchaseOrder(payload);
    setSuccessMsg(`Purchase Order ${po.po_number} created successfully.`);
    await fetchData();
    return po;
  };

  const handleApprovePO = async (poId: number) => {
    setError(null);
    try {
      const po = await api.approvePurchaseOrder(poId);
      setSuccessMsg(`Purchase Order ${po.po_number} APPROVED for procurement!`);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to approve purchase order');
    }
  };

  const handleReceivePOLine = async (poId: number, payload: POReceivePayload) => {
    setError(null);
    try {
      const actorLabel = currentUser ? `${currentUser.full_name} (${currentUser.role})` : 'Storekeeper (STOREKEEPER)';
      const po = await api.receivePOLine(poId, {
        ...payload,
        actor_label: payload.actor_label || actorLabel,
      });
      setSuccessMsg(`Received ${payload.quantity_received} units on ${po.po_number} by ${currentUser?.full_name || 'Storekeeper'}! Status: ${po.status}`);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Receipt rejected');
      throw err;
    }
  };

  const handleCancelPO = async (poId: number) => {
    setError(null);
    try {
      const po = await api.cancelPurchaseOrder(poId);
      setSuccessMsg(`Purchase Order ${po.po_number} CANCELLED.`);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel purchase order');
    }
  };

  const handleTriggerAIRun = async (payload: AIRunTriggerPayload = { service_level: 0.95, default_method: 'tsb' }) => {
    setRunningAi(true);
    setError(null);
    try {
      const run = await api.triggerAIRun(payload);
      setSuccessMsg(`AI Run #${run.id} completed! Identified ${run.recommendations_count} replenishment proposals.`);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'AI run failed');
    } finally {
      setRunningAi(false);
    }
  };

  const handleApproveRecommendation = async (recId: number): Promise<PurchaseOrder> => {
    setError(null);
    try {
      const po = await api.approveRecommendation(recId);
      setSuccessMsg(`Recommendation #${recId} APPROVED! Draft Purchase Order ${po.po_number} created.`);
      await fetchData();
      return po;
    } catch (err: any) {
      setError(err.message || 'Failed to approve recommendation');
      throw err;
    }
  };

  const handleDismissRecommendation = async (recId: number, reason: string) => {
    setError(null);
    try {
      await api.dismissRecommendation(recId, reason);
      setSuccessMsg(`Recommendation #${recId} dismissed.`);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to dismiss recommendation');
    }
  };

  const handleRunIntegrityCheck = async () => {
    try {
      const res = await api.getIntegrityCheck();
      setIntegrity(res);
      setSuccessMsg(`Audit verified! Status: ${res.status}. Mismatches: ${res.mismatches_count}.`);
    } catch (err: any) {
      setError(err.message || 'Integrity check failed');
    }
  };

  if (isVerifyingSession) {
    return (
      <div className="login-viewport">
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span>Verifying StockSense secure session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return (
      <LoginView
        onLoginSuccess={(user, token) => {
          localStorage.setItem('stocksense_token', token);
          localStorage.setItem('stocksense_current_user_id', String(user.id));
          setCurrentUser(user);
          setIsAuthenticated(true);
          setSuccessMsg(`Welcome, ${user.full_name} (${user.role.replace('_', ' ')})!`);
          fetchData();
        }}
      />
    );
  }

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        itemsCount={items.length}
        ledgerCount={ledger.length}
        poCount={orders.length}
        aiCount={recommendations.filter((r) => r.status === 'OPEN').length}
        activityCount={alerts.filter((a) => a.status !== 'RESOLVED').length}
        usersCount={users.length}
        health={health}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <main className="main-content">
        <Header
          activeTab={activeTab}
          integrity={integrity}
          loading={loading}
          onRefresh={fetchData}
          onRunAudit={handleRunIntegrityCheck}
          onOpenModal={() => handleOpenMovementModal('RECEIPT')}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
          users={users}
          currentUser={currentUser}
          onSelectUser={handleSelectUser}
          onNavigateTab={(tab) => handleTabChange(tab as TabType)}
          onOpenScanner={() => setShowScannerModal(true)}
          onLogout={handleLogout}
        />

        {error && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: '#f87171', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', opacity: 0.8 }}
              title="Dismiss notification"
            >
              <X style={{ width: 15, height: 15 }} />
            </button>
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', color: '#34d399', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', animation: 'fadeIn 0.2s ease-in-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', opacity: 0.8 }}
              title="Dismiss notification"
            >
              <X style={{ width: 15, height: 15 }} />
            </button>
          </div>
        )}

        <div className="content-body">
          {activeTab === 'inventory' && (
            <InventoryView
              items={items}
              orders={orders}
              loading={loading}
              onAction={(itemId, type) => handleOpenMovementModal(type, itemId)}
              onNavigateTab={handleTabChange}
              onPrintLabel={(item) => setLabelPrintItem(item)}
              onAddNewItem={() => handleOpenNewItemModal('')}
            />
          )}
          {activeTab === 'ledger' && (
            <OperationsView
              ledger={ledger}
              items={items}
              locations={locations}
              onRefresh={fetchData}
              onOpenMovementModal={(type) => handleOpenMovementModal(type)}
              onPrintWaybill={(mov) => setWaybillMovement(mov)}
              onOpenScanner={() => setShowScannerModal(true)}
            />
          )}
          {activeTab === 'procurement' && (
            <ProcurementView
              orders={orders}
              suppliers={suppliers}
              items={items}
              locations={locations}
              onCreatePO={handleCreatePO}
              onApprove={handleApprovePO}
              onReceive={handleReceivePOLine}
              onCancel={handleCancelPO}
              loading={loading}
              initialPoId={navPoId}
              onClearInitialPoId={() => setNavPoId(null)}
            />
          )}
          {activeTab === 'ai' && (
            <AIInsightsView
              recommendations={recommendations}
              runs={aiRuns}
              items={items}
              suppliers={suppliers}
              locations={locations}
              onTriggerRun={handleTriggerAIRun}
              onInspectRec={(rec) => setInspectingRec(rec)}
              onQuickApprove={handleApproveRecommendation}
              onDismissRec={handleDismissRecommendation}
              onNavigateToPO={(poId) => {
                setNavPoId(poId);
                handleTabChange('procurement');
              }}
              loading={loading}
              runningAi={runningAi}
            />
          )}
          {activeTab === 'activity' && (
            <ActivityView
              ledger={ledger}
              items={items}
              locations={locations}
              integrity={integrity}
              currentUser={currentUser}
              onRefresh={fetchData}
              onIntegrityUpdated={(rep) => setIntegrity(rep)}
              onPrintWaybill={(mov) => setWaybillMovement(mov)}
            />
          )}
          {activeTab === 'users' && (
            <UsersView
              users={users}
              currentUser={currentUser}
              onSelectUser={handleSelectUser}
              ledger={ledger}
              onNavigateTab={(tab) => handleTabChange(tab as TabType)}
            />
          )}
          {activeTab === 'overview' && (
            <OverviewView
              items={items}
              locations={locations}
              ledger={ledger}
              orders={orders}
              recommendations={recommendations}
              currentUser={currentUser}
              loading={loading}
              onNavigateTab={(tab) => handleTabChange(tab as TabType)}
              onOpenMovementModal={() => handleOpenMovementModal('RECEIPT')}
              onInspectRec={(rec) => setInspectingRec(rec)}
            />
          )}
        </div>
      </main>

      {showModal && (
        <MovementModal
          modalType={modalType}
          setModalType={(type) => {
            setModalError(null);
            setModalType(type);
          }}
          items={items}
          locations={locations}
          balances={balances}
          selectedItemId={selectedItemId}
          setSelectedItemId={(id) => {
            setModalError(null);
            setSelectedItemId(id);
          }}
          selectedLocId={selectedLocId}
          setSelectedLocId={(id) => {
            setModalError(null);
            setSelectedLocId(id);
          }}
          targetLocId={targetLocId}
          setTargetLocId={(id) => {
            setModalError(null);
            setTargetLocId(id);
          }}
          txQty={txQty}
          setTxQty={setTxQty}
          txReason={txReason}
          setTxReason={setTxReason}
          adjustmentDirection={adjDirection}
          setAdjustmentDirection={setAdjDirection}
          destinationLabel={destinationLabel}
          setDestinationLabel={setDestinationLabel}
          attachedFile={attachedFile}
          setAttachedFile={setAttachedFile}
          modalError={modalError}
          setModalError={setModalError}
          isSubmitting={isSubmittingTx}
          onClose={() => {
            setShowModal(false);
            setAttachedFile(null);
            setModalError(null);
          }}
          onSubmit={handleTransaction}
        />
      )}


      {showPOCreateModal && (
        <POCreateModal
          suppliers={suppliers}
          items={items}
          locations={locations}
          onClose={() => setShowPOCreateModal(false)}
          onSubmit={async (payload) => { await handleCreatePO(payload); }}
        />
      )}

      {receivingPO && (
        <POReceiveModal
          po={receivingPO}
          onClose={() => setReceivingPO(null)}
          onSubmit={handleReceivePOLine}
        />
      )}

      {inspectingRec && (
        <RecommendationModal
          rec={inspectingRec}
          onClose={() => setInspectingRec(null)}
          onApprove={async (id) => { await handleApproveRecommendation(id); }}
          onDismiss={handleDismissRecommendation}
        />
      )}

      {waybillMovement && (
        <WaybillModal
          movement={waybillMovement}
          items={items}
          locations={locations}
          onClose={() => setWaybillMovement(null)}
        />
      )}

      {showScannerModal && (
        <BarcodeScannerModal
          items={items}
          orders={orders}
          suppliers={suppliers}
          onClose={() => setShowScannerModal(false)}
          onQuickAction={(action, itm) => handleOpenMovementModal(action, itm.id)}
          onPrintLabel={(itm) => setLabelPrintItem(itm)}
          onInspectItem={(itm) => {
            setSelectedItemId(itm.id);
            setActiveTab('inventory');
          }}
          onOnboardNewItem={(code) => {
            setShowScannerModal(false);
            handleOpenNewItemModal(code);
          }}
          onReceivePOLine={async (po, lineId, qty) => {
            await handleReceivePOLine(po.id, {
              po_line_id: lineId,
              quantity_received: qty,
              destination_location_id: locations[0]?.id || 1,
              actor_label: currentUser?.full_name || 'Storekeeper',
            });
          }}
        />
      )}

      {showNewItemModal && (
        <NewItemModal
          initialSku={newItemInitialSku}
          locations={locations}
          suppliers={suppliers}
          onClose={() => setShowNewItemModal(false)}
          onSuccess={() => {
            fetchData();
          }}
          onPrintLabel={(itm) => {
            setShowNewItemModal(false);
            setLabelPrintItem(itm);
          }}
        />
      )}

      {labelPrintItem && (
        <BinLabelModal
          item={labelPrintItem}
          location={locations.find((l) => l.name === labelPrintItem.warehouse_name) || locations[0]}
          onClose={() => setLabelPrintItem(null)}
        />
      )}
    </div>
  );
};

export default App;
