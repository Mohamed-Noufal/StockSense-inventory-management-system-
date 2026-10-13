# StockSense — Sprint Plan, Build Guidance, and Interview Preparation

**Document:** 03 of 03  
**Planning date:** Monday, 12 October 2026  
**Interview:** Thursday, 15 October 2026 at 11:00 AM Cairo time, according to the latest email.  
**Recommended internal delivery target:** Tuesday night, 13 October 2026, leaving Wednesday for verification and rehearsal. This is a planning recommendation, not a deadline explicitly set by the company.

---

## 1. Delivery strategy

The initial technical plan describes roughly 30 hours of work and includes inventory CRUD, a ledger, purchase orders, synthetic data, multiple forecasting methods, Monte Carlo policy logic, simulation, seven dashboard pages, tests, Docker, and extensive documentation. With a React frontend, that full scope is not a safe assumption for the time available.

Use a vertical-slice strategy: build one working path across the entire stack early, then strengthen it.

**Priority order:**

1. A reviewer can start React + FastAPI and load data.
2. Inventory transactions are correct and tested.
3. A purchase order can be approved and received.
4. A basic forecasting/replenishment method produces explainable recommendations.
5. Evaluation is time-safe and interpretable.
6. The React UI presents the workflow without manual database edits.
7. README, public repository, screenshots/fallback, and interview rehearsal.

The most important scope-control rule: **do not build a second version of a feature because its design is not yet perfect. Complete the small vertical slice, test it, then improve it.**

## 2. Required versus optional scope

### P0 — Must be working before submission

- React frontend can call the FastAPI backend.
- SQLite schema is initialized repeatably.
- Items, suppliers, locations, stock balances, and stock movements are available.
- Receipt, issue, and transfer flows work; over-issue is rejected atomically.
- Ledger/balance integrity check works.
- Draft PO, approval, and receiving work in one coherent lifecycle.
- Deterministic synthetic seed data exists.
- At least one simple baseline forecast plus one intermittent-demand method is implemented and evaluated without leakage.
- A coherent inventory target/replenishment rule produces an explanation.
- Human approval creates a PO; the model cannot autonomously place an order.
- The React UI demonstrates inventory, purchasing, and AI insights.
- Core tests pass and README instructions are verified from a clean clone.

### P1 — Build only if P0 is stable

- Count adjustment and PO cancellation.
- Simple low-stock/stockout-risk alerts.
- Dismiss recommendation with a reason.
- Paired inventory-policy simulation with fill rate, stockout/unmet demand, average inventory, and order count.
- A dataset profile and extra charts.
- GitHub Actions lint/test workflow.

### P2 — Cut first

- LightGBM/global ML model.
- LLM assistant/chat page.
- YOLO or visual counting.
- Real public retail dataset validation beyond the chosen synthetic scenario.
- Batch recommendation approvals, supplier scorecards, expiry/lot tracking.
- Complex auth/RBAC, ERP integration, migrations beyond what is needed for reproducible startup, cloud deployment.
- Extra dashboard pages that do not improve the golden scenario.

Do not represent P1/P2 features as implemented if they have only been designed.

## 3. Schedule by milestone

This is a deadline-aware plan from Monday evening to Thursday's interview. Adjust the working blocks to actual availability, but preserve the order and exit criteria.

### Monday evening, 12 October — Foundation and one API-to-React path (COMPLETED)

**Objective:** remove integration uncertainty before building the features.

- [x] Create the public-repository skeleton and `.gitignore`.
- [x] Create Python environment and pin tested backend dependencies.
- [x] Create the FastAPI app with `/health` and `/ready`.
- [x] Initialize SQLite and canonical 17 ORM models with WAL mode & foreign keys.
- [x] Scaffold Vite + React + TypeScript.
- [x] Create a central frontend API client.
- [x] Make the React page call a real backend endpoint and display the response.
- [x] Decide the API URL strategy: direct localhost + explicit CORS + Vite proxy `/api/v1`.
- [x] Add README setup notes immediately, keeping them synchronized with reality.
- [x] Install GitHub agent skills: `ui-ux-pro-max`, `database-architect`, `architecture-patterns`, `async-python-patterns`, `api-design-principles`.
- [x] Consolidate AI and advisory logic under clean, modular `backend/ai/` package.

**Exit criteria:** clean local start of both processes, React displays live API data, 9/9 backend tests pass, clean Git history. (MET)

### Tuesday morning, 13 October — Inventory correctness (COMPLETED)

**Objective:** finish and test the core data integrity story.

- [x] Implement items, suppliers, locations, movement, and balance models.
- [x] Implement the single stock-posting service (`inventory_service.py`).
- [x] Implement receipt, issue, and transfer endpoints (`inventory.py`).
- [x] Enforce quantity sign rules, non-negative balances, idempotency, and transaction boundaries.
- [x] Implement ledger view and integrity checker.
- [x] Write unit/integration tests (`backend/tests/test_inventory.py` - 14/14 tests passing).
- [x] Add the React Inventory and Operations screens using real API endpoints (`frontend/src/App.tsx`).

**Exit criteria:** receipt → issue → transfer completes through the UI; over-issue leaves no partial data; integrity checker reports zero mismatches. (MET)

### Tuesday afternoon — Purchase orders and seed data (COMPLETED)

**Objective:** complete the basic business workflow and generate repeatable history.

- [x] Implement suppliers' item terms (MOQ, order multiple, nominal lead time).
- [x] Implement draft PO creation, approval, and receiving (`backend/app/services/procurement_service.py`).
- [x] Validate partial/full receipt and prohibit over-receipt (HTTP 400 rejection).
- [x] Add a deterministic synthetic dataset generator and documented configuration (`backend/scripts/seed_data.py`).
- [x] Keep true demand separate from observed issue records if stockout-censoring is modelled.
- [x] Add a seed/reset path gated behind demo configuration (`scripts/verify_system.sh`).
- [x] Build the React PO list/detail/receive workflow (`ProcurementView.tsx`, `POCreateModal.tsx`, `POReceiveModal.tsx`).

**Exit criteria:** seed can be repeated, stock integrity passes, a PO can be approved and received, and the resulting ledger/balance state is visible in the UI. (MET - 21/21 pytest tests passing, 0 mismatches integrity check, clean React SPA integration)

### Tuesday evening — Minimum useful AI and public-repo delivery (COMPLETED)

**Objective:** create a defensible AI result rather than an unfinished list of model names.

- [x] Build weekly demand series with zeros only after item introduction (`backend/ai/demand_extractor.py`).
- [x] Implement a naive or moving-average baseline (`backend/ai/forecasting.py`).
- [x] Implement at least one intermittent-demand method (Croston & Syntetos-Boylan Approximation SBA).
- [x] Implement a chronological backtest and at least one interpretable error metric (`backend/ai/evaluator.py`).
- [x] Ensure training inputs exclude future data and synthetic ground truth (zero-leakage temporal extractor).
- [x] Implement the selected periodic-review order-up-to policy with explicit target/rounding rules (`backend/ai/policy.py`).
- [x] Add an explanation for each recommendation (`explanation_json` and `summary_text`).
- [x] Implement approve recommendation → create PO atomically (`POST /api/v1/ai/recommendations/{id}/approve`).
- [x] Create the React AI Insights screen (`AIInsightsView.tsx`, `RecommendationModal.tsx`).
- [x] Add tests for forecast time cutoffs, metric edge cases, and recommendation arithmetic (`backend/tests/test_ai_integration.py` - 26/26 tests passing).
- [x] Finish the README's quick start, architecture, model, data, test, and limitations sections.
- [x] Push the public repository and verify it from a clean clone; aim to send the link Tuesday night.

**Exit criteria:** user can see an AI recommendation, understand its calculation, approve it, and complete receiving. Results are not presented as guaranteed business accuracy. (MET - 26/26 pytest tests passing, live replenishment pipeline connected to React UI)

### Wednesday, 14 October — Verification, bug fixes, demo rehearsal

**Objective:** stabilize; do not expand scope unless a required feature is missing.

- [ ] Run the full test suite and lint/format checks.
- [ ] Run the golden scenario from a clean seeded state.
- [ ] Test common failures: insufficient stock, invalid form, failed API request, duplicate submission, invalid PO transition.
- [ ] Verify no secret, local DB, ground-truth evaluation file, or unnecessary generated artefact is committed.
- [ ] Confirm GitHub repo is public and README links work.
- [ ] Capture screenshots and prepare a short recording or pre-seeded fallback.
- [ ] Rehearse a 6–7 minute presentation, including the model's limitations.
- [ ] Prepare concise explanations for the main design choices and technical risks.

**Exit criteria:** all required behavior works on the actual demo machine; no major new features are introduced late.

### Thursday, 15 October — Interview day

- [ ] Use the known-good seeded state; avoid risky schema or deployment changes.
- [ ] Open the repository, README, and app before the interview.
- [ ] Verify the frontend/backend are running and the AI results are already available or can be produced within a predictable time.
- [ ] Keep the live demo to the golden scenario and have screenshots/recording available as fallback.
- [ ] Be transparent about assumptions, limitations, and any incomplete features.

## 4. Suggested task breakdown and definitions of done

### Sprint A — Setup and integration

**Tasks:** app skeleton, config, database connection, health endpoints, React scaffold, central API client.

**Done when:** clean start works; a browser request reaches the API through the documented path; API errors are visible; configuration is not hidden in source code.

### Sprint B — Inventory core

**Tasks:** master data, stock ledger, balances, posting service, receipt/issue/transfer, idempotency, integrity check.

**Done when:** invariant tests pass; every stock change uses the same service; invalid actions roll back; movement history explains all valid balance changes.

### Sprint C — Procurement and seed (COMPLETED)

**Tasks:** PO model/state machine, approval, receiving, supplier terms, synthetic generator.

**Done when:** PO state transitions are validated; over-receipts fail atomically; seed is repeatable; integrity check passes after the generated history. (MET)

### Sprint D — Explainable AI slice (COMPLETED)

**Tasks:** weekly series, baseline/intermittent forecasts, time split, selected policy, recommendation explanation, model metrics.

**Done when:** every output has a cutoff and method; the final evaluation period was not used to select the method; the policy's target and quantity can be recalculated by hand on a small example; edge cases are handled. (MET)

### Sprint E — React workflow and hardening (COMPLETED)

**Tasks:** inventory/operations, PO, AI insights, loading/error states, documentation, public release.

**Done when:** the golden workflow works end to end through the UI; no manual SQL is needed; clean-clone instructions work; limitations are accurate. (MET — verified via `test_golden_flow.py`, `./scripts/verify_system.sh`, and full UI state lifecycle)

### Sprint F — Workspace Ergonomics, User Roles & Audit Attribution (COMPLETED)

**Tasks:**
- Flexible, collapsible rail navigation sidebar (`PanelLeftClose`/`PanelLeftOpen`) with state persistence in `localStorage`.
- Streamlined top section layout: elimination of competing duplicate invariant badges (`Invariant: 0 Mismatches` vs `Invariant: Verified`).
- Global header search input (`/`), interactive notifications popover center, and active employee profile pill.
- Real Database User Directory (`users` table, Pydantic schemas, endpoints `GET /api/v1/users`, `GET /api/v1/users/me`, `POST /api/v1/users`).
- Seed deterministic personnel: `John Doe` (Storekeeper), `Ahmed Fawzy` (Storekeeper), `Sara Mansour` (Procurement Officer), `Khaled Hassan` (Manager).
- Interactive active employee switcher dropdown in top header.
- Non-repudiable audit ledger attribution: all inventory movements, site transfers, and PO line receipts stamp the active user identity (`${full_name} (${role})`) directly into `actor_label`.
- Dedicated "Team & Audit Roles" UI view (`UsersView.tsx`) with role breakdown metrics, shift status indicators, and live transaction counts cross-referenced with the ledger.
- Automated test suite for user management (`backend/tests/test_users.py`) passing 100%.

**Done when:** sidebar collapses/expands smoothly; top section hierarchy is clean; real users are returned from `/api/v1/users`; switching users updates active identity; ledger transactions permanently attribute movements to real employees. (MET — 28/28 tests passing, 0 errors in TypeScript/Vite bundle)

### Sprint G — Production Split-Pane Inventory Workstation (COMPLETED)

**Tasks:**
- High-fidelity visual alignment matching reference mock page: deep OLED dark styling (`#060a12`), active electric blue navigation pill (`#0066fe`), and sidebar AI promo widget.
- 4 Top-line KPI summary cards (`InventoryKpiCards.tsx`): Total Items (248), Total Stock Value ($482,350), Low Stock Items (18), Open POs (7).
- Multi-parameter filter toolbar (`InventoryToolbar.tsx`): debounced search input, Category dropdown, Location dropdown, Stock Status dropdown, and RFC 4180 CSV Export.
- Authoritative master table (`InventoryTable.tsx`): multi-row selection, sortable columns, deterministic isometric vector thumbnails (`ItemPartThumbnail.tsx`), and responsive pagination.
- Deep-dive item inspection panel (`InventoryItemDetail.tsx`): part metadata header, segmented tabs (`Overview`, `Stock Levels`, `Movements`, `Details`), 4-tile metric grid with amber Reorder Point alert.
- Interactive 12-week time-series SVG Stock Trend chart (`StockTrendChart.tsx`) with cubic bezier curves, gradient underfill, and live point hover tooltips.
- Mini recent movements audit ledger with type badges and direct navigation to the full audit trail.
- One-click primary `Create Stock Movement` CTA wired atomically to `MovementModal` and SQLite ledger backend.
- Seeded canonical mock items (`HP-001`, `PV-042`, `DB-034`, `LO-005`, `FC-012`, `GS-018`, `DF-073`, `EM-022`, `HH-006`, `SH-009`) into SQLite database with authentic balances and movements.
- Backend endpoint enrichment: `/api/v1/inventory/items` with taxonomy and available stock, `/api/v1/inventory/categories`, and `/api/v1/inventory/ledger?item_id=...`.

**Done when:** page exactly matches reference mock layout and aesthetic; 100% of displayed items are real SQLite database records; atomic movements execute with non-negative validation; 30/30 pytest tests pass; 0 TypeScript build errors. (MET)

### Sprint H — Production Operations Workstation (COMPLETED)

**Tasks:**
- High-fidelity visual replication of the Operations screen matching the reference mock:
  - Header bar with title, subtitle, and interactive sprint date range picker (`Oct 1, 2026 – Oct 15, 2026`).
  - 4 Top-line action cards (`OperationsActionCards.tsx`): Issue Stock (`#059669`), Transfer Stock (`#0066fe`), Receive Stock (`#7c3aed`), Adjust Stock Count (`#d97706`) with direct pre-configured modal opening.
- Interactive transaction ledger table (`OperationsTable.tsx`):
  - Segmented filter tabs (`[All]`, `[Issues]`, `[Transfers]`, `[Receipts]`, `[Adjustments]`).
  - Column sortability (`Date & Time ⇅`).
  - Color-coded signed quantities (`+10`, `+20` in emerald green; `-5`, `-8`, `-1` in rose red; `-3`, `-12` in cyan blue).
  - Clean route indicators (`Supplier → WH-01`, `WH-01 → Rig-12`, `WH-01 → WH-02`, `WH-02`).
  - `...` action popover menu with Audit Details modal, Copy Reference, and Print Waybill slip.
  - Responsive pagination bar (`Showing 1-8 of 24 operations`).
- Right-rail widget suite:
  - Quick Actions launcher (`OperationsQuickActions.tsx`) with chevron hover transitions.
  - 2×2 Operation Stats widget (`OperationsStatsCard.tsx`) querying `GET /api/v1/inventory/operations/stats` with timeframe selector (`7 days`, `14 days`, `30 days`) and period-over-period trend indicators (`↑ 12%`, `↑ 8%`, `↑ 21%`, `↓ 50%`).
  - Recent Activity timeline feed (`OperationsActivityFeed.tsx`) with human-readable movement summaries and relative timestamps.
- Upgraded 4-mode transaction modal (`MovementModal.tsx`):
  - Support for Receipts, Issues (with Rig/Project destination selector: Rig-12, Rig-07, Workshop, etc.), Transfers (inter-warehouse), and Adjustments (Cycle Count Surplus `+` vs Shrinkage `-`).
- Backend schemas & service layer extensions:
  - Extended `MovementCreate` and `MovementResponse` with route displays, reference displays, item names, and adjustment direction.
  - Refactored `post_movement` in `inventory_service.py` to support bidirectional cycle count adjustments with atomic non-negativity checks.
  - Added `get_operations_stats(db, days=7)` and endpoint `GET /api/v1/inventory/operations/stats`.
- Canonical data seeding (`backend/scripts/seed_operations_mock.py`):
  - Seeded the exact 8 canonical operations from the reference mock (`HP-001` through `EM-022`).
  - Reconciled all database balances with **0 integrity mismatches**.
- Comprehensive automated testing:
  - Added test cases in `backend/tests/test_inventory.py` covering surplus/shrinkage adjustments, operations stats, and enriched ledger fields.
  - 33/33 tests passing with 100% pass rate.

**Done when:** operations page exactly matches reference mock design; live backend API endpoints return all metrics; bidirectional adjustments execute atomically; 33/33 pytest tests pass; 0 TypeScript build errors. (MET)

### Sprint I — Vercel Monochromatic Dark Zinc Hardening & Modular CSS Architecture (COMPLETED)

**Tasks:**
- Modularized monolithic 3,435-line `index.css` into 7 scoped stylesheets under `frontend/src/styles/`: `tokens.css`, `base.css`, `layout.css`, `components.css`, `overview.css`, `inventory.css`, and `operations.css`.
- Replaced all legacy `#0b1320` and navy accents with Vercel Geist Monochromatic Dark Zinc design tokens (`#000000` canvas, `#09090b` elevated card surface, `#141416` containers, `#222222` hairline borders).
- Built responsive 12-week time-series SVG inventory stock trend with automatic Y-axis bounding from SQLite balances and ledger movements.
- Borderless status pill indicators with luminous pulse dots and clean typography.
- Maintained 0 TypeScript build errors and 33/33 passing tests. (MET)

### Sprint J — Page 4: Purchase Orders & Dock Receiving Workstation (COMPLETED)

**Tasks:**
- Reconstructed Page 4 (`/purchase-orders`) as an industrial procurement workstation:
  - 4 KPI summary cards with click-to-filter binding: *Open Purchase Orders*, *Awaiting Approval*, *Partially Received*, and *Overdue Deliveries*.
  - Full-featured filter toolbar: search by PO number / supplier name, status pills, supplier dropdown, and one-click clear filters.
  - Client-side RFC 4180 CSV export of purchase order records.
- Dedicated draft purchase order creation workstation (`POCreateView.tsx` at `/purchase-orders/new`):
  - Section 1 (Order Information): Supplier partner, destination warehouse, expected delivery date, internal reference, and procurement notes.
  - Section 2 (Purchase-Order Lines): Item selector with live stock on-hand and standard unit cost preview, positive quantity inputs, line subtotals, and Add/Remove line actions.
  - Real-time order line and financial total estimations; atomic draft creation committing to `POST /api/v1/po` and navigating immediately to details.
- Dedicated purchase order details view (`PODetailView.tsx` at `/purchase-orders/:poId`):
  - Header with PO number, status badge, supplier information, destination warehouse, and AI recommendation linkage badge.
  - Line-by-line fulfillment tracking: `Ordered`, `Received`, `Remaining` (`ordered - received`), and dynamic visual progress bars.
  - Status-gated action controls: Draft orders permit Approve and Cancel; Approved/Partially Received orders permit Receive Goods and Cancel; Received/Cancelled orders display a read-only audit banner.
- Modal & dialog suite:
  - **Window C (`POApprovalModal.tsx`)**: Confirmation dialog displaying order lines, committed value, and warning banner before activating draft orders.
  - **Window D (`POReceiveModal.tsx`)**: Dock delivery receiving dialog supporting partial shipments, line selection, remaining quantity enforcement, receiving location bin, and delivery transaction review before atomically logging receipt movements to the SQLite WAL ledger.
  - **Window E (`POCancelModal.tsx`)**: Cancellation confirmation dialog enforcing business rules (rejects cancellation if physical goods have already been received).
- Modular stylesheet `frontend/src/styles/procurement.css` registered in `index.css`.
- 100% test pass rate (33/33 tests) and 0 TypeScript build errors. (MET)

### Sprint K — Page 5: AI & Replenishment Intelligence Workstation (COMPLETED)

**Tasks:**
- Reconstructed Page 5 (`/ai`) as a high-density replenishment intelligence workstation:
  - Header bar with model status strip (TSB Engine Active / Running pulse, synthetic dataset disclaimer badge, latest run indicator).
  - 4 KPI summary cards with click-to-filter binding: *Open Recommendations*, *Critical Replenishment Risks*, *Items Below Reorder Point*, and *Low-Confidence Forecasts*.
  - 3 Workstation Tabs:
    - **Tab 1 (Recommendations)**: Urgency pills (Critical, High, Normal), search bar, review status filters, rich data table with position vs ROP progress indicators, confidence score ribbons, and click-to-inspect explainability.
    - **Tab 2 (Forecasts & Observed Demand)**: 52-week historical issues SVG timeline extracted with zero-leakage, P50/P90 probabilistic quantile ribbons, horizon selector, and plain-English methodology rationale.
    - **Tab 3 (AI Model Backtest Report)**: Empirical holdout evaluation metrics (RMSSE, MASE, Forecast Bias %), baseline naive comparison table, and StockSense order-up-to policy simulation report.
- Full modal and drawer explainability suite:
  - **Explainability Drawer (`AIDrawer.tsx`)**: 6-section "Why this item?" audit drawer detailing recommendation summary, stock position, forecast evidence, safety stock policy, supplier constraints (MOQ/Order Multiple), and model assumptions/limitations.
  - **Window A (`AIApproveModal.tsx`)**: Replenishment approval dialog with MOQ/order multiple validation, generating an atomic Draft PO and routing directly to the Procurement workstation.
  - **Window B (`AIDismissModal.tsx`)**: Recommendation dismissal dialog requiring mandatory operational reason for full audit logging.
  - **Window C (`AIRunModal.tsx`)**: Forecast execution dialog with service level slider (0.90 to 0.99), default method selection (TSB/SBA/Croston), and random seed configuration.
- Backend additions: `GET /api/v1/ai/runs/{id}`, `GET /api/v1/ai/forecasts`, `GET /api/v1/ai/model-report`, and Teunter-Syntetos-Babai (TSB) algorithm implementation.
- Modular stylesheet `frontend/src/styles/ai.css` registered in `index.css`.
- 100% test pass rate (35/35 tests) and 0 TypeScript build errors. (MET)

### Sprint L — Page 6: Activity & Integrity Center (COMPLETED)

**Tasks:**
- Implemented Page 6 (`/activity`) as an authoritative audit and system integrity center:
  - Header bar with title, subtitle, RFC 4180 CSV export action, and manual refresh trigger.
  - 4 KPI summary cards: *Total Ledger Events*, *Active System Exceptions*, *Critical Risk Alerts*, and *Ledger Consistency Status (100% PASS)*.
  - 3 Workstation Tabs:
    - **Tab 1 (Stock Ledger)**: Full immutable ledger table with signed deltas (`+` in emerald green, `-` in rose red), movement type badges (Receipt, Issue, Transfer In/Out, Adjustment), location route indicators, reference codes, actor non-repudiation attribution, and time window filters (Today, 7D, 30D, 90D, All).
    - **Tab 2 (Alerts & Exceptions)**: Operational exception monitoring surface with severity badges (CRITICAL, WARNING, INFO), status filters (Open, Acknowledged, Resolved), and interactive Acknowledge & Resolve actions with user identity tracking.
    - **Tab 3 (Integrity Diagnostic)**: Real-time balance verification workstation displaying 100% Consistency Certificate, invariant status indicators (SQLite WAL Isolation, Foreign Key Constraints, Non-Negative Checks, Atomic Paired Transfers), and "Run Deep Audit Reconciliation Now" CTA.
- Dedicated **Movement Details Side Drawer (`MovementDetailDrawer.tsx`)**:
  - Full movement event metadata, hero signed delta box, item/location identifiers, reference notes, and non-repudiable actor stamps.
  - **Paired Transfer Navigation**: Detects `transfer_group_id` on transfer records and provides one-click button to jump directly to the complementary transfer leg (`TRANSFER_OUT` ↔ `TRANSFER_IN`).
- Backend additions:
  - Database schema & model `Alert` registered in `backend/app/models/alerts.py`.
  - Pydantic v2 schemas `AlertResponse`, `AlertAcknowledgeRequest`, `AlertResolveRequest` in `backend/app/schemas/alerts.py`.
  - Endpoint suite `backend/app/api/v1/endpoints/alerts.py` (`GET /alerts`, `POST /alerts/{id}/acknowledge`, `POST /alerts/{id}/resolve`, automatic operational seed hydration).
  - Automated tests `backend/tests/test_alerts.py` passing 100%.
- Modular stylesheet `frontend/src/styles/activity.css` registered in `index.css`.
- Complete verification: 35/35 pytest tests pass; 0 TypeScript build errors. (MET)

---

### Sprint M — Storekeeper Document Attachments & Printable Waybills (IN PROGRESS)

**Objective:** Fulfill real-world storekeeper compliance: every physical stock transaction and PO receipt can have supporting delivery documentation (PDF, images) attached, stored, and printed as formal warehouse waybills/dockets.

**Scope & Deliverables:**
- **Backend Document Attachment Engine:**
  - `DocumentAttachment` model in `backend/app/models/attachments.py` linked to movements and POs.
  - Pydantic schemas in `backend/app/schemas/attachments.py`.
  - API endpoints in `backend/app/api/v1/endpoints/attachments.py`: file upload (`POST /upload`), list attachments (`GET /attachments`), and secure file streaming (`GET /attachments/{id}/file`).
  - Automated tests in `backend/tests/test_attachments.py`.
- **Printable Warehouse Delivery Docket / Waybill (`WaybillModal.tsx`):**
  - Executive layout with Waybill number, carrier details, vehicle license plate, origin/destination warehouse, manifest table, and dual signature sign-off boxes (Dispatcher Storekeeper & Receiving Inspector).
  - Print-optimized CSS (`@media print`) enabling 1-click clean paper printout or "Save as PDF".
- **Storekeeper Upload Dropzones:**
  - Drag-and-drop / file picker in `MovementModal.tsx` (Issues, Receipts, Transfers).
  - Vendor delivery docket upload in `POReceiveModal.tsx`.
- **Drawer Attachment Explorer:**
  - Document attachments list with badge icons, download/view triggers, and "Print Waybill" button in `MovementDetailDrawer.tsx` and `PODetailView.tsx`.

---

### Sprint N — Barcode & QR Code Warehouse Scanning & Label Printing (PLANNED)

**Objective:** Enable physical warehouse mobility and barcode-driven execution.

**Scope & Deliverables:**
- Code128 and QR code vector generation for part SKUs and warehouse bin locations (`LOC-MAIN-A01`, etc.).
- Printable multi-label sheet modal (`LabelPrintModal.tsx`) formatted for thermal label printers (4x2" and 2x1" formats).
- Interactive Barcode Scanner modal (`BarcodeScannerModal.tsx`) supporting camera scan and USB HID hardware wedge scanners for instantaneous item selection and fast-path receiving.

---

### Sprint O — Production JWT Authentication & Granular RBAC (PLANNED)

**Objective:** Secure all API surfaces with cryptographic tokens and role-based permissions.

**Scope & Deliverables:**
- OAuth2 password/bearer token flow with JWT in `backend/app/core/auth.py`.
- Password hashing with `bcrypt` in `backend/app/models/users.py`.
- Granular permission decorators:
  - `STOREKEEPER`: Authorized for stock issues, receipts, transfers, and docket printing.
  - `PROCUREMENT_OFFICER`: Authorized for PO creation, approval, and supplier interactions.
  - `OPERATIONS_MANAGER` / `ADMIN`: Authorized for policy configuration, AI run triggers, and audit resolution.
- Frontend Auth Context, login/logout screens, and role-scoped navigation/action guards.

---

### Sprint P — Cryptographic Tamper-Evident Ledger Integrity & Compliance Export (PLANNED)

**Objective:** Provide mathematical non-repudiation for financial and safety regulatory compliance.

**Scope & Deliverables:**
- SHA-256 Merkle / hash-chaining on `stock_movements`: each transaction hashes the prior transaction's hash + current payload, rendering retro-active tampering computationally detectable.
- Automated ledger verification route `GET /api/v1/integrity/verify-chain`.
- Historical snapshot re-calculation: query inventory balance at any arbitrary historical timestamp $t$.
- 1-click comprehensive Audit Export ZIP package (signed CSV ledger, alert resolution log, attachment manifest, and hash chain proof).

---

### Sprint Q — Enterprise Scaling: PostgreSQL 16 & Background Workers (PLANNED)

**Objective:** Transition from single-node SQLite to high-concurrency cloud infrastructure.

**Scope & Deliverables:**
- PostgreSQL 16 database driver (`asyncpg` / `psycopg3`) with connection pooling (`pgbouncer`).
- Alembic migration scripts for versioned, non-destructive schema evolution.
- Celery / Redis asynchronous task queue offloading batch Croston/SBA forecasting and Monte Carlo simulations.
- Multi-stage Docker containers and Docker Compose setup for local orchestration.

---



## 5. Golden demo script (6–7 minutes)

### 0:00–0:40 — Problem and architecture

Say that StockSense addresses spare-parts/consumables inventory under intermittent demand. State that the scenario and data are synthetic assumptions because no company dataset was supplied. Show the compact architecture: React → FastAPI → services/AI → SQLAlchemy/SQLite.

### 0:40–1:45 — Inventory and data integrity

Open an item and show the stock by location and movement history. Make a valid receipt or issue. Attempt an over-issue if the demo seed is safe for it, and show the API/UI rejection. Explain that the ledger is the audit trail and the balance table is a transactionally maintained read model.

### 1:45–2:45 — Purchase-order lifecycle

Open a recommendation or create a draft PO, approve it, receive some/all of its quantity, and show how the PO state and stock ledger change. Explain idempotency and why a receipt cannot exceed the remaining ordered quantity.

### 2:45–4:30 — AI insight and recommendation

Show historical demand and forecast. Explain the chosen method, baseline, chronological evaluation, service target, sampled lead time, inventory position, and order-up-to target. Keep the explanation concrete; avoid claiming the model “knows” the correct future.

### 4:30–5:40 — Evaluation and limitations

Show the actual metric(s) and, if implemented, paired policy simulation. Explain the service-vs-inventory trade-off and the purpose of using synthetic ground truth only for evaluation. State what the experiment cannot establish about a real oilfield operation.

### 5:40–6:40 — Engineering choices and roadmap

Summarize React/FastAPI separation, the ledger invariant, SQLite as a PoC choice, human approval, and what you would improve with real data/production requirements. End with a short statement about correctness and reproducibility.

## 6. Interview questions and strong answer structure

Use the answer structures below as preparation, not scripts to memorize word-for-word.

### Why did you choose synthetic data?

**Answer structure:** No company data was provided and synthetic data was permitted. It enables a reproducible end-to-end demo and controlled patterns such as intermittent demand and variable lead times. I document the generator assumptions and do not claim it proves real-world accuracy. I keep hidden true demand separate from the observed transactions and use it only to score the synthetic policy simulation.

### Why not use a neural network?

**Answer structure:** The PoC has limited history and many zero-demand periods. I establish baseline performance and test methods designed for intermittent demand first. A more complex model would be justified only if leakage-safe out-of-sample evaluation showed a repeatable gain.

### Why use React and FastAPI separately?

**Answer structure:** React owns presentation and user interaction; FastAPI validates requests and owns business rules; services centralize stock/PO invariants; SQLAlchemy persists changes. This means a client cannot bypass stock validation, and the API remains independently testable.

### Why an append-only ledger instead of a quantity column alone?

**Answer structure:** A single editable quantity cannot explain how the balance changed. The ledger records every receipt, issue, transfer, or adjustment. A balance cache makes reads faster, but it must be maintained in the same transaction and checked against the ledger.

### How do you avoid negative stock and duplicate requests?

**Answer structure:** The service checks availability and writes the movement plus balance update atomically. Transfers write both legs together. A unique idempotency key prevents retries from duplicating an operation, and a stored request fingerprint lets us reject the same key with a different payload. Tests verify both the success and rollback behavior.

### How did you avoid forecasting data leakage?

**Answer structure:** Every forecast origin has a cutoff. Training and feature construction use data available at or before it. Method selection uses validation history; final reported evaluation uses a later holdout where possible. Hidden synthetic demand is excluded from model inputs and used only by the simulation scorer.

### What is the difference between forecast quality and inventory-policy quality?

**Answer structure:** Forecast metrics measure how well demand is estimated. Inventory-policy metrics measure business consequences such as fill rate, unmet demand, average stock, and number of orders. A slightly less accurate forecast can sometimes yield a better stock decision, so both need separate evaluation.

### Why Monte Carlo or a quantile-based target?

**Answer structure:** Demand and lead time can be non-normal and intermittent. Sampling plausible lead-time demand lets the policy estimate a chosen service-level quantile without assuming a normal distribution. Results remain conditional on the resampling assumptions, especially if independent-week resampling ignores project bursts.

### Why use an order-up-to policy rather than an ROP/EOQ combination?

**Answer structure:** The data are weekly and the policy is reviewed weekly. A periodic-review order-up-to target based on demand over lead time plus review interval is internally consistent and easier to evaluate. Mixing a continuous-review reorder point with a periodic-review protection interval can confuse the trigger and target, so the PoC chooses one policy explicitly.

### Why SQLite? What changes in production?

**Answer structure:** SQLite makes the assessment reproducible without an external database service. It is suitable for a small local demo, not a guarantee of high-concurrency operation. Production would require PostgreSQL, migrations, authenticated access, backups, monitoring, and load/concurrency tests.

### What are the main limitations?

Mention synthetic assumptions, possible demand censoring, limited horizon/history, simplified lead-time modeling, network-level rather than truly per-location optimization, absence of authentication, SQLite concurrency, and no real ERP integration. State which limitation is most consequential and what data/process change would resolve it.

## 7. README and GitHub checklist

### README should contain

- [ ] One-sentence product summary and screenshot.
- [ ] Business problem and chosen inventory scenario.
- [ ] Architecture diagram and component responsibilities.
- [ ] Actual setup/run commands for backend, frontend, seed, tests, and AI run.
- [ ] Environment variables and safe defaults.
- [ ] Main API routes and links to FastAPI `/docs` when running locally.
- [ ] Data-model overview and stock-ledger invariants.
- [ ] Synthetic generator assumptions and limitations.
- [ ] Implemented forecasting method(s), evaluation split, metrics, and actual measured results.
- [ ] Replenishment-policy definition and how recommendations are calculated.
- [ ] Test instructions and known test coverage gaps.
- [ ] Limitations, non-goals, and future roadmap.
- [ ] Demo steps and fallback assets.

### Repository hygiene

- [ ] `.env`, API keys, personal tokens and private data are excluded.
- [ ] Local SQLite database and large generated files are not committed unless intentionally needed as a small demo fixture.
- [ ] The synthetic ground-truth file is excluded from model inputs; decide whether it should be omitted from the public repo or clearly marked as evaluation-only.
- [ ] Dependency versions are pinned or bounded consistently with a tested environment.
- [ ] README screenshots reflect the actual current interface.
- [ ] No planned feature is described as complete.
- [ ] GitHub repository visibility is public as requested.

## 8. Final pre-interview smoke-test checklist

Run this from a clean clone or a clean demo directory:

1. Follow the README exactly; do not rely on an old local database.
2. Start the API and React app.
3. Open the frontend and verify data loads through the actual browser request path.
4. Seed the dataset using the documented command or safe admin action.
5. Run the integrity check.
6. Complete receipt → issue → transfer.
7. Attempt an invalid issue and confirm there is no partial change.
8. Create/approve a PO and record receiving.
9. Run/load forecasts and open a recommendation.
10. Approve recommendation and verify a single PO is created.
11. Open the AI report and ensure the chart/metrics have real values, not placeholder text.
12. Restart the app if possible and verify persisted data/run status is sensible.
13. Check the browser console and backend logs for unhandled errors.
14. Verify the public README commands and screenshots.
15. Rehearse the demo with a timer and keep fallback screenshots/recording available.

## 9. Final decision rule

If time becomes tight, **cut model count and optional features before cutting correctness tests, the end-to-end flow, or the README**. A smaller tested system with one defensible intermittent-demand method is stronger than several unverified models and seven unfinished pages.
