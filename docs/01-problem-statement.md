# StockSense — Problem Statement, Goals, and Assessment Requirements

**Document:** 01 of 03  
**Project:** StockSense — AI-Assisted Inventory Management System  
**Purpose:** Define the problem, the intended user value, what the assessment requires, the scope of the proof of concept (PoC), and how success will be judged.  
**Assessment context:** AI Engineer take-home/design assessment; public GitHub repository and live demonstration required.  
**Planning date:** Monday, 12 October 2026  
**Scheduled interview:** Thursday, 15 October 2026 at 11:00 AM Cairo time, as stated in the latest email.

---

## 1. Executive summary

StockSense is a proof-of-concept inventory management system for spare parts and consumables. It combines reliable stock transaction handling with an explainable replenishment recommendation workflow. The system records inventory movements, maintains current balances, supports basic purchase orders and receiving, and uses historical demand and supplier lead-time assumptions to help a procurement user decide **what to replenish, how much to order, and why**.

The AI must advise rather than silently control purchasing. A person reviews a recommendation and explicitly approves or dismisses it. Inventory correctness is deterministic application logic; forecasting and risk estimates are probabilistic and must be evaluated separately.

The project is intended to demonstrate engineering judgment, not to claim that a synthetic-data prototype is production-ready. It should be small enough to finish and defend, but complete enough that a reviewer can run a realistic end-to-end flow.

## 2. What the company asked for

The email from the Senior AI Engineer clarifies that the assessment is for a **complete inventory management system**, not just a standalone forecasting model. The candidate may choose the inventory context and may use public or synthetic data. Spare parts and consumables are closest to the company's domain, but the context remains open. The submission must be a complete public GitHub project with a README, and the candidate will run a live demo and discuss design choices.

Required submission elements:

1. A brief description of the approach and the reasons behind the design choices.
2. The model architecture and techniques/tools used.
3. Source code and/or notebook where applicable.
4. Assumptions and limitations.
5. A public GitHub repository with clear setup, architecture, and run instructions.
6. A working live demonstration before/during the technical interview.

**Implication:** A notebook that only forecasts demand is insufficient. The deliverable must connect inventory operations, purchasing decisions, the AI layer, an interface, and evidence that the system behaves correctly.

## 3. Problem statement

### 3.1 Assumed operating context

For this PoC, assume an oilfield-services operation holding spare parts and consumables across a small network of warehouses, a yard, and project/rig locations. Representative items could include mechanical spares, electrical/instrumentation parts, PPE, and packaged consumables. Demand is issued to projects or operational teams.

This is an **assessment assumption**, not a claim about the company's actual internal workflows, ERP, suppliers, or warehouse structure. The company has not supplied internal inventory data or process documentation. The README must state this distinction explicitly.

### 3.2 The business problem

Inventory teams have to balance service availability against stock holding cost. Too little stock can delay maintenance or operations; too much stock ties up cash and can create obsolescence or expiry risk. This is more difficult when demand is intermittent, project-driven, and supplied with uncertain lead times.

The PoC targets six related problems:

| ID | Problem | Possible business consequence | PoC response |
|---|---|---|---|
| P1 | Critical items run out before replenishment arrives | Operational delays or emergency purchasing | Surface low-stock and replenishment-risk items |
| P2 | Slow-moving items accumulate | Cash tied up and possible obsolescence | Show stock and demand history; optionally flag no recent demand |
| P3 | Demand has many zero periods and occasional spikes | Simple averages can be misleading | Compare baseline forecasts with intermittent-demand methods |
| P4 | Supplier lead times vary | Fixed buffers may be too low or unnecessarily high | Use recorded/assumed lead-time samples and a risk-based stock target |
| P5 | Stock changes are overwritten or difficult to explain | Reconciliation and audit problems | Append-only movement ledger and balance-integrity check |
| P6 | Replenishment decisions are reactive and opaque | Inconsistent ordering and low trust | Human-reviewed recommendations with stored explanations |

### 3.3 Goal

Build a reproducible, end-to-end inventory PoC that:

- maintains consistent stock balances and an auditable transaction history;
- supports the basic receiving, issuing, transfer, and purchase-order lifecycle;
- forecasts demand using methods appropriate to the observed demand pattern;
- estimates an inventory replenishment target under explicit assumptions;
- produces human-reviewable order recommendations;
- compares forecasting and/or replenishment decisions against simple baselines;
- exposes the process through a React frontend and a documented API; and
- can be installed and demonstrated by a reviewer following the README.

## 4. Users and essential workflows

**Data-model note:** the technical design includes a `users` table for stable demo identities and audit attribution, with roles such as storekeeper, procurement officer, manager, and admin. It does not implement login, password storage, or real authorization in the assessment PoC. See Document 02 for the full 17-table column dictionary and ER diagram.


### 4.1 Storekeeper

Needs to find an item, inspect available stock by location, record receipts/issues/transfers/count adjustments, and see a useful validation error when a transaction cannot be completed.

### 4.2 Procurement officer

Needs to review stock-risk signals, inspect the reason behind an order recommendation, edit its suggested quantity if appropriate, approve or dismiss it, manage purchase orders, and record deliveries.

### 4.3 Operations/procurement manager

Needs a summary of inventory health, current alerts/recommendations, an understandable view of forecast evidence, and a comparison of service and inventory trade-offs.

### 4.4 Golden end-to-end scenario

The live demo should prove this complete path:

1. Load deterministic synthetic data.
2. Open the inventory table and select an item.
3. Show the current balance and movement history.
4. Run or load a forecasting/replenishment run.
5. Open a recommendation and explain its inputs, confidence/limitations, and proposed quantity.
6. Approve the recommendation; a purchase order is created once, with a destination location.
7. Record a partial or full receipt against the PO.
8. Show the stock ledger and balance updated consistently.
9. Run the integrity check and show zero mismatches.
10. Open the evaluation report and explain the evidence and limitations.

This scenario is more valuable than a large number of disconnected screens.

## 5. Scope and non-goals

### 5.1 Required PoC scope

**Inventory core**
- Categories, items/SKUs, suppliers, supplier-specific item terms, locations, and optional project references.
- Current stock by item and location.
- Append-only stock movement history.
- Receipt, issue, transfer, and count-adjustment workflows.
- Stock integrity check and protection against negative stock.
- Request idempotency for transaction endpoints.

**Procurement**
- Draft purchase order with one or more lines.
- Explicit approval transition.
- Partial and full receiving.
- Cancellation only when permitted by the order state and receipt history.
- Recommendations can be turned into a purchase order only after a person approves.

**AI and evaluation**
- Synthetic data with a documented generation process.
- Baseline forecasting methods and at least one method suited to intermittent demand.
- Walk-forward/rolling-origin evaluation with no future leakage.
- A documented replenishment policy using clear service-level/lead-time assumptions.
- Explainable recommendations and a modest comparison with a traditional baseline.

**Interface and delivery**
- React + TypeScript frontend.
- FastAPI backend and SQLite database.
- A small number of working pages with loading, empty, success, and error states.
- Tests for core invariants and key AI calculations.
- Docker Compose or clearly documented local commands.
- Public GitHub repository with a complete README and limitations section.

### 5.2 Explicit non-goals for this deadline

Do not attempt to build these unless the required system is complete and tested:

- real ERP integration or integrations with the company's internal systems;
- real login/authentication, multi-tenant access, enterprise RBAC, or production security controls (the demo `users` table is attribution only);
- multi-echelon inventory optimization or advanced per-location optimization;
- lot/batch/serial tracking, FEFO expiry operations, barcode/RFID hardware;
- supplier portals, invoicing/accounting, payments, or multi-currency valuation;
- an LLM chat assistant, autonomous agents, computer vision, or a custom-trained deep-learning model;
- a production job queue, distributed services, Kubernetes, or cloud deployment;
- claims of production accuracy or ROI based only on synthetic data.

## 6. Success criteria and acceptance tests

These targets are the definition of a convincing PoC, not a claim that the current plan already satisfies them.

| ID | Criterion | Acceptance evidence |
|---|---|---|
| AC-01 | A reviewer can start the app from a clean clone | README commands work without hidden local files or API keys |
| AC-02 | A stock receipt increases the correct item/location balance | API/integration test plus UI demonstration |
| AC-03 | An issue cannot make a balance negative | Rejected transaction creates no ledger row and leaves balances unchanged |
| AC-04 | A transfer affects both locations atomically | Two linked ledger entries; either both commit or neither commits |
| AC-05 | Replaying a transaction request does not duplicate its effect | Same idempotency key and same payload returns the prior outcome; conflicting payload is rejected |
| AC-06 | Ledger and balance totals agree | Integrity check reports zero mismatches after seed and demo flow |
| AC-07 | PO lifecycle is enforced | Draft → approved → partially received/received; invalid transitions rejected |
| AC-08 | AI results are reproducible | Fixed seed/configuration produces repeatable synthetic data and repeatable simulation results within the documented environment |
| AC-09 | Forecast evaluation is honest | Rolling/temporal split; no future periods used for training or method selection against the final holdout |
| AC-10 | Recommendations are explainable | Every recommendation records the data cutoff, method/policy, current inventory position, service target, target level, quantity rule, and important caveats |
| AC-11 | Human approval is required | No AI run directly submits or receives an order |
| AC-12 | UI handles API failures clearly | Tested insufficient-stock, validation, conflict, and service-unavailable states |
| AC-13 | Model report shows evidence, not marketing claims | Displays implemented metrics and baseline results; does not promise that the AI always wins |
| AC-14 | Limitations are explicit | README/model report identify synthetic-data limits, lack of auth, SQLite constraints, and unimplemented features |

## 7. Dataset plan and justification

### 7.1 Why synthetic data

The company has not provided historical data, and the assessment permits synthetic data. Synthetic data lets the project demonstrate the full transaction and AI pipeline without inventing access to confidential records. It can also represent demand with long zero-demand stretches, occasional spikes, differing item criticality, and variable supplier lead times.

The dataset is a **controlled test environment**, not proof that the generated data matches the company's actual operations.

### 7.2 Initial generator specification

Use configurable values rather than hard-coding assumptions throughout the application. A practical default is:

- 4–5 item categories representing spare parts and consumables;
- 40–60 items for a deadline-friendly first run; increase to 120 if the generator and runtime are stable;
- 52–104 weeks of history;
- 4 locations (main warehouse, yard, and two project/rig sites);
- a small supplier set with local and imported lead-time profiles;
- smooth, erratic, intermittent, and lumpy demand patterns;
- item criticality and supplier-specific MOQ/order multiple/nominal lead time;
- deterministic random seed;
- stock receipts/issues and a simple replenishment process if time permits.

Store assumptions in a config file such as `config/synthetic.yaml`; do not hide them inside generator code.

### 7.3 Demand and stockout realism

Where practical, generate both:

- **true demand**, used only by the synthetic evaluation simulator to measure fulfilled and unfulfilled demand; and
- **observed issues**, representing units that the warehouse actually issued from stock and which the forecasting pipeline can observe.

When available stock is insufficient, observed issues may be lower than true demand. This is called censored demand. The model must not use the ground-truth file as a training feature or otherwise leak future/hidden demand into forecasts. Ground truth is evaluation-only.

### 7.4 Generator validation

Record and display:

- seed and configuration;
- item counts and demand-pattern mix;
- proportion of zero-demand weeks and positive demand sizes;
- lead-time distribution by supplier class;
- stock movement and balance integrity result;
- missing/invalid data checks;
- the dataset time range and the cutoff used by each AI run.

### 7.5 Dataset limitations to disclose

- Generator parameters are assumptions, not fitted to company data.
- Project effects and item relationships are simplified.
- Seasonality, supplier disruptions, substitutions, price changes, and real procurement constraints may be missing.
- Historical observed issues can understate demand during stockouts.
- Synthetic performance validates code and methodology under the simulator's assumptions, not expected business performance.

## 8. Business and technical success measures

### Inventory correctness

- zero negative balances;
- zero ledger/balance mismatches after valid operations;
- invalid transactions leave no partial writes;
- duplicate retries do not duplicate stock movements.

### Forecast quality

- report at least one simple baseline and one intermittent-demand method;
- evaluate on periods not used to fit/select the method;
- report a metric that is defined for the evaluated series, with explicit handling for constant/all-zero series;
- compare cumulative demand over the decision horizon, not only one-step errors;
- report results by demand pattern where sample sizes permit.

### Inventory policy quality

- compare the AI policy with a reasonable baseline under the same demand path, initial conditions, review cadence, and lead-time scenarios;
- report fill rate, unmet units/stockout weeks, average inventory, and order count;
- report results even if the proposed AI policy does not outperform the baseline;
- do not tune the policy on the final evaluation window and then report that same window as independent evidence.

### Product quality

- a reviewer can complete the golden scenario without editing the database manually;
- React forms prevent obvious invalid input and display backend errors;
- the main pages are usable at laptop resolution;
- setup and reset instructions are reliable;
- all claimed features in the README are implemented or marked as planned.

## 9. Risks and mitigation

| Risk | Why it matters | Mitigation |
|---|---|---|
| Scope exceeds the deadline | A broad plan can yield many incomplete features | Prioritize the end-to-end scenario; cut optional models/features early |
| AI-generated code is not understood | Candidate must defend implementation | Build in small modules; read every critical function and test it |
| Synthetic evaluation looks artificially strong | Could overstate business value | Separate hidden ground truth from observable inputs and explain assumptions |
| UI and API integration happens too late | Demo may fail despite working components | Connect React to `/health` and one real endpoint on day one |
| Stock integrity defect | Invalid inventory results undermine the entire product | Implement transaction helpers and invariant tests before AI features |
| No-auth PoC is exposed publicly | Public demo endpoint could be abused | Keep local-only for assessment or clearly isolate deployment; never label it production-ready |
| Live demo/network issue | Interview time is limited | Seed a known-good dataset and prepare screenshots or a short fallback recording |

## 10. Final product principle

**Correct stock operations first, a complete purchasing loop second, and explainable/evaluated AI third.** A polished interface matters, but it must be backed by correct transactional behavior and honest model evidence. The PoC succeeds when a reviewer can run it, understand it, and verify its behavior—not when it contains the most technologies.
