from typing import List, Tuple
import numpy as np

def classify_demand(demand_series: List[float]) -> Tuple[str, float, float]:
    """
    Classify demand pattern based on Syntetos, Boylan, and Croston framework:
    - ADI (Average Demand Interval): average time between non-zero demand periods.
    - CV2 (Coefficient of Variation Squared): variability of non-zero demand quantities.
    
    Categories:
    - Smooth: ADI < 1.32 and CV2 < 0.49
    - Intermittent: ADI >= 1.32 and CV2 < 0.49
    - Erratic: ADI < 1.32 and CV2 >= 0.49
    - Lumpy: ADI >= 1.32 and CV2 >= 0.49
    """
    if not demand_series or len(demand_series) < 4:
        return "insufficient_history", 0.0, 0.0

    arr = np.array(demand_series, dtype=float)
    nonzero_indices = np.where(arr > 0)[0]
    
    if len(nonzero_indices) == 0:
        return "insufficient_history", 0.0, 0.0
    
    if len(nonzero_indices) == 1:
        return "intermittent", float(len(arr)), 0.0

    # Calculate intervals between consecutive non-zero demand periods
    intervals = np.diff(nonzero_indices)
    adi = float(np.mean(intervals))
    
    # Calculate CV2 for non-zero demand sizes
    nonzero_values = arr[nonzero_indices]
    mean_val = float(np.mean(nonzero_values))
    std_val = float(np.std(nonzero_values, ddof=1)) if len(nonzero_values) > 1 else 0.0
    cv2 = float((std_val / mean_val) ** 2) if mean_val > 0 else 0.0

    if adi < 1.32 and cv2 < 0.49:
        pattern = "smooth"
    elif adi >= 1.32 and cv2 < 0.49:
        pattern = "intermittent"
    elif adi < 1.32 and cv2 >= 0.49:
        pattern = "erratic"
    else:
        pattern = "lumpy"

    return pattern, round(adi, 3), round(cv2, 3)
