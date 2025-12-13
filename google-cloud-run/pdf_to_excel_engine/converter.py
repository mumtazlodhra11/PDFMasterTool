"""High-level PDF to Excel conversion pipeline."""

from __future__ import annotations

import logging
import os
import re
import tempfile
from collections import defaultdict
from typing import Dict, Iterable, List, Sequence, Tuple

import fitz

from .excel_builder import build_workbook
from .image_extractor import extract_images
from .table_extractor import extract_tables
from .types import ExtractedTable, ParagraphBlock

LOGGER = logging.getLogger(__name__)

MIN_PDF_BYTES = 100
DEFAULT_MAX_PAGES = 200


def convert_pdf_to_excel(
    pdf_bytes: bytes,
    *,
    max_pages: int = DEFAULT_MAX_PAGES,
) -> Tuple[bytes, Dict[str, int]]:
    """Convert the supplied PDF bytes into a single-sheet workbook."""

    if not pdf_bytes or len(pdf_bytes) < MIN_PDF_BYTES:
        raise ValueError("File is too small or empty.")

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as exc:
        raise ValueError(f"Unable to open PDF: {exc}") from exc

    with doc:
        total_pages = doc.page_count
        page_indices = list(range(min(total_pages, max_pages)))

        if not page_indices:
            raise ValueError("No pages detected in PDF.")

        # Persist to disk for Camelot/Tabula.
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
            temp_pdf.write(pdf_bytes)
            temp_pdf_path = temp_pdf.name

        try:
            tables = extract_tables(temp_pdf_path, page_indices)
        finally:
            try:
                os.remove(temp_pdf_path)
            except OSError:
                LOGGER.debug("Temporary PDF file already removed.")

        table_bboxes = defaultdict(list)
        for table in tables:
            if table.bbox:
                table_bboxes[table.page_index].append(table.bbox)

        paragraphs = _extract_paragraphs(doc, page_indices, table_bboxes)
        images = extract_images(doc, page_indices)

        workbook_bytes, excel_stats = build_workbook(paragraphs, tables, images)

        metadata = {
            "pages_processed": len(page_indices),
            "tables_detected": len(tables),
            "images_extracted": excel_stats.get("images_embedded", 0),
            "text_blocks": len(paragraphs),
            "rows_written": excel_stats.get("rows_written", 0),
            "max_pages_reached": int(total_pages > len(page_indices)),
        }

        return workbook_bytes, metadata


def _extract_paragraphs(
    doc: fitz.Document,
    page_indices: Sequence[int],
    table_bboxes_per_page: Dict[int, List[Tuple[float, float, float, float]]],
) -> List[ParagraphBlock]:
    paragraphs: List[ParagraphBlock] = []

    for page_index in page_indices:
        try:
            page = doc.load_page(page_index)
        except Exception as exc:
            LOGGER.error("Failed to load page %s for text extraction: %s", page_index, exc)
            continue

        blocks = []
        try:
            # Get blocks sorted by position (top to bottom, left to right)
            # Use "blocks" method which gives better text extraction than "dict"
            blocks = page.get_text("blocks", sort=True)
            # Additional sorting to ensure exact order: by Y position, then X position
            blocks = sorted(blocks, key=lambda b: (b[1] if len(b) > 1 else 0, b[0] if len(b) > 0 else 0))
            
            # If no blocks found, try alternative extraction method
            if not blocks:
                LOGGER.warning("No blocks found with 'blocks' method on page %s, trying 'dict' method", page_index)
                try:
                    dict_data = page.get_text("dict")
                    # Convert dict format to blocks format
                    for block_dict in dict_data.get("blocks", []):
                        if block_dict.get("type") == 0:  # Text block
                            bbox = block_dict.get("bbox", [])
                            if len(bbox) >= 4:
                                text_lines = []
                                for line in block_dict.get("lines", []):
                                    line_text = " ".join([span.get("text", "") for span in line.get("spans", [])])
                                    if line_text.strip():
                                        text_lines.append(line_text)
                                if text_lines:
                                    blocks.append((bbox[0], bbox[1], bbox[2], bbox[3], "\n".join(text_lines), 0, 0, 0))
                except Exception as dict_exc:
                    LOGGER.warning("Dict extraction also failed on page %s: %s", page_index, dict_exc)
        except Exception as exc:
            LOGGER.warning("PyMuPDF block extraction failed on page %s: %s", page_index, exc)
            continue

        # Get detailed block info with colors using rawdict
        color_info = {}
        try:
            raw_dict = page.get_text("rawdict")
            for block_dict in raw_dict.get("blocks", []):
                if block_dict.get("type") == 0:  # Text block
                    bbox = block_dict.get("bbox", [])
                    if len(bbox) >= 4:
                        block_key = (bbox[0], bbox[1], bbox[2], bbox[3])
                        # Extract background color from spans
                        bg_colors = []
                        text_colors = []
                        for line in block_dict.get("lines", []):
                            for span in line.get("spans", []):
                                # Get text color (PyMuPDF color is 24-bit integer: 0xRRGGBB)
                                color = span.get("color", 0)
                                if color and color != 0:
                                    # Extract RGB from 24-bit color
                                    r = (color >> 16) & 0xFF
                                    g = (color >> 8) & 0xFF
                                    b = color & 0xFF
                                    text_colors.append((r, g, b))
                                
                                # Get fill/background color
                                fill = span.get("fill", 0)
                                if fill and fill != 0 and fill != color:
                                    r = (fill >> 16) & 0xFF
                                    g = (fill >> 8) & 0xFF
                                    b = fill & 0xFF
                                    bg_colors.append((r, g, b))
                        
                        if bg_colors or text_colors:
                            color_info[block_key] = {
                                "bg": bg_colors[0] if bg_colors else None,
                                "text": text_colors[0] if text_colors else None
                            }
        except Exception as color_exc:
            LOGGER.debug("Could not extract colors: %s", color_exc)

        table_bboxes = table_bboxes_per_page.get(page_index, [])
        seen_bboxes = set()  # Track seen blocks to prevent duplicates
        seen_text_content = set()  # Track seen text content to prevent duplicates

        for block in blocks:
            if len(block) < 5:
                continue
            x0, y0, x1, y1 = block[0], block[1], block[2], block[3]
            text = block[4] if len(block) > 4 else ""
            bbox = (x0, y0, x1, y1)

            if not isinstance(text, str):
                continue

            lines = [_sanitize_text(line) for line in text.splitlines()]
            lines = [line for line in lines if line]
            if not lines:
                continue
            
            # DON'T skip blocks that overlap with tables - tables and text can coexist
            # Only skip if block is COMPLETELY inside a table (which is rare)
            # This ensures ALL content is extracted
            
            # MINIMAL duplicate detection - only exact position + exact text matches
            # This ensures ALL content is extracted, only true duplicates are skipped
            bbox_key = (round(x0, 1), round(y0, 1), round(x1, 1), round(y1, 1))
            text_key = lines[0][:100] if lines else ""  # Use first line for comparison
            duplicate_key = (page_index, bbox_key, text_key)
            
            # Only skip if EXACT same position AND same first line (true duplicate)
            if duplicate_key in seen_bboxes:
                LOGGER.debug(f"Skipping exact duplicate block at page {page_index}, position {bbox_key}")
                continue
            seen_bboxes.add(duplicate_key)
            
            # DON'T check for text duplicates at different positions - this was filtering out valid content
            # Only exact position+text duplicates are skipped
            
            # Check 3: Overlapping blocks with similar content (merge instead of duplicate)
            # This is handled by the position-based sorting, but we skip if content is identical

            # Get colors for this block
            block_key = (x0, y0, x1, y1)
            colors = color_info.get(block_key, {})
            bg_color = colors.get("bg")
            text_color = colors.get("text")
            
            # Also check if this is in a colored header area (top portion of page)
            page_rect = page.rect
            if y0 < (page_rect.height * 0.20) and not bg_color:  # Top 20% of page - likely header
                # Check if there's a colored background by sampling the area
                try:
                    # Sample a larger area to detect background color more accurately
                    sample_width = min(x1 - x0, 100)
                    sample_height = min(y1 - y0, 30)
                    clip_rect = fitz.Rect(x0, y0, x0 + sample_width, y0 + sample_height)
                    pix = page.get_pixmap(clip=clip_rect, matrix=fitz.Matrix(2, 2))  # 2x scale for better sampling
                    if pix and pix.samples:
                        # Get average color of the sampled area
                        samples = pix.samples
                        if len(samples) >= 3:
                            # Average RGB values (samples are in RGB order)
                            r_values = [samples[i] for i in range(0, len(samples), 3)]
                            g_values = [samples[i] for i in range(1, len(samples), 3)]
                            b_values = [samples[i] for i in range(2, len(samples), 3)]
                            
                            if r_values and g_values and b_values:
                                avg_r = sum(r_values) // len(r_values)
                                avg_g = sum(g_values) // len(g_values)
                                avg_b = sum(b_values) // len(b_values)
                                
                                # If it's a dark/non-white color (likely header background)
                                # Check if it's significantly different from white (255, 255, 255)
                                if (avg_r < 240 or avg_g < 240 or avg_b < 240) and (avg_r + avg_g + avg_b < 700):
                                    bg_color = (avg_r, avg_g, avg_b)
                                    # If background is dark, text is usually white/light
                                    if avg_r < 150 and avg_g < 150 and avg_b < 150:
                                        text_color = (255, 255, 255)
                                    else:
                                        text_color = (0, 0, 0)  # Dark text on light background
                except Exception as sample_exc:
                    LOGGER.debug("Could not sample header color: %s", sample_exc)

            paragraphs.append(ParagraphBlock(
                page_index=page_index, 
                lines=lines, 
                bbox=bbox,
                bg_color=bg_color,
                text_color=text_color
            ))

    return paragraphs


def _bbox_intersects_any(
    bbox: Tuple[float, float, float, float],
    other_bboxes: Iterable[Tuple[float, float, float, float]],
) -> bool:
    for other in other_bboxes:
        if not other:
            continue
        if bbox[2] <= other[0] or other[2] <= bbox[0]:
            continue
        if bbox[3] <= other[1] or other[3] <= bbox[1]:
            continue
        return True
    return False


def _sanitize_text(value: str) -> str:
    value = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", value or "")
    return value.strip()

