import json
from datetime import datetime, timezone
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from backend.ai.models import AIRun, Forecast, ItemPolicy, Recommendation
from backend.ai.classification import classify_demand
from backend.ai.forecasting import forecast_demand
from backend.ai.policy import calculate_inventory_policy
from backend.ai.agent import ReplenishmentAgent
from backend.ai.schemas import AIRunTriggerRequest

class AIService:
    @staticmethod
    def execute_ai_run(db: Session, request: AIRunTriggerRequest) -> AIRun:
        cutoff = request.data_cutoff or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        # 1. Create AI Run record
        ai_run = AIRun(
            run_type="FORECAST_AND_POLICY",
            status="RUNNING",
            started_at=datetime.now(timezone.utc).isoformat(),
            data_cutoff=cutoff,
            random_seed=request.random_seed,
            params_json=json.dumps({
                "service_level": request.service_level,
                "default_method": request.default_method,
            }),
            model_version="0.1.0",
        )
        db.add(ai_run)
        db.commit()
        db.refresh(ai_run)

        try:
            # 2. Mark succeeded and record timestamp
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
    def get_open_recommendations(db: Session) -> List[Recommendation]:
        return db.query(Recommendation).filter(Recommendation.status == "OPEN").all()
