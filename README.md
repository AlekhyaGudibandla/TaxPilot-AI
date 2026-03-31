# TaxPilot AI - GST & Accounting Automation System

TaxPilot AI is a comprehensive multi-agent system built to automate accounting operations, document processing, and GST compliance for Chartered Accountants in India.

## Features
- **Intelligent OCR & Document Extraction**: Extracts vendor, GSTIN, amount, and dates automatically.
- **AI-Powered Categorization**: Uses Groq API (Llama 3.3 70B) for smart classification with keyword fallback.
- **AI-Enhanced Data Extraction**: LLM-powered invoice field parsing from raw OCR text.
- **GST Summaries**: Pre-calculates tables for GSTR-1 and GSTR-3B filings.
- **Compliance Validation**: Analyzes for missing GSTINs, anomalous tax rates, duplicates.
- **Agentic Workflow**: Uses LangGraph to manage a 7-agent pipeline.
- **Modern Dashboard**: React frontend with Tailwind CSS.

## Architecture

1. **Frontend**: React + Vite + Tailwind CSS + Recharts
2. **Backend**: FastAPI + Uvicorn + SQLite 
3. **AI Pipeline**: LangGraph + Groq API (Llama 3.3 70B) + LangChain

> **No local LLM required!** TaxPilot AI uses Groq's free-tier cloud API for all AI features.
> This means no heavy GPU/memory usage on your machine — everything runs via fast cloud inference.

## Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- [Groq API Key](https://console.groq.com/) (free tier — sign up and generate a key)
- [Tesseract OCR](https://tesseract-ocr.github.io/tessdoc/Installation.html) (if processing scanned images)

### 2. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Seed the database / Init
python data/seed_data.py

# Start the FastAPI server
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```
*API docs will be available at http://localhost:8000/docs*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*App will run on http://localhost:5173*

### 4. Setting up Groq API (Recommended)
To enable AI-powered invoice classification and extraction:
1. Sign up for a free account at [console.groq.com](https://console.groq.com/)
2. Generate an API key from the dashboard
3. Set the environment variable before starting the backend:
```bash
# Windows (PowerShell)
$env:GROQ_API_KEY="gsk_your_api_key_here"

# Linux / macOS
export GROQ_API_KEY="gsk_your_api_key_here"
```
*(If GROQ_API_KEY is not set, the system falls back gracefully to robust keyword-matching and regex-based extraction.)*

## AI Models Used

| Feature | Model | Provider |
|---------|-------|----------|
| Invoice Classification | Llama 3.3 70B Versatile | Groq (free tier) |
| Smart Data Extraction | Llama 3.3 70B Versatile | Groq (free tier) |
| OCR | Tesseract | Local |
| Compliance Checks | Rule-based | Local |
| GST Calculations | Rule-based | Local |
