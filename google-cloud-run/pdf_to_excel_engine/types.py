"""Shared dataclasses for the PDF to Excel engine."""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Tuple, Dict, Any

BBox = Tuple[float, float, float, float]


@dataclass(frozen=True)
class ParagraphBlock:
    """Represents a paragraph or text block extracted from a PDF page."""

    page_index: int
    lines: List[str]
    bbox: BBox
    bg_color: Optional[Tuple[int, int, int]] = None  # RGB background color (0-255)
    text_color: Optional[Tuple[int, int, int]] = None  # RGB text color (0-255)


@dataclass(frozen=True)
class ExtractedTable:
    """Represents a structured table extracted from a PDF page."""

    page_index: int
    data: List[List[str]]
    bbox: Optional[BBox]
    source: str
    metadata: Optional[Dict[str, Any]] = None


@dataclass(frozen=True)
class ImageFragment:
    """Represents an image or diagram extracted from a PDF page."""

    page_index: int
    bbox: BBox
    image_bytes: bytes
    width: int
    height: int
    label: str = "diagram"

