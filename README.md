# MedLens — AI-Powered Clinical Information Intelligence & Patient Intake System

> **MedLens is an information-intelligence and organization system — NOT a diagnostic or treatment system.**  
> It transforms fragmented medical reports, patient intake forms, and historical records into a structured, traceable, and human-verifiable patient record without diagnostic hallucinations.

---

## Architecture & Workflow

MedLens processes clinical information through an AI-assisted and human-in-the-loop workflow:
```
Patient Intake & Documents (Text / PDF / Image)
                 ↓
      AI & Regex Extraction
                 ↓
   Validation & Terminology Normalization
                 ↓
         Structured Record
                 ↓
┌─────────────────────────────────────────────────┐
│ • Reference Range Analysis (Non-hallucinated)   │
│ • Important Finding Highlighting                │
│ • Cross-Source Inconsistency & Conflict Flags   │
│ • Context-Aware Clarification Questions         │
│ • Longitudinal Comparison (Delta & Trends)      │
└─────────────────────────────────────────────────┘
                 ↓
   Human Verification & Audit Logging
                 ↓
  Structured Patient Summary & PDF Export
```

---

## Key Features

### 1. Patient Intake Form
- Captures demographics (Name/ID, Age, Sex), symptoms, timelines, existing medical conditions, known allergies, current medications, and clinician notes.
- Every user-provided field is tagged with `Source: Patient Intake (User-Provided)`.

### 2. Medical Report Processing & Terminology Normalization
- Supports text pasting and direct file uploads (PDF, TXT) with `pdf-parse`.
- Maps clinical aliases to canonical terminology (e.g. `Hb` ⇄ `Hemoglobin` ⇄ `HGB`, `FBS` ⇄ `Fasting Blood Sugar`, `Cr` ⇄ `Serum Creatinine`).
- 100% provenance traceability: every extracted parameter links back to its exact snippet and line number.

### 3. Strict Reference Range Guardrails
- Compares values strictly against reference ranges provided in the source document (`Within Normal Range`, `Below Reported Range`, `Above Reported Range`, `Critical Low`).
- **Never invents reference ranges**: if a source report omits reference bounds, MedLens explicitly flags `No reference range in source report`.

### 4. Interactive Source Provenance Inspector
- Side-by-side modal displaying the structured parameter alongside the raw report text with the exact source line highlighted.

### 5. Inconsistency & Conflict Detection
- Identifies cross-source contradictions (e.g., patient intake reports "No known allergies", but medical record notes a Penicillin reaction; patient takes Metformin without listed diabetes).
- Flags discrepancies for human clarification rather than guessing which source is correct.

### 6. Context-Aware Clarification Questions
- Generates 3–5 targeted clarification questions based on missing information (symptom onset, fasting duration, reaction type).
- Framed strictly as investigative questions for clinical intake, not medical advice.

### 7. Longitudinal Report Comparison
- Compares previous vs. current laboratory reports.
- Computes mathematical deltas, percentage changes, directional trend icons (`↑`, `↓`, `→`), and status transitions (`Normal → Below Reference Range`).

### 8. Human Review & Verification Seal
- Full inline editing of parameters, add/delete capabilities, and conflict resolution with clinical notes.
- Attestation workflow: Clinicians sign off with name, title/role, and timestamp, generating an immutable audit trail of all changes.

### 9. Export & Print-Ready Clinical Brief
- Generates a formatted hospital/clinic summary brief suitable for printing or saving to PDF.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Vanilla CSS Design System with glassmorphism, responsive table layouts, dark & light themes.
- **Backend**: Node.js, Express, TypeScript, Multer, `pdf-parse`.
- **AI & Intelligence Layer**:
  - **Deterministic Clinical Engine**: Regex tokenizer, synonym dictionaries, range evaluator, conflict rule matrix.
  - **Gemini 2.5 / Flash AI Integration**: Secure server proxy using `@google/genai` (zero client key leakage).
- **Persistence**: Local JSON database with automatic record storage and audit logs.

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation
```bash
# Clone repository
git clone https://github.com/chaithupatel07/medlens.git
cd medlens

# Install dependencies
npm install
```

### Development
```bash
# Run both backend API (port 5000) and frontend (port 5173) concurrently
npm run dev
```

Open your browser at [http://localhost:5173](http://localhost:5173).

### Run Test Suite
```bash
npm test
```
*Executes 32 automated unit and integration tests for terminology normalization, reference range evaluation, conflict detection, and longitudinal comparison.*

### Production Build & Vercel Deployment

#### Deploying on Vercel (1-Click Ready):
This repository is pre-configured for **Vercel**:
- **`vercel.json`**: Configured with `@vercel/node` serverless rewrites and Vite SPA routing.
- **Serverless API**: `api/index.ts` automatically proxies all `/api/*` requests to the Express clinical engine.
- **Frontend SPA**: `client/dist` is served statically with client-side history fallback.
- **Zero-Crash Storage**: `storageService.ts` automatically uses `/tmp` and in-memory cache resilience when running in serverless environments.

To deploy:
1. Import this repository into [Vercel Dashboard](https://vercel.com/new).
2. Leave the build settings as default (they are automatically read from [`vercel.json`](vercel.json)):
   - **Build Command**: `npm run build:client`
   - **Output Directory**: `client/dist`
3. *(Optional)* Add `GEMINI_API_KEY` in Vercel Project Settings → Environment Variables.
4. Click **Deploy**!

#### Local Production Run:
```bash
npm run build
npm start
```

---

## Safety & Privacy Mandate

- MedLens does **not** diagnose diseases, prescribe treatments, or alter medication dosages.
- It communicates uncertainty transparently through confidence ratings and clarification flags.
- API keys are never bundled into client-side code or exposed publicly.

---

## License
MIT License
