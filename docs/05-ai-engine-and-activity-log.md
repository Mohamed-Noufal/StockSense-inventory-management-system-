# StockSense — AI Engine Specification & Activity Log

> **Document:** 05 of 05  
> **Status:** Living Document & AI Run Registry  
> **Package Reference:** [`backend/ai/`](file:///home/noufal/workspace/inventory-poc-project/backend/ai)  
> **Principle:** All AI models are strictly advisory; all executions, cutoffs, and human decisions are auditable.

---

## 1. AI Engine Overview & Mathematical Core

StockSense operates in an industrial environment (oilfield services and spare parts) characterized by **intermittent, lumpy, and erratic demand**. Standard time series models (ARIMA, standard moving averages) severely fail on sparse data by overestimating ongoing demand or producing negative forecasts.

The AI engine is organized as a dedicated, self-contained package under `backend/ai/`:

```text
backend/ai/
├── agent.py            # ReplenishmentAgent advisory service (human-in-the-loop proposals)
├── classification.py   # ADI & CV² demand pattern classifier (Syntetos-Boylan quadrant)
├── forecasting.py      # Croston, SBA (Syntetos-Boylan), MA8, SES algorithms
├── policy.py           # Safety stock, ROP, Order-Up-To (OUT) calculations
├── evaluator.py        # Leakage-free out-of-sample evaluation & backtest metrics (MAE, RMSE, bias)
├── models.py           # SQLAlchemy models (AIRun, Forecast, BacktestResult, ItemPolicy, Recommendation)
├── schemas.py          # Pydantic v2 DTOs for AI runs, forecasts, and recommendations
├── service.py          # AIService orchestrating classification, forecasting, and policy runs
└── router.py           # REST endpoints mounted under /api/v1/ai
```

---

## 2. Demand Pattern Classification (Syntetos-Boylan Quadrant)

Located in [`backend/ai/classification.py`](file:///home/noufal/workspace/inventory-poc-project/backend/ai/classification.py).

Every item's weekly demand history is categorized using two metrics:
1. **Average Demand Interval ($ADI$):** Average number of time periods between non-zero demand events:
   $$ADI = \frac{N}{k}$$
   where $N$ is total periods and $k$ is the number of non-zero demand periods.
2. **Coefficient of Variation Squared ($CV^2$):** Demand size variance normalized by mean demand size:
   $$CV^2 = \left( \frac{\sigma_{nonzero}}{\mu_{nonzero}} \right)^2$$

### The Categorization Matrix:

```text
       CV²
        ▲
        │   ERRATIC            │      LUMPY
   0.49 ┼──────────────────────┼──────────────────────
        │   SMOOTH             │   INTERMITTENT
        │                      │
        └──────────────────────┴──────────────────────► ADI
                               1.32
```

- **Smooth ($ADI < 1.32, CV^2 < 0.49$):** Regular demand, low variability. Standard methods (SES, MA) are suitable.
- **Intermittent ($ADI \ge 1.32, CV^2 < 0.49$):** Sporadic demand intervals, consistent order sizes. Croston or SBA recommended.
- **Erratic ($ADI < 1.32, CV^2 \ge 0.49$):** Frequent demand, highly fluctuating quantities.
- **Lumpy ($ADI \ge 1.32, CV^2 \ge 0.49$):** Sporadic demand and highly variable quantities. SBA with conservative safety stock recommended.

---

## 3. Intermittent Demand Forecasting Algorithms

Located in [`backend/ai/forecasting.py`](file:///home/noufal/workspace/inventory-poc-project/backend/ai/forecasting.py).

### Croston's Method
Croston's method decomposes the demand series into two separate exponential smoothing components:
- Demand size when non-zero ($z_t$):
  $$\hat{z}_{t} = \hat{z}_{t-1} + \alpha (y_t - \hat{z}_{t-1})$$
- Inter-arrival time interval ($p_t$):
  $$\hat{p}_{t} = \hat{p}_{t-1} + \alpha (q_t - \hat{p}_{t-1})$$
- Projected demand rate:
  $$\hat{y}_{t+h} = \frac{\hat{z}_t}{\hat{p}_t}$$

### Syntetos-Boylan Approximation (SBA)
Croston's method is known to possess an inherent positive bias (overestimating demand). Syntetos & Boylan (2005) introduced a debiasing shrinkage factor:
$$\hat{y}_{SBA} = \left( 1 - \frac{\alpha}{2} \right) \frac{\hat{z}_t}{\hat{p}_t}$$
StockSense implements SBA as the primary recommended algorithm for intermittent and lumpy spare parts.

---

## 4. Inventory Policy & Replenishment Mathematics

Located in [`backend/ai/policy.py`](file:///home/noufal/workspace/inventory-poc-project/backend/ai/policy.py).

### Periodic Review Order-Up-To ($OUT$) Policy
Because inventory reviews occur weekly (review period $R = 1$ week), the protection interval is:
$$T_{protect} = L + R$$
where $L$ is supplier lead time in weeks.

1. **Safety Stock ($SS$):**
   $$SS = z_{service} \times \sigma_{demand} \times \sqrt{L + R}$$
   Where $z_{service}$ corresponds to target service level (e.g., $1.645$ for 95% service on critical items).
2. **Reorder Point ($ROP$):**
   $$ROP = (\hat{d} \times L) + SS$$
3. **Order-Up-To Target ($OUT$):**
   $$OUT = (\hat{d} \times (L + R)) + SS$$
4. **Recommended Order Quantity ($ROQ$):**
   $$NetStock = Q_{on\_hand} + Q_{on\_order} - Q_{reserved}$$
   $$\text{Raw Order} = \max(0, OUT - NetStock)$$
   $$\text{Final Order} = \text{ApplySupplierRules}(\text{Raw Order}, MOQ, OrderMultiple)$$

---

## 5. Human-in-the-Loop Advisory Agent Architecture

Located in [`backend/ai/agent.py`](file:///home/noufal/workspace/inventory-poc-project/backend/ai/agent.py).

The AI agent functions strictly as an **advisory decision-support system**:
1. It continuously evaluates items against current inventory positions.
2. If $NetStock \le ROP$, it constructs a human-reviewable order proposal.
3. Every recommendation contains a transparent `explanation_json` detailing:
   - Demand rate ($\hat{d}$) and algorithm used (e.g., `SBA`).
   - Lead time assumptions ($L$, $p90$).
   - Current stock position ($Q_{on\_hand}$, $Q_{on\_order}$).
   - Exact mathematical formula step-by-step.
   - Financial estimate in minor currency units.
4. **Approval Boundary:** The agent **never** creates purchase orders autonomously. A human procurement officer must explicitly approve the recommendation.

---

## 6. Living AI Activity & Run Registry

*This section is dynamically updated as AI runs, backtests, and recommendation cycles are executed.*

### Execution History Log

| Run ID | Execution Timestamp (UTC) | Data Cutoff Date | Trigger Type | Items Evaluated | Primary Method | Avg Backtest MAE | Recommendations Generated | Status |
|---|---|---|---|---|---|---|---|---|
| `RUN-20261012-001` | 2026-10-12 17:48:00 | 2026-10-01 | Scheduled Daily | 15 items | SBA (Syntetos-Boylan) | 0.84 | 3 proposed | Completed |
| `RUN-20261012-002` | 2026-10-12 18:27:16 | 2026-10-01 | Manual Re-eval | 15 items | SBA / Croston | 0.79 | 4 proposed | Completed |

---

## 7. Recommendation Audit Trail & Decision Log

*Record of generated AI recommendations, their mathematical rationale, and human procurement decisions.*

### Recent Recommendations

#### Recommendation #1: Valve Seat Assembly (SKU: `SLV-SEAT-01`)
- **Run ID:** `RUN-20261012-002`
- **Criticality:** `CRITICAL`
- **Location:** `WH-01` (Main Warehouse)
- **Supplier:** PetroParts International (Lead Time: 3 weeks, MOQ: 10)
- **Inputs:**
  - On-hand stock: $4$ units
  - On-order stock: $0$ units
  - Projected weekly demand: $2.1$ units/week (SBA)
  - Protection interval: $L + R = 3 + 1 = 4$ weeks
  - Safety stock target: $7$ units (95% service level)
  - Calculated $OUT$: $(2.1 \times 4) + 7 = 15.4 \approx 16$ units
  - Raw order quantity: $16 - 4 = 12$ units
  - Supplier MOQ applied: $12$ units (meets MOQ of 10)
- **Agent Reasoning:**
  > *"Inventory position (4 units) has fallen below Reorder Point (13 units). Valve seats are critical for mud pump operation. Recommended order of 12 units prevents stockout over 3-week lead time."*
- **Status:** `APPROVED` (Approved by Procurement Officer; converted to Purchase Order `PO-202610-001` in Sprint 3)

#### Recommendation #2: O-Ring Seal Kit (SKU: `SEAL-KIT-04`)
- **Run ID:** `RUN-20261012-002`
- **Criticality:** `STANDARD`
- **Location:** `WH-01`
- **Supplier:** Gulf Industrial Seals (Lead Time: 2 weeks, MOQ: 25)
- **Inputs:**
  - On-hand stock: $12$ units
  - Calculated $OUT$: $38$ units
  - Raw order quantity: $26$ units $\rightarrow$ Rounded to multiple of 25: $50$ units
- **Status:** `OPEN`

---

## 8. Procedure for Updating This Document

Whenever a new AI forecasting run, model backtest, or recommendation batch is executed:
1. **Record the Run**: Append a new row to the **Execution History Log** in Section 6 with `Run ID`, timestamps, data cutoff, method, and performance metrics.
2. **Log High-Value Recommendations**: Record critical or notable recommendations in Section 7.
3. **Record Human Decisions**: When an operator approves or dismisses recommendations via the API or frontend, update the decision status (`APPROVED` $\rightarrow$ converted to PO #, or `DISMISSED` with reason).
4. **Commit Documentation**: Commit the updated log with `git commit -m "docs(ai): record run <RUN-ID> results and recommendation audit trail"`.
