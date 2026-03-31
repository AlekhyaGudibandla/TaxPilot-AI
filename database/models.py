"""
TaxPilot AI - Database Models
=============================
SQLAlchemy ORM models for Invoice and Client tables.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from database.db import Base
import enum


class ComplianceStatus(enum.Enum):
    """Compliance status for an invoice."""
    PENDING = "pending"
    CLEAN = "clean"
    FLAGGED = "flagged"


class InvoiceType(enum.Enum):
    """Type of invoice - sales or purchase."""
    SALES = "sales"
    PURCHASE = "purchase"


class Client(Base):
    """Client / Business entity model."""
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    gstin = Column(String(15), unique=True, nullable=True)
    industry = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    invoices = relationship("Invoice", back_populates="client")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "gstin": self.gstin,
            "industry": self.industry,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Invoice(Base):
    """Invoice model with GST details."""
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vendor = Column(String(255), nullable=True)
    gstin = Column(String(15), nullable=True)
    invoice_number = Column(String(100), nullable=True)
    invoice_date = Column(String(20), nullable=True)
    amount = Column(Float, default=0.0)
    cgst = Column(Float, default=0.0)
    sgst = Column(Float, default=0.0)
    igst = Column(Float, default=0.0)
    category = Column(String(100), nullable=True)
    invoice_type = Column(String(20), default="purchase")
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    compliance_status = Column(String(20), default="pending")
    compliance_issues = Column(Text, nullable=True)  # JSON string of issues
    raw_text = Column(Text, nullable=True)
    file_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    client = relationship("Client", back_populates="invoices")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "vendor": self.vendor,
            "gstin": self.gstin,
            "invoice_number": self.invoice_number,
            "invoice_date": self.invoice_date,
            "amount": self.amount,
            "cgst": self.cgst,
            "sgst": self.sgst,
            "igst": self.igst,
            "category": self.category,
            "invoice_type": self.invoice_type,
            "client_id": self.client_id,
            "compliance_status": self.compliance_status,
            "compliance_issues": self.compliance_issues,
            "file_name": self.file_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
