from typing import Dict
import math

def calculate_inventory_policy(
    mean_weekly_demand: float,
    lead_time_days: int,
    service_level: float = 0.95,
    unit_cost_minor: int = 1000,
    moq: int = 1,
    order_multiple: int = 1,
) -> Dict[str, any]:
    """
    Calculate inventory replenishment policy:
    - Lead time in weeks: L = lead_time_days / 7.0
    - Expected Lead Time Demand (LTD) = mean_weekly_demand * L
    - Safety Stock (SS) based on target service level
    - Reorder Point (ROP) = LTD + SS
    - Order Up To Level (OUT)
    """
    lead_time_weeks = max(0.14, lead_time_days / 7.0)
    lead_time_demand = mean_weekly_demand * lead_time_weeks
    
    # Normal quantile z-factor approximation for service level
    # 0.90 -> 1.28, 0.95 -> 1.645, 0.98 -> 2.05, 0.99 -> 2.33
    if service_level >= 0.99:
        z = 2.33
    elif service_level >= 0.95:
        z = 1.645
    elif service_level >= 0.90:
        z = 1.28
    else:
        z = 1.0

    # Demand standard deviation heuristic for intermittent/poisson-like processes
    demand_std = math.sqrt(max(1.0, mean_weekly_demand))
    safety_stock = int(math.ceil(z * demand_std * math.sqrt(lead_time_weeks)))
    reorder_point = int(math.ceil(lead_time_demand + safety_stock))
    
    # Suggested order size based on lead time buffer and constraints
    cycle_stock = max(moq, int(math.ceil(lead_time_demand)))
    if order_multiple > 1:
        cycle_stock = int(math.ceil(cycle_stock / order_multiple) * order_multiple)
    
    order_up_to = reorder_point + cycle_stock

    return {
        "service_level": service_level,
        "lead_time_days": lead_time_days,
        "lead_time_weeks": round(lead_time_weeks, 2),
        "lead_time_demand": round(lead_time_demand, 2),
        "safety_stock": safety_stock,
        "reorder_point": reorder_point,
        "order_up_to": order_up_to,
        "target_cycle_stock": cycle_stock,
    }
