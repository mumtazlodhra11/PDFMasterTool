"""Utilities for extracting diagrams and images using PyMuPDF."""

from __future__ import annotations

import io
import logging
from typing import Iterable, List

import fitz

from .types import ImageFragment, BBox

LOGGER = logging.getLogger(__name__)


def extract_images(
    doc: fitz.Document,
    page_indices: Iterable[int],
    dpi: int = 220,
) -> List[ImageFragment]:
    """Extract diagrams/images from the given pages.

    Args:
        doc: An open PyMuPDF document.
        page_indices: Iterable of zero-based page indices to process.
        dpi: Render resolution used for fallback snapshots.

    Returns:
        A list of ImageFragment instances with approximate page positioning.
    """

    fragments: List[ImageFragment] = []

    for page_index in page_indices:
        try:
            page = doc.load_page(page_index)
        except Exception as exc:
            LOGGER.error("Failed to load page %s for image extraction: %s", page_index, exc)
            continue

        page_rect = page.rect
        blocks = []
        try:
            blocks = page.get_text("rawdict").get("blocks", [])
        except Exception as exc:
            LOGGER.warning("rawdict text extraction failed for page %s: %s", page_index, exc)

        page_has_native_images = False

        # Extract all embedded images from the page
        for block in blocks or []:
            if block.get("type") != 1:  # Type 1 = image block
                continue

            xref = block.get("image")
            bbox = tuple(block.get("bbox", (page_rect.x0, page_rect.y0, page_rect.x1, page_rect.y1)))
            if not xref:
                continue

            try:
                base_image = doc.extract_image(xref)
            except Exception as exc:
                LOGGER.warning("Unable to extract image xref %s on page %s: %s", xref, page_index, exc)
                continue

            img_bytes = base_image.get("image")
            width = int(base_image.get("width", 0))
            height = int(base_image.get("height", 0))

            if not img_bytes or width == 0 or height == 0:
                continue

            # Extract image format
            ext = base_image.get("ext", "png")
            if ext not in ["png", "jpg", "jpeg"]:
                # Convert to PNG if needed
                try:
                    from PIL import Image as PILImage
                    import io
                    pil_img = PILImage.open(io.BytesIO(img_bytes))
                    png_buffer = io.BytesIO()
                    pil_img.save(png_buffer, format="PNG")
                    img_bytes = png_buffer.getvalue()
                except Exception as conv_exc:
                    LOGGER.warning("Could not convert image to PNG: %s", conv_exc)
                    continue

            fragments.append(
                ImageFragment(
                    page_index=page_index,
                    bbox=bbox,  # type: ignore[arg-type]
                    image_bytes=img_bytes,
                    width=width,
                    height=height,
                    label="embedded-image",
                )
            )
            page_has_native_images = True
            LOGGER.info(f"Extracted embedded image from page {page_index + 1}: {width}x{height} at position {bbox}")

        # Also try extracting images using get_images() method (more comprehensive)
        try:
            image_list = page.get_images(full=True)
            for img_index, img in enumerate(image_list):
                xref = img[0]
                try:
                    base_image = doc.extract_image(xref)
                    img_bytes = base_image.get("image")
                    width = int(base_image.get("width", 0))
                    height = int(base_image.get("height", 0))
                    
                    if img_bytes and width > 0 and height > 0:
                        # Check if we already added this image
                        already_added = any(
                            f.page_index == page_index and 
                            abs(f.width - width) < 5 and 
                            abs(f.height - height) < 5
                            for f in fragments
                        )
                        
                        if not already_added:
                            # Get image position from page
                            try:
                                image_rects = page.get_image_rects(xref)
                                if image_rects:
                                    bbox = tuple(image_rects[0])
                                else:
                                    # Fallback: use page dimensions
                                    bbox = (page_rect.x0, page_rect.y0, page_rect.x1, page_rect.y1)
                            except:
                                bbox = (page_rect.x0, page_rect.y0, page_rect.x1, page_rect.y1)
                            
                            fragments.append(
                                ImageFragment(
                                    page_index=page_index,
                                    bbox=bbox,
                                    image_bytes=img_bytes,
                                    width=width,
                                    height=height,
                                    label="embedded-image",
                                )
                            )
                            LOGGER.info(f"Extracted image via get_images() from page {page_index + 1}: {width}x{height}")
                except Exception as img_exc:
                    LOGGER.debug("Could not extract image %s: %s", xref, img_exc)
                    continue
        except Exception as get_images_exc:
            LOGGER.debug("get_images() failed for page %s: %s", page_index, get_images_exc)

        # Only skip page snapshot if we found native images
        if page_has_native_images and len([f for f in fragments if f.page_index == page_index and f.label == "embedded-image"]) > 0:
            continue

        try:
            scale = dpi / 72.0
            pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
            img_bytes = pix.tobytes("png")
            fragments.append(
                ImageFragment(
                    page_index=page_index,
                    bbox=(page_rect.x0, page_rect.y0, page_rect.x1, page_rect.y1),
                    image_bytes=img_bytes,
                    width=pix.width,
                    height=pix.height,
                    label="page-snapshot",
                )
            )
        except Exception as exc:
            LOGGER.warning("Unable to render fallback snapshot for page %s: %s", page_index, exc)

    return fragments

