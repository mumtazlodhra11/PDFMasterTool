"""Extract structured tables using Camelot and Tabula."""

from __future__ import annotations

import logging
from typing import Iterable, List, Optional, Sequence, Tuple, Dict, Any

import pandas as pd

from .types import ExtractedTable, BBox

LOGGER = logging.getLogger(__name__)

try:
    import camelot  # type: ignore
except Exception:  # pragma: no cover - optional dependency runtime check
    camelot = None
    LOGGER.debug("Camelot not available; table extraction will skip it.")

try:
    import tabula  # type: ignore
    from tabula.io import read_pdf as tabula_read_pdf  # type: ignore
except Exception:  # pragma: no cover - optional dependency runtime check
    tabula = None
    tabula_read_pdf = None
    LOGGER.debug("Tabula not available; table extraction will skip it.")

try:
    import pdfplumber  # type: ignore
except Exception:  # pragma: no cover - optional dependency runtime check
    pdfplumber = None
    LOGGER.debug("pdfplumber not available; deep table fallback disabled.")


def extract_tables(pdf_path: str, page_numbers: Sequence[int]) -> List[ExtractedTable]:
    """Extract tables from the provided PDF path for the selected pages."""

    if not page_numbers:
        return []

    page_spec = _page_numbers_to_spec(page_numbers)
    tables: List[ExtractedTable] = []

    camelot_tables = _extract_with_camelot(pdf_path, page_spec)
    tables.extend(camelot_tables)

    # Only fallback to Tabula if Camelot failed or found nothing.
    if not tables:
        tables.extend(_extract_with_tabula(pdf_path, page_spec))

    if not tables:
        tables.extend(_extract_with_pdfplumber(pdf_path, page_numbers))

    return sorted(tables, key=lambda table: (table.page_index, table.bbox or (0, 0, 0, 0)))


def _extract_with_camelot(pdf_path: str, page_spec: str) -> List[ExtractedTable]:
    if camelot is None:
        return []

    tables: List[ExtractedTable] = []
    seen_signatures: set[Tuple[Tuple[str, ...], ...]] = set()

    for flavor in ("stream", "lattice"):
        try:
            table_list = camelot.read_pdf(
                pdf_path,
                pages=page_spec,
                flavor=flavor,
                strip_text="\n",
            )
        except Exception as exc:
            LOGGER.warning("Camelot %s extraction failed: %s", flavor, exc)
            continue

        for table in table_list:
            cleaned = _clean_dataframe(table.df)
            if not cleaned:
                continue

            signature = tuple(tuple(row) for row in cleaned)
            if signature in seen_signatures:
                continue
            seen_signatures.add(signature)

            bbox: Optional[BBox] = None
            if getattr(table, "_bbox", None):
                bbox_tuple = tuple(table._bbox)
                bbox = (float(bbox_tuple[0]), float(bbox_tuple[1]), float(bbox_tuple[2]), float(bbox_tuple[3]))

            metadata = {
                "accuracy": getattr(table, "accuracy", None),
                "flavor": flavor,
            }

            try:
                page_index = max(int(getattr(table, "page", 1)) - 1, 0)
            except Exception:
                page_index = 0

            tables.append(
                ExtractedTable(
                    page_index=page_index,
                    data=cleaned,
                    bbox=bbox,
                    source=f"camelot-{flavor}",
                    metadata=metadata,
                )
            )

    return tables


def _extract_with_tabula(pdf_path: str, page_spec: str) -> List[ExtractedTable]:
    if tabula_read_pdf is None:
        return []

    tables: List[ExtractedTable] = []
    seen_signatures: set[Tuple[Tuple[str, ...], ...]] = set()

    for lattice_mode in (True, False):
        try:
            dfs = tabula_read_pdf(  # type: ignore[misc]
                pdf_path,
                pages=page_spec,
                lattice=lattice_mode,
                stream=not lattice_mode,
                multiple_tables=True,
                pandas_options={"dtype": str, "header": None},
            )
        except Exception as exc:
            LOGGER.warning("Tabula extraction failed (lattice=%s): %s", lattice_mode, exc)
            continue

        if dfs is None:
            continue
        if isinstance(dfs, pd.DataFrame):
            dfs = [dfs]

        for df in dfs:
            cleaned = _clean_dataframe(df)
            if not cleaned:
                continue
            signature = tuple(tuple(row) for row in cleaned)
            if signature in seen_signatures:
                continue
            seen_signatures.add(signature)

            page_index = 0
            try:
                page_meta = df.attrs.get("page")
                if page_meta:
                    page_index = max(int(page_meta) - 1, 0)
            except Exception:
                pass

            tables.append(
                ExtractedTable(
                    page_index=page_index,
                    data=cleaned,
                    bbox=None,
                    source=f"tabula-{'lattice' if lattice_mode else 'stream'}",
                )
            )

        if tables:
            break

    return tables


def _extract_with_pdfplumber(pdf_path: str, page_numbers: Sequence[int]) -> List[ExtractedTable]:
    if pdfplumber is None:
        return []

    normalized_pages = sorted({idx for idx in page_numbers if idx >= 0})
    if not normalized_pages:
        normalized_pages = [0]

    tables: List[ExtractedTable] = []
    seen_signatures: set[Tuple[Tuple[str, ...], ...]] = set()

    TABLE_SETTINGS: Sequence[Dict[str, Any]] = [
        {
            "vertical_strategy": "lines",
            "horizontal_strategy": "lines",
            "intersection_tolerance": 5,
            "snap_tolerance": 3,
            "join_tolerance": 3,
        },
        {
            "vertical_strategy": "lines",
            "horizontal_strategy": "text",
            "intersection_tolerance": 5,
        },
        {
            "vertical_strategy": "text",
            "horizontal_strategy": "text",
            "text_tolerance": 1,
        },
    ]

    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_index in normalized_pages:
                if page_index >= len(pdf.pages):
                    continue
                page = pdf.pages[page_index]

                page_found_tables = False
                for settings in TABLE_SETTINGS:
                    try:
                        raw_tables = page.extract_tables(settings)
                    except Exception as exc:
                        LOGGER.debug(
                            "pdfplumber extraction failed on page %s with settings %s: %s",
                            page_index,
                            settings,
                            exc,
                        )
                        continue

                    if not raw_tables:
                        continue

                    for raw_table in raw_tables:
                        cleaned = _clean_pdfplumber_table(raw_table)
                        if not cleaned:
                            continue
                        signature = tuple(tuple(row) for row in cleaned)
                        if signature in seen_signatures:
                            continue
                        seen_signatures.add(signature)

                        tables.append(
                            ExtractedTable(
                                page_index=page_index,
                                data=cleaned,
                                bbox=None,
                                source=f"pdfplumber-{settings.get('vertical_strategy')}-{settings.get('horizontal_strategy')}",
                            )
                        )
                        page_found_tables = True

                    if page_found_tables:
                        break
    except Exception as exc:
        LOGGER.warning("pdfplumber table extraction failed: %s", exc)

    return tables


def _clean_dataframe(df: pd.DataFrame) -> List[List[str]]:
    rows: List[List[str]] = []
    for _, row in df.iterrows():
        values = []
        has_data = False
        for cell in row.tolist():
            cell_text = ""
            if cell is not None and not (isinstance(cell, float) and pd.isna(cell)):
                cell_text = str(cell).strip()
            if cell_text:
                has_data = True
            values.append(cell_text)
        if has_data:
            rows.append(values)
    return rows


def _clean_pdfplumber_table(raw_table: Optional[List[List[Optional[str]]]]) -> List[List[str]]:
    if not raw_table:
        return []
    cleaned: List[List[str]] = []
    for row in raw_table:
        if not row:
            continue
        values: List[str] = []
        has_data = False
        for cell in row:
            text = (cell or "").strip()
            if text:
                has_data = True
            values.append(text)
        if has_data:
            cleaned.append(values)
    return cleaned


def _page_numbers_to_spec(page_numbers: Sequence[int]) -> str:
    # Camelot/Tabula expect 1-indexed page numbers.
    normalized = sorted({idx + 1 for idx in page_numbers if idx >= 0})
    return ",".join(str(number) for number in normalized)

