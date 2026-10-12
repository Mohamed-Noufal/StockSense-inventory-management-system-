from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.ai.service import AIService
from backend.ai.schemas import (
    AIRunTriggerRequest,
    AIRunStatusResponse,
    RecommendationResponse,
    RecommendationDecisionRequest,
)
from backend.ai.models import AIRun, Recommendation
from backend.app.schemas.purchase_orders import POResponse
from backend.app.api.v1.endpoints.purchase_orders import _format_po

router = APIRouter()

@router.post("/runs", response_model=AIRunStatusResponse)
def trigger_ai_run(request: AIRunTriggerRequest, db: Session = Depends(get_db)):
    """Trigger a new AI forecasting and replenishment policy run."""
    run = AIService.execute_ai_run(db, request)
    rec_count = db.query(Recommendation).filter(Recommendation.run_id == run.id).count()
    return AIRunStatusResponse(
        id=run.id,
        run_type=run.run_type,
        status=run.status,
        started_at=run.started_at,
        finished_at=run.finished_at,
        data_cutoff=run.data_cutoff,
        random_seed=run.random_seed,
        model_version=run.model_version,
        recommendations_count=rec_count,
        error=run.error,
    )

@router.get("/runs", response_model=List[AIRunStatusResponse])
def list_ai_runs(limit: int = Query(20, le=100), db: Session = Depends(get_db)):
    """List historical AI forecasting and replenishment runs."""
    runs = db.query(AIRun).order_by(AIRun.id.desc()).limit(limit).all()
    results = []
    for r in runs:
        rec_count = db.query(Recommendation).filter(Recommendation.run_id == r.id).count()
        results.append(AIRunStatusResponse(
            id=r.id, run_type=r.run_type, status=r.status, started_at=r.started_at,
            finished_at=r.finished_at, data_cutoff=r.data_cutoff, random_seed=r.random_seed,
            model_version=r.model_version, recommendations_count=rec_count, error=r.error
        ))
    return results

@router.get("/recommendations", response_model=List[RecommendationResponse])
def list_recommendations(status: Optional[str] = None, db: Session = Depends(get_db)):
    """List replenishment recommendations with optional status filter (OPEN, APPROVED, DISMISSED)."""
    return AIService.get_recommendations(db, status=status)

@router.post("/recommendations/{id}/approve", response_model=POResponse)
def approve_recommendation(id: int, db: Session = Depends(get_db)):
    """
    Approve an AI recommendation and convert it atomically into a formal Purchase Order.
    Preserves human-in-the-loop requirement: model cannot autonomously place orders.
    """
    po = AIService.approve_recommendation(db, id)
    return _format_po(po, db)

@router.post("/recommendations/{id}/dismiss", response_model=RecommendationResponse)
def dismiss_recommendation(
    id: int, payload: RecommendationDecisionRequest, db: Session = Depends(get_db)
):
    """Dismiss an AI recommendation with an operator audit rationale."""
    rec = AIService.dismiss_recommendation(db, id, reason=payload.decision_note or "Operator dismissed")
    # Return formatted response
    recs = AIService.get_recommendations(db)
    for r in recs:
        if r.id == rec.id:
            return r
    raise HTTPException(status_code=404, detail="Recommendation not found after update")
