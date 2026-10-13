# StockSense — Documentation Hub & Architecture Gateway

Welcome to the **StockSense** technical documentation suite. This folder houses the architectural blueprints, data models, sprint roadmaps, frontend specifications, and autonomous agent onboarding guides for the StockSense AI-Assisted Inventory Management System.

---

## 🌟 Master Index & Agent Playbook

For the full architectural review, directory analysis, agent onboarding guide, and enterprise production roadmap, consult the master document:

👉 **[Master Documentation Index & AI Agent Playbook (`INDEX.md`)](./INDEX.md)**

---

## Documentation Suite

| Document | Title | Description |
|---|---|---|
| 📑 **[`INDEX.md`](./INDEX.md)** | **Master Index & Agent Playbook** | Single entrypoint for project navigation, senior folder structure critique, AI skill instructions, ledger invariants, and production hardening steps. |
| 🎯 **[`01-problem-statement.md`](./01-problem-statement.md)** | **Problem Statement & Operating Context** | Oilfield spare parts & consumables domain, pain points (P1–P6), storekeeper/procurement personas, and the Golden Demo scenario. |
| 🏗️ **[`02-technical-architecture.md`](./02-technical-architecture.md)** | **Technical Architecture & Data Model** | System architecture diagrams, 17-table data dictionary, append-only ledger mechanics, non-negative stock constraints, and API boundaries. |
| 📊 **[`02b-system-design-and-data-flows.md`](./02b-system-design-and-data-flows.md)** | **System Design Charts & Data Flow Diagrams** | Visual diagrams: layered system topology, core stock movement transactions, double-entry transfers, AI advisory replenishment pipeline, and PO lifecycle. |
| 🗓️ **[`03-sprint-plan.md`](./03-sprint-plan.md)** | **Sprint Plan & Delivery Roadmap** | Day-by-day delivery schedule (Sprint 1 to Sprint 6), P0/P1/P2 scope management, exit criteria, interview talking points, and rehearsal scripts. |
| 🎨 **[`04-frontend-plan.md`](./04-frontend-plan.md)** | **Frontend UX & Page Routing Guide** | InvenTree/ERPNext/Odoo inspired interaction patterns, 6 core screens, design tokens, layout grids, and API states. |
| 🤖 **[`05-ai-engine-and-activity-log.md`](./05-ai-engine-and-activity-log.md)** | **AI Engine Specification & Activity Log** | Dynamic living registry: demand classification formulas, Croston/SBA algorithms, policy math, live execution history log, and recommendation audit trail. |
| 📖 **[`stocksense-technical-plan.md`](./stocksense-technical-plan.md)** | **Master Technical Plan (Single Source of Truth)** | Comprehensive architectural reference covering domain models, intermittent forecasting math (Croston, SBA), Monte Carlo policies, ADRs, and glossary. |

---

## 🚀 Current Milestone Status

Refer to [`03-sprint-plan.md`](./03-sprint-plan.md) for granular task tracking:

- **Sprint 1 (Foundation & Environment)**: ✅ **COMPLETED & MET** (SQLite WAL, 17 tables, FastAPI health APIs, React+Vite frontend, unified `backend/ai/` module, 9/9 tests passing).
- **Sprint 2 (Core Inventory & Ledger)**: ✅ **COMPLETED & MET** (Atomic movements service, over-issue rejection, paired transfers, 0-mismatch integrity check, seed data, modular React UI, 14/14 tests passing).
- **Sprint 3 (Purchase Orders & Receiving)**: ✅ **COMPLETED & MET** (PO state machine, atomic goods receipt via `post_movement`, over-receipt HTTP 400 rejection, interactive Procurement UI, 21/21 tests passing).
- **Sprint 4 (AI Replenishment Engine)**: ✅ **COMPLETED & MET** (Time-safe demand extraction, Croston/SBA, recommendation-to-PO conversion, AI Insights UI, 26/26 tests passing).
- **Sprint 5 (Verification & Golden Demo)**: ✅ **COMPLETED & MET** (End-to-end golden flow automated test suite, zero-leakage verification, 100% pass rate).
- **Sprint 6 (Ergonomics, Users & Audit)**: ✅ **COMPLETED & MET** (Collapsible rail sidebar, streamlined top bar with search/notifications, database users directory, and non-repudiable ledger audit attribution).
- **Sprint 7 (Production Inventory Workstation)**: ✅ **COMPLETED & MET** (High-precision split-pane Inventory workspace, 4 KPI metric cards, interactive 12-week SVG stock trend chart, deterministic vector part thumbnails, CSV export, live SQLite WAL database integration, 30/30 tests passing).
- **Sprint 8 (Production Operations Workstation)**: ✅ **COMPLETED & MET** (Enterprise stock movements workstation matching reference mock: 4 top action cards with direct modal dispatch, Recent Operations table with tabbed filtering and sortable columns, 2x2 Operations Stats widget with dynamic period trend percentages, Recent Activity feed, unified 4-way modal supporting Receipts, Issues, Transfers, and Adjustments, 33/33 tests passing with 0 integrity mismatches).
- **Sprint 9 (Vercel Theme Hardening & Modular CSS Architecture)**: ✅ **COMPLETED & MET** (Modularized monolithic 3,435-line `index.css` into 7 domain-specific stylesheets in `frontend/src/styles/`: `tokens.css`, `base.css`, `layout.css`, `components.css`, `overview.css`, `inventory.css`, and `operations.css`. Reconstructed dynamic 12-week SVG inventory trend with responsive Y-axis scaling from SQLite balances and ledger movements. Removed all remaining `#0b1320` navy tints and rainbow button styling, implemented borderless status pills with luminous dot indicators, and streamlined header layouts across all views. All 33/33 backend tests passing).
- **Sprint 10 (Page 4: Purchase Orders & Dock Receiving Workstation)**: ✅ **COMPLETED & MET** (Delivered comprehensive procurement workstation at `/purchase-orders`: 4 KPI summary cards with click-to-filter binding for Open, Awaiting Approval, Partially Received, and Overdue Deliveries; dedicated multi-section draft PO creation workstation at `/purchase-orders/new` with live stock preview and line item math; dedicated PO details view at `/purchase-orders/:poId` with line-by-line fulfillment progress tracking; Window C Approval confirmation modal; Window D partial/full dock receiving modal with delivery review summary; Window E cancellation modal; CSV export; modular `procurement.css` adhering to Vercel Dark Zinc design tokens; 33/33 backend tests passing, 0 TypeScript build errors).
- **Sprint 11 (Page 5: AI & Replenishment Intelligence Workstation)**: ✅ **COMPLETED & MET** (Delivered unified replenishment intelligence workstation at `/ai`: 4 KPI summary cards with click-to-filter binding, status strip with active TSB engine badge and synthetic ledger disclaimer; 3 Workstation Tabs: Recommendations table with urgency badges and confidence ribbons, Forecasts tab with 52-week observed demand SVG timeline and P50/P90 ribbons, Model Report tab with holdout RMSSE/MASE metrics and policy simulation; Explainability Drawer `AIDrawer.tsx` with 6 sections; Window A Approval modal with MOQ/multiple enforcement; Window B Dismiss modal with audit reason; Window C Run Analysis modal; modular `ai.css`; 35/35 backend tests passing, 0 TypeScript errors).
- **Sprint 12 (Page 6: Activity & Integrity Center)**: ✅ **COMPLETED & MET** (Delivered unified audit and system integrity center at `/activity`: 4 KPI summary cards; 3 Workstation Tabs: Stock Ledger with signed deltas `+` green / `-` red and time window filters, Alerts & Exceptions with CRITICAL/WARNING/INFO badges and interactive Acknowledge/Resolve actions, Integrity Diagnostic with 100% Consistency Certificate and SQLite WAL invariant breakdown; Movement Details Side Drawer `MovementDetailDrawer.tsx` with paired transfer navigation jumping between `TRANSFER_OUT` and `TRANSFER_IN`; RFC 4180 CSV export; modular `activity.css`; 35/35 backend tests passing, 0 TypeScript errors).
- **Sprint 13 (Physical Warehouse Capabilities)**:
  - **Task 1 (Storekeeper Document Attachments & Audit Proof Engine)**: ✅ **COMPLETED & MET** (Delivered full physical document attachment subsystem: `document_attachments` table with composite indexing, Pydantic v2 schemas, endpoints at `/api/v1/attachments` for multipart PDF/photo upload, listing, and file streaming, automatic realistic sample seed hydration, drag-and-drop dropzone in `MovementModal.tsx` and `POReceiveModal.tsx`, attached document cards with View/Download triggers in `MovementDetailDrawer.tsx` and `PODetailView.tsx`, modular `attachments.css`).
  - **Task 2 (Printable Warehouse Transit Waybill & Delivery Docket)**: ✅ **COMPLETED & MET** (Official printable transit docket modal `WaybillModal.tsx` with vector Code128 barcode, carrier metadata, vehicle license, manifest items, dual sign-off blocks for Storekeeper Dispatcher & Material Inspector, native browser print trigger, and print-ready monochrome `@media print` stylesheet `waybill.css`. Dynamically derived from `stock_movements`, `items`, and `locations` with zero schema migrations).
  - **Test Suite**: 39/39 backend test items verified (37 passed, 2 skipped, 0 failures), 0 TypeScript build errors.

---

## 📋 Remaining Work & Feature Roadmap: What Still Needs to be Built

All 6 primary application workstations (Overview, Inventory, Operations, Purchase Orders, AI Replenishment, Activity & Integrity) plus the Document Attachments Engine and Waybill Docket are completely built, styled with the Vercel Dark Zinc design system, connected to SQLite WAL, and passing all test suites.

To elevate StockSense from an advanced working prototype to a fully hardened, enterprise-grade warehouse management system, the following items represent the remaining physical and enterprise features:

| Priority | Feature / Work Item | Description & Scope | Status |
|---|---|---|---|
| **P1.1** | **Storekeeper Document Attachments** | **Physical Audit Trail**: File upload engine (PDF/images) attached to movements and POs. File streaming, storage, and drawer inspection. | ✅ **COMPLETED** |
| **P1.2** | **Printable Warehouse Delivery Waybill** | **Physical Transit Documentation**: Printable Delivery Docket modal (`WaybillModal.tsx`) with `@media print` styling, carrier metadata, manifest table, vector Code128 barcode, and dual storekeeper/inspector sign-off boxes. | ✅ **COMPLETED** |
| **P1.3 (Next)** | **Barcode & QR Code Scanning & Label Printing** | **Physical Warehouse Mobility**: Barcode (Code128) and QR code generation for SKU items and storage bin locations. Printable shelf/bin barcode labels (`BinLabelModal.tsx`). Interactive quick-scan modal (`BarcodeScannerModal.tsx`). | 🔄 **In Progress** |
| **P2** | **Production JWT Authentication & Granular RBAC** | **Security & Access Control**: Formal JWT authentication endpoints (`/login`, `/refresh`), encrypted password hashing (`bcrypt`), and role decorators (`Storekeeper`, `Procurement Officer`, `Manager`). Frontend route guards and permission-scoped button visibility. | ⏳ **Planned** |
| **P3** | **Production JWT Authentication & Granular RBAC** | **Security & Access Control**: Formal JWT authentication endpoints (`/login`, `/refresh`), encrypted password hashing (`bcrypt`), and role decorators (`Storekeeper`, `Procurement Officer`, `Manager`). Frontend route guards and permission-scoped button visibility. | ⏳ **Planned** |
| **P4** | **Tamper-Evident Ledger Integrity & Cryptographic Audit** | **Regulatory Compliance**: SHA-256 hash chaining across `stock_movements` rows guaranteeing tamper-evident immutability. Historical ledger state replay at any arbitrary timestamp $t$. Zip package export for formal regulatory audits. | ⏳ **Planned** |
| **P5** | **PostgreSQL 16 Migration & Background Worker Queue** | **Enterprise Scale**: Port database layer to PostgreSQL 16 with `asyncpg`/`pgbouncer` and Alembic schema migrations. Move weekly batch AI forecasting and Monte Carlo policy simulations to asynchronous Celery/Redis workers. | ⏳ **Planned** |



