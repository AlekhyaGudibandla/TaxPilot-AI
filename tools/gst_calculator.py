"""
TaxPilot AI - GST Calculator
==============================
Compute GST summaries, generate GSTR-1 and GSTR-3B tables.
Includes GSTIN validation.
"""

import re
from typing import Optional
from loguru import logger


# ────────────────────────── GSTIN Validation ──────────────────────────

def validate_gstin(gstin: Optional[str]) -> bool:
    """
    Validate Indian GSTIN format.
    Format: 2-digit state code + 10-char PAN + 1 entity code + Z + 1 check digit.
    Example: 27AAPFU0939F1ZV
    """
    if not gstin:
        return False
    pattern = r"^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$"
    return bool(re.match(pattern, gstin.upper()))


def get_state_from_gstin(gstin: str) -> Optional[str]:
    """Extract state code from GSTIN (first 2 digits)."""
    STATE_CODES = {
        "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
        "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana",
        "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
        "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
        "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
        "16": "Tripura", "17": "Meghalaya", "18": "Assam",
        "19": "West Bengal", "20": "Jharkhand", "21": "Odisha",
        "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
        "26": "Dadra & Nagar Haveli", "27": "Maharashtra",
        "29": "Karnataka", "30": "Goa", "31": "Lakshadweep",
        "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry",
        "35": "Andaman & Nicobar", "36": "Telangana",
        "37": "Andhra Pradesh",
    }
    if gstin and len(gstin) >= 2:
        return STATE_CODES.get(gstin[:2])
    return None


# ────────────────────────── GST Summary ──────────────────────────

def calculate_gst_summary(invoices: list[dict]) -> dict:
    """
    Compute GST summary from a list of invoice dicts.

    Args:
        invoices: List of invoice dicts with keys:
            amount, cgst, sgst, igst, invoice_type ('sales' or 'purchase')

    Returns:
        Dict with total_sales, total_purchases, output_gst, input_gst,
        net_gst_payable, and per-component breakdowns.
    """
    total_sales = 0.0
    total_purchases = 0.0
    output_cgst = 0.0
    output_sgst = 0.0
    output_igst = 0.0
    input_cgst = 0.0
    input_sgst = 0.0
    input_igst = 0.0

    for inv in invoices:
        amount = float(inv.get("amount", 0))
        cgst = float(inv.get("cgst", 0))
        sgst = float(inv.get("sgst", 0))
        igst = float(inv.get("igst", 0))
        inv_type = inv.get("invoice_type", "purchase").lower()

        if inv_type == "sales":
            total_sales += amount
            output_cgst += cgst
            output_sgst += sgst
            output_igst += igst
        else:
            total_purchases += amount
            input_cgst += cgst
            input_sgst += sgst
            input_igst += igst

    output_gst = output_cgst + output_sgst + output_igst
    input_gst = input_cgst + input_sgst + input_igst
    net_gst_payable = max(0, output_gst - input_gst)

    summary = {
        "total_sales": round(total_sales, 2),
        "total_purchases": round(total_purchases, 2),
        "output_gst": {
            "cgst": round(output_cgst, 2),
            "sgst": round(output_sgst, 2),
            "igst": round(output_igst, 2),
            "total": round(output_gst, 2),
        },
        "input_gst": {
            "cgst": round(input_cgst, 2),
            "sgst": round(input_sgst, 2),
            "igst": round(input_igst, 2),
            "total": round(input_gst, 2),
        },
        "net_gst_payable": round(net_gst_payable, 2),
        "itc_available": round(input_gst, 2),
    }

    logger.info(f"GST Summary: Net payable = ₹{net_gst_payable:.2f}")
    return summary


# ────────────────────────── GSTR-1 Summary ──────────────────────────

def generate_gstr1_summary(invoices: list[dict]) -> list[dict]:
    """
    Generate GSTR-1 (outward supplies) summary table.
    Groups sales invoices by GST rate slab.
    """
    sales = [inv for inv in invoices if inv.get("invoice_type", "").lower() == "sales"]

    rate_groups: dict[str, dict] = {}
    for inv in sales:
        amount = float(inv.get("amount", 0))
        cgst = float(inv.get("cgst", 0))
        sgst = float(inv.get("sgst", 0))
        igst = float(inv.get("igst", 0))
        total_gst = cgst + sgst + igst
        taxable = amount - total_gst if amount > total_gst else amount

        # Determine rate slab
        rate = _estimate_gst_rate(taxable, total_gst)
        rate_key = f"{rate}%"

        if rate_key not in rate_groups:
            rate_groups[rate_key] = {
                "rate": rate_key,
                "count": 0,
                "taxable_value": 0.0,
                "cgst": 0.0,
                "sgst": 0.0,
                "igst": 0.0,
                "total_tax": 0.0,
            }

        rate_groups[rate_key]["count"] += 1
        rate_groups[rate_key]["taxable_value"] += taxable
        rate_groups[rate_key]["cgst"] += cgst
        rate_groups[rate_key]["sgst"] += sgst
        rate_groups[rate_key]["igst"] += igst
        rate_groups[rate_key]["total_tax"] += total_gst

    result = list(rate_groups.values())
    for item in result:
        for k in ["taxable_value", "cgst", "sgst", "igst", "total_tax"]:
            item[k] = round(item[k], 2)

    return result


# ────────────────────────── GSTR-3B Summary ──────────────────────────

def generate_gstr3b_summary(invoices: list[dict]) -> dict:
    """
    Generate GSTR-3B summary with outward/inward supplies sections.
    """
    summary = calculate_gst_summary(invoices)

    gstr3b = {
        "section_3_1": {
            "description": "Outward Supplies (other than nil/exempted)",
            "taxable_value": summary["total_sales"],
            "igst": summary["output_gst"]["igst"],
            "cgst": summary["output_gst"]["cgst"],
            "sgst": summary["output_gst"]["sgst"],
        },
        "section_4": {
            "description": "Eligible ITC",
            "igst": summary["input_gst"]["igst"],
            "cgst": summary["input_gst"]["cgst"],
            "sgst": summary["input_gst"]["sgst"],
        },
        "section_6_1": {
            "description": "Net Tax Payable",
            "igst": round(
                max(0, summary["output_gst"]["igst"] - summary["input_gst"]["igst"]), 2
            ),
            "cgst": round(
                max(0, summary["output_gst"]["cgst"] - summary["input_gst"]["cgst"]), 2
            ),
            "sgst": round(
                max(0, summary["output_gst"]["sgst"] - summary["input_gst"]["sgst"]), 2
            ),
        },
    }

    return gstr3b


# ────────────────────────── Helpers ──────────────────────────

def _estimate_gst_rate(taxable: float, total_gst: float) -> int:
    """Estimate the GST rate slab from taxable value and total GST."""
    if taxable <= 0:
        return 0
    rate = (total_gst / taxable) * 100
    # Round to nearest standard slab
    slabs = [0, 5, 12, 18, 28]
    return min(slabs, key=lambda s: abs(s - rate))
