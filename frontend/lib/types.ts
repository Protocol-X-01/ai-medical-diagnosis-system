// Shared domain types for the AI Medical Diagnosis System.
// Kept framework-agnostic so they can be reused by API routes, lib, and tests.

export interface Citation {
  id: string
  title: string
  source: string // e.g. "PubMed", "WHO", "NICE", "CDC"
  url: string
  identifier?: string // PMID / DOI / guideline id
  year?: number
}

/** A verified encyclopedia entry. Diagnoses may ONLY cite sources stored here. */
export interface ConditionEntry {
  conditionId: string // e.g. "J18", "A41", or "OMIM:619340"
  name: string
  icd10Code: string
  category: string
  symptoms: string[]
  redFlags?: string[]
  causes?: string[]
  treatments?: string[]
  differentials?: string[]
  citations: Citation[]
  /** Provenance tier: 'curated' (guideline-cited) | 'hpo' (ontology-derived) etc. */
  source?: string
  /** Representative reference image (open-licensed) for visual comparison. */
  imageUrl?: string
  /** Teaching depth (AMBOSS-style) for clinicians/students — optional. */
  pathophysiology?: string
  investigations?: string[]
  keyPoints?: string[]
  /** Commonality prior (0..1): curated common conditions ~1.0; bulk/rare lower.
   *  Multiplies retrieval match-strength so common conditions rank ahead of rare
   *  ones on equal symptom overlap. Defaults to 1 when absent. */
  prior?: number
  updatedAt: string
}

export interface CaseInput {
  patientRef?: string // pseudonymous reference only — never PHI/PII
  symptoms: string[]
  vitalSigns?: Record<string, string | number>
  medicalHistory?: string[]
  ageBand?: string
  sex?: string
}

/** One model's independent vote in the quorum. */
export interface AgentVote {
  agent: string // human-readable role
  model: string // NIM model id
  diagnosis: string | null
  icd10: string | null
  confidence: number // 0..1
  reasoning: string
  citedSourceIds: string[] // must reference ConditionEntry.citations ids
  insufficientEvidence: boolean
  weight?: number // effective weight this vote contributed (trust × confidence × matchStrength)
  error?: string
}

export interface ConsensusResult {
  reached: boolean
  diagnosis: string | null
  icd10: string | null
  agreement: string // e.g. "2/3"
  confidence: number // 0..1, derived from weighted agreement + model confidence
  method: 'weighted'
  topWeightShare: number // winning condition's share of total vote weight (0..1)
  margin: number // gap between top and second condition's weighted share (0..1)
  differentials: { diagnosis: string; icd10?: string; votes: number; weight: number }[]
}

export interface EscalationResult {
  triggered: boolean
  reason: string
  model?: string
  verdict?: string // adjudicator's chosen condition
  changedOutcome?: boolean
}

export interface SafetyVerdict {
  safe: boolean
  flags: string[]
  note: string
}

export interface DiagnosisResponse {
  requestId: string
  disclaimer: string
  consensus: ConsensusResult
  escalation: EscalationResult
  /** Management guidance derived from the verified consensus condition. */
  recommendations: { treatments: string[]; redFlags: string[] }
  /** Visible features extracted from an uploaded image (assistive, not a diagnosis). */
  visualFindings?: string[]
  votes: AgentVote[]
  citations: Citation[] // only verified citations actually used
  safety: SafetyVerdict
  groundedConditions: { conditionId: string; name: string; icd10Code: string; matchStrength: number; imageUrl?: string; category?: string }[]
  metadata: {
    timestamp: string
    quorumThreshold: string
    modelsConsulted: string[]
    processingTimeMs: number
    grounded: boolean
    groundingSource?: string
  }
}
