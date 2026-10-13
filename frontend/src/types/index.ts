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

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: 'STOREKEEPER' | 'PROCUREMENT_OFFICER' | 'MANAGER' | 'ADMIN';
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  category_id: number;
  category_name?: string;
  warehouse_name?: string;
  uom: string;
  unit_cost_minor: number;
  criticality: 'CRITICAL' | 'STANDARD' | 'LOW';
  is_active: number;
  total_on_hand: number;
  reserved_qty?: number;
  available_qty?: number;
  reorder_point?: number;
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
  item_name?: string;
  location_code?: string;
  route_display?: string;
  reference_display?: string;
  status?: string;
}

export interface MovementCreatePayload {
  item_id: number;
  location_id: number;
  movement_type: 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT';
  quantity: number;
  adjustment_direction?: 'SURPLUS' | 'SHRINKAGE';
  destination_label?: string;
  reason?: string;
  project_id?: number;
  actor_label?: string;
}

export interface OperationsStats {
  timeframe_days: number;
  issues_count: number;
  issues_trend_pct: number;
  transfers_count: number;
  transfers_trend_pct: number;
  receipts_count: number;
  receipts_trend_pct: number;
  adjustments_count: number;
  adjustments_trend_pct: number;
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

export interface Supplier {
  id: number;
  name: string;
  country?: string;
  contact_email?: string;
  is_import: number;
  is_active: number;
}

export interface PurchaseOrderLine {
  id: number;
  po_id: number;
  item_id: number;
  destination_location_id: number;
  qty_ordered: number;
  qty_received: number;
  remaining_quantity: number;
  unit_price_minor: number;
  created_at: string;
  item_sku?: string;
  item_name?: string;
  location_code?: string;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name?: string;
  status: 'DRAFT' | 'APPROVED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  created_at: string;
  order_date?: string;
  expected_date?: string;
  notes?: string;
  source_recommendation_id?: number | null;
  lines: PurchaseOrderLine[];
  total_lines: number;
  total_amount_minor: number;
}

export interface POLineCreatePayload {
  item_id: number;
  destination_location_id: number;
  qty_ordered: number;
  unit_price_minor: number;
}

export interface POCreatePayload {
  supplier_id: number;
  po_number?: string;
  expected_date?: string;
  notes?: string;
  lines: POLineCreatePayload[];
}

export interface POReceivePayload {
  po_line_id: number;
  quantity_received: number;
  destination_location_id?: number;
  idempotency_key?: string;
  actor_label?: string;
}

export interface AIRun {
  id: number;
  run_type: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  data_cutoff: string;
  random_seed: number;
  model_version: string;
  recommendations_count: number;
  error?: string | null;
}

export interface AIRecommendation {
  id: number;
  run_id: number;
  item_id: number;
  supplier_id: number;
  destination_location_id: number;
  status: 'OPEN' | 'APPROVED' | 'DISMISSED' | 'EXPIRED';
  urgency: 'CRITICAL' | 'HIGH' | 'NORMAL';
  on_hand: number;
  on_order: number;
  inventory_position: number;
  reorder_point: number;
  suggested_qty: number;
  explanation_json: string;
  summary_text: string;
  created_at: string;
  item_sku?: string;
  item_name?: string;
  supplier_name?: string;
  location_code?: string;
  demand_pattern?: string;
  forecast_method?: string;
  created_po_id?: number;
  created_po_number?: string;
}

export interface AIRunTriggerPayload {
  data_cutoff?: string;
  random_seed?: number;
  service_level?: number;
  default_method?: string;
}

export interface AlertItem {
  id: number;
  alert_type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  item_id?: number | null;
  item_sku?: string | null;
  item_name?: string | null;
  location_id?: number | null;
  location_code?: string | null;
  movement_id?: number | null;
  source_run_id?: number | null;
  message: string;
  details_json?: string | null;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  created_at: string;
  acknowledged_by_user_id?: number | null;
  acknowledged_by_name?: string | null;
  acknowledged_at?: string | null;
  resolved_by_user_id?: number | null;
  resolved_by_name?: string | null;
  resolved_at?: string | null;
}

export interface AlertAcknowledgePayload {
  user_id?: number;
  notes?: string;
}

export interface AlertResolvePayload {
  user_id?: number;
  resolution_notes?: string;
}

export interface DocumentAttachment {
  id: number;
  entity_type: 'MOVEMENT' | 'PURCHASE_ORDER';
  entity_id: number;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  description?: string | null;
  uploaded_by_user_id?: number | null;
  uploaded_by_name?: string | null;
  created_at: string;
  download_url?: string;
}



