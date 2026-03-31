"""
TaxPilot AI - PDF Parser
=========================
Extract text and tables from PDF invoices using pdfplumber.
Falls back to OCR for scanned PDFs.
"""

import os
from typing import Optional
from loguru import logger

try:
    import pdfplumber
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    logger.warning("pdfplumber not installed.")


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract all text from a PDF file.

    Args:
        pdf_path: Path to the PDF file.

    Returns:
        Combined text from all pages.
    """
    if not PDF_AVAILABLE:
        logger.error("pdfplumber not available")
        return ""

    if not os.path.exists(pdf_path):
        logger.error(f"PDF file not found: {pdf_path}")
        return ""

    text_parts: list[str] = []

    try:
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text() or ""
                text_parts.append(page_text)
                logger.debug(f"Page {i+1}: extracted {len(page_text)} chars")

        combined = "\n".join(text_parts).strip()

        # If no text is extracted, the PDF is likely scanned → try OCR
        if len(combined) < 20:
            logger.info("Minimal text from pdfplumber, attempting OCR fallback")
            combined = _ocr_fallback(pdf_path)

        logger.info(f"Extracted {len(combined)} chars from {pdf_path}")
        return combined

    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        return ""


def extract_tables_from_pdf(pdf_path: str) -> list[list[list[str]]]:
    """
    Extract tables from all pages of a PDF.

    Returns:
        List of tables (each table is a list of rows, each row a list of cells).
    """
    if not PDF_AVAILABLE:
        return []

    tables: list[list[list[str]]] = []

    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_tables = page.extract_tables()
                if page_tables:
                    tables.extend(page_tables)
        logger.info(f"Extracted {len(tables)} tables from {pdf_path}")
    except Exception as e:
        logger.error(f"Table extraction failed: {e}")

    return tables


def _ocr_fallback(pdf_path: str) -> str:
    """
    Convert PDF pages to images and run OCR.
    Uses pdf2image if available, otherwise returns empty.
    """
    try:
        from pdf2image import convert_from_path
        from tools.ocr_tool import extract_text_from_image
        import tempfile

        images = convert_from_path(pdf_path, dpi=300)
        texts: list[str] = []

        for i, img in enumerate(images):
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                img.save(tmp.name, "PNG")
                text = extract_text_from_image(tmp.name)
                texts.append(text)
                os.unlink(tmp.name)

        return "\n".join(texts)
    except ImportError:
        logger.warning("pdf2image not available for OCR fallback")
        return ""
    except Exception as e:
        logger.error(f"OCR fallback failed: {e}")
        return ""


def process_document(file_path: str) -> dict:
    """
    Unified entry point: process a PDF or image file and return parsed invoice fields.

    Args:
        file_path: Path to PDF or image file.

    Returns:
        Dict with raw_text and parsed invoice fields.
    """
    from tools.ocr_tool import parse_invoice_fields, extract_text_from_image

    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        raw_text = extract_text_from_pdf(file_path)
    elif ext in (".png", ".jpg", ".jpeg", ".tiff", ".bmp"):
        raw_text = extract_text_from_image(file_path)
    else:
        logger.warning(f"Unsupported file type: {ext}")
        raw_text = ""

    fields = parse_invoice_fields(raw_text)
    fields["raw_text"] = raw_text
    fields["file_name"] = os.path.basename(file_path)

    return fields
