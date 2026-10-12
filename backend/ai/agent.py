from typing import Dict, Optional
import math

class ReplenishmentAgent:
    """
    Advisory replenishment agent:
    Analyzes stock positions against risk-based replenishment policies and
    generates transparent, human-reviewable order recommendations.
    """

    @staticmethod
    def evaluate_item(
        item_id: int,
        item_sku: str,
        item_name: str,
        supplier_id: int,
        destination_location_id: int,
        on_hand: int,
        on_order: int,
        policy: Dict[str, any],
        moq: int = 1,
        order_multiple: int = 1,
    ) -> Optional[Dict[str, any]]:
        inventory_position = on_hand + on_order
        reorder_point = policy["reorder_point"]
        order_up_to = policy["order_up_to"]

        # Only recommend if inventory position breached reorder point
        if inventory_position > reorder_point:
            return None

        # Calculate suggested quantity respecting supplier pack rules
        deficit = max(0, order_up_to - inventory_position)
        suggested_qty = max(moq, deficit)
        if order_multiple > 1:
            suggested_qty = int(math.ceil(suggested_qty / order_multiple) * order_multiple)

        # Assess urgency
        if on_hand == 0 and on_order == 0:
            urgency = "CRITICAL"
        elif on_hand <= policy["safety_stock"]:
            urgency = "HIGH"
        else:
            urgency = "NORMAL"

        explanation = {
            "formula": "Order suggested because Inventory Position (on_hand + on_order) <= Reorder Point (ROP)",
            "on_hand": on_hand,
            "on_order": on_order,
            "inventory_position": inventory_position,
            "safety_stock": policy["safety_stock"],
            "reorder_point": reorder_point,
            "order_up_to": order_up_to,
            "lead_time_days": policy["lead_time_days"],
            "moq": moq,
            "order_multiple": order_multiple,
        }

        summary_text = (
            f"Replenishment proposed for {item_sku} ({item_name}). Current position is "
            f"{inventory_position} (on-hand: {on_hand}, open POs: {on_order}), which is below "
            f"ROP threshold of {reorder_point}. Recommending {suggested_qty} units from preferred "
            f"supplier to restore position to target {order_up_to} (service level: {int(policy['service_level']*100)}%)."
        )

        return {
            "item_id": item_id,
            "supplier_id": supplier_id,
            "destination_location_id": destination_location_id,
            "status": "OPEN",
            "urgency": urgency,
            "on_hand": on_hand,
            "on_order": on_order,
            "inventory_position": inventory_position,
            "reorder_point": reorder_point,
            "suggested_qty": suggested_qty,
            "explanation": explanation,
            "summary_text": summary_text,
        }
