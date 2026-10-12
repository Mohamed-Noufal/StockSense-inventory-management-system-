import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.ai.models import AIRun, ItemPolicy, Recommendation
from backend.ai.demand_extractor import extract_weekly_demand
from backend.ai.pipeline import process_item_replenishment
from backend.ai.schemas import AIRunTriggerRequest, RecommendationResponse
from backend.app.models.items import Item
from backend.app.models.suppliers import Supplier
from backend.app.models.locations import Location
from backend.app.models.purchase_orders import PurchaseOrder
from backend.app.schemas.purchase_orders import POCreate, POLineCreate
from backend.app.services.procurement_service import create_po

class AIService:
    @staticmethod
    def execute_ai_run(db: Session, request: AIRunTriggerRequest) -> AIRun:
        cutoff = request.data_cutoff or datetime.now(timezone.utc).isoformat()
        ai_run = AIRun(
            run_type="FORECAST_AND_POLICY",
            status="RUNNING",
            started_at=datetime.now(timezone.utc).isoformat(),
            data_cutoff=cutoff,
            random_seed=request.random_seed,
            params_json=json.dumps({"service_level": request.service_level, "default_method": request.default_method}),
            model_version="0.1.0",
        )
        db.add(ai_run)
        db.commit()
        db.refresh(ai_run)

        try:
            demand_map = extract_weekly_demand(db, cutoff_iso=cutoff, history_weeks=52)
            default_loc = db.query(Location).filter_by(is_default_replenishment=1).first() or db.query(Location).first()
            dest_loc_id = default_loc.id if default_loc else 1
            items = db.query(Item).filter(Item.is_active == 1).all()

            for item in items:
                series = demand_map.get(item.id, [0.0] * 52)
                process_item_replenishment(
                    db=db,
                    ai_run_id=ai_run.id,
                    item=item,
                    series=series,
                    service_level=request.service_level,
                    default_method=request.default_method,
                    dest_loc_id=dest_loc_id,
                )

            ai_run.status = "SUCCEEDED"
            ai_run.finished_at = datetime.now(timezone.utc).isoformat()
            db.commit()
            db.refresh(ai_run)
            return ai_run
        except Exception as e:
            db.rollback()
            ai_run.status = "FAILED"
            ai_run.error = str(e)
            ai_run.finished_at = datetime.now(timezone.utc).isoformat()
            db.add(ai_run)
            db.commit()
            raise

    @staticmethod
    def get_recommendations(db: Session, status: Optional[str] = None) -> List[RecommendationResponse]:
        query = db.query(Recommendation)
        if status:
            query = query.filter(Recommendation.status == status.upper())
        recs = query.order_by(Recommendation.id.desc()).all()
        results = []
        for r in recs:
            item = db.query(Item).filter_by(id=r.item_id).first()
            sup = db.query(Supplier).filter_by(id=r.supplier_id).first()
            loc = db.query(Location).filter_by(id=r.destination_location_id).first()
            pol = db.query(ItemPolicy).filter_by(run_id=r.run_id, item_id=r.item_id).first()
            linked_po = db.query(PurchaseOrder).filter_by(source_recommendation_id=r.id).first()
            results.append(RecommendationResponse(
                id=r.id, run_id=r.run_id, item_id=r.item_id, supplier_id=r.supplier_id,
                destination_location_id=r.destination_location_id, status=r.status,
                urgency=r.urgency, on_hand=r.on_hand, on_order=r.on_order,
                inventory_position=r.inventory_position, reorder_point=r.reorder_point,
                suggested_qty=r.suggested_qty, explanation_json=r.explanation_json,
                summary_text=r.summary_text, created_at=r.created_at,
                item_sku=item.sku if item else None, item_name=item.name if item else None,
                supplier_name=sup.name if sup else None, location_code=loc.code if loc else None,
                demand_pattern=pol.demand_pattern if pol else None, forecast_method=pol.selected_method if pol else None,
                created_po_id=linked_po.id if linked_po else None, created_po_number=linked_po.po_number if linked_po else None
            ))
        return results

    @staticmethod
    def approve_recommendation(db: Session, rec_id: int, user_id: Optional[int] = None) -> PurchaseOrder:
        rec = db.query(Recommendation).filter_by(id=rec_id).first()
        if not rec:
            raise HTTPException(status_code=404, detail=f"Recommendation {rec_id} not found")
        if rec.status != "OPEN":
            raise HTTPException(status_code=400, detail=f"Recommendation is already {rec.status}")

        item = db.query(Item).filter_by(id=rec.item_id).first()
        po_in = POCreate(
            supplier_id=rec.supplier_id,
            notes=f"Auto-drafted from AI Recommendation #{rec.id} ({rec.urgency} urgency)",
            source_recommendation_id=rec.id,
            lines=[
                POLineCreate(
                    item_id=rec.item_id,
                    destination_location_id=rec.destination_location_id,
                    qty_ordered=rec.suggested_qty,
                    unit_price_minor=item.unit_cost_minor or 10000,
                )
            ]
        )
        po = create_po(db, po_in, user_id=user_id)
        rec.status = "APPROVED"
        rec.decided_at = datetime.now(timezone.utc).isoformat()
        rec.decided_by_user_id = user_id
        db.commit()
        db.refresh(rec)
        return po

    @staticmethod
    def dismiss_recommendation(db: Session, rec_id: int, reason: str, user_id: Optional[int] = None) -> Recommendation:
        rec = db.query(Recommendation).filter_by(id=rec_id).first()
        if not rec:
            raise HTTPException(status_code=404, detail=f"Recommendation {rec_id} not found")
        if rec.status != "OPEN":
            raise HTTPException(status_code=400, detail=f"Recommendation is already {rec.status}")

        rec.status = "DISMISSED"
        rec.decision_note = reason
        rec.decided_at = datetime.now(timezone.utc).isoformat()
        rec.decided_by_user_id = user_id
        db.commit()
        db.refresh(rec)
        return rec
