"""
TaxPilot AI - OCR Tool
======================
Extract text from images using pytesseract with OpenCV pre-processing.
Parse structured invoice fields via regex patterns.
"""

import re
from typing import Optional
from loguru import logger

try:
    import pytesseract
    from PIL import Image
    import cv2
    import numpy as np
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    logger.warning("OCR dependencies not installed. OCR will use fallback mode.")


def preprocess_image(image_path: str) -> "np.ndarray":
    """
    Pre-process image for better OCR accuracy.
    Applies grayscale, Gaussian blur, and adaptive thresholding.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Image not found: {image_path}")

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Adaptive thresholding for better text contrast
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, 2
    )

    return thresh


def extract_text_from_image(image_path: str) -> str:
    """
    Extract raw text from an image file using pytesseract.

    Args:
        image_path: Path to the image file.

    Returns:
        Extracted text string.
    """
    if not OCR_AVAILABLE:
        logger.error("pytesseract/OpenCV not available for OCR.")
        return ""

    try:
        processed = preprocess_image(image_path)
        # Use PSM 6 for uniform block of text
        custom_config = r"--oem 3 --psm 6"
        text = pytesseract.image_to_string(processed, config=custom_config)
        logger.info(f"OCR extracted {len(text)} chars from {image_path}")
        return text.strip()
    except Exception as e:
        logger.error(f"OCR extraction failed for {image_path}: {e}")
        return ""


def parse_invoice_fields(text: str) -> dict:
    """
    Parse structured invoice fields from raw OCR text using regex patterns.

    Returns dict with keys:
        vendor, gstin, invoice_number, invoice_date, amount, cgst, sgst, igst
    """
    result = {
        "vendor": None,
        "gstin": None,
        "invoice_number": None,
        "invoice_date": None,
        "amount": 0.0,
        "cgst": 0.0,
        "sgst": 0.0,
        "igst": 0.0,
    }

    if not text:
        return result

    # ── GSTIN (15-char alphanumeric pattern) ──
    gstin_pattern = r"\b(\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1})\b"
    gstin_match = re.search(gstin_pattern, text, re.IGNORECASE)
    if gstin_match:
        result["gstin"] = gstin_match.group(1).upper()

    # ── Invoice Number ──
    inv_patterns = [
        r"(?:Invoice\s*(?:No|Number|#|Num)[.:]*\s*)([A-Z0-9\-/]+)",
        r"(?:Inv\s*(?:No|#)[.:]*\s*)([A-Z0-9\-/]+)",
        r"(?:Bill\s*(?:No|Number|#)[.:]*\s*)([A-Z0-9\-/]+)",
    ]
    for pattern in inv_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result["invoice_number"] = match.group(1).strip()
            break

    # ── Invoice Date ──
    date_patterns = [
        r"(?:Date|Invoice\s*Date|Dated)[.:]*\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})",
        r"(?:Date|Invoice\s*Date|Dated)[.:]*\s*(\d{1,2}\s+\w+\s+\d{2,4})",
        r"\b(\d{2}[-/]\d{2}[-/]\d{4})\b",
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result["invoice_date"] = match.group(1).strip()
            break

    # ── Vendor Name (heuristic: first non-empty line that looks like a name) ──
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    for line in lines[:5]:
        # Skip common header keywords
        if re.match(r"^(tax|invoice|bill|date|gstin|gst|from|to|ship)", line, re.IGNORECASE):
            continue
        if len(line) > 3 and not line.isdigit():
            result["vendor"] = line
            break

    # ── Amount Extraction ──
    amount_patterns = [
        r"(?:Total|Grand\s*Total|Net\s*Amount|Amount\s*Payable)[.:]*\s*[₹$]*\s*([\d,]+\.?\d*)",
        r"(?:Total\s*Amount)[.:]*\s*[₹$]*\s*([\d,]+\.?\d*)",
    ]
    for pattern in amount_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result["amount"] = _parse_amount(match.group(1))
            break

    # ── CGST ──
    cgst_match = re.search(
        r"(?:CGST|Central\s*GST)[^₹$\d]*[₹$]*\s*([\d,]+\.?\d*)", text, re.IGNORECASE
    )
    if cgst_match:
        result["cgst"] = _parse_amount(cgst_match.group(1))

    # ── SGST ──
    sgst_match = re.search(
        r"(?:SGST|State\s*GST)[^₹$\d]*[₹$]*\s*([\d,]+\.?\d*)", text, re.IGNORECASE
    )
    if sgst_match:
        result["sgst"] = _parse_amount(sgst_match.group(1))

    # ── IGST ──
    igst_match = re.search(
        r"(?:IGST|Integrated\s*GST)[^₹$\d]*[₹$]*\s*([\d,]+\.?\d*)", text, re.IGNORECASE
    )
    if igst_match:
        result["igst"] = _parse_amount(igst_match.group(1))

    logger.info(f"Parsed invoice fields: {result}")
    return result


def _parse_amount(value: str) -> float:
    """Convert comma-formatted amount strings to float."""
    try:
        return float(value.replace(",", ""))
    except (ValueError, TypeError):
        return 0.0
