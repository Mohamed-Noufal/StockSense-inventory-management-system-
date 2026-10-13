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
