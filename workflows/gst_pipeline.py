"""
TaxPilot AI - GST Pipeline Workflow
=====================================
LangGraph StateGraph wiring all agents into a complete pipeline:
Coordinator → Document → Invoice → Classification → GST → Compliance → Automation → Finalize
"""

from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from loguru import logger

from agents.coordinator import coordinator_node, finalize_node
from agents.document_agent import document_extraction_node
from agents.invoice_agent import invoice_processing_node
from agents.classification_agent import classification_node
from agents.gst_agent import gst_calculation_node
from agents.compliance_agent import compliance_check_node
from agents.automation_agent import automation_node


# ────────────────────────── Workflow State ──────────────────────────

class WorkflowState(TypedDict, total=False):
    """Shared state across all agents in the pipeline."""
    # Inputs
    file_paths: list[str]
    automation_config: dict

    # Coordinator
    pipeline_status: str
    errors: list[str]
    current_step: str

    # Document Extraction
    extracted_invoices: list[dict]
    extraction_errors: list[dict]

    # Invoice Processing
    processed_invoices: list[dict]
    processing_warnings: list[dict]

    # Classification
    classified_invoices: list[dict]

    # GST Calculation
    gst_summary: dict
    gstr1_summary: list[dict]
    gstr3b_summary: dict
    category_breakdown: dict
    vendor_breakdown: dict

    # Compliance
    compliance_issues: list[dict]
    invoices_with_compliance: list[dict]
    compliance_summary: dict

    # Automation
    automation_results: list[dict]

    # Final
    pipeline_summary: dict


# ────────────────────────── Routing Logic ──────────────────────────

def should_continue_after_coordinator(state: dict) -> str:
    """Route after coordinator: proceed or abort."""
    if state.get("pipeline_status") == "error":
        return "finalize"
    return "document_extraction"


def should_continue_after_extraction(state: dict) -> str:
    """Route after extraction: check if any invoices were extracted."""
    if not state.get("extracted_invoices"):
        return "finalize"
    return "invoice_processing"


# ────────────────────────── Build Graph ──────────────────────────

def build_gst_pipeline() -> StateGraph:
    """
    Build and compile the LangGraph GST processing pipeline.

    Pipeline flow:
        coordinator → document_extraction → invoice_processing
        → classification → gst_calculation → compliance_check
        → automation → finalize
    """
    workflow = StateGraph(WorkflowState)

    # ── Add nodes ──
    workflow.add_node("coordinator", coordinator_node)
    workflow.add_node("document_extraction", document_extraction_node)
    workflow.add_node("invoice_processing", invoice_processing_node)
    workflow.add_node("classification", classification_node)
    workflow.add_node("gst_calculation", gst_calculation_node)
    workflow.add_node("compliance_check", compliance_check_node)
    workflow.add_node("automation", automation_node)
    workflow.add_node("finalize", finalize_node)

    # ── Set entry point ──
    workflow.set_entry_point("coordinator")

    # ── Add conditional edges ──
    workflow.add_conditional_edges(
        "coordinator",
        should_continue_after_coordinator,
        {
            "document_extraction": "document_extraction",
            "finalize": "finalize",
        },
    )

    workflow.add_conditional_edges(
        "document_extraction",
        should_continue_after_extraction,
        {
            "invoice_processing": "invoice_processing",
            "finalize": "finalize",
        },
    )

    # ── Add sequential edges ──
    workflow.add_edge("invoice_processing", "classification")
    workflow.add_edge("classification", "gst_calculation")
    workflow.add_edge("gst_calculation", "compliance_check")
    workflow.add_edge("compliance_check", "automation")
    workflow.add_edge("automation", "finalize")
    workflow.add_edge("finalize", END)

    logger.info("GST Pipeline built successfully")
    return workflow.compile()


def run_pipeline(file_paths: list[str], automation_config: dict = None) -> dict:
    """
    Convenience function to run the full GST pipeline.

    Args:
        file_paths: List of file paths to process.
        automation_config: Optional automation settings.

    Returns:
        Final workflow state dict.
    """
    pipeline = build_gst_pipeline()

    initial_state: WorkflowState = {
        "file_paths": file_paths,
        "automation_config": automation_config or {"enabled": False},
    }

    logger.info(f"Running pipeline with {len(file_paths)} files")
    result = pipeline.invoke(initial_state)
    logger.info(f"Pipeline completed: {result.get('pipeline_status', 'unknown')}")

    return result
