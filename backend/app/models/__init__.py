from backend.app.core.database import Base
from backend.app.models.categories import Category
from backend.app.models.items import Item
from backend.app.models.suppliers import Supplier
from backend.app.models.item_suppliers import ItemSupplier
from backend.app.models.locations import Location
from backend.app.models.projects import Project
from backend.app.models.users import User
from backend.app.models.stock_movements import StockMovement
from backend.app.models.stock_balances import StockBalance
from backend.app.models.purchase_orders import PurchaseOrder, PurchaseOrderLine
from backend.app.models.alerts import Alert
from backend.app.models.attachments import DocumentAttachment

# Import AI models from unified backend.ai package
from backend.ai.models import (
    AIRun,
    Forecast,
    BacktestResult,
    ItemPolicy,
    Recommendation,
)

__all__ = [
    "Base",
    "Category",
    "Item",
    "Supplier",
    "ItemSupplier",
    "Location",
    "Project",
    "User",
    "StockMovement",
    "StockBalance",
    "PurchaseOrder",
    "PurchaseOrderLine",
    "Alert",
    "DocumentAttachment",
    "AIRun",
    "Forecast",
    "BacktestResult",
    "ItemPolicy",
    "Recommendation",
]

