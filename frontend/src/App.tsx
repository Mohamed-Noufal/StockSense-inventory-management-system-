import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from './api/client';
import {
  HealthResponse, ReadyResponse, InventoryItem, InventoryLocation,
  StockMovement, IntegrityCheckResponse, Milestone, PurchaseOrder,
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
import { SprintView } from './components/SprintView';
import { DiagnosticsView } from './components/DiagnosticsView';
import { MovementModal } from './components/MovementModal';
import { POCreateModal } from './components/POCreateModal';
import { POReceiveModal } from './components/POReceiveModal';
import { RecommendationModal } from './components/RecommendationModal';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'ledger' | 'procurement' | 'ai' | 'activity' | 'sprint' | 'diagnostics' | 'users'>('overview');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [readiness, setReadiness] = useState<ReadyResponse | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [ledger, setLedger] = useState<StockMovement[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [aiRuns, setAiRuns] = useState<AIRun[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [integrity, setIntegrity] = useState<IntegrityCheckResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningAi, setRunningAi] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('stocksense_sidebar_collapsed') === 'true';
  });

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      localStorage.setItem('stocksense_sidebar_collapsed', String(!prev));
      return !prev;
    });
  };

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('stocksense_current_user_id', String(user.id));
    setSuccessMsg(`Active identity switched to ${user.full_name} (${user.role}) for audit logging`);
  };

  // Modals
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT'>('RECEIPT');
  const [adjDirection, setAdjDirection] = useState<'SURPLUS' | 'SHRINKAGE'>('SURPLUS');
  const [destinationLabel, setDestinationLabel] = useState<string>('Rig-12');
  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [selectedLocId, setSelectedLocId] = useState<number>(0);
  const [targetLocId, setTargetLocId] = useState<number>(0);
  const [txQty, setTxQty] = useState<number>(5);
  const [txReason, setTxReason] = useState<string>('');

  const [showPOCreateModal, setShowPOCreateModal] = useState<boolean>(false);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
  const [inspectingRec, setInspectingRec] = useState<AIRecommendation | null>(null);
  const [navPoId, setNavPoId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [hData, rData, itmData, locData, ledgData, integData, poData, supData, recData, runData, usersData, alertsData] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getReadiness().catch(() => null),
        api.getItems().catch(() => []),
        api.getLocations().catch(() => []),
        api.getLedger(30).catch(() => []),
        api.getIntegrityCheck().catch(() => null),
        api.getPurchaseOrders().catch(() => []),
        api.getSuppliers().catch(() => []),
        api.getAIRecommendations().catch(() => []),
        api.getAIRuns().catch(() => []),
        api.getUsers().catch(() => []),
        api.getAlerts().catch(() => []),
      ]);
      setHealth(hData);
      setReadiness(rData);
      setItems(itmData);
      setLocations(locData);
      setLedger(ledgData);
      setIntegrity(integData);
      setOrders(poData);
      setSuppliers(supData);
      setRecommendations(recData);
      setAiRuns(runData);
      setUsers(usersData);
      setAlerts(alertsData);

      if (usersData && usersData.length > 0) {
        const savedUserId = localStorage.getItem('stocksense_current_user_id');
        const matched = savedUserId ? usersData.find((u: User) => String(u.id) === savedUserId) : null;
        setCurrentUser((prev) => prev || matched || usersData[0]);
      }

      if (itmData.length > 0 && selectedItemId === 0) setSelectedItemId(itmData[0].id);
      if (locData.length > 0 && selectedLocId === 0) {
        setSelectedLocId(locData[0].id);
        if (locData.length > 1) setTargetLocId(locData[1].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
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
      }
      setShowModal(false);
      setTxQty(5);
      setTxReason('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
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

  const milestones: Milestone[] = [
    {
      id: 'sprint-1',
      title: 'Foundation, Environment & Skeletons',
      sprint: 'Sprint 1',
      status: 'completed',
      description: 'SQLite WAL mode, FastAPI health API, React+Vite SPA, typed client, and unified backend/ai/ module.',
      deliverables: ['Clean repository', 'SQLite WAL mode', 'FastAPI health endpoints', 'Vite + React + TS', 'AI SBA/Croston engine'],
    },
    {
      id: 'sprint-2',
      title: 'Core Inventory & Ledger Transactions',
      sprint: 'Sprint 2',
      status: 'completed',
      description: 'Master items, append-only stock movement ledger, atomic balance sync, over-issue rejection, paired transfers, and integrity check.',
      deliverables: ['Atomic post_movement service', 'CHECK quantity >= 0', 'Over-issue rejection (400)', 'Paired transfers', '0-mismatch integrity check', 'Seed dataset', 'Modular UI tables'],
    },
    {
      id: 'sprint-3',
      title: 'Procurement & Purchase Order Lifecycle',
      sprint: 'Sprint 3',
      status: 'completed',
      description: 'Draft PO creation, approval workflow, supplier terms, and partial/full goods receiving linked to stock movements ledger.',
      deliverables: ['PO state machine', 'Partial goods receiving', 'Over-receipt prohibition (400)', 'Ledger append & balance sync', 'Interactive Procurement UI'],
    },
    {
      id: 'sprint-4',
      title: 'AI Intermittent Demand & Replenishment Integration',
      sprint: 'Sprint 4',
      status: 'completed',
      description: 'Connecting intermittent demand models (Croston/SBA) and safety stock policies directly to live inventory for replenishment proposals.',
      deliverables: ['Zero-leakage demand extractor', 'Croston / SBA statistical models', 'Risk-based order-up-to policies', 'Human-in-the-loop recommendation approval', 'Atomic Draft PO generation', 'React AI Insights screen'],
    },
    {
      id: 'sprint-5',
      title: 'End-to-End Workflow Verification & Golden Demo',
      sprint: 'Sprint 5',
      status: 'completed',
      description: 'Comprehensive automated integration test suite validating zero-leakage replenishment, draft PO conversion, and ledger reconciliation.',
      deliverables: ['Automated test_golden_flow', 'Over-issue rejection (400)', 'Zero-mismatch final audit reconciliation', 'Multi-scenario verification script'],
    },
    {
      id: 'sprint-6',
      title: 'Workspace Ergonomics, User Directory & Authentic Ledger Audit',
      sprint: 'Sprint 6',
      status: 'completed',
      description: 'Flexible collapsible rail sidebar, streamlined top header with search/notifications, database users directory, and non-repudiable audit ledger attribution.',
      deliverables: ['Collapsible rail sidebar (localStorage persisted)', 'Streamlined header with / search & notifications', 'Database users directory & role breakdown UI', 'Non-repudiable actor_label attribution on all transactions', 'Interactive employee switcher'],
    },
  ];

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
          onOpenModal={() => { setModalType('RECEIPT'); setShowModal(true); }}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
          users={users}
          currentUser={currentUser}
          onSelectUser={handleSelectUser}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />

        {error && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: '#f87171', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <AlertTriangle style={{ width: 16, height: 16 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', color: '#34d399', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <CheckCircle2 style={{ width: 16, height: 16 }} />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="content-body">
          {activeTab === 'inventory' && (
            <InventoryView
              items={items}
              onAction={(itemId, type) => {
                setSelectedItemId(itemId);
                setModalType(type);
                setShowModal(true);
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === 'ledger' && (
            <OperationsView
              ledger={ledger}
              items={items}
              locations={locations}
              onRefresh={fetchData}
              onOpenMovementModal={(type) => {
                setModalType(type);
                setShowModal(true);
              }}
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
                setActiveTab('procurement');
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
            />
          )}
          {activeTab === 'users' && (
            <UsersView
              users={users}
              currentUser={currentUser}
              onSelectUser={handleSelectUser}
              ledger={ledger}
              onNavigateTab={(tab) => setActiveTab(tab)}
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
              onNavigateTab={(tab) => setActiveTab(tab as any)}
              onOpenMovementModal={() => { setModalType('RECEIPT'); setShowModal(true); }}
              onInspectRec={(rec) => setInspectingRec(rec)}
            />
          )}
          {activeTab === 'sprint' && <SprintView milestones={milestones} />}
          {activeTab === 'diagnostics' && <DiagnosticsView readiness={readiness} />}
        </div>
      </main>

      {showModal && (
        <MovementModal
          modalType={modalType}
          setModalType={setModalType}
          items={items}
          locations={locations}
          selectedItemId={selectedItemId}
          setSelectedItemId={setSelectedItemId}
          selectedLocId={selectedLocId}
          setSelectedLocId={setSelectedLocId}
          targetLocId={targetLocId}
          setTargetLocId={setTargetLocId}
          txQty={txQty}
          setTxQty={setTxQty}
          txReason={txReason}
          setTxReason={setTxReason}
          adjustmentDirection={adjDirection}
          setAdjustmentDirection={setAdjDirection}
          destinationLabel={destinationLabel}
          setDestinationLabel={setDestinationLabel}
          onClose={() => setShowModal(false)}
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
    </div>
  );
};

export default App;
