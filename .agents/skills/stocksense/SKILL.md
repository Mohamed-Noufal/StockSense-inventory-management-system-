---
name: stocksense
description: StockSense AI-Assisted Inventory Management domain knowledge, business rules, architectural invariants, and assessment workflows.
---

# StockSense Domain & Architecture Skill

## 1. Domain Context & Invariants
- **Domain**: Oilfield-services spare parts and consumables (drilling fluids, pressure control parts, mechanical/electrical spares, PPE).
- **Core Principle**: Separation of deterministic inventory state from probabilistic AI advice.
- **Ledger Invariant**: All inventory movements (`RECEIPT`, `ISSUE`, `TRANSFER_OUT`, `TRANSFER_IN`, `ADJUSTMENT`) are written to `stock_movements` as an append-only ledger.
- **Stock Balances**: `stock_balances` is updated within the exact same database transaction as `stock_movements`.
- **Non-Negativity Constraint**: Quantity on hand can never drop below zero (`CHECK (quantity_on_hand >= 0)`). Over-issuing is atomically rejected with a clear business error.
- **Idempotency**: External stock write requests must support an `idempotency_key` and verify request payload fingerprint.

## 2. Purchasing & Human-In-The-Loop Workflow
- AI recommendations (`recommendations`) are purely advisory and cannot place purchase orders automatically.
- Approving a recommendation creates a Purchase Order (`purchase_orders`) with line items (`purchase_order_lines`) pointing to a destination location.
- PO receiving records receipt movements into `stock_movements` and increments `qty_received` on PO lines.

## 3. AI / Forecasting Invariants
- Target intermittent demand methods: Croston, Syntetos-Boylan Approximation (SBA), Teunter-Syntetos-Babai (TSB), Moving Average (MA8), Simple Exponential Smoothing (SES).
- Strict temporal cutoff: AI runs snapshot data up to `data_cutoff`. Future data must never leak into model training or feature generation.
- Ground truth evaluation demand is stored separately and never joined into operational feature tables.
- Inventory policy computes Safety Stock ($SS$), Reorder Point ($ROP$), and Order-Up-To level ($OUT$) using lead time distributions and service level targets.
