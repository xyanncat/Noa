from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
import time

class MemoryLayerType(str, Enum):
    WORKING = "working"
    SHORT_TERM = "short_term"
    LONG_TERM = "long_term"
    SEMANTIC = "semantic"
    EPISODIC = "episodic"

class MemoryItem(BaseModel):
    id: Optional[str] = None
    layer: MemoryLayerType
    category: str = "general" # 'preference', 'fact', 'event', 'task', 'goal'
    key: str
    value: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = 1.0
    timestamp: float = Field(default_factory=time.time)

class MemorySearchResult(BaseModel):
    item: MemoryItem
    score: float = 1.0
