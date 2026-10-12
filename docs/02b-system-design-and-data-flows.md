# StockSense — System Design Charts & Data Flow Diagrams

> **Document:** 02b of 05  
> **Status:** Visual Architecture Reference  
> **Focus:** End-to-end component topology, transactional workflows, and AI data flows.

---

## 1. System Topology & Architectural Layers

StockSense implements a clean, decoupled modular architecture where the **deterministic inventory ledger** is strictly isolated from the **probabilistic AI advisory engine**.

```mermaid
flowchart TB
    subgraph Presentation [1. Client Presentation Tier]
        UI[React 18 SPA + Vite 5]
        Theme[Industrial Dark Slate Design System]
        Client[Central Typed API Client client.ts]
        UI --- Theme
        UI --> Client
    end

    subgraph Gateway [2. API & Routing Tier]
        FastAPI[FastAPI Modular Monolith]
        CORS[CORS & Lifespan Handler]
        Pydantic[Pydantic v2 Schema Validation]
        FastAPI --- CORS
        FastAPI --- Pydantic
    end

    subgraph Domain [3. Application & Service Tier]
        InvSvc[Inventory Service<br/>• Post Movement<br/>• Integrity Check<br/>• Over-Issue Rejection]
        ProcSvc[Procurement Service<br/>• PO Lifecycle<br/>• Partial Receiving<br/>• Audit Attribution]
        AISvc[AI Advisory Service<br/>• Demand Classifier<br/>• Croston / SBA<br/>• Monte Carlo Policy<br/>• ReplenishmentAgent]
    end

    subgraph Persistence [4. Data & Persistence Tier]
        SQLA[SQLAlchemy 2.0 ORM]
        DB[(SQLite in WAL Mode)]
        Ledger[(stock_movements<br/>• Append-Only Audit Trail)]
        Balances[(stock_balances<br/>• Transactional Running Cache<br/>• CHECK qty >= 0)]
        AITables[(ai_runs, forecasts,<br/>recommendations, policies)]
        
        SQLA --> DB
        DB --- Ledger
        DB --- Balances
        DB --- AITables
    end

    Client -->|HTTP REST JSON| FastAPI
    FastAPI --> InvSvc
    FastAPI --> ProcSvc
    FastAPI --> AISvc
    InvSvc --> SQLA
    ProcSvc --> SQLA
    AISvc --> SQLA
```

---

## 2. Core Stock Transaction Data Flow (Receipt & Issue)

All physical stock changes pass through a single, authoritative transactional pipeline. Balances are never modified directly; every change requires an append-only ledger record.

```mermaid
sequenceDiagram
    autonumber
    actor User as Storekeeper / App
    participant API as FastAPI Router (/api/v1/inventory/movements)
    participant Svc as InventoryService (post_movement)
    participant DB as SQLite Transaction (WAL Mode)
    participant Balance as stock_balances
    participant Ledger as stock_movements

    User->>API: POST /movements (item_id, loc_id, type, qty, idempotency_key)
    API->>Svc: Validate DTO & invoke post_movement()
    
    alt Movement Type is ISSUE
        Svc->>Balance: Query current quantity_on_hand
        alt quantity_on_hand < requested_qty
            Svc-->>API: Raise HTTP 400 (Over-Issue Rejection)
            API-->>User: 400 Bad Request: Insufficient Stock
        end
    end

    Svc->>DB: BEGIN IMMEDIATE TRANSACTION
    Svc->>Ledger: INSERT INTO stock_movements (append-only audit log)
    Svc->>Balance: UPDATE stock_balances SET quantity_on_hand = Q + ΔQ
    
    Note over DB,Balance: DB constraint: CHECK (quantity_on_hand >= 0)
    
    alt Balance >= 0
        DB->>DB: COMMIT TRANSACTION
        Svc-->>API: Return updated balance & movement record
        API-->>User: 201 Created (JSON Movement Response)
    else Engine Check Violation
        DB->>DB: ROLLBACK TRANSACTION
        Svc-->>API: Raise IntegrityError
        API-->>User: 400 Bad Request: Invariant Violation
    end
```

---

## 3. Double-Entry Inter-Location Transfer Data Flow

Transfers between physical locations (e.g., Central Warehouse `WH-01` to Rig Site `RIG-01`) execute atomically as paired double-entry ledger rows sharing a single `transfer_group_id`.

```mermaid
flowchart TD
    Start([Initiate Stock Transfer]) --> Val{Validate Source Stock<br/>WH-01 On-Hand >= Transfer Qty?}
    
    Val -- No --> Rej[Reject with HTTP 400<br/>Insufficient Source Stock]
    
    Val -- Yes --> TxBegin[BEGIN TRANSACTION]
    
    TxBegin --> GenUUID[Generate unique transfer_group_id]
    
    GenUUID --> Leg1[Append Movement Leg 1:<br/>TRANSFER_OUT from WH-01<br/>quantity_change = -N]
    GenUUID --> Leg2[Append Movement Leg 2:<br/>TRANSFER_IN to RIG-01<br/>quantity_change = +N]
    
    Leg1 --> Bal1[Update WH-01 Balance:<br/>Q_source = Q_source - N]
    Leg2 --> Bal2[Update RIG-01 Balance:<br/>Q_dest = Q_dest + N]
    
    Bal1 --> Commit[COMMIT TRANSACTION]
    Bal2 --> Commit
    
    Commit --> InvariantCheck[Conservation of Stock Invariant:<br/>Total System Stock Unchanged]
    InvariantCheck --> End([Transfer Complete])
```

---

## 4. AI Advisory Replenishment & Decision Pipeline

The AI engine takes historical observations, classifies intermittency, runs debiased forecasting, simulates policy targets, and produces explainable proposals for human review.

```mermaid
flowchart TB
    subgraph Input [1. Historical Observations]
        Movements[(Historical Issues<br/>from stock_movements)]
        Cutoff[Time-Safe Cutoff Filter<br/>Timestamp <= Cutoff Date]
        Movements --> Cutoff
        Cutoff --> WeeklySeries[Weekly Demand Aggregation]
    end

    subgraph Intelligence [2. AI Statistical Engine]
        WeeklySeries --> Classifier{Demand Classifier<br/>Calculate ADI & CV²}
        
        Classifier -->|Smooth / Regular| SES[Single Exponential Smoothing / MA8]
        Classifier -->|Intermittent / Lumpy| SBA[Syntetos-Boylan Approximation SBA]
        
        SBA --> Forecast[Point Demand Rate Forecast]
        SES --> Forecast
        
        Forecast --> Policy[Inventory Policy Engine<br/>• Lead Time Distribution<br/>• Safety Stock SS<br/>• Order-Up-To Level OUT]
    end

    subgraph Advisory [3. Decision Support & Human Review]
        Policy --> Position{Check Inventory Position<br/>NetStock <= ROP?}
        Position -- No --> NoAction[No Reorder Needed]
        Position -- Yes --> Proposal[Generate Advisory Recommendation<br/>• Calculate ROQ<br/>• Apply Supplier MOQ & Multiples<br/>• Build explanation_json]
        
        Proposal --> RecQueue[(recommendations Table<br/>Status: OPEN)]
        
        RecQueue --> ReviewUI[React Review Dashboard]
        
        ReviewUI --> HumanDecision{Procurement Officer<br/>Decision}
        HumanDecision -- Dismiss --> Dismissed[Status: DISMISSED<br/>Record Reason]
        HumanDecision -- Approve --> CreatePO[Atomic Transaction:<br/>Status: APPROVED<br/>INSERT purchase_orders]
    end
```

---

## 5. Purchase Order Lifecycle & Goods Receiving Data Flow

Purchase orders manage the inbound procurement pipeline. Receiving updates the stock ledger atomically and prohibits over-receiving.

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Created manually or via AI recommendation approval
    
    DRAFT --> APPROVED: Procurement Officer approves terms & pricing
    DRAFT --> CANCELLED: Dismissed or cancelled prior to issuance
    
    APPROVED --> PARTIALLY_RECEIVED: Warehouse receives partial shipment (qty < ordered)
    APPROVED --> RECEIVED: Warehouse receives full shipment (qty == ordered)
    
    PARTIALLY_RECEIVED --> RECEIVED: Subsequent delivery completes remaining quantity
    
    APPROVED --> CANCELLED: Allowed only if zero quantity received
    
    RECEIVED --> [*]: Goods in warehouse, stock balance updated
    CANCELLED --> [*]: PO closed with zero stock changes
```

### Goods Receiving Sequence:

```mermaid
sequenceDiagram
    autonumber
    actor Storekeeper as Storekeeper
    participant UI as PO Detail Screen
    participant API as /api/v1/po/{id}/receive
    participant Svc as ProcurementService
    participant Inv as InventoryService
    participant DB as SQLite DB

    Storekeeper->>UI: Input received quantity for PO line
    UI->>API: POST /receive (po_line_id, qty_received, destination_location_id)
    API->>Svc: Validate remaining quantity
    
    alt Received Qty > Remaining Qty
        Svc-->>API: 400 Bad Request: Over-receipt prohibited
        API-->>UI: Display Error Alert
    else Valid Quantity
        Svc->>DB: BEGIN TRANSACTION
        Svc->>Inv: post_movement(type=RECEIPT, qty=+N, po_id=po.id)
        Inv->>DB: Append stock_movements & increment stock_balances
        Svc->>DB: Update po_lines.quantity_received += N
        Svc->>DB: Re-evaluate PO status (PARTIALLY_RECEIVED or RECEIVED)
        DB->>DB: COMMIT TRANSACTION
        Svc-->>API: Updated PO & Line Status
        API-->>UI: Success: Stock updated & PO line refreshed
    end
```

---

## 6. Zero-Leakage Time Cutoff Evaluation Data Flow

To ensure scientific validity, model evaluation prevents any data from the holdout testing period from leaking into feature extraction or model selection.

```mermaid
gantt
    title Chronological Time-Safe Evaluation Split
    dateFormat  YYYY-MM-DD
    section Historical Data
    Training Split (t <= t_cutoff)       :active, t1, 2025-10-01, 2026-06-01
    Validation Holdout (t_cutoff < t)    :crit, t2, 2026-06-02, 2026-09-01
    Out-of-Sample Test Window           :crit, t3, 2026-09-02, 2026-10-01
```

```mermaid
flowchart LR
    Dataset[(Complete Historical Ledger)] --> SplitFilter{Time Cutoff Filter<br/>t <= 2026-06-01}
    
    SplitFilter --> TrainData[Training Features]
    Dataset -.-> HoldoutData[Isolated Holdout Ground Truth]
    
    TrainData --> ModelFit[Fit Croston / SBA / Baselines]
    ModelFit --> Predict[Generate h-week Forecasts]
    
    Predict --> MetricEngine[Evaluator Engine<br/>Compare Predict vs HoldoutData]
    HoldoutData --> MetricEngine
    
    MetricEngine --> Metrics[Out-of-Sample Metrics:<br/>• Mean Absolute Error MAE<br/>• Root Mean Squared Error RMSE<br/>• Forecast Bias]
    
    Metrics --> AuditLog[(backtest_results Table)]
```

---

## 7. Ledger vs. Balance Integrity Reconciliation Flow

The system provides an automated audit endpoint that verifies the mathematical equivalence between the append-only ledger and current running balances.

```mermaid
flowchart TD
    Req([GET /api/v1/inventory/integrity-check]) --> Query1[Query 1: Sum Ledger Movements<br/>SELECT item_id, location_id, SUM quantity_change<br/>FROM stock_movements<br/>GROUP BY item_id, location_id]
    
    Req --> Query2[Query 2: Read Current Balances<br/>SELECT item_id, location_id, quantity_on_hand<br/>FROM stock_balances]
    
    Query1 --> Reconcile{Reconciliation Engine<br/>Compare Ledger Sum vs Balance On-Hand}
    Query2 --> Reconcile
    
    Reconcile -->|Every Pair Matches| Clean[mismatches_count = 0<br/>Status: HEALTHY / AUDIT_PASSED]
    Reconcile -->|Discrepancy Found| Mismatch[mismatches_count > 0<br/>Status: CORRUPTED<br/>List Discrepant Items & Deltas]
    
    Clean --> Resp([Return IntegrityReport JSON])
    Mismatch --> Resp
```
