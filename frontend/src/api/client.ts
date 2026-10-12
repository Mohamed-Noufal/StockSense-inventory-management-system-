import {
  HealthResponse, ReadyResponse, InventoryItem, InventoryLocation,
  StockBalance, StockMovement, MovementCreatePayload, TransferCreatePayload,
  IntegrityCheckResponse, Supplier, PurchaseOrder, POCreatePayload, POReceivePayload
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
  getItems: () => request<InventoryItem[]>('/inventory/items'),
  getLocations: () => request<InventoryLocation[]>('/inventory/locations'),
  getBalances: (itemId?: number, locationId?: number) => {
    const params = new URLSearchParams();
    if (itemId) params.append('item_id', String(itemId));
    if (locationId) params.append('location_id', String(locationId));
    const qs = params.toString();
    return request<StockBalance[]>(`/inventory/balances${qs ? `?${qs}` : ''}`);
  },
  getLedger: (limit = 50, offset = 0, movementType?: string) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (movementType) params.append('movement_type', movementType);
    return request<StockMovement[]>(`/inventory/ledger?${params.toString()}`);
  },
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
};

