// DynamoDB data-access layer (AWS SDK v3, Document client).
//
// Two tables:
//   MedicalConditions  (PK conditionId)  — verified encyclopedia entries
//   Diagnoses          (PK requestId)    — diagnosis audit trail
//
// Retrieval is intentionally simple for the current scope: the verified
// encyclopedia is small (tens of conditions), so we load it and score by
// symptom overlap in-process. Production roadmap: OpenSearch vector retrieval
// (see DATABASE_SCHEMA.md) — swap matchConditions() without touching callers.

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb'
import type { ConditionEntry, DiagnosisResponse, CaseInput } from './types'
import { buildIndex, scoreConditions, type ScoredCondition } from './symptom-index'

export const CONDITIONS_TABLE = process.env.DDB_CONDITIONS_TABLE || 'MedicalConditions'
export const DIAGNOSES_TABLE = process.env.DDB_DIAGNOSES_TABLE || 'Diagnoses'
export const PATIENTS_TABLE = process.env.DDB_PATIENTS_TABLE || 'Patients'
export const SIGNUPS_TABLE = process.env.DDB_SIGNUPS_TABLE || 'Signups'

let _doc: DynamoDBDocumentClient | null = null
function doc(): DynamoDBDocumentClient {
  if (_doc) return _doc
  const region = process.env.AWS_REGION || 'us-east-1'
  // Credentials resolved from the standard AWS provider chain (env vars on Vercel).
  _doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), {
    marshallOptions: { removeUndefinedValues: true },
  })
  return _doc
}

/** Load all verified conditions. Cached per warm lambda for the request burst. */
export async function getAllConditions(): Promise<ConditionEntry[]> {
  const out: ConditionEntry[] = []
  let ExclusiveStartKey: Record<string, unknown> | undefined
  do {
    const res = await doc().send(
      new ScanCommand({ TableName: CONDITIONS_TABLE, ExclusiveStartKey })
    )
    out.push(...((res.Items as ConditionEntry[]) || []))
    ExclusiveStartKey = res.LastEvaluatedKey
  } while (ExclusiveStartKey)
  return out
}

// In-memory index cache, per warm process. Building the synonym index over the
// full (now ~10k) condition set is expensive, so we do it once and reuse it
// across requests rather than rebuilding per call (which made retrieval ~70s).
// Roadmap for true scale: a DynamoDB GSI / keyword index table queried directly,
// instead of a full table scan + in-memory index.
let _index: ReturnType<typeof buildIndex> | null = null
let _indexAt = 0
const INDEX_TTL_MS = 10 * 60 * 1000

async function loadConditions(): Promise<ConditionEntry[]> {
  // Prefer the bundled deploy-time snapshot (fast cold start — no network scan).
  // DynamoDB remains the system of record + handles real-time audit writes, and
  // is the fallback if the snapshot is absent.
  try {
    const snap = (await import('../data/conditions.json')).default as unknown as ConditionEntry[]
    if (Array.isArray(snap) && snap.length > 0) return snap
  } catch {
    /* no snapshot bundled — fall back to a live scan */
  }
  return getAllConditions()
}

async function getIndex(): Promise<ReturnType<typeof buildIndex>> {
  if (_index && Date.now() - _indexAt < INDEX_TTL_MS) return _index
  const all = await loadConditions()
  _index = buildIndex(all)
  _indexAt = Date.now()
  return _index
}

/** Invalidate the cached index (e.g. after a bulk import in the same process). */
export function invalidateIndexCache(): void {
  _index = null
  _indexAt = 0
}

/**
 * Rank verified conditions against the case using the cached, precomputed symptom
 * index (synonym-aware keyword matching), returning the top N with match-strength
 * scores. This is the grounding step: only these verified entries reach the quorum.
 */
export async function matchConditions(
  input: CaseInput,
  topN = 5
): Promise<ScoredCondition[]> {
  const index = await getIndex()
  return scoreConditions(index, input.symptoms, topN)
}

// Raw-conditions cache (separate from the symptom index) for the free-text
// encyclopedia lookup used by front-desk staff.
let _conds: ConditionEntry[] | null = null
let _condsAt = 0
async function allConditionsCached(): Promise<ConditionEntry[]> {
  if (_conds && Date.now() - _condsAt < INDEX_TTL_MS) return _conds
  _conds = await loadConditions()
  _condsAt = Date.now()
  return _conds
}

export async function conditionCount(): Promise<number> {
  return (await allConditionsCached()).length
}

/**
 * Free-text lookup across the encyclopedia by name / ICD-10 / symptom. Ranked by
 * relevance × commonality prior so common conditions surface first. Empty query
 * returns the most common conditions. This powers the staff lookup page.
 */
export async function searchConditions(q: string, limit = 40): Promise<ConditionEntry[]> {
  const all = await allConditionsCached()
  const query = q.trim().toLowerCase()
  if (!query) {
    return [...all]
      .sort((a, b) => (b.prior ?? 0.5) - (a.prior ?? 0.5) || a.name.localeCompare(b.name))
      .slice(0, limit)
  }
  const tokens = query.split(/\s+/).filter(Boolean)
  const scored = all
    .map((c) => {
      const name = c.name.toLowerCase()
      const icd = (c.icd10Code || '').toLowerCase()
      const symBlob = (c.symptoms || []).join(' ').toLowerCase()
      let s = 0
      if (name === query) s += 20
      if (name.includes(query)) s += 10
      if (name.startsWith(query)) s += 5
      if (icd.includes(query)) s += 8
      for (const t of tokens) {
        if (name.includes(t)) s += 3
        if (symBlob.includes(t)) s += 1
      }
      return { c, s: s * (0.5 + (c.prior ?? 0.5)) }
    })
    .filter((x) => x.s > 0)
  scored.sort((a, b) => b.s - a.s)
  return scored.slice(0, limit).map((x) => x.c)
}

export async function putCondition(entry: ConditionEntry): Promise<void> {
  await doc().send(new PutCommand({ TableName: CONDITIONS_TABLE, Item: entry }))
}

export async function saveDiagnosis(record: DiagnosisResponse): Promise<void> {
  await doc().send(
    new PutCommand({
      TableName: DIAGNOSES_TABLE,
      Item: { ...record, requestId: record.requestId },
    })
  )
}

export interface DiagnosisSummary {
  requestId: string
  diagnosis: string | null
  confidence: number
  reached: boolean
  safe: boolean
  timestamp: string
}

/** Recent assessments from the audit trail, newest first. Powers the dashboard. */
export async function listRecentDiagnoses(limit = 20): Promise<{ items: DiagnosisSummary[]; total: number }> {
  const res = await doc().send(new ScanCommand({ TableName: DIAGNOSES_TABLE }))
  const rows = ((res.Items as DiagnosisResponse[]) || []).map((r) => ({
    requestId: r.requestId,
    diagnosis: r.consensus?.diagnosis ?? null,
    confidence: r.consensus?.confidence ?? 0,
    reached: r.consensus?.reached ?? false,
    safe: r.safety?.safe ?? true,
    timestamp: r.metadata?.timestamp || '',
  }))
  rows.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
  return { items: rows.slice(0, limit), total: rows.length }
}

export async function getDiagnosis(requestId: string): Promise<DiagnosisResponse | null> {
  const res = await doc().send(
    new GetCommand({ TableName: DIAGNOSES_TABLE, Key: { requestId } })
  )
  return (res.Item as DiagnosisResponse) || null
}

// ---- Patients (clinic-held records; staff behind the desk legitimately see these;
// the AI grounding stays de-identified via a pseudonymous patientRef) -----------

export interface Patient {
  patientId: string
  name: string
  ageBand?: string
  sex?: string
  notes?: string
  createdAt: string
}

export async function listPatients(): Promise<Patient[]> {
  const res = await doc().send(new ScanCommand({ TableName: PATIENTS_TABLE }))
  return ((res.Items as Patient[]) || []).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

export async function getPatient(patientId: string): Promise<Patient | null> {
  const res = await doc().send(new GetCommand({ TableName: PATIENTS_TABLE, Key: { patientId } }))
  return (res.Item as Patient) || null
}

export async function putPatient(p: Patient): Promise<void> {
  await doc().send(new PutCommand({ TableName: PATIENTS_TABLE, Item: p }))
}

export interface Signup {
  signupId: string
  email: string
  name?: string
  organization?: string
  createdAt: string
}

/** Persist a trial / access request (a lead — no password, no account auth). */
export async function putSignup(s: Signup): Promise<void> {
  await doc().send(new PutCommand({ TableName: SIGNUPS_TABLE, Item: s }))
}

/** Assessments linked to a patient via the pseudonymous patientRef stored on save. */
export async function listDiagnosesByPatient(patientId: string): Promise<DiagnosisSummary[]> {
  const res = await doc().send(new ScanCommand({ TableName: DIAGNOSES_TABLE }))
  const rows = ((res.Items as (DiagnosisResponse & { patientRef?: string })[]) || [])
    .filter((r) => r.patientRef === patientId)
    .map((r) => ({
      requestId: r.requestId,
      diagnosis: r.consensus?.diagnosis ?? null,
      confidence: r.consensus?.confidence ?? 0,
      reached: r.consensus?.reached ?? false,
      safe: r.safety?.safe ?? true,
      timestamp: r.metadata?.timestamp || '',
    }))
  return rows.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
}
