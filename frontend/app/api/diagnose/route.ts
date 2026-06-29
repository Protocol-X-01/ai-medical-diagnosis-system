import { NextRequest, NextResponse } from 'next/server'
import { matchConditions, saveDiagnosis } from '@/lib/dynamodb'
import { runQuorum, DISCLAIMER } from '@/lib/quorum'
import { SEED_CONDITIONS } from '@/lib/seed-data'
import { buildIndex, scoreConditions, type ScoredCondition } from '@/lib/symptom-index'
import { describeImage } from '@/lib/vision'
import type { CaseInput } from '@/lib/types'

// Real diagnosis pipeline: DynamoDB retrieval (grounding) -> NIM multi-model
// weighted quorum (+ escalation, citation integrity) -> safety gate -> audit write.
// Runs as a Vercel serverless function (Node runtime).
export const runtime = 'nodejs'
export const maxDuration = 90

// Seed index built once per warm lambda for the fallback path.
const seedIndex = buildIndex(SEED_CONDITIONS)
function inMemoryMatch(input: CaseInput, topN = 5): ScoredCondition[] {
  return scoreConditions(seedIndex, input.symptoms, topN)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symptoms, vitalSigns, medicalHistory, ageBand, sex, patientRef, imageDataUrl } = body || {}

    const symptomList: string[] = Array.isArray(symptoms) ? symptoms.map(String) : []

    // Optional image: extract VISIBLE features (assistive) and feed them into the
    // case as additional input. Not a diagnostic imaging read.
    let visualFindings: string[] = []
    if (typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:image/')) {
      const v = await describeImage(imageDataUrl)
      visualFindings = v.findings
    }

    const allSymptoms = [...symptomList, ...visualFindings]
    if (allSymptoms.length === 0) {
      return NextResponse.json({ error: 'Provide at least one symptom or an image.' }, { status: 400 })
    }

    const input: CaseInput = {
      patientRef: typeof patientRef === 'string' ? patientRef : undefined,
      symptoms: allSymptoms,
      vitalSigns: vitalSigns && typeof vitalSigns === 'object' ? vitalSigns : undefined,
      medicalHistory: Array.isArray(medicalHistory) ? medicalHistory.map(String) : undefined,
      ageBand: typeof ageBand === 'string' ? ageBand : undefined,
      sex: typeof sex === 'string' ? sex : undefined,
    }

    // 1) Grounding: retrieve verified candidate conditions (scored) from DynamoDB.
    //    Fall back to the in-memory verified seed if the table is unreachable, so
    //    the live quorum never hard-fails (still grounded in the same sources).
    let scored: ScoredCondition[]
    let groundingSource: 'dynamodb' | 'seed-fallback' = 'dynamodb'
    try {
      scored = await matchConditions(input, 5)
      if (scored.length === 0) scored = inMemoryMatch(input, 5)
    } catch (err) {
      console.error('DynamoDB retrieval failed, using verified seed fallback:', (err as Error).message)
      scored = inMemoryMatch(input, 5)
      groundingSource = 'seed-fallback'
    }

    if (scored.length === 0) {
      return NextResponse.json({
        requestId: `req_${Date.now()}`,
        disclaimer: DISCLAIMER,
        consensus: { reached: false, diagnosis: null, icd10: null, agreement: '0/3', confidence: 0, method: 'weighted', topWeightShare: 0, margin: 0, differentials: [] },
        escalation: { triggered: false, reason: 'no grounded candidates' },
        recommendations: { treatments: [], redFlags: [] },
        visualFindings,
        votes: [],
        citations: [],
        safety: { safe: true, flags: ['no-grounded-candidates'], note: 'No verified condition matched the presentation; cannot ground a diagnosis.' },
        groundedConditions: [],
        metadata: { timestamp: new Date().toISOString(), quorumThreshold: 'weighted', modelsConsulted: [], processingTimeMs: 0, grounded: false, groundingSource },
      })
    }

    // 2) Weighted quorum (+ escalation) + 3) safety gate.
    const result = await runQuorum(input, scored)
    const enriched = { ...result, visualFindings, patientRef: input.patientRef, metadata: { ...result.metadata, groundingSource } }

    // 4) Audit trail (best-effort; never block the response on the write).
    saveDiagnosis(enriched).catch((e) =>
      console.error('saveDiagnosis failed (non-fatal):', (e as Error).message)
    )

    return NextResponse.json(enriched, { status: 200 })
  } catch (error) {
    console.error('Diagnosis API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'diagnosis-api',
    pipeline: 'dynamodb-grounding -> weighted-quorum -> escalation -> safety-gate -> audit',
    timestamp: new Date().toISOString(),
  })
}
