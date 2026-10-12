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

### Tuesday evening — Minimum useful AI and public-repo delivery

**Objective:** create a defensible AI result rather than an unfinished list of model names.

- [ ] Build weekly demand series with zeros only after item introduction.
- [ ] Implement a naive or moving-average baseline.
- [ ] Implement at least one intermittent-demand method (prefer a tested Croston-family method such as SBA or TSB if feasible).
- [ ] Implement a chronological backtest and at least one interpretable error metric.
- [ ] Ensure training inputs exclude future data and synthetic ground truth.
- [ ] Implement the selected periodic-review order-up-to policy with explicit target/rounding rules.
- [ ] Add an explanation for each recommendation.
- [ ] Implement approve recommendation → create PO atomically.
- [ ] Create the React AI Insights screen.
- [ ] Add tests for forecast time cutoffs, metric edge cases, and recommendation arithmetic.
- [ ] Finish the README's quick start, architecture, model, data, test, and limitations sections.
- [ ] Push the public repository and verify it from a clean clone; aim to send the link Tuesday night.

**Exit criteria:** user can see an AI recommendation, understand its calculation, approve it, and complete receiving. Results are not presented as guaranteed business accuracy.

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

### Sprint D — Explainable AI slice

**Tasks:** weekly series, baseline/intermittent forecasts, time split, selected policy, recommendation explanation, model metrics.

**Done when:** every output has a cutoff and method; the final evaluation period was not used to select the method; the policy's target and quantity can be recalculated by hand on a small example; edge cases are handled.

### Sprint E — React workflow and hardening

**Tasks:** inventory/operations, PO, AI insights, loading/error states, documentation, public release.

**Done when:** the golden workflow works end to end through the UI; no manual SQL is needed; clean-clone instructions work; limitations are accurate.

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
