# 🧾 TaxPilot AI — GST & Accounting Automation Platform

> A production-oriented, AI-driven system designed to automate document ingestion, invoice extraction, compliance validation, and GST workflows for Chartered Accountants and finance teams in India.

---

## 🚀 Overview

TaxPilot AI addresses a critical inefficiency in accounting workflows:

> ❝ Manual invoice processing and compliance validation are time-consuming, error-prone, and non-scalable ❞

This platform transforms raw financial documents into:

* structured invoice data
* compliance insights
* GST summaries
* AI-assisted decision workflows

---

## 🧠 Key Capabilities

* 📄 **Document Ingestion & Processing**
* 🤖 **LLM-powered Invoice Extraction**
* ⚖️ **Compliance Validation Engine**
* 📊 **GST Aggregation & Reporting**
* 🧩 **Agentic Workflow System (LangGraph)**
* 🧑‍💻 **AI Copilot for Finance Operations**

---

## 🏗️ System Architecture

```text
Frontend (Next.js)
        ↓
Backend API (Express + TypeScript)
        ↓
Processing Layer (Async Workers)
        ↓
AI Layer (LangGraph + Groq LLM)
        ↓
Database (PostgreSQL via Prisma)
```

---

## 🧠 System Design Highlights

### 1. Asynchronous Document Processing

```text
Upload → Persist → Async Worker → Extraction → Storage
```

* Non-blocking ingestion
* Scalable pipeline design
* Enables future queue systems (BullMQ / Kafka)

---

### 2. Hybrid Extraction Strategy

```text
OCR/Text → LLM (Groq) → JSON Parsing → Fallback Regex
```

* LLM for flexibility
* Regex fallback for robustness
* Handles imperfect OCR outputs

---

### 3. Agentic Workflow Engine

Built using LangGraph:

* Multi-step reasoning workflows
* Conditional execution paths
* Safe “authorization mode” before committing actions

---

### 4. Domain-Specific Intelligence

* GST-specific validation rules
* Invoice anomaly detection
* Financial data aggregation

---

## ⚙️ Tech Stack

### Frontend

* Next.js 14 (App Router)
* React 18
* Tailwind CSS
* Recharts (analytics)
* Lucide Icons

---

### Backend

* Node.js + TypeScript
* Express.js
* Prisma ORM
* PostgreSQL

---

### AI Layer

* Groq API (`llama-3.3-70b-versatile`)
* LangChain
* LangGraph

---

### Data Processing

* PDF parsing (`pdf-parse`)
* File upload (`multer`)
* Schema validation (`zod`)

---

## 📂 Project Structure

```text
taxpilot-ai/
├── backend/         # Express + Prisma API
├── frontend/        # Next.js application
├── docker-compose.yml
├── .env.example
```

---

## 🔄 Core Workflows

### 📄 1. Document Processing Pipeline

```text
Upload File
   ↓
Store Metadata (FileUpload)
   ↓
Async Processing
   ↓
LLM Extraction (Groq)
   ↓
Structured Invoice Data
   ↓
Compliance Checks + GST Aggregation
```

---

### 🤖 2. AI Copilot Flow

```text
User Query
   ↓
LangGraph Workflow
   ↓
Context + DB Retrieval
   ↓
LLM Reasoning
   ↓
Response / Action Suggestion
```

---

### 📊 3. GST Summary Generation

* Aggregates invoices by period
* Computes:

  * Output GST
  * Input Tax Credit (ITC)
  * Net payable

---

## 🧱 Data Model (Prisma)

Core entities:

* `Client`
* `FileUpload`
* `Invoice`
* `ComplianceIssue`
* `GSTSummary`
* `AuditLog`
* `CopilotQuery`

Designed for:

* auditability
* traceability
* financial correctness

---

## 🔌 API Overview

Base: `/api`

### Core Endpoints

* `GET /health`
* `GET /dashboard`
* `GET /analytics`

---

### Document Processing

* `POST /upload`
* `GET /upload`

---

### Clients

* `GET /clients`
* `POST /clients`
* `GET /clients/:id`

---

### AI Workflows

* `POST /ai/copilot`
* `POST /ai/workflow`
* `GET /ai/workflow`

---

### GST & Reports

* `GET /returns/gst`
* `GET /audit-logs`

---

## ⚡ Performance Considerations

* Async document processing
* LLM fallback strategy
* Minimal blocking operations
* Efficient DB queries via Prisma

---

## ⚖️ Engineering Tradeoffs

| Decision             | Benefit                | Tradeoff                  |
| -------------------- | ---------------------- | ------------------------- |
| Groq LLM             | Fast, free-tier        | External dependency       |
| LLM + Regex fallback | Robust extraction      | Added complexity          |
| In-process async     | Simple setup           | Not horizontally scalable |
| Prisma ORM           | Developer productivity | Abstraction overhead      |

---

## 🔐 Security Considerations

* Input validation via Zod
* Helmet for HTTP security
* File upload handling safeguards
* Environment-based secrets

---

## ⚠️ Limitations

* In-process async (not queue-based yet)
* LLM output variability
* OCR accuracy dependent on input quality
* Not optimized for high concurrency

---

## 🧪 Local Development

### 1. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

---

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

---

### 3. Environment

```env
DATABASE_URL=your_postgres_url
GROQ_API_KEY=your_key
JWT_SECRET_KEY=your_secret
```

---

## 🐳 Docker (Note)

Docker setup exists but requires alignment with current Node backend.

---

## 📈 Future Improvements

* Queue-based processing (BullMQ / Redis)
* Multi-tenant architecture
* Role-based access control
* Advanced anomaly detection (ML models)
* Real-time dashboard updates

---

## 💡 Why This Project Stands Out

This project demonstrates:

* Real-world problem solving (finance domain)
* AI + backend integration
* Agentic workflows (LangGraph)
* System design thinking
* Scalable architecture awareness

---

## 👩‍💻 Author

Built as a **production-focused, system** emphasizing:

> Systems Design • AI Engineering • Backend Scalability • Domain Intelligence
