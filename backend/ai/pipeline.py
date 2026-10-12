import json
import numpy as np
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.ai.models import AIRun, ItemPolicy, Recommendation
from backend.ai.classification import classify_demand
from backend.ai.forecasting import forecast_demand
from backend.ai.policy import calculate_inventory_policy
from backend.ai.agent import ReplenishmentAgent
from backend.ai.demand_extractor import extract_weekly_demand
from backend.app.models.items import Item
from backend.app.models.suppliers import Supplier
from backend.app.models.locations import Location
from backend.app.models.item_suppliers import ItemSupplier
from backend.app.models.stock_balances import StockBalance
from backend.app.models.purchase_orders import PurchaseOrder, PurchaseOrderLine

def process_item_replenishment(
    db: Session,
    ai_run_id: int,
    item: Item,
    series: list[float],
    service_level: float,
    default_method: str,
    dest_loc_id: int
) -> None:
    pattern, adi, cv2 = classify_demand(series)
    fc_info = forecast_demand(series, method=default_method)

    item_sup = db.query(ItemSupplier).filter_by(item_id=item.id).order_by(ItemSupplier.is_preferred.desc()).first()
    supplier_id = item_sup.supplier_id if item_sup else (db.query(Supplier).first().id if db.query(Supplier).first() else 1)
    lead_time_days = float(item_sup.lead_time_days_nominal or 14) if item_sup else 14.0
    moq = item_sup.moq or 1 if item_sup else 1
    order_multiple = item_sup.order_multiple or 1 if item_sup else 1

    mean_d = float(fc_info.get("step_1_mean", 0.0))
    policy = calculate_inventory_policy(
        mean_weekly_demand=mean_d,
        lead_time_days=int(lead_time_days),
        service_level=service_level,
        unit_cost_minor=item.unit_cost_minor or 1000,
        moq=moq,
        order_multiple=order_multiple,
    )

    item_pol = ItemPolicy(
        run_id=ai_run_id,
        item_id=item.id,
        demand_pattern=pattern,
        adi=adi,
        cv2=cv2,
        selected_method=fc_info.get("method", default_method),
        service_level=service_level,
        lead_time_mean_days=lead_time_days,
        lead_time_p90_days=lead_time_days * 1.3,
        mean_weekly_demand=mean_d,
        safety_stock=policy["safety_stock"],
        reorder_point=policy["reorder_point"],
        order_up_to=policy["order_up_to"],
    )
    db.add(item_pol)

    bal = db.query(func.sum(StockBalance.quantity_on_hand)).filter(StockBalance.item_id == item.id).scalar() or 0
    open_lines = db.query(PurchaseOrderLine).join(PurchaseOrder).filter(
        PurchaseOrderLine.item_id == item.id,
        PurchaseOrder.status.in_(["APPROVED", "PARTIALLY_RECEIVED"])
    ).all()
    on_order = sum(max(0, l.qty_ordered - l.qty_received) for l in open_lines)

    proposal = ReplenishmentAgent.evaluate_item(
        item_id=item.id,
        item_sku=item.sku,
        item_name=item.name,
        supplier_id=supplier_id,
        destination_location_id=dest_loc_id,
        on_hand=int(bal),
        on_order=int(on_order),
        policy=policy,
        moq=moq,
        order_multiple=order_multiple,
    )
    if proposal:
        rec = Recommendation(
            run_id=ai_run_id,
            item_id=item.id,
            supplier_id=supplier_id,
            destination_location_id=dest_loc_id,
            status="OPEN",
            urgency=proposal["urgency"],
            on_hand=proposal["on_hand"],
            on_order=proposal["on_order"],
            inventory_position=proposal["inventory_position"],
            reorder_point=proposal["reorder_point"],
            suggested_qty=proposal["suggested_qty"],
            explanation_json=json.dumps(proposal["explanation"]),
            summary_text=proposal["summary_text"],
        )
        db.add(rec)
