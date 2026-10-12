export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  environment: string;
  database: {
    status: string;
    engine: string;
    journal_mode: string;
    foreign_keys: boolean;
  };
  timestamp: string;
}

export interface ReadyResponse {
  status: 'ready' | 'not_ready';
  tables_initialized: boolean;
  table_counts: Record<string, number>;
  default_warehouse: string | null;
}

export interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  category_id: number;
  uom: string;
  unit_cost_minor: number;
  criticality: 'CRITICAL' | 'STANDARD' | 'LOW';
  is_active: number;
  total_on_hand: number;
}

export interface InventoryLocation {
  id: number;
  code: string;
  name: string;
  location_type: string;
  is_default_replenishment: number;
  is_active: number;
}

export interface StockBalance {
  item_id: number;
  location_id: number;
  quantity_on_hand: number;
  updated_at: string;
  item_sku?: string;
  item_name?: string;
  location_code?: string;
}

export interface StockMovement {
  id: number;
  item_id: number;
  location_id: number;
  movement_type: 'RECEIPT' | 'ISSUE' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'ADJUSTMENT';
  quantity: number;
  project_id: number | null;
  transfer_group_id: string | null;
  reason: string | null;
  actor_label: string;
  occurred_at: string;
  item_sku?: string;
  location_code?: string;
}

export interface MovementCreatePayload {
  item_id: number;
  location_id: number;
  movement_type: 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT';
  quantity: number;
  reason?: string;
  project_id?: number;
  actor_label?: string;
}

export interface TransferCreatePayload {
  item_id: number;
  from_location_id: number;
  to_location_id: number;
  quantity: number;
  reason?: string;
  actor_label?: string;
}

export interface IntegrityCheckResponse {
  status: string;
  total_items_checked: number;
  total_locations_checked: number;
  mismatches_count: number;
  mismatches: Array<{
    item_id: number;
    location_id: number;
    balance_on_hand: number;
    ledger_sum: number;
    difference: number;
  }>;
  timestamp: string;
}

export interface Milestone {
  id: string;
  title: string;
  sprint: string;
  status: 'completed' | 'in_progress' | 'queued';
  description: string;
  deliverables: string[];
}
