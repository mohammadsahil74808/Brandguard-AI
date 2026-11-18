# BrandGuard AI — AI-Powered Brand Governance & Content Intelligence Platform

> **Create Freely. Publish Confidently.**  
> Pre-publication governance that audits content against an organization's own approved truth, cites exact sources, assigns deterministic risk bands, suggests non-destructive corrections, and enforces separation-of-duties review workflows.

---

## 🚀 1. Run 100% Locally Without Cloud Deployment

You do **NOT** need to create or configure any cloud accounts (Vercel, Render, or Supabase) to test and run BrandGuard AI! The entire platform—frontend, backend, and database with pre-seeded Acme Audio demo data—runs locally out of the box.

### Quick Start (1 Click)
Double-click `run-local.bat` or in PowerShell execute:
```powershell
.\run-local.ps1
```

### Or Manual Command-Line Start:

#### A. Backend (FastAPI + Local SQLite DB)
```powershell
cd backend
& "$env:USERPROFILE\AppData\Roaming\uv\python\cpython-3.12-windows-x86_64-none\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API is running at: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

#### B. Frontend (React 18 + Vite + Tailwind)
```powershell
cd frontend
npm run dev
```
- Open browser at: `http://localhost:5173`

---

## 🎯 2. Hackathon Golden Demo Walkthrough

1. **Dashboard**: Inspect workspace metrics for the fictional organization **Acme Audio**. Click **"Run Golden Demo Audit"**.
2. **Brand Knowledge Hub**: View the pre-seeded *"Acme Audio Brand Guidelines v4"*, active pricing (₹799) vs expired pricing (₹999), and lab battery spec (30 hours).
3. **Audit Results**: 
   - Initial draft: `"Hey guys!!! Grab the Acme Buds Pro NOW for just ₹999 – the cheapest and world's best earbuds with 40-hour battery! #Sale"`
   - Output: **CRITICAL RISK (28 Points)** with 5 cited violations (outdated price, contradicted battery spec, prohibited term *"cheapest"*, unsupported superlative *"world's best"*, and tone slang).
4. **Correction Studio**:
   - Inspect side-by-side original vs corrected draft.
   - Accept the recommended corrections and click **"Apply & Re-Audit Revision"**.
   - Notice the risk score instantly drops to **LOW RISK (0 Points)**!
5. **Separation of Duties Review Workflow**:
   - As **Rohan (Creator)**, attempt to approve the submission $\to$ blocked with:  
     `"FORBIDDEN_ROLE: Separation of duties violation. A creator cannot approve their own content."`
   - Switch persona in the TopBar to **Priya (Marketing Manager)** and approve the Manager stage.
   - Switch persona to **Kabir (Compliance Reviewer)** and approve the Compliance stage.
   - Watch the status advance to **Approved (Publish-Ready)**!

---

## ☁️ 3. Deploy to Vercel, Render & Supabase

When you are ready to deploy to the cloud:

### 1. Database (Supabase PostgreSQL)
1. Create a new project in [Supabase](https://supabase.com).
2. In the Supabase SQL Editor, run:
   - `supabase/migrations/001_initial_schema.sql` (Creates schema with pgvector & UUIDs)
   - `supabase/migrations/002_rls_policies.sql` (Enables Row-Level Security)
   - `supabase/seed.sql` (Seeds Acme Audio demo data)
3. Copy your project connection string: `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`.

### 2. Backend (Render)
1. In [Render](https://render.com), click **New +** $\to$ **Blueprint** (or Web Service).
2. Connect this repository. Render automatically reads `render.yaml` and `backend/Dockerfile`.
3. In environment variables, set:
   - `DATABASE_URL`: Your Supabase connection string.
   - `ENVIRONMENT`: `production`
   - `EXTERNAL_AI_ENABLED`: `true`
4. Deploy! Your backend URL will be e.g. `https://brandguard-api.onrender.com`.

### 3. Frontend (Vercel)
1. In [Vercel](https://vercel.com), import this repository.
2. Select root directory as `frontend` (or keep root with included `vercel.json`).
3. Set Environment Variable:
   - `VITE_API_URL`: Your Render backend URL (e.g. `https://brandguard-api.onrender.com`).
4. Click **Deploy**! Vercel builds the SPA with automatic route rewrites to `index.html`.

---

## 🛡️ Key Architectural Principles
- **Source-Grounded or Silent**: Every violation cites an exact document, section, and page number.
- **Deterministic Risk Scoring**: 0–3 pts = LOW, 4–11 pts = MEDIUM, 12–24 pts = HIGH, $\ge 25$ pts = CRITICAL.
- **Non-Destructive Corrections**: Authors accept or reject changes; nothing is silently overwritten.
- **Strict Separation of Duties**: Immutable audit logs enforce that creators cannot approve their own work.
