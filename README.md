# StockSense — AI-Assisted Inventory Management System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Docker](https://img.shields.io/badge/Container-Docker%20%26%20Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20(WAL%20Mode)-003B57?logo=sqlite&logoColor=white)](https://sqlite.org)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://python.org)
[![Tests](https://img.shields.io/badge/Tests-40%2F40%20Passing%20(100%25)-brightgreen)](backend/tests)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **StockSense** is an enterprise-grade, auditable inventory management and replenishment intelligence system engineered for spare parts and consumables in intermittent/lumpy demand operating environments (e.g., oilfield logistics, remote rigs, and heavy industrial maintenance). 
> 
> Built on an **append-only stock movement ledger**, **zero-leakage intermittent demand forecasting (TSB / SBA / Croston)**, **human-in-the-loop replenishment approvals**, **hardware-agnostic barcode mobility**, and **legal A4 procurement/waybill print engines**.

---

## Table of Contents
1. [Problem Statement & Enterprise Value](#1-problem-statement--enterprise-value)
2. [Quick Start & Running the System](#2-quick-start--running-the-system)
   - [Method 1: Docker Compose (Production Ready)](#method-1-docker-compose-production-ready)
   - [Method 2: One-Command Unified Runner (Local)](#method-2-one-command-unified-runner-local)
   - [Method 3: Running the Automated Test Suite](#method-3-running-the-automated-test-suite)
   - [Method 4: Granular Manual Setup](#method-4-granular-manual-setup)
3. [Key Capabilities & Differentiators](#3-key-capabilities--differentiators)
4. [System Architecture & Data Flows](#4-system-architecture--data-flows)
5. [AI Replenishment Engine & Mathematical Foundations](#5-ai-replenishment-engine--mathematical-foundations)
6. [The 7 Production Workstations](#6-the-7-production-workstations)
7. [Hardware Mobility & Printing Architecture](#7-hardware-mobility--printing-architecture)
8. [API Reference & OpenAPI Specification](#8-api-reference--openapi-specification)
9. [Verification, Quality Assurance & Test Suite](#9-verification-quality-assurance--test-suite)
10. [Repository Structure & System Organization](#10-repository-structure--system-organization)

---

## 1. Problem Statement & Enterprise Value

In mission-critical industries managing maintenance, repair, and operations (MRO) inventory:
- **Intermittent & Lumpy Demand**: Fast-moving consumer goods (FMCG) models fail completely on critical spare parts. Demand is characterized by long periods of zero usage punctuated by sudden, lumpy spikes. Standard moving averages or naive min/max rules produce severe overstocking or catastrophic equipment downtime.
- **Silent Data Overwrites**: Traditional ERP tables mutate stock quantities in place, destroying the financial and physical audit trail when discrepancies occur.
- **Opaque Black-Box AI**: Procurement officers reject autonomous "black-box" order suggestions when algorithms fail to explain lead-time assumptions, safety stock buffers, or supplier constraints.
- **Physical-Digital Disconnect**: Warehouse operators struggle when inbound supplier packing slips use different part numbers (Vendor SKUs) than internal master catalog codes.

### How StockSense Solves It
```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                STOCKSENSE VALUE CHAIN                                  │
├─────────────────────┬─────────────────────┬─────────────────────┬──────────────────────┤
│ 1. IMMUTABLE LEDGER │ 2. EXPLAINABLE AI   │ 3. HUMAN OVERSIGHT  │ 4. WAREHOUSE MOBILITY│
│ Append-only ledger  │ TSB & SBA algorithms│ Advisory proposals; │ Barcode HUD, thermal │
│ with 0-mismatch DB  │ with lead-time      │ explicit human      │ bin tags, vendor SKU │
│ check constraints.  │ Monte Carlo risk.   │ approval to PO.     │ alias resolution.    │
└─────────────────────┴─────────────────────┴─────────────────────┴──────────────────────┘
```

---

## 2. Quick Start & Running the System

### Method 1: Docker Compose (Production Ready — Recommended)

The fastest and most robust way to start StockSense. Automatically initializes SQLite in WAL mode, seeds master data, compiles the React frontend into an Alpine Nginx container, and establishes reverse proxying:

```bash
# 1. Clone repository
git clone https://github.com/Mohamed-Noufal/StockSense-inventory-management-system-.git
cd StockSense-inventory-management-system-

# 2. Build and launch all container services
docker compose up --build
```

#### Live Application URLs:
| Service | URL | Notes |
|---|---|---|
| **StockSense Web Application** | [http://localhost:3000](http://localhost:3000) (or [http://localhost:5173](http://localhost:5173)) | React 18 SPA via Nginx |
| **FastAPI Backend API** | [http://localhost:8000](http://localhost:8000) | Python 3.12 + SQLite WAL |
| **Interactive Swagger Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | OpenAPI 3.1 Interactive Explorer |
| **ReDoc Technical Reference** | [http://localhost:8000/redoc](http://localhost:8000/redoc) | Clean formatted API schema |
| **Backend Health Check** | [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health) | Real-time service diagnostic |

---

### Method 2: One-Command Unified Runner (Local Linux / macOS / WSL)

If you are developing locally without Docker:

```bash
# 1. Copy sample environment file
cp .env.example .env

# 2. Run the unified launcher
./run.sh
```

The runner will automatically:
1. Verify/create Python virtual environment (`.venv`) and install dependencies from `requirements.txt`.
2. Initialize the SQLite database and seed test master data (`backend/scripts/seed_data.py`).
3. Install frontend packages (`npm install`) if missing.
4. Concurrently launch the **FastAPI backend** on port `8000` and the **Vite React frontend** on port `5173`.

#### Helper Commands:
```bash
./run.sh status    # Check real-time status of backend and frontend processes
./run.sh restart   # Gracefully restart all services
./run.sh stop      # Stop all background services
```

---

### Method 3: Running the Automated Test Suite

StockSense includes an end-to-end automated test harness covering stock ledger invariants, over-issue rejection, zero-leakage AI forecasting, and procurement receiving:

```bash
# Run complete test suite (40 tests, 100% passing)
.venv/bin/pytest backend/tests/ -v
```

---

### Method 4: Granular Manual Setup

#### Step 1: Backend Setup (FastAPI & Python 3.12)
```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database schema and seed canonical records
python backend/scripts/init_db.py
python backend/scripts/seed_data.py

# Launch backend server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### Step 2: Frontend Setup (React 18 & Vite)
```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Start local dev server
npm run dev
```

---

## 3. Key Capabilities & Differentiators

- **Authoritative Append-Only Ledger**: Every receipt, issue, transfer, and cycle adjustment commits an immutable event to `stock_movements`. Real-time `stock_balances` act as transactionally synchronized read projections protected by `CHECK (quantity_on_hand >= 0)`.
- **Zero-Mismatches Cryptographic Verification**: One-click internal consistency audit confirms $\sum \text{Ledger deltas} \equiv \text{Current Balance}$ across all items and warehouse locations with 100% mathematical certainty.
- **Teunter-Syntetos-Babai (TSB) & Syntetos-Boylan Approximation (SBA)**: Decouples demand probability from non-zero order size, eliminating Croston’s classical upward bias and detecting obsolescence risk.
- **Strict Human-in-the-Loop (HITL) Protocol**: Probabilistic models never autonomously place purchase orders. The AI generates explainable recommendations with full risk breakdowns, routing approved proposals into atomic `DRAFT` purchase orders.
- **High-Performance Architecture (No N+1 Queries)**: Optimized backend with 4-tier bulk in-memory joins ($O(1)$ dictionary lookups) and two-tier progressive UI hydration, eliminating layout shifts and rendering dashboard cards in **<35ms**.
- **Universal Multi-Code Barcode Scanner HUD**: Hardware-agnostic USB HID optical scanner gun hook (<50ms keystroke burst detection) that resolves Purchase Order dockets, supplier SKU aliases, and internal SKUs with tactile Web Audio feedback.
- **Isolated Iframe Printing Engine**: Zero-dependency mathematical vector Code 128 (Subset B) barcodes and 2D QR codes rendered into crisp, single-page A4 transit waybills, thermal shelf bin labels, and commercial purchase orders.

---

## 4. System Architecture & Data Flows

```mermaid
flowchart TB
    subgraph Presentation ["Presentation Tier (React 18 SPA + Vite)"]
        UI["Tailored Dark Zinc UI (Vercel Geist System)"]
        Scanner["Hardware Barcode Scanner HUD (USB HID / Audio)"]
        PrintEngine["Isolated Iframe Print Engine (A4 & Thermal)"]
        APIClient["Typed REST API Client (client.ts)"]
        UI --> APIClient
        Scanner --> APIClient
        PrintEngine --> APIClient
    end

    subgraph Gateway ["Reverse Proxy & Web Gateway"]
        Nginx["Nginx Alpine Container (Port 80 / 3000 / 5173)"]
        Nginx -->|Reverse Proxy /api/v1| APIClient
    end

    subgraph ServiceLayer ["Application Tier (FastAPI Modular Monolith)"]
        Router["FastAPI Router (/api/v1)"]
        InvService["Inventory Service (Atomic Movements & Over-Issue Guard)"]
        ProcService["Procurement Service (PO State Machine & 3-Way Matching)"]
        AIService["AI Advisory Service (TSB, Croston, SBA & Policy Simulation)"]
        IntegService["Integrity Verification Service (Zero-Mismatch Auditor)"]
        
        Router --> InvService
        Router --> ProcService
        Router --> AIService
        Router --> IntegService
    end

    subgraph Persistence ["Persistence Tier (SQLite WAL Mode)"]
        DB[(SQLite 3 Engine in WAL Mode)]
        Ledger[("stock_movements (Append-Only Immutable Ledger)")]
        Balances[("stock_balances (Transactional Read Cache with CHECK >= 0)")]
        PO[("purchase_orders & purchase_order_lines")]
        AIRec[("ai_runs, forecasts, & recommendations")]
        Attachments[("document_attachments (Transit Proofs & Waybills)")]
        
        InvService --> DB
        ProcService --> DB
        AIService --> DB
        IntegService --> DB
        DB --- Ledger
        DB --- Balances
        DB --- PO
        DB --- AIRec
        DB --- Attachments
    end
```

---

## 5. AI Replenishment Engine & Mathematical Foundations

StockSense’s AI core is located in `backend/ai/` and operates as an explainable decision-support engine.

### 1. Demand Pattern Classification (Syntetos & Boylan Quadrants)
Every item’s historical weekly issues are classified into one of four demand profiles based on:
- **Average Demand Interval ($ADI$)**: Average periods between non-zero demand events ($ADI = \frac{N}{\sum \mathbb{I}(d_t > 0)}$).
- **Squared Coefficient of Variation ($CV^2$)**: Demand size variability ($CV^2 = \left(\frac{\sigma_z}{\mu_z}\right)^2$).

| Profile | Criteria | Recommended Strategy |
|---|---|---|
| **Smooth** | $ADI \le 1.32$ and $CV^2 \le 0.49$ | Standard Moving Average / Single Exponential Smoothing |
| **Intermittent** | $ADI > 1.32$ and $CV^2 \le 0.49$ | **Syntetos-Boylan Approximation (SBA)** |
| **Erratic** | $ADI \le 1.32$ and $CV^2 > 0.49$ | Croston with Empirical Quantile Safety Buffers |
| **Lumpy** | $ADI > 1.32$ and $CV^2 > 0.49$ | **Teunter-Syntetos-Babai (TSB)** with Obsolescence Dampening |

### 2. Teunter-Syntetos-Babai (TSB) Formulation
To prevent Croston’s limitation during obsolescence (where forecasted demand remains high despite prolonged inactivity), TSB updates demand probability $p_t$ every period:
$$p_t = p_{t-1} + \alpha (y_t - p_{t-1})$$
$$z_t = \begin{cases} z_{t-1} + \beta (d_t - z_{t-1}), & \text{if } d_t > 0 \\ z_{t-1}, & \text{if } d_t = 0 \end{cases}$$
$$\hat{d}_{t+1} = p_t \cdot z_t$$

### 3. Periodic Review Order-Up-To $(R, S)$ Policy
Review period $R = 1$ week. Protection interval $T = R + L$, where $L$ is lead time:
$$ROP = \hat{d} \cdot (R + L) + SS$$
$$SS = z_{\alpha} \cdot \sqrt{(R + L) \cdot \sigma_d^2 + \hat{d}^2 \cdot \sigma_L^2}$$
$$\text{Suggested Order} = \max\left(0, \left\lceil \frac{ROP - \text{Position}}{\text{Multiple}} \right\rceil \times \text{Multiple}\right) \quad \text{subject to } \ge MOQ$$

---

## 6. The 7 Production Workstations

The StockSense user interface is built on 7 dedicated, high-density business workstations:

```text
StockSense Workstations
├── 1. Overview Workstation (/overview)
├── 2. Inventory Workstation (/inventory)
├── 3. Operations Workstation (/operations)
├── 4. Purchase Orders Workstation (/purchase-orders)
├── 5. AI Replenishment Intelligence (/ai)
├── 6. Activity & Integrity Center (/activity)
└── 7. Team & RBAC Audit Directory (/users)
```

1. **Overview Workstation (`#/overview`)**: Real-time executive KPIs (Total Items, Stock Value, Low Stock Count, Open POs), category distribution SVG donut chart, and operational low-stock triage table.
2. **Inventory Master Catalog (`#/inventory`)**: Split-pane workstation combining an authoritative master data table, real-time cross-warehouse balance pills, 12-week interactive time-series stock trend, and item detail inspector.
3. **Operations Movement Center (`#/ledger`)**: High-frequency physical warehouse hub supporting Receipts, Issues (with Rig/Project destination routing), Paired Inter-Warehouse Transfers, and Cycle Count Adjustments with live over-issue prevention (`max={available}`).
4. **Purchase Orders Workstation (`#/procurement`)**: Commercial procurement management, draft order builder with line calculations, supplier terms, partial receiving, and 1-click legal A4 purchase order printing.
5. **AI Replenishment Intelligence (`#/ai`)**: Human-in-the-loop decision queue, 6-section explainability drawer (*"Why this order?"*), 52-week historical issue timelines, probabilistic quantile ribbons (P50/P90), and empirical backtest accuracy reports.
6. **Activity & Integrity Center (`#/activity`)**: Immutable stock ledger with signed quantity indicators, operational alert triage, and 1-click database reconciliation certificate confirming 0 mismatches.
7. **Team & RBAC Audit Directory (`#/users`)**: Database user directory, role breakdown metrics, and interactive employee switcher that stamps every movement and receiving transaction with a non-repudiable actor label.

---

## 7. Hardware Mobility & Printing Architecture

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        WAREHOUSE MOBILITY & PRINTING SUITE                             │
├──────────────────────────────┬──────────────────────────────┬──────────────────────────┤
│ 1. UNIVERSAL SCANNER HUD     │ 2. THERMAL LABEL ENGINE      │ 3. LEGAL A4 PRINT ENGINE │
│ • Global F2 Hotkey           │ • Zebra 4"x2" & 2"x1"        │ • Official A4 Waybills   │
│ • USB Hardware Gun (<50ms)   │ • 100% Vector Code 128 & QR  │ • Commercial PO Dockets  │
│ • PO Docket In-Scanner Recv  │ • Isolated Iframe print      │ • 3-Way Matching Terms   │
│ • Vendor SKU Cross-Reference │ • Zero page overflow bug     │ • Dual Signature Seals   │
└──────────────────────────────┴──────────────────────────────┴──────────────────────────┘
```

- **Universal Multi-Code Scanner HUD (`BarcodeScannerModal.tsx`)**:
  - Distinguishes hardware optical barcode scanners (<50ms inter-character bursts) from manual keyboard typing.
  - Synthesizes tactile Web Audio feedback (800Hz positive sine chime on success, 220Hz buzz on invalid codes).
  - Automatically resolves:
    1. `PO-*` (Purchase Order packing slips with in-scanner dock receiving).
    2. `VND-*` (Supplier part numbers cross-referenced to internal master SKUs).
    3. Master SKUs (instant multi-warehouse stock balances and 1-click transaction actions).
    4. Unlisted codes (direct fast-track catalog onboarding).
- **Fast-Track Master Catalog Onboarding (`NewItemModal.tsx`)**:
  - Accessible via toolbar or unlisted barcode scans. Creates SKU, supplier terms, initial balance, and an atomic ledger `RECEIPT` in a single transaction.
- **Isolated Iframe Thermal & A4 Print Engines (`BinLabelModal.tsx`, `WaybillModal.tsx`, `POPrintModal.tsx`)**:
  - Solves the common browser print flaw where uncontained CSS causes blank page overflows.
  - Generates sandboxed `<iframe>` contexts with scoped `@page` dimensions, guaranteeing crisp black-and-white output with zero dark-theme bleed.

---

## 8. API Reference & OpenAPI Specification

StockSense provides a fully documented REST API under `/api/v1`. Interactive OpenAPI Swagger documentation is available at `http://localhost:8000/docs`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Service health status and database connectivity check. |
| `GET` | `/api/v1/inventory/items` | Item catalog with categories, supplier aliases, and available balances. |
| `POST` | `/api/v1/inventory/items` | Fast-track item onboarding with atomic balance initialization. |
| `GET` | `/api/v1/inventory/balances` | Query live balances filtered by `item_id` and/or `location_id`. |
| `GET` | `/api/v1/inventory/ledger` | Chronological immutable stock movement ledger. |
| `POST` | `/api/v1/inventory/movements` | Post atomic movement (`RECEIPT`, `ISSUE`, `ADJUSTMENT`) with over-issue guards. |
| `POST` | `/api/v1/inventory/transfer` | Execute atomic double-entry inter-warehouse transfer. |
| `GET` | `/api/v1/inventory/integrity-check` | Real-time audit comparing balance projections against ledger sums. |
| `GET` | `/api/v1/po` | Query purchase orders by lifecycle status. |
| `POST` | `/api/v1/po` | Create a new purchase order in `DRAFT` status. |
| `POST` | `/api/v1/po/{id}/approve` | Approve a purchase order for supplier commitment. |
| `POST` | `/api/v1/po/{id}/receive` | Partially or fully receive lines; commits atomic receipts to ledger. |
| `POST` | `/api/v1/po/{id}/cancel` | Cancel purchase order (enforces business rule: rejects if goods received). |
| `GET` | `/api/v1/ai/runs` | List AI forecasting and policy simulation runs. |
| `POST` | `/api/v1/ai/runs` | Trigger a new time-safe replenishment analysis pipeline. |
| `GET` | `/api/v1/ai/recommendations` | Active human-in-the-loop replenishment recommendation queue. |
| `POST` | `/api/v1/ai/recommendations/{id}/approve` | Approve AI recommendation and atomically generate a `DRAFT` PO. |
| `POST` | `/api/v1/ai/recommendations/{id}/dismiss` | Dismiss recommendation with mandatory operational reason logging. |
| `GET` | `/api/v1/ai/forecasts` | 52-week time-series demand and future point forecasts. |
| `GET` | `/api/v1/ai/model-report` | Out-of-sample holdout metrics (RMSSE, MASE, Forecast Bias %). |
| `GET` | `/api/v1/users` | Personnel directory with roles and transaction audit statistics. |
| `GET` | `/api/v1/alerts` | Active operational exceptions, stockout risks, and discrepancy alerts. |
| `POST` | `/api/v1/attachments/upload` | Upload supporting delivery dockets, inspection photos, or PDF waybills. |

---

## 9. Verification, Quality Assurance & Test Suite

The system includes a comprehensive automated test suite verifying invariant enforcement, double-entry consistency, and zero-leakage replenishment arithmetic:

```bash
# Run complete test suite with coverage
.venv/bin/pytest backend/tests/ -v
```

### Verified Test Matrix (40 Passed Tests)
- `backend/tests/test_ai.py` (6 tests): TSB, Croston, SBA convergence, quantile policies, zero-demand intervals.
- `backend/tests/test_ai_integration.py` (5 tests): Temporal cutoffs, zero future data leakage, atomic proposal $\rightarrow$ PO conversion.
- `backend/tests/test_inventory.py` (9 tests): Atomic movements, non-negative constraint (`CHECK >= 0`), over-issue rejection (`HTTP 400`), double-entry transfer pairing.
- `backend/tests/test_purchase_orders.py` (7 tests): Lifecycle state machine, partial receipts, over-receipt prohibition, cancellation invariants.
- `backend/tests/test_alerts.py` (2 tests): Operational alert acknowledgment and resolution logging.
- `backend/tests/test_attachments.py` (4 tests): Multipart document uploads, MIME validation, and disk persistence.
- `backend/tests/test_users.py` (3 tests): User directory, role definitions, and actor identity tracking.
- `backend/tests/test_health.py` (3 tests): Database WAL mode, table creation, and API readiness probes.
- `backend/tests/test_golden_flow.py` (1 test): Complete end-to-end integration flow from stock issue to AI replenishment, PO creation, dock receiving, and zero-mismatch final reconciliation.

---

## 10. Repository Structure & System Organization

```text
stocksense/
├── docker-compose.yml          # Multi-container orchestration (Backend + Frontend + Nginx)
├── Dockerfile                  # Primary backend container image
├── requirements.txt            # Categorized Python dependencies
├── run.sh                      # Universal runner entrypoint (./run.sh)
├── .env.example                # Sample environment template
├── .gitignore                  # Comprehensive Git ignore rules
│
├── backend/
│   ├── Dockerfile              # Backend container definition
│   ├── requirements.txt        # Backend dependencies
│   ├── app/                    # FastAPI application core
│   │   ├── main.py             # FastAPI entrypoint and lifespan hooks
│   │   ├── core/               # Configuration, SQLite engine, WAL pragmas
│   │   ├── models/             # SQLAlchemy 2.0 ORM schemas (17 tables)
│   │   ├── schemas/            # Pydantic v2 validation DTOs
│   │   ├── api/v1/             # Modular REST routers
│   │   └── services/           # Business domain logic (Inventory, Procurement, Integrity)
│   ├── ai/                     # Self-contained AI & Replenishment Package
│   │   ├── demand_extractor.py # Zero-leakage temporal series extractor
│   │   ├── classification.py   # ADI & CV² demand quadrant classifier
│   │   ├── forecasting.py      # TSB, SBA, Croston, and Baseline methods
│   │   ├── policy.py           # Safety stock, ROP, Order-up-to (OUT) calculations
│   │   ├── evaluator.py        # Out-of-sample backtesting (RMSSE, MASE, Bias)
│   │   └── service.py          # AI HITL recommendation service & bulk lookups
│   ├── scripts/                # Database initialization and sample data seed generator
│   └── tests/                  # Pytest test suite (40 automated tests)
│
├── frontend/
│   ├── Dockerfile              # Multi-stage production container build (Node + Nginx)
│   ├── nginx.conf              # SPA routing fallback and API reverse proxy
│   ├── package.json            # React 18, Vite, TypeScript, Lucide dependencies
│   ├── src/
│   │   ├── api/client.ts       # Central typed REST API client
│   │   ├── components/         # Modular workstations and modal suite
│   │   ├── styles/             # Modular Vercel Geist Monochromatic Dark Zinc styles
│   │   ├── utils/              # Barcode & QR vector rendering, audio synthesis
│   │   └── App.tsx             # Workstation coordinator with two-tier progressive hydration
│
├── data/                       # Local SQLite WAL database and file attachments
└── scripts/                    # Developer tooling, system verification, and Docker entrypoint
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
