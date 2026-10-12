import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from './api/client';
import {
  HealthResponse, ReadyResponse, InventoryItem, InventoryLocation,
  StockMovement, IntegrityCheckResponse, Milestone,
} from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { InventoryView } from './components/InventoryView';
import { LedgerView } from './components/LedgerView';
import { OverviewView } from './components/OverviewView';
import { SprintView } from './components/SprintView';
import { DiagnosticsView } from './components/DiagnosticsView';
import { MovementModal } from './components/MovementModal';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'ledger' | 'sprint' | 'diagnostics'>('inventory');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [readiness, setReadiness] = useState<ReadyResponse | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [ledger, setLedger] = useState<StockMovement[]>([]);
  const [integrity, setIntegrity] = useState<IntegrityCheckResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'RECEIPT' | 'ISSUE' | 'TRANSFER'>('RECEIPT');
  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [selectedLocId, setSelectedLocId] = useState<number>(0);
  const [targetLocId, setTargetLocId] = useState<number>(0);
  const [txQty, setTxQty] = useState<number>(5);
  const [txReason, setTxReason] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [hData, rData, itmData, locData, ledgData, integData] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getReadiness().catch(() => null),
        api.getItems().catch(() => []),
        api.getLocations().catch(() => []),
        api.getLedger(30).catch(() => []),
        api.getIntegrityCheck().catch(() => null),
      ]);
      setHealth(hData);
      setReadiness(rData);
      setItems(itmData);
      setLocations(locData);
      setLedger(ledgData);
      setIntegrity(integData);
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
    try {
      if (modalType === 'TRANSFER') {
        const res = await api.transferStock({
          item_id: selectedItemId, from_location_id: selectedLocId,
          to_location_id: targetLocId, quantity: txQty,
          reason: txReason || 'Field site transfer',
        });
        setSuccessMsg(`Transfer of ${res.quantity} units executed! Group: ${res.transfer_group_id.slice(0, 8)}`);
      } else {
        const res = await api.postMovement({
          item_id: selectedItemId, location_id: selectedLocId,
          movement_type: modalType, quantity: txQty,
          reason: txReason || `Manual ${modalType.toLowerCase()}`,
        });
        setSuccessMsg(`Movement #${res.id} (${res.movement_type} ${res.quantity} units) recorded!`);
      }
      setShowModal(false);
      setTxQty(5);
      setTxReason('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
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

  const handleOpenActionModal = (itemId: number, type: 'RECEIPT' | 'ISSUE' | 'TRANSFER') => {
    setSelectedItemId(itemId);
    setModalType(type);
    setShowModal(true);
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
      status: 'queued',
      description: 'Draft PO creation, approval workflow, supplier terms, and partial/full goods receiving.',
      deliverables: ['PO state machine', 'Partial goods receiving', 'Over-receipt prohibition'],
    },
  ];

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        itemsCount={items.length}
        ledgerCount={ledger.length}
        health={health}
      />

      <main className="main-content">
        <Header
          activeTab={activeTab}
          integrity={integrity}
          loading={loading}
          onRefresh={fetchData}
          onRunAudit={handleRunIntegrityCheck}
          onOpenModal={() => { setModalType('RECEIPT'); setShowModal(true); }}
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
          {activeTab === 'inventory' && <InventoryView items={items} onAction={handleOpenActionModal} />}
          {activeTab === 'ledger' && <LedgerView ledger={ledger} onRefresh={fetchData} />}
          {activeTab === 'overview' && <OverviewView itemsCount={items.length} movementsCount={ledger.length} locationsCount={locations.length} />}
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
          onClose={() => setShowModal(false)}
          onSubmit={handleTransaction}
        />
      )}
    </div>
  );
};

export default App;
