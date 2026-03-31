"""
TaxPilot AI - Sample Data Generator
=====================================
Creates sample invoice data and seeds the database for testing.
"""

import os
import sys
import json
import random
from datetime import datetime, timedelta

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db import init_db, get_db_session
from database.models import Invoice, Client


SAMPLE_VENDORS = [
    {"name": "Tata Consultancy Services", "gstin": "27AAPCS0236Q1Z5", "industry": "IT Services"},
    {"name": "Amazon Web Services India", "gstin": "29AABCU9603R1ZM", "industry": "Cloud Computing"},
    {"name": "Reliance Jio Infocomm", "gstin": "27AABCR5055K1ZN", "industry": "Telecommunications"},
    {"name": "Wipro Technologies", "gstin": "29AABCW6212G1Z0", "industry": "IT Services"},
    {"name": "Hindustan Unilever", "gstin": "27AAACH2702R1ZP", "industry": "FMCG"},
    {"name": "Infosys Limited", "gstin": "29AABCI1131E1ZP", "industry": "IT Services"},
    {"name": "ITC Limited", "gstin": "33AABCI6900G1ZO", "industry": "Conglomerate"},
    {"name": "HDFC Bank", "gstin": "27AABCH0520L1ZA", "industry": "Banking"},
    {"name": "Larsen & Toubro", "gstin": "27AABCL0883Q1ZX", "industry": "Engineering"},
    {"name": "Mahindra & Mahindra", "gstin": "27AABCM7764G1ZP", "industry": "Automotive"},
]

CATEGORIES = [
    "Office Supplies", "Travel", "Software Subscription", "Utilities",
    "Professional Services", "Hardware & Equipment", "Rent & Lease",
    "Marketing & Advertising", "Insurance", "Telecommunications",
    "Food & Beverages", "Maintenance & Repairs",
]

GST_RATES = [5, 12, 18, 28]


def generate_sample_invoices(count: int = 25) -> list[dict]:
    """Generate realistic sample invoice data."""
    invoices = []
    base_date = datetime(2025, 4, 1)

    for i in range(count):
        vendor_info = random.choice(SAMPLE_VENDORS)
        category = random.choice(CATEGORIES)
        inv_type = random.choice(["purchase", "purchase", "purchase", "sales"])  # 75% purchases

        gst_rate = random.choice(GST_RATES)
        base_amount = round(random.uniform(500, 150000), 2)
        total_gst = round(base_amount * gst_rate / 100, 2)

        # Intra-state vs inter-state
        is_intra = random.random() > 0.3  # 70% intra-state
        if is_intra:
            cgst = round(total_gst / 2, 2)
            sgst = round(total_gst / 2, 2)
            igst = 0.0
        else:
            cgst = 0.0
            sgst = 0.0
            igst = total_gst

        total_amount = round(base_amount + total_gst, 2)
        inv_date = base_date + timedelta(days=random.randint(0, 300))

        invoices.append({
            "vendor": vendor_info["name"],
            "gstin": vendor_info["gstin"],
            "invoice_number": f"INV-{2025}-{i+1:04d}",
            "invoice_date": inv_date.strftime("%Y-%m-%d"),
            "amount": total_amount,
            "cgst": cgst,
            "sgst": sgst,
            "igst": igst,
            "category": category,
            "invoice_type": inv_type,
            "compliance_status": "clean",
            "file_name": f"sample_invoice_{i+1}.pdf",
        })

    # Add some with compliance issues for testing
    if len(invoices) > 3:
        invoices[0]["gstin"] = ""  # Missing GSTIN
        invoices[0]["compliance_status"] = "flagged"
        invoices[0]["compliance_issues"] = json.dumps([{
            "type": "missing_gstin", "severity": "high",
            "message": "Invoice is missing GSTIN number"
        }])

        invoices[1]["gstin"] = "INVALID123"  # Invalid GSTIN
        invoices[1]["compliance_status"] = "flagged"
        invoices[1]["compliance_issues"] = json.dumps([{
            "type": "invalid_gstin", "severity": "high",
            "message": "Invalid GSTIN format: INVALID123"
        }])

        invoices[2]["invoice_number"] = invoices[3]["invoice_number"]  # Duplicate
        invoices[2]["compliance_status"] = "warning"
        invoices[2]["compliance_issues"] = json.dumps([{
            "type": "duplicate_invoice", "severity": "high",
            "message": f"Duplicate invoice number: {invoices[2]['invoice_number']}"
        }])

    return invoices


def seed_database():
    """Seed the database with sample clients and invoices."""
    init_db()

    with get_db_session() as db:
        # Check if data already exists
        existing = db.query(Invoice).count()
        if existing > 0:
            print(f"Database already contains {existing} invoices. Skipping seed.")
            return

        # Create clients
        clients = []
        for vendor_info in SAMPLE_VENDORS[:5]:
            client = Client(
                name=vendor_info["name"],
                gstin=vendor_info["gstin"],
                industry=vendor_info["industry"],
            )
            db.add(client)
            db.flush()
            clients.append(client)

        # Create invoices
        sample_invoices = generate_sample_invoices(25)
        for inv_data in sample_invoices:
            client = random.choice(clients) if clients else None
            invoice = Invoice(
                vendor=inv_data["vendor"],
                gstin=inv_data["gstin"],
                invoice_number=inv_data["invoice_number"],
                invoice_date=inv_data["invoice_date"],
                amount=inv_data["amount"],
                cgst=inv_data["cgst"],
                sgst=inv_data["sgst"],
                igst=inv_data["igst"],
                category=inv_data["category"],
                invoice_type=inv_data["invoice_type"],
                client_id=client.id if client else None,
                compliance_status=inv_data.get("compliance_status", "clean"),
                compliance_issues=inv_data.get("compliance_issues"),
                file_name=inv_data["file_name"],
            )
            db.add(invoice)

        db.commit()
        print(f"✅ Seeded database with {len(clients)} clients, {len(sample_invoices)} invoices")


if __name__ == "__main__":
    seed_database()
