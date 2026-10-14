import {
  HealthResponse, ReadyResponse, InventoryItem, InventoryLocation,
  StockBalance, StockMovement, MovementCreatePayload, TransferCreatePayload,
  OperationsStats, IntegrityCheckResponse, Supplier, PurchaseOrder, POCreatePayload, POReceivePayload,
  AIRun, AIRecommendation, AIRunTriggerPayload, User, AlertItem, AlertAcknowledgePayload, AlertResolvePayload,
  DocumentAttachment, ItemCreatePayload, Category
} from '../types';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    let errMsg = `Request failed with status ${res.status}`;
    try {
      const errData = await res.json();
      if (errData.detail) errMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
    } catch {
      // fallback to status text
    }
    throw new ApiError(res.status, errMsg);
  }
  return res.json();
}

export const api = {
  getHealth: () => request<HealthResponse>('/health'),
  getReadiness: () => request<ReadyResponse>('/ready'),
  getUsers: () => request<User[]>('/users'),
  getCurrentUser: () => request<User>('/users/me'),
  getItems: () => request<InventoryItem[]>('/inventory/items'),
  createItem: (payload: ItemCreatePayload) =>
    request<InventoryItem>('/inventory/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCategories: () => request<Category[]>('/inventory/categories'),
  getLocations: () => request<InventoryLocation[]>('/inventory/locations'),
  getBalances: (itemId?: number, locationId?: number) => {
    const params = new URLSearchParams();
    if (itemId) params.append('item_id', String(itemId));
    if (locationId) params.append('location_id', String(locationId));
    const qs = params.toString();
    return request<StockBalance[]>(`/inventory/balances${qs ? `?${qs}` : ''}`);
  },
  getLedger: (limit = 50, offset = 0, movementType?: string, itemId?: number) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (movementType) params.append('movement_type', movementType);
    if (itemId) params.append('item_id', String(itemId));
    return request<StockMovement[]>(`/inventory/ledger?${params.toString()}`);
  },
  getOperationsStats: (days = 7) => request<OperationsStats>(`/inventory/operations/stats?days=${days}`),
  postMovement: (payload: MovementCreatePayload) =>
    request<StockMovement>('/inventory/movements', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  transferStock: (payload: TransferCreatePayload) =>
    request<{ transfer_group_id: string; out_id: number; in_id: number; quantity: number }>(
      '/inventory/transfer',
      { method: 'POST', body: JSON.stringify(payload) }
    ),
  getIntegrityCheck: () => request<IntegrityCheckResponse>('/inventory/integrity-check'),
  getSuppliers: () => request<Supplier[]>('/po/suppliers'),
  getPurchaseOrders: (status?: string) =>
    request<PurchaseOrder[]>(`/po${status && status !== 'ALL' ? `?status=${status}` : ''}`),
  getPurchaseOrder: (id: number) => request<PurchaseOrder>(`/po/${id}`),
  createPurchaseOrder: (payload: POCreatePayload) =>
    request<PurchaseOrder>('/po', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  approvePurchaseOrder: (id: number) =>
    request<PurchaseOrder>(`/po/${id}/approve`, {
      method: 'POST',
    }),
  receivePOLine: (id: number, payload: POReceivePayload) =>
    request<PurchaseOrder>(`/po/${id}/receive`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  cancelPurchaseOrder: (id: number) =>
    request<PurchaseOrder>(`/po/${id}/cancel`, {
      method: 'POST',
    }),
  triggerAIRun: (payload: AIRunTriggerPayload = {}) =>
    request<AIRun>('/ai/runs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getAIRuns: () => request<AIRun[]>('/ai/runs'),
  getAIRecommendations: (status?: string) =>
    request<AIRecommendation[]>(`/ai/recommendations${status && status !== 'ALL' ? `?status=${status}` : ''}`),
  approveRecommendation: (id: number) =>
    request<PurchaseOrder>(`/ai/recommendations/${id}/approve`, {
      method: 'POST',
    }),
  dismissRecommendation: (id: number, decisionNote: string) =>
    request<AIRecommendation>(`/ai/recommendations/${id}/dismiss`, {
      method: 'POST',
      body: JSON.stringify({ action: 'DISMISS', decision_note: decisionNote }),
    }),
  getAIRun: (id: number) => request<AIRun>(`/ai/runs/${id}`),
  getItemForecast: (itemId: number, horizon = 12) =>
    request<any>(`/ai/forecasts?item_id=${itemId}&horizon=${horizon}`),
  getModelReport: () => request<any>('/ai/model-report'),
  getAlerts: (severity?: string, status?: string) => {
    const params = new URLSearchParams();
    if (severity && severity !== 'ALL') params.append('severity', severity);
    if (status && status !== 'ALL') params.append('status', status);
    const qs = params.toString();
    return request<AlertItem[]>(`/alerts${qs ? `?${qs}` : ''}`);
  },
  acknowledgeAlert: (id: number, payload: AlertAcknowledgePayload = {}) =>
    request<AlertItem>(`/alerts/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  resolveAlert: (id: number, payload: AlertResolvePayload = {}) =>
    request<AlertItem>(`/alerts/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getAttachments: (entityType?: string, entityId?: number) => {
    const params = new URLSearchParams();
    if (entityType) params.append('entity_type', entityType);
    if (entityId !== undefined) params.append('entity_id', entityId.toString());
    const qs = params.toString();
    return request<DocumentAttachment[]>(`/attachments${qs ? `?${qs}` : ''}`);
  },
  uploadAttachment: async (
    file: File,
    entityType: 'MOVEMENT' | 'PURCHASE_ORDER',
    entityId: number,
    description?: string,
    uploadedByName?: string
  ): Promise<DocumentAttachment> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_type', entityType);
    formData.append('entity_id', entityId.toString());
    if (description) formData.append('description', description);
    if (uploadedByName) formData.append('uploaded_by_name', uploadedByName);

    const res = await fetch(`${API_BASE}/attachments/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      let errMsg = `Upload failed with status ${res.status}`;
      try {
        const errData = await res.json();
        if (errData.detail) errMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      } catch {}
      throw new ApiError(res.status, errMsg);
    }
    return res.json();
  },
};


