from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class DashboardSummary(BaseModel):
    total_products: int
    total_inventory_value: float
    low_stock_count: int
    movements_today: int
    
    model_config = ConfigDict(from_attributes=True)