import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.core.database import get_db
from backend.app.models.alerts import Alert
from backend.app.models.items import Item
from backend.app.models.locations import Location
from backend.app.models.stock_balances import StockBalance
from backend.app.models.users import User
from backend.app.schemas.alerts import (
    AlertResponse, AlertAcknowledgeRequest, AlertResolveRequest
)

router = APIRouter()

def ensure_initial_seed_alerts(db: Session):
    """Seed initial operational exception alerts if table is empty."""
    if db.query(Alert).count() > 0:
        return

    items = db.query(Item).all()
    locations = db.query(Location).all()
    users = db.query(User).all()

    if not items or not locations:
        return

    wh_loc = next((l for l in locations if l.code == "WH-01"), locations[0])
    rig_loc = next((l for l in locations if "RIG" in l.code), locations[-1])
    yard_loc = next((l for l in locations if "YARD" in l.code), locations[0])

    admin_user = next((u for u in users if u.role == "ADMIN"), users[0] if users else None)

    seed_alerts = [
        Alert(
            alert_type="STOCKOUT_RISK",
            severity="CRITICAL",
            item_id=items[0].id,
            location_id=rig_loc.id,
            message=f"Critical Stockout Risk on {items[0].sku} ({items[0].name}) at {rig_loc.name}. Immediate drilling disruption hazard.",
            details_json=json.dumps({
                "current_on_hand": 0,
                "safety_stock": 5,
                "reorder_point": 15,
                "lead_time_days": 18,
                "drilling_phase": "Deep Casing Section",
            }),
            status="OPEN",
            created_at=datetime.now(timezone.utc).isoformat(),
        ),
        Alert(
            alert_type="LOW_STOCK",
            severity="WARNING",
            item_id=items[1].id if len(items) > 1 else items[0].id,
            location_id=wh_loc.id,
            message=f"Stock Below Reorder Point for {items[1].sku if len(items) > 1 else items[0].sku} at {wh_loc.name}.",
            details_json=json.dumps({
                "current_on_hand": 4,
                "reorder_point": 10,
                "open_pos": 0,
                "recommended_order": 20,
            }),
            status="OPEN",
            created_at=datetime.now(timezone.utc).isoformat(),
        ),
        Alert(
            alert_type="ANOMALOUS_ISSUE",
            severity="WARNING",
            item_id=items[2].id if len(items) > 2 else items[0].id,
            location_id=wh_loc.id,
            message=f"High Issue Velocity on {items[2].sku if len(items) > 2 else items[0].sku}: 3 consecutive withdrawals exceeding 3-sigma demand envelope.",
            details_json=json.dumps({
                "window_days": 7,
                "expected_mean_demand": 1.2,
                "actual_issued_units": 15,
                "destination": "Rig-07 Offshore",
            }),
            status="OPEN",
            created_at=datetime.now(timezone.utc).isoformat(),
        ),
        Alert(
            alert_type="SUSPICIOUS_ADJUSTMENT",
            severity="INFO",
            item_id=items[0].id,
            location_id=yard_loc.id,
            message=f"Cycle count shrinkage adjustment recorded on {items[0].sku} at {yard_loc.name}.",
            details_json=json.dumps({
                "delta": -2,
                "auditor": "Cycle Count Team Bravo",
                "variance_reason": "Physical bin recount post-sandstorm",
            }),
            status="ACKNOWLEDGED",
            created_at=datetime.now(timezone.utc).isoformat(),
            acknowledged_by_user_id=admin_user.id if admin_user else None,
            acknowledged_at=datetime.now(timezone.utc).isoformat(),
        ),
    ]

    for a in seed_alerts:
        db.add(a)
    db.commit()

def format_alert_response(a: Alert, item: Optional[Item], loc: Optional[Location], ack_user: Optional[User], res_user: Optional[User]) -> AlertResponse:
    return AlertResponse(
        id=a.id,
        alert_type=a.alert_type,
        severity=a.severity,
        item_id=a.item_id,
        item_sku=item.sku if item else None,
        item_name=item.name if item else None,
        location_id=a.location_id,
        location_code=loc.code if loc else None,
        movement_id=a.movement_id,
        source_run_id=a.source_run_id,
        message=a.message,
        details_json=a.details_json,
        status=a.status,
        created_at=a.created_at,
        acknowledged_by_user_id=a.acknowledged_by_user_id,
        acknowledged_by_name=ack_user.full_name if ack_user else None,
        acknowledged_at=a.acknowledged_at,
        resolved_by_user_id=a.resolved_by_user_id,
        resolved_by_name=res_user.full_name if res_user else None,
        resolved_at=a.resolved_at,
    )

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    alert_type: Optional[str] = Query(None),
    item_id: Optional[int] = Query(None),
    limit: int = Query(100, le=200),
    db: Session = Depends(get_db),
):
    ensure_initial_seed_alerts(db)

    query = db.query(Alert)
    if severity and severity.upper() != "ALL":
        query = query.filter(Alert.severity == severity.upper())
    if status and status.upper() != "ALL":
        query = query.filter(Alert.status == status.upper())
    if alert_type and alert_type.upper() != "ALL":
        query = query.filter(Alert.alert_type == alert_type.upper())
    if item_id:
        query = query.filter(Alert.item_id == item_id)

    alerts = query.order_by(Alert.id.desc()).limit(limit).all()

    # Preload entities for hydration
    item_ids = [a.item_id for a in alerts if a.item_id]
    loc_ids = [a.location_id for a in alerts if a.location_id]
    user_ids = list(set([a.acknowledged_by_user_id for a in alerts if a.acknowledged_by_user_id] +
                        [a.resolved_by_user_id for a in alerts if a.resolved_by_user_id]))

    items_map = {i.id: i for i in db.query(Item).filter(Item.id.in_(item_ids)).all()} if item_ids else {}
    locs_map = {l.id: l for l in db.query(Location).filter(Location.id.in_(loc_ids)).all()} if loc_ids else {}
    users_map = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()} if user_ids else {}

    return [
        format_alert_response(
            a,
            items_map.get(a.item_id),
            locs_map.get(a.location_id),
            users_map.get(a.acknowledged_by_user_id),
            users_map.get(a.resolved_by_user_id)
        )
        for a in alerts
    ]

@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: int,
    payload: AlertAcknowledgeRequest = AlertAcknowledgeRequest(),
    db: Session = Depends(get_db),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_by_user_id = payload.user_id
    alert.acknowledged_at = datetime.now(timezone.utc).isoformat()
    db.commit()
    db.refresh(alert)

    item = db.query(Item).filter_by(id=alert.item_id).first() if alert.item_id else None
    loc = db.query(Location).filter_by(id=alert.location_id).first() if alert.location_id else None
    ack_user = db.query(User).filter_by(id=alert.acknowledged_by_user_id).first() if alert.acknowledged_by_user_id else None
    res_user = db.query(User).filter_by(id=alert.resolved_by_user_id).first() if alert.resolved_by_user_id else None

    return format_alert_response(alert, item, loc, ack_user, res_user)

@router.post("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(
    alert_id: int,
    payload: AlertResolveRequest = AlertResolveRequest(),
    db: Session = Depends(get_db),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    alert.status = "RESOLVED"
    alert.resolved_by_user_id = payload.user_id
    alert.resolved_at = datetime.now(timezone.utc).isoformat()
    db.commit()
    db.refresh(alert)

    item = db.query(Item).filter_by(id=alert.item_id).first() if alert.item_id else None
    loc = db.query(Location).filter_by(id=alert.location_id).first() if alert.location_id else None
    ack_user = db.query(User).filter_by(id=alert.acknowledged_by_user_id).first() if alert.acknowledged_by_user_id else None
    res_user = db.query(User).filter_by(id=alert.resolved_by_user_id).first() if alert.resolved_by_user_id else None

    return format_alert_response(alert, item, loc, ack_user, res_user)
