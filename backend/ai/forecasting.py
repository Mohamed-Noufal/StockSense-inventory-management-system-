from typing import List, Dict
import numpy as np

def croston_forecast(series: List[float], horizon: int = 4, alpha: float = 0.1) -> List[float]:
    """Croston's Method for intermittent demand."""
    if not series:
        return [0.0] * horizon
    
    y = np.array(series, dtype=float)
    nonzeros = np.where(y > 0)[0]
    if len(nonzeros) == 0:
        return [0.0] * horizon

    # Initialize estimates
    z = float(y[nonzeros[0]])  # demand size estimate
    p = 1.0                    # interval estimate
    q = 1                      # periods since last non-zero demand

    for t in range(1, len(y)):
        if y[t] > 0:
            z = z + alpha * (y[t] - z)
            p = p + alpha * (q - p)
            q = 1
        else:
            q += 1

    mean_rate = float(z / p) if p > 0 else 0.0
    return [max(0.0, round(mean_rate, 3))] * horizon

def sba_forecast(series: List[float], horizon: int = 4, alpha: float = 0.1) -> List[float]:
    """Syntetos-Boylan Approximation (SBA) - deflates Croston's positive bias."""
    croston_vals = croston_forecast(series, horizon=horizon, alpha=alpha)
    # SBA correction factor: (1 - alpha / 2)
    correction = 1.0 - (alpha / 2.0)
    return [max(0.0, round(val * correction, 3)) for val in croston_vals]

def moving_average_forecast(series: List[float], horizon: int = 4, window: int = 8) -> List[float]:
    """Simple Moving Average baseline."""
    if not series:
        return [0.0] * horizon
    w = series[-window:] if len(series) >= window else series
    val = float(np.mean(w))
    return [max(0.0, round(val, 3))] * horizon

def forecast_demand(series: List[float], method: str = "sba", horizon: int = 4) -> Dict[str, any]:
    """Dispatches forecasting based on chosen method."""
    method_normalized = method.lower().strip()
    if method_normalized == "croston":
        forecast_vals = croston_forecast(series, horizon=horizon)
    elif method_normalized == "ma8":
        forecast_vals = moving_average_forecast(series, horizon=horizon, window=8)
    else:
        # Default to SBA
        forecast_vals = sba_forecast(series, horizon=horizon)
        method_normalized = "sba"

    return {
        "method": method_normalized,
        "horizon": horizon,
        "mean_values": forecast_vals,
        "step_1_mean": forecast_vals[0] if forecast_vals else 0.0,
    }
