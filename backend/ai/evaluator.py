from typing import List, Dict
import numpy as np

def evaluate_forecast(actuals: List[float], predictions: List[float]) -> Dict[str, float]:
    """
    Evaluate forecast metrics out-of-sample:
    - Bias: mean(predictions - actuals)
    - MAE: mean(|predictions - actuals|)
    - RMSE: sqrt(mean((predictions - actuals)^2))
    """
    if not actuals or not predictions or len(actuals) != len(predictions):
        return {"mae": 0.0, "rmse": 0.0, "bias": 0.0}

    y_true = np.array(actuals, dtype=float)
    y_pred = np.array(predictions, dtype=float)
    errors = y_pred - y_true

    bias = float(np.mean(errors))
    mae = float(np.mean(np.abs(errors)))
    rmse = float(np.sqrt(np.mean(errors ** 2)))

    return {
        "bias": round(bias, 3),
        "mae": round(mae, 3),
        "rmse": round(rmse, 3),
    }
