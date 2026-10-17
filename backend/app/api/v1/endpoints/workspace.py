from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field

from backend.app.core.database import get_db
from backend.app.models.workspace import WorkspaceSetting
from backend.app.models.items import Item
from backend.app.models.item_suppliers import ItemSupplier
from backend.app.models.categories import Category
from backend.app.models.locations import Location
from backend.app.models.suppliers import Supplier
from backend.app.models.projects import Project
from backend.app.models.stock_balances import StockBalance
from backend.app.models.stock_movements import StockMovement
from backend.app.models.purchase_orders import PurchaseOrder, PurchaseOrderLine
from backend.app.models.alerts import Alert
from backend.app.models.attachments import DocumentAttachment
from backend.ai.models import Recommendation, Forecast, BacktestResult, ItemPolicy, AIRun
from backend.scripts.seed import seed_master_data, seed_demo_items_and_ledger

router = APIRouter()

class WorkspaceInfoResponse(BaseModel):
    company_name: str
    facility_name: str
    industry: str = "GENERAL"
    is_demo_dataset: bool
    total_items: int
    total_locations: int
    total_stock_value_minor: int
    currency: str = "USD"

class InitCleanWorkspaceRequest(BaseModel):
    company_name: str = Field(min_length=2, max_length=120)
    warehouse_name: str = Field(min_length=2, max_length=120)
    warehouse_code: str = Field(default="WH-01", min_length=2, max_length=30)
    industry: Optional[str] = Field(default="GENERAL", max_length=50)

class UpdateWorkspaceProfileRequest(BaseModel):
    company_name: str = Field(min_length=2, max_length=120)
    industry: Optional[str] = Field(default="GENERAL", max_length=50)

def get_setting_value(db: Session, key: str, default: str) -> str:
    setting = db.query(WorkspaceSetting).filter_by(key=key).first()
    return setting.value if setting else default

def set_setting_value(db: Session, key: str, value: str):
    setting = db.query(WorkspaceSetting).filter_by(key=key).first()
    if setting:
        setting.value = value
    else:
        db.add(WorkspaceSetting(key=key, value=value))

@router.get("/info", response_model=WorkspaceInfoResponse)
def get_workspace_info(db: Session = Depends(get_db)):
    company_name = get_setting_value(db, "company_name", "StockSense Energy Logistics")
    facility_name = get_setting_value(db, "facility_name", "Central Receiving Yard • Base (WH-01)")
    industry = get_setting_value(db, "industry", "GENERAL")
    is_demo_raw = get_setting_value(db, "is_demo_dataset", "auto")

    total_items = db.query(Item).filter(Item.is_active == 1).count()
    total_locations = db.query(Location).filter(Location.is_active == 1).count()

    # Calculate total stock valuation
    val_subq = (
        db.query(func.sum(StockBalance.quantity_on_hand * Item.unit_cost_minor))
        .join(Item, StockBalance.item_id == Item.id)
        .scalar()
    )
    total_stock_val = int(val_subq or 0)

    if is_demo_raw == "auto":
        is_demo = total_items > 0
    else:
        is_demo = is_demo_raw.lower() in ("true", "1", "yes")

    return WorkspaceInfoResponse(
        company_name=company_name,
        facility_name=facility_name,
        industry=industry,
        is_demo_dataset=is_demo,
        total_items=total_items,
        total_locations=total_locations,
        total_stock_value_minor=total_stock_val,
        currency="USD",
    )

@router.put("/profile", response_model=WorkspaceInfoResponse)
def update_workspace_profile(payload: UpdateWorkspaceProfileRequest, db: Session = Depends(get_db)):
    company_clean = payload.company_name.strip()
    if not company_clean:
        raise HTTPException(status_code=400, detail="Company name cannot be empty.")
    set_setting_value(db, "company_name", company_clean)
    if payload.industry:
        set_setting_value(db, "industry", payload.industry.strip())
    db.commit()
    return get_workspace_info(db)

@router.post("/init-clean", response_model=WorkspaceInfoResponse)
def init_clean_workspace(payload: InitCleanWorkspaceRequest, db: Session = Depends(get_db)):
    company_clean = payload.company_name.strip()
    wh_name_clean = payload.warehouse_name.strip()
    wh_code_clean = payload.warehouse_code.strip().upper()
    industry_clean = (payload.industry or "GENERAL").strip().upper()

    if not company_clean or not wh_name_clean or not wh_code_clean:
        raise HTTPException(status_code=400, detail="Company name and warehouse details are required.")

    try:
        # 1. Clean operational records in child-to-parent order
        db.query(DocumentAttachment).delete()
        db.query(Alert).delete()
        db.query(PurchaseOrderLine).delete()
        db.query(PurchaseOrder).delete()
        db.query(StockMovement).delete()
        db.query(StockBalance).delete()
        db.query(Recommendation).delete()
        db.query(Forecast).delete()
        db.query(BacktestResult).delete()
        db.query(ItemPolicy).delete()
        db.query(AIRun).delete()
        db.query(ItemSupplier).delete()
        db.query(Item).delete()
        db.query(Project).delete()
        db.query(Location).delete()
        db.query(Category).delete()

        # 2. Seed industry-tailored clean categories
        if industry_clean in ("APPAREL", "FASHION", "CLOTHING"):
            default_categories = [
                ("APPAREL_TOPS", "Tops, Shirts, Blouses & Knitwear"),
                ("APPAREL_BOTTOMS", "Pants, Trousers, Jeans & Skirts"),
                ("OUTERWEAR", "Jackets, Coats & Outerwear"),
                ("FOOTWEAR", "Shoes, Boots, Sneakers & Sandals"),
                ("ACCESSORIES", "Bags, Belts, Scarves & Headwear"),
                ("RAW_FABRICS", "Fabrics, Linings, Trims & Textiles"),
            ]
        elif industry_clean in ("ELECTRONICS", "TECH"):
            default_categories = [
                ("COMPUTING_DEVICES", "Laptops, Tablets, PCs & Servers"),
                ("PERIPHERALS_ACCESSORIES", "Keyboards, Mice, Monitors & Cables"),
                ("MOBILE_AUDIO", "Smartphones, Headphones & Wearables"),
                ("COMPONENTS_BOARDS", "PCBs, Microcontrollers & ICs"),
                ("POWER_BATTERIES", "Power Supplies, Adapters & Batteries"),
                ("NETWORKING_IOT", "Routers, Switches & IoT Modules"),
            ]
        elif industry_clean in ("INDUSTRIAL", "ENERGY", "MRO"):
            default_categories = [
                ("MECHANICAL_PARTS", "Mechanical Equipment & Rotation Spares"),
                ("PIPES_TUBING", "Pipes, Tubing & High-Pressure Fittings"),
                ("VALVES_PRESSURE", "Valves, Flanges & Pressure Control"),
                ("ELECTRICAL_INSTRUMENT", "Electrical, Sensors & Instrumentation"),
                ("TOOLS_HARDWARE", "Rig Tools, Hardware & Consumables"),
                ("CHEMICALS_LUBRICANTS", "Fluids, Thread Compounds & Industrial Chemicals"),
            ]
        else: # GENERAL / RETAIL
            default_categories = [
                ("APPAREL_TEXTILES", "Apparel, Clothing, Footwear & Accessories"),
                ("ELECTRONICS_GADGETS", "Electronics, Devices & Hardware"),
                ("FINISHED_GOODS", "Packaged Goods & Retail Merchandise"),
                ("PARTS_MATERIALS", "Raw Materials, Components & Spares"),
                ("CONSUMABLES_PACKAGING", "Packaging, Supplies & Essentials"),
                ("GENERAL_INVENTORY", "General Store Inventory"),
            ]

        for name, desc in default_categories:
            db.add(Category(name=name, description=desc))

        # 3. Create initial company primary warehouse/store
        primary_loc = Location(
            code=wh_code_clean,
            name=wh_name_clean,
            location_type="WAREHOUSE",
            is_default_replenishment=1,
            is_active=1,
        )
        db.add(primary_loc)

        # 4. Update workspace settings
        set_setting_value(db, "company_name", company_clean)
        set_setting_value(db, "facility_name", f"{wh_name_clean} ({wh_code_clean})")
        set_setting_value(db, "industry", industry_clean)
        set_setting_value(db, "is_demo_dataset", "false")

        db.commit()

        return WorkspaceInfoResponse(
            company_name=company_clean,
            facility_name=f"{wh_name_clean} ({wh_code_clean})",
            industry=industry_clean,
            is_demo_dataset=False,
            total_items=0,
            total_locations=1,
            total_stock_value_minor=0,
            currency="USD",
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to initialize clean workspace: {str(e)}")

@router.post("/restore-demo", response_model=WorkspaceInfoResponse)
def restore_demo_workspace(db: Session = Depends(get_db)):
    try:
        # 1. Clean operational records
        db.query(DocumentAttachment).delete()
        db.query(Alert).delete()
        db.query(PurchaseOrderLine).delete()
        db.query(PurchaseOrder).delete()
        db.query(StockMovement).delete()
        db.query(StockBalance).delete()
        db.query(Recommendation).delete()
        db.query(Forecast).delete()
        db.query(BacktestResult).delete()
        db.query(ItemPolicy).delete()
        db.query(AIRun).delete()
        db.query(ItemSupplier).delete()
        db.query(Item).delete()

        # 2. Reseed master categories, locations, suppliers, projects
        master = seed_master_data(db)

        # 3. Reseed demo 15 items, 52-week ledger movements, sample POs
        seed_demo_items_and_ledger(db, master)

        # 4. Update workspace settings
        set_setting_value(db, "company_name", "StockSense Energy Logistics")
        set_setting_value(db, "facility_name", "Central Receiving Yard • Base (WH-01)")
        set_setting_value(db, "is_demo_dataset", "true")

        db.commit()

        total_items = db.query(Item).filter(Item.is_active == 1).count()
        total_locations = db.query(Location).filter(Location.is_active == 1).count()

        val_subq = (
            db.query(func.sum(StockBalance.quantity_on_hand * Item.unit_cost_minor))
            .join(Item, StockBalance.item_id == Item.id)
            .scalar()
        )
        total_stock_val = int(val_subq or 0)

        return WorkspaceInfoResponse(
            company_name="StockSense Energy Logistics",
            facility_name="Central Receiving Yard • Base (WH-01)",
            is_demo_dataset=True,
            total_items=total_items,
            total_locations=total_locations,
            total_stock_value_minor=total_stock_val,
            currency="USD",
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to restore demo dataset: {str(e)}")
