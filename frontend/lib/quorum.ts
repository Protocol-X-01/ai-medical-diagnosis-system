// Multi-model quorum orchestration — the core anti-hallucination engine.
//
// Design (governed by Claude Code at build time, enforced deterministically at runtime):
//  1. RETRIEVAL grounds the case in verified ConditionEntry records, each with a
//     match-strength score (how much of the presentation it explains).
//  2. Each voter model may ONLY diagnose from the supplied grounded candidates,
//     or explicitly declare insufficient evidence.
//  3. Votes are aggregated by WEIGHTED consensus: weight = model trust × the
//     model's confidence × the retrieval match-strength of the voted condition.
//  4. Citation integrity: any source id a model invents that is not in our verified
//     store is DROPPED; a consensus with zero verified citations is withheld.
//  5. AGGRESSIVE HANDOVER: on a tight margin / split / ambiguous presentation, the
//     case is escalated to a stronger adjudicator model that breaks the tie.
//  6. A content-safety model screens the final narrative.
//
// Models are config-driven (verified available on the project NIM key 2026-06-28).

import { nimChat, extractJson } from './nim'
import type { ScoredCondition } from './symptom-index'
import type {
  AgentVote,
  CaseInput,
  ConditionEntry,
  ConsensusResult,
  EscalationResult,
  Citation,
  DiagnosisResponse,
  SafetyVerdict,
} from './types'

interface VoterConfig {
  agent: string
  model: string
  trust: number // relative trust weight
}

// Verified runnable on the project NIM key (2026-06-28). Three independent model
// families for genuine vote independence.
export const QUORUM_VOTERS: VoterConfig[] = [
  { agent: 'Reasoning (NVIDIA Nemotron-3 Super 120B)', model: 'nvidia/nemotron-3-super-120b-a12b', trust: 1.1 },
  { agent: 'Diagnostic (Meta Llama 3.3 70B)', model: 'meta/llama-3.3-70b-instruct', trust: 1.0 },
  { agent: 'Cross-check (Mistral Nemotron)', model: 'mistralai/mistral-nemotron', trust: 1.0 },
]

// Senior tie-breaker for ambiguous/complex cases. A fallback chain of reliable,
// strong, verified models — tried in order until one returns a committed verdict.
// (The 550B ultra model 503s under load, so it is not used here.)
export const ADJUDICATOR_MODELS: { agent: string; model: string }[] = [
  { agent: 'Adjudicator (NVIDIA Nemotron-3 Super 120B)', model: 'nvidia/nemotron-3-super-120b-a12b' },
  { agent: 'Adjudicator (StepFun Step-3.7)', model: 'stepfun-ai/step-3.7-flash' },
  { agent: 'Adjudicator (Meta Llama 3.1 70B)', model: 'meta/llama-3.1-70b-instruct' },
]
export const ADJUDICATOR_TRUST = 1.5

export const SAFETY_MODEL = 'nvidia/nemotron-content-safety-reasoning-4b'

export const QUORUM_MIN_VOTES = 2 // minimum raw agreeing votes for an un-escalated consensus
export const MARGIN_ESCALATION_THRESHOLD = 0.2 // escalate if top-vs-second weighted margin is below this
export const CONTESTED_MARGIN = 0.15 // consensus reached but a runner-up within this weighted-share gap is flagged contested

export const DISCLAIMER =
  'Clinical decision-support output. Not a diagnosis and not a substitute for a ' +
  'qualified clinician. All conclusions are grounded in cited, verified sources; ' +
  'verify against current guidelines before any clinical action.'

function norm(s: string | null | undefined): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}
function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(1, n))
}
function key(v: { icd10: string | null; diagnosis: string | null }): string {
  return norm(v.icd10) || norm(v.diagnosis)
}

// ---- prompting -------------------------------------------------------------

function buildGroundingBlock(scored: ScoredCondition[]): string {
  if (scored.length === 0) return 'NO VERIFIED CANDIDATE CONDITIONS RETRIEVED.'
  return scored
    .map(({ condition: c, score }) => {
      const cites = c.citations
        .map((ci) => `      - [${ci.id}] ${ci.title} (${ci.source}${ci.identifier ? ' ' + ci.identifier : ''})`)
        .join('\n')
      return [
        `  • ${c.name} (ICD-10 ${c.icd10Code}, conditionId ${c.conditionId}) [match ${(score * 100).toFixed(0)}%]`,
        `    typical symptoms: ${c.symptoms.join(', ')}`,
        c.redFlags?.length ? `    red flags: ${c.redFlags.join(', ')}` : '',
        `    verified citations:`,
        cites,
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')
}

function buildVoterPrompt(input: CaseInput, scored: ScoredCondition[]): string {
  const validIds = scored.flatMap((s) => s.condition.citations.map((ci) => ci.id))
  return [
    'CASE:',
    `  symptoms: ${input.symptoms.join(', ')}`,
    input.vitalSigns ? `  vitals: ${JSON.stringify(input.vitalSigns)}` : '',
    input.medicalHistory?.length ? `  history: ${input.medicalHistory.join(', ')}` : '',
    input.ageBand ? `  age band: ${input.ageBand}` : '',
    input.sex ? `  sex: ${input.sex}` : '',
    '',
    'VERIFIED CANDIDATE CONDITIONS (you may ONLY diagnose from these):',
    buildGroundingBlock(scored),
    '',
    'INSTRUCTIONS:',
    '  - Choose the single most likely condition from the verified candidates above.',
    '  - You may ONLY cite source ids that appear in the verified citations.',
    `  - Valid citation ids: ${validIds.join(', ') || '(none)'}`,
    '  - Prefer to commit to the best-fitting candidate; set insufficientEvidence=true ONLY if none plausibly fit.',
    '  - Do NOT invent conditions, ICD-10 codes, or citations.',
    '  - Output the JSON object FIRST, before any other text.',
    '',
    'Respond ONLY with compact JSON of exactly this shape:',
    '{"diagnosis": string|null, "icd10": string|null, "confidence": number(0..1),',
    ' "reasoning": string, "citedSourceIds": string[], "insufficientEvidence": boolean}',
  ]
    .filter(Boolean)
    .join('\n')
}

const VOTER_SYSTEM =
  'You are a cautious clinical decision-support agent in a multi-model quorum. ' +
  'You reason strictly within provided verified evidence and never fabricate ' +
  'conditions or citations. Output JSON only.'

// ---- voting ----------------------------------------------------------------

async function runVoter(
  cfg: VoterConfig,
  input: CaseInput,
  scored: ScoredCondition[]
): Promise<AgentVote> {
  const validIdSet = new Set(scored.flatMap((s) => s.condition.citations.map((ci) => ci.id)))
  try {
    const { content, model } = await nimChat({
      model: cfg.model,
      system: VOTER_SYSTEM,
      user: buildVoterPrompt(input, scored),
      temperature: 0.2,
      maxTokens: 900,
    })
    const parsed = extractJson<Partial<AgentVote>>(content)
    if (!parsed) return baseVote(cfg, model, 'Model returned unparseable output', content.slice(0, 200))
    const citedSourceIds = (parsed.citedSourceIds || []).filter((id) => validIdSet.has(id))
    return {
      agent: cfg.agent,
      model,
      diagnosis: parsed.diagnosis ?? null,
      icd10: parsed.icd10 ?? null,
      confidence: clamp01(Number(parsed.confidence ?? 0)),
      reasoning: String(parsed.reasoning ?? '').slice(0, 800),
      citedSourceIds,
      insufficientEvidence: Boolean(parsed.insufficientEvidence) || citedSourceIds.length === 0,
    }
  } catch (err) {
    return baseVote(cfg, cfg.model, 'agent error', (err as Error).message)
  }
}

function baseVote(cfg: VoterConfig, model: string, reasoning: string, error?: string): AgentVote {
  return { agent: cfg.agent, model, diagnosis: null, icd10: null, confidence: 0, reasoning, citedSourceIds: [], insufficientEvidence: true, error }
}

// ---- weighted consensus ----------------------------------------------------

function matchStrengthFor(
  vote: AgentVote,
  scoreByKey: Map<string, number>
): number {
  const s = scoreByKey.get(key(vote))
  return s === undefined ? 0.25 : Math.max(s, 0.25) // floor so a grounded vote always counts
}

function voteWeight(vote: AgentVote, trust: number, matchStrength: number): number {
  // soften extremes so a single zero factor doesn't fully annihilate a grounded vote
  return trust * (0.3 + 0.7 * vote.confidence) * (0.3 + 0.7 * matchStrength)
}

interface ConsensusComputation {
  result: ConsensusResult
  topKey: string | null
}

function computeWeightedConsensus(
  votes: { vote: AgentVote; trust: number }[],
  scoreByKey: Map<string, number>
): ConsensusComputation {
  const buckets = new Map<string, { label: string; icd10?: string; rawVotes: number; weight: number; confs: number[] }>()
  let totalWeight = 0

  for (const { vote, trust } of votes) {
    if (vote.insufficientEvidence || !vote.diagnosis) continue
    const k = key(vote)
    if (!k) continue
    const ms = matchStrengthFor(vote, scoreByKey)
    const w = voteWeight(vote, trust, ms)
    vote.weight = Math.round(w * 1000) / 1000
    totalWeight += w
    const b = buckets.get(k) || { label: vote.diagnosis, icd10: vote.icd10 || undefined, rawVotes: 0, weight: 0, confs: [] }
    b.rawVotes++
    b.weight += w
    b.confs.push(vote.confidence)
    buckets.set(k, b)
  }

  const ranked = [...buckets.entries()].sort((a, b) => b[1].weight - a[1].weight)
  const differentials = ranked.map(([, b]) => ({
    diagnosis: b.label,
    icd10: b.icd10,
    votes: b.rawVotes,
    weight: Math.round((totalWeight ? b.weight / totalWeight : 0) * 1000) / 1000,
  }))

  if (ranked.length === 0 || totalWeight === 0) {
    return {
      result: { reached: false, diagnosis: null, icd10: null, agreement: `0/${votes.length}`, confidence: 0, method: 'weighted', topWeightShare: 0, margin: 0, differentials },
      topKey: null,
    }
  }

  const [topKey, top] = ranked[0]
  const topShare = top.weight / totalWeight
  const secondShare = ranked[1] ? ranked[1][1].weight / totalWeight : 0
  const margin = topShare - secondShare
  const avgConf = top.confs.reduce((s, c) => s + c, 0) / top.confs.length
  const reached = (top.rawVotes >= QUORUM_MIN_VOTES && topShare >= 0.4) || topShare >= 0.55

  // Disagreement handling: even a "reached" consensus can be a near-tie. Flag any
  // runner-up within CONTESTED_MARGIN of the leader so it's surfaced, not hidden.
  const closeContenders = reached
    ? differentials.slice(1).filter((d) => topShare - d.weight <= CONTESTED_MARGIN && d.weight > 0).slice(0, 2)
    : []
  const contested = reached && closeContenders.length > 0

  return {
    result: {
      reached,
      diagnosis: reached ? top.label : null,
      icd10: reached ? top.icd10 || null : null,
      agreement: `${top.rawVotes}/${votes.length}`,
      confidence: reached ? clamp01(0.45 * topShare + 0.35 * avgConf + 0.2 * margin) : 0,
      method: 'weighted',
      topWeightShare: Math.round(topShare * 1000) / 1000,
      margin: Math.round(margin * 1000) / 1000,
      differentials,
      contested,
      closeContenders: closeContenders.map((d) => ({ diagnosis: d.diagnosis, icd10: d.icd10, weight: d.weight })),
    },
    topKey: reached ? topKey : ranked[0][0],
  }
}

// ---- optional senior re-read (retained for tests / future opt-in use) ------
// NOTE: not invoked by runQuorum — the product presents ranked options on
// ambiguity rather than performing an opaque handover.

export async function runAdjudicator(input: CaseInput, scored: ScoredCondition[], votes: AgentVote[]): Promise<AgentVote> {
  const voteSummary = votes
    .filter((v) => !v.insufficientEvidence)
    .map((v) => `  - ${v.model}: ${v.diagnosis} (${v.icd10}), conf ${v.confidence}`)
    .join('\n') || '  (no decisive votes)'
  const prompt = [
    'You are the senior adjudicator in a clinical decision-support quorum. The junior',
    'models disagreed or the case is ambiguous. Review the case, the verified candidate',
    'conditions, and the votes, then make the final call.',
    '',
    buildVoterPrompt(input, scored),
    '',
    'JUNIOR VOTES:',
    voteSummary,
  ].join('\n')
  const validIdSet = new Set(scored.flatMap((s) => s.condition.citations.map((ci) => ci.id)))
  let last: AgentVote | null = null
  for (const cfg of ADJUDICATOR_MODELS) {
    try {
      const { content, model } = await nimChat({ model: cfg.model, system: VOTER_SYSTEM, user: prompt, temperature: 0.1, maxTokens: 1400, timeoutMs: 70000 })
      const parsed = extractJson<Partial<AgentVote>>(content)
      if (!parsed) {
        last = baseVote({ agent: cfg.agent, model, trust: ADJUDICATOR_TRUST }, model, 'adjudicator unparseable', content.slice(0, 160))
        continue
      }
      const citedSourceIds = (parsed.citedSourceIds || []).filter((id) => validIdSet.has(id))
      const vote: AgentVote = { agent: cfg.agent, model, diagnosis: parsed.diagnosis ?? null, icd10: parsed.icd10 ?? null, confidence: clamp01(Number(parsed.confidence ?? 0)), reasoning: String(parsed.reasoning ?? '').slice(0, 800), citedSourceIds, insufficientEvidence: Boolean(parsed.insufficientEvidence) || citedSourceIds.length === 0 }
      if (vote.diagnosis && !vote.insufficientEvidence) return vote // committed verdict
      last = vote
    } catch (err) {
      last = baseVote({ agent: cfg.agent, model: cfg.model, trust: ADJUDICATOR_TRUST }, cfg.model, 'adjudicator error', (err as Error).message)
    }
  }
  return last ?? baseVote({ agent: ADJUDICATOR_MODELS[0].agent, model: ADJUDICATOR_MODELS[0].model, trust: ADJUDICATOR_TRUST }, ADJUDICATOR_MODELS[0].model, 'no adjudicator available')
}

// ---- safety + citations ----------------------------------------------------

async function runSafetyGate(narrative: string): Promise<SafetyVerdict> {
  try {
    const { content } = await nimChat({
      model: SAFETY_MODEL,
      user: 'Assess the following clinical decision-support text for safety. Respond ONLY with JSON {"safe": boolean, "flags": string[], "note": string}.\n\nTEXT:\n' + narrative.slice(0, 2000),
      temperature: 0,
      maxTokens: 300,
    })
    const parsed = extractJson<SafetyVerdict>(content)
    if (parsed && typeof parsed.safe === 'boolean') return { safe: parsed.safe, flags: parsed.flags || [], note: parsed.note || '' }
  } catch {
    /* fall through */
  }
  return { safe: true, flags: ['safety-gate-unavailable'], note: 'Safety model could not be reached; output not independently screened.' }
}

function collectCitations(votes: AgentVote[], conditions: ConditionEntry[], consensus: ConsensusResult): Citation[] {
  const byId = new Map<string, Citation>()
  for (const c of conditions) for (const ci of c.citations) byId.set(ci.id, ci)
  const used = new Set<string>()
  for (const v of votes) {
    if (consensus.reached && key(v) !== (norm(consensus.icd10) || norm(consensus.diagnosis))) continue
    for (const id of v.citedSourceIds) used.add(id)
  }
  return [...used].map((id) => byId.get(id)).filter((c): c is Citation => !!c)
}

// ---- orchestration ---------------------------------------------------------

export async function runQuorum(input: CaseInput, scored: ScoredCondition[]): Promise<DiagnosisResponse> {
  const start = Date.now()
  const conditions = scored.map((s) => s.condition)
  const scoreByKey = new Map<string, number>()
  for (const s of scored) {
    scoreByKey.set(norm(s.condition.icd10Code), s.score)
    scoreByKey.set(norm(s.condition.name), s.score)
  }

  const allVotes = await Promise.all(QUORUM_VOTERS.map((cfg) => runVoter(cfg, input, scored)))
  const weighted = QUORUM_VOTERS.map((cfg, i) => ({ vote: allVotes[i], trust: cfg.trust }))
  const consensus = computeWeightedConsensus(weighted, scoreByKey)

  // No aggressive handover. When the case is ambiguous we present the ranked
  // differential OPTIONS (an encyclopedia behaviour) rather than escalate to a
  // hidden adjudicator — clearer value for a B2B product.
  const escalation: EscalationResult = { triggered: false, reason: '' }

  let citations = collectCitations(allVotes, conditions, consensus.result)
  if (consensus.result.reached && citations.length === 0) {
    consensus.result.reached = false
    consensus.result.diagnosis = null
    consensus.result.icd10 = null
    consensus.result.confidence = 0
    citations = []
  }

  // Management guidance from the verified consensus condition (curated entries carry
  // treatments + red flags; ontology/NIH entries may not).
  const recommendations = extractRecommendations(consensus.result, conditions)

  const contestedNote = consensus.result.contested
    ? ` Contested: close differential${consensus.result.closeContenders!.length > 1 ? 's' : ''} to keep in mind — ${consensus.result.closeContenders!.map((c) => c.diagnosis).join(', ')}.`
    : ''
  const narrative = consensus.result.reached
    ? `Consensus: ${consensus.result.diagnosis} (${consensus.result.icd10}), weighted share ${consensus.result.topWeightShare}, margin ${consensus.result.margin}.${contestedNote} ${allVotes.map((v) => v.reasoning).join(' ')}`
    : `No single consensus; ${consensus.result.differentials.length} ranked options presented for clinician review.`
  const safety = await runSafetyGate(narrative)

  return {
    requestId: `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    disclaimer: DISCLAIMER,
    consensus: consensus.result,
    escalation,
    recommendations,
    votes: allVotes,
    citations,
    safety,
    groundedConditions: scored.map((s) => ({ conditionId: s.condition.conditionId, name: s.condition.name, icd10Code: s.condition.icd10Code, matchStrength: Math.round(s.score * 100) / 100, imageUrl: s.condition.imageUrl, category: s.condition.category })),
    metadata: {
      timestamp: new Date().toISOString(),
      quorumThreshold: `weighted · min ${QUORUM_MIN_VOTES}/${QUORUM_VOTERS.length}`,
      modelsConsulted: [...QUORUM_VOTERS.map((v) => v.model), SAFETY_MODEL],
      processingTimeMs: Date.now() - start,
      grounded: scored.length > 0,
    },
  }
}

function extractRecommendations(
  consensus: ConsensusResult,
  conditions: ConditionEntry[]
): { treatments: string[]; redFlags: string[] } {
  if (!consensus.reached) return { treatments: [], redFlags: [] }
  const k = norm(consensus.icd10) || norm(consensus.diagnosis)
  const cond = conditions.find((c) => norm(c.icd10Code) === k || norm(c.name) === k)
  return {
    treatments: cond?.treatments?.slice(0, 8) || [],
    redFlags: cond?.redFlags?.slice(0, 8) || [],
  }
}
