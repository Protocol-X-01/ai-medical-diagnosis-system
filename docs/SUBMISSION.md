# H0: Hack the Zero Stack — Submission

**Project:** AI Medical Diagnosis — Hallucination-Resistant Clinical Decision Support
**Track:** Monetizable B2B Application
**Live app:** https://ai-medical-diagnosis-dusky.vercel.app
**AWS database:** **Amazon DynamoDB** (on-demand, `us-east-1`) — tables `MedicalConditions` and `Diagnoses`

---

## What it does

A B2B clinical **decision-support** platform sold to **medical-industry businesses** (clinics,
practices, hospital networks) — the **client is the provider organisation, not the patient**. It
sits **behind the front desk**: it relieves pressure at the point of initial contact, helps staff
triage faster, and lets them **query a comprehensive, source-cited encyclopedia** while assessing
a patient.

A staff member enters a de-identified case (symptoms, vitals, history, and optionally an image);
the system returns a consensus assessment in which **every conclusion is grounded in cited,
verified medical sources** — and any output that cannot be traced to a source is withheld.

**Key capabilities:**
- **Multi-model quorum** — three independent LLMs from different families (NVIDIA Nemotron-3 Super
  120B, Meta Llama 3.3 70B, Mistral Nemotron) on **NVIDIA NIM** vote independently; **2-of-3
  consensus** required; a dedicated content-safety model screens the result; and a
  **citation-integrity rule drops any source a model invents**. This makes a generative system
  hallucination-*resistant*.
- **Common cases, utmost accuracy** — a commonality prior ranks common conditions ahead of rare
  ones on equal symptom overlap, so everyday presentations are fast and accurate.
- **Ambiguity → ranked options, not a black box** — when no single condition dominates we present
  the ranked differential **options** for clinician review (encyclopedia behaviour), rather than
  an opaque "handover".
- **Treatments & red-flag recommendations** — guideline-derived management for the consensus
  condition, with "escalate immediately if…" safety-netting.
- **Image analysis & visual differential** — an NVIDIA NIM vision model extracts *visible features*
  from an uploaded image (assistive, not a diagnostic imaging read); the result shows **look-alike
  conditions with open-licensed reference images** for side-by-side comparison.
- **Staff encyclopedia lookup** — free-text search across the full corpus by name / ICD-10 / symptom,
  with citations, treatments and reference images.

## How we use the AWS database (Amazon DynamoDB)

DynamoDB is on the **critical path of every request**, used for both reads and writes:

- **Read — grounding:** `MedicalConditions` holds **11,230 verified entries** across tiers —
  guideline-cited curated conditions (NICE/ESC/IDSA/ADA/GOLD/KDIGO/WHO/AHA), **8,000+ rare diseases**
  (HPO/OMIM/Orphanet), NIH MedlinePlus common topics, and a curated set of **visible conditions with
  reference images** (DermNet-cited). On each request the API retrieves candidates that match the
  presentation; the quorum may only reason within these and only cite their sources. The same store
  powers the staff lookup.
- **Write — audit trail:** every assessment (consensus, per-model votes, citations, safety verdict,
  metadata) is persisted to the `Diagnoses` table — an immutable record. The in-app **dashboard reads
  this table live** (assessment count, consensus rate, average confidence, recent assessments).

DynamoDB (serverless, on-demand) is the right fit: it connects cleanly from Vercel serverless
functions with no VPC/connection-pool overhead, and scales on demand with zero capacity planning.
A deploy-time snapshot of the read-only encyclopedia keeps cold starts fast; DynamoDB remains the
system of record and handles all audit writes.

## Architecture

`Clinician → Vercel (Next.js 16 UI + /api/diagnose route handler) → DynamoDB grounding (read) →
NVIDIA NIM 2-of-3 quorum → content-safety gate → response + DynamoDB audit (write)`

See `docs/architecture-diagram.svg`. The entire backend runs as Vercel serverless functions —
no separate compute to manage. Claude Code acted as the **build-time governor**, curating the
sourced encyclopedia and defining the consensus rules.

## Tech stack

- **Frontend & API:** Next.js 16 (App Router), React 19, Tailwind — deployed on **Vercel**
- **Database:** **Amazon DynamoDB** (AWS SDK v3, document client)
- **AI:** NVIDIA NIM (OpenAI-compatible) — 3 quorum models + 1 content-safety model
- **Security headers:** CSP-adjacent hardening via `vercel.json` (nosniff, X-Frame-Options DENY, etc.)

## How it maps to the judging criteria

- **Technological Implementation:** DynamoDB read (grounding) + write (audit) on every request;
  clean serverless deployment; citation-integrity enforcement.
- **Design:** coherent full-stack flow; transparent UI showing each model vote, consensus,
  confidence, and source citations.
- **Impact & Real-world Applicability:** addresses the #1 barrier to clinical AI adoption —
  trust — by grounding in cited evidence rather than model recall.
- **Originality:** a multi-model NIM quorum with a deterministic citation-integrity guarantee,
  not a single-model wrapper.

## Honest scope (what this is and isn't)

This is clinical **decision support**, **not a diagnosis** and **not a certified medical device**.
Compliance posture is *pre-certification*: built to align with HIPAA controls, de-identified
inputs by design, but formal HIPAA/SOC 2/GDPR certification and clinical validation are on the
roadmap — not claimed as complete.

**Roadmap:** add Claude as a live quorum voter (Anthropic API); OpenSearch vector retrieval for
a larger corpus; migrate PHI to **AWS HealthLake** (HIPAA-eligible) under a BAA following the AWS
Well-Architected Healthcare Industry Lens; SOC 2 / HIPAA certification; prospective clinical validation.

### AWS healthcare integration roadmap

Because the product already sits *behind the front desk* on AWS, it maps directly onto AWS's
healthcare engagement patterns. These are planned integrations, not yet built — each extends a
capability that exists today:

| AWS use case | AWS services | How it extends what's here today |
|---|---|---|
| **Patient engagement** | Amazon Connect + EHR integration | Pipe the multilingual pre-triage widget into a Connect contact flow so phone/chat contacts get the same safe disposition staff get at the desk. |
| **Verify patient identity** | Amazon Connect Voice ID / Cognito | Authenticate the caller before linking to a patient record (today's pseudonymous `patientRef` becomes a verified identity). |
| **Appointment scheduling** | Amazon Connect + Lambda → scheduling system | The widget already returns a "book an appointment" disposition; wire that to real calendar slots. |
| **Ambient clinical documentation** | AWS HealthScribe | Generate a structured visit note from the consultation; the quorum's cited assessment seeds the differential and plan. |
| **ICD-10 / CPT coding** | Amazon Comprehend Medical | Auto-suggest billing codes — the encyclopedia is already ICD-10-indexed, so this is a natural extension. |
| **Point-of-care insights** | HealthLake analytics + QuickSight | Turn the `Diagnoses` audit trail into population-level dashboards (presentation mix, consensus rates, throughput). |

---

## Demo video script (< 3 minutes)

**[0:00–0:20] Hook.** "Clinicians won't trust an AI that makes things up. So we built one that
*can't* present anything it can't cite." Show the homepage.

**[0:20–0:50] The problem & approach.** "This is a B2B tool that sits behind the front desk —
it relieves pressure at initial contact and lets staff query a cited encyclopedia while they
assess. Most medical AI is a single model that can hallucinate. Ours is a quorum of three
independent models that must agree — grounded in verified sources on AWS DynamoDB." Show the
architecture diagram.

**[0:50–1:40] Live demo.** Open the diagnose page. Enter a case (e.g. fever, productive cough,
pleuritic chest pain, raised CRP). Submit. Show the live result: consensus diagnosis, the three
model votes, confidence, **cited guideline sources** (NICE/IDSA), and the **treatments + red-flag
recommendations**. Then show the **visual differential**: upload a skin image, point out the
extracted visible features and the **look-alike conditions with reference images**. Briefly open
the **Encyclopedia** page and search "psoriasis" to show staff lookup across 11,000+ cited entries.

**[1:40–2:20] The AWS database.** Switch to the AWS console. Show the `MedicalConditions` table
(11,230 verified entries that ground the answers) and the `Diagnoses` table filling with audit
records. Back in the app, open the **Dashboard** — its counts (assessments, consensus rate,
average confidence) are read **live from that `Diagnoses` table**. "Every assessment is
read-grounded and write-audited in DynamoDB."

**[2:20–2:50] Integrity & honesty.** "If a model cites a source we don't have, we drop it. If
nothing can be grounded, we withhold. This is decision support, not a replacement for a clinician
— and here's our roadmap to certification."

**[2:50–3:00] Close.** Live URL + "Built on Vercel and Amazon DynamoDB."

## Required submission checklist

- [x] Text description naming the database (DynamoDB) — this document
- [x] Published Vercel project link — https://ai-medical-diagnosis-dusky.vercel.app
- [x] Architecture diagram — `docs/architecture-diagram.svg`
- [ ] Sub-3-minute demo video — script above (record)
- [ ] Screenshot of AWS database usage — capture `MedicalConditions` + `Diagnoses` in the DynamoDB console
- [ ] Team ID on the Vercel project (confirm in submission form)
