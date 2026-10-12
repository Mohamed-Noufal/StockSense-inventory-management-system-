from typing import List
from fastapi import APIRouter, Depends, HTTPException
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

@router.get("/recommendations", response_model=List[RecommendationResponse])
def list_recommendations(db: Session = Depends(get_db)):
    """List all open human-reviewable replenishment recommendations."""
    recs = AIService.get_open_recommendations(db)
    return recs
