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
| 🗓️ **[`03-sprint-plan.md`](./03-sprint-plan.md)** | **Sprint Plan & Delivery Roadmap** | Day-by-day delivery schedule (Sprint 1 to Sprint 6), P0/P1/P2 scope management, exit criteria, interview talking points, and rehearsal scripts. |
| 🎨 **[`04-frontend-plan.md`](./04-frontend-plan.md)** | **Frontend UX & Page Routing Guide** | InvenTree/ERPNext/Odoo inspired interaction patterns, 6 core screens, design tokens, layout grids, and API states. |
| 📖 **[`stocksense-technical-plan.md`](./stocksense-technical-plan.md)** | **Master Technical Plan (Single Source of Truth)** | Comprehensive architectural reference covering domain models, intermittent forecasting math (Croston, SBA), Monte Carlo policies, ADRs, and glossary. |

---

## 🚀 Current Milestone Status

Refer to [`03-sprint-plan.md`](./03-sprint-plan.md) for granular task tracking:

- **Sprint 1 (Foundation & Environment)**: ✅ **COMPLETED & MET** (SQLite WAL, 17 tables, FastAPI health APIs, React+Vite frontend, unified `backend/ai/` module, 9/9 tests passing).
- **Sprint 2 (Core Inventory & Ledger)**: 🚀 **ACTIVE / UP NEXT** (Stock movements service, receipt/issue/transfer transactions, over-issue rejection, zero-mismatch integrity check).
- **Sprint 3 (Purchase Orders & Receiving)**: ⏳ In Queue (PO lifecycle: Draft → Approved → Received, partial receiving).
- **Sprint 4 (AI Replenishment Engine)**: ⏳ In Queue (Intermittent forecasting, lead time risk simulation, human-in-the-loop recommendations).
- **Sprint 5 (Operations & Review UI)**: ⏳ In Queue (Inventory ledger viewer, recommendation review modal, dashboard KPIs).
- **Sprint 6 (Verification & Demo Rehearsal)**: ⏳ In Queue (Smoke test, out-of-sample backtest validation, presentation dry run).
