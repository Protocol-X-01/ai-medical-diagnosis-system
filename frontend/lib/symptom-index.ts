// Symptom normalisation, synonym expansion, and a precomputed inverted index
// mapping symptom keywords -> conditionIds. This makes retrieval robust to lay
// phrasing ("can't breathe" -> dyspnoea) and fast (no per-request scanning of
// free text). The index is rebuilt from the condition set it is given.

import type { ConditionEntry } from './types'

// Lay term / variant  ->  canonical clinical token(s).
// Deliberately conservative and clinically defensible; expand over time.
export const SYNONYMS: Record<string, string[]> = {
  'short of breath': ['dyspnoea', 'breathlessness'],
  'shortness of breath': ['dyspnoea', 'breathlessness'],
  'cant breathe': ['dyspnoea', 'breathlessness'],
  'cannot breathe': ['dyspnoea', 'breathlessness'],
  'difficulty breathing': ['dyspnoea', 'breathlessness'],
  'breathless': ['dyspnoea', 'breathlessness'],
  'out of breath': ['dyspnoea', 'breathlessness'],
  'high temperature': ['fever'],
  'feverish': ['fever'],
  'pyrexia': ['fever'],
  'temperature': ['fever'],
  'sweating': ['diaphoresis', 'sweating'],
  'sweaty': ['diaphoresis', 'sweating'],
  'racing heart': ['tachycardia', 'rapid heart rate', 'palpitations'],
  'fast heart rate': ['tachycardia', 'rapid heart rate'],
  'palpitations': ['tachycardia', 'palpitations'],
  'heart pounding': ['palpitations', 'tachycardia'],
  'chest pain': ['chest pain'],
  'chest tightness': ['chest tightness', 'chest pain'],
  'tight chest': ['chest tightness', 'chest pain'],
  'pain on breathing': ['pleuritic chest pain'],
  'pain when breathing': ['pleuritic chest pain'],
  'coughing': ['cough'],
  'coughing up blood': ['haemoptysis'],
  'coughing blood': ['haemoptysis'],
  'phlegm': ['productive cough', 'sputum'],
  'bringing up phlegm': ['productive cough'],
  'wheezing': ['wheeze'],
  'confused': ['confusion', 'altered mental state'],
  'disoriented': ['confusion', 'altered mental state'],
  'altered consciousness': ['altered consciousness', 'confusion'],
  'passed out': ['syncope'],
  'fainted': ['syncope'],
  'blackout': ['syncope'],
  'dizzy': ['dizziness', 'lightheadedness'],
  'lightheaded': ['lightheadedness', 'dizziness'],
  'low blood pressure': ['hypotension', 'low blood pressure'],
  'high blood pressure': ['hypertension', 'elevated blood pressure'],
  'peeing a lot': ['polyuria', 'urinary frequency'],
  'frequent urination': ['polyuria', 'urinary frequency'],
  'painful urination': ['dysuria'],
  'burning when peeing': ['dysuria'],
  'very thirsty': ['polydipsia'],
  'always thirsty': ['polydipsia'],
  'weight loss': ['unintended weight loss', 'weight loss'],
  'tired': ['fatigue'],
  'tiredness': ['fatigue'],
  'exhausted': ['fatigue'],
  'headache': ['headache'],
  'severe headache': ['severe headache', 'headache'],
  'stiff neck': ['neck stiffness'],
  'sensitivity to light': ['photophobia'],
  'rash': ['rash'],
  'blurred vision': ['blurred vision'],
  'face drooping': ['facial droop'],
  'arm weakness': ['arm weakness', 'unilateral weakness'],
  'slurred speech': ['speech disturbance', 'slurred speech'],
  'belly pain': ['abdominal pain'],
  'stomach pain': ['abdominal pain'],
  'tummy pain': ['abdominal pain'],
  'throwing up': ['vomiting', 'nausea'],
  'feeling sick': ['nausea'],
  'nauseous': ['nausea'],
}

export function normalizeToken(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/** Expand a raw symptom phrase into canonical tokens (itself + any synonyms). */
export function expandSymptom(raw: string): string[] {
  const n = normalizeToken(raw)
  const out = new Set<string>([n])
  if (SYNONYMS[n]) for (const t of SYNONYMS[n]) out.add(normalizeToken(t))
  // also try partial: if a synonym key is contained in the phrase
  for (const [key, vals] of Object.entries(SYNONYMS)) {
    if (n !== key && (n.includes(key) || key.includes(n))) {
      for (const t of vals) out.add(normalizeToken(t))
    }
  }
  return [...out].filter(Boolean)
}

// Generic words that should not drive matching (avoid every "disorder"/"syndrome" hit).
export const STOPWORDS = new Set([
  'with', 'and', 'the', 'syndrome', 'disorder', 'disease', 'abnormal', 'abnormality',
  'increased', 'decreased', 'recurrent', 'chronic', 'acute', 'mild', 'severe', 'type',
  'left', 'right', 'bilateral', 'generalized', 'progressive', 'onset', 'multiple',
])

export interface SymptomIndex {
  // canonical token -> set of conditionIds
  byKeyword: Map<string, Set<string>>
  // individual significant word -> set of conditionIds (for cheap partial matching)
  byWord: Map<string, Set<string>>
  // conditionId -> condition
  byId: Map<string, ConditionEntry>
}

export function buildIndex(conditions: ConditionEntry[]): SymptomIndex {
  const byKeyword = new Map<string, Set<string>>()
  const byWord = new Map<string, Set<string>>()
  const byId = new Map<string, ConditionEntry>()
  const add = (map: Map<string, Set<string>>, k: string, id: string) => {
    if (!map.has(k)) map.set(k, new Set())
    map.get(k)!.add(id)
  }
  for (const c of conditions) {
    byId.set(c.conditionId, c)
    const tokens = new Set<string>()
    // Synonym expansion (lay->clinical) is only needed for curated entries; bulk
    // ontology/NIH terms are already clinical, so use cheap normalisation there.
    // This keeps index-build fast across the ~11k-condition corpus.
    const expand = c.source && c.source !== 'curated' ? (s: string) => [normalizeToken(s)] : expandSymptom
    for (const s of c.symptoms) for (const t of expand(s)) tokens.add(t)
    for (const s of c.redFlags || []) for (const t of expand(s)) tokens.add(t)
    for (const t of tokens) {
      add(byKeyword, t, c.conditionId)
      for (const w of t.split(' ')) {
        if (w.length >= 4 && !STOPWORDS.has(w)) add(byWord, w, c.conditionId)
      }
    }
  }
  return { byKeyword, byWord, byId }
}

export interface ScoredCondition {
  condition: ConditionEntry
  score: number // 0..1 normalised match strength
  matched: string[] // case tokens that hit this condition
}

/**
 * Score conditions against case symptoms using the inverted index.
 * Token-overlap with synonym expansion; normalised by the number of case tokens
 * so score is a fraction of the presentation explained by the condition.
 */
export function scoreConditions(
  index: SymptomIndex,
  caseSymptoms: string[],
  topN = 5
): ScoredCondition[] {
  const caseTokens = new Set<string>()
  for (const s of caseSymptoms) for (const t of expandSymptom(s)) caseTokens.add(t)
  if (caseTokens.size === 0) return []

  const hits = new Map<string, Set<string>>() // conditionId -> matched case tokens
  for (const token of caseTokens) {
    // Exact canonical-token hit — O(1) map lookup, independent of index size.
    const exact = index.byKeyword.get(token)
    if (exact) for (const id of exact) addHit(hits, id, token)
    // Word-level partial match (e.g. case "chest pain" -> keyword "pleuritic chest
    // pain") via the prebuilt word index. Skips generic stopwords to avoid noise.
    for (const w of token.split(' ')) {
      if (w.length < 4 || STOPWORDS.has(w)) continue
      const ids = index.byWord.get(w)
      if (ids) for (const id of ids) addHit(hits, id, token)
    }
  }

  const denom = caseTokens.size
  const scored: ScoredCondition[] = []
  for (const [id, matched] of hits) {
    const condition = index.byId.get(id)
    if (!condition) continue
    // Apply the commonality prior so common curated conditions outrank rare bulk
    // entries on equal symptom overlap. Default prior = 1 (no change).
    const prior = condition.prior ?? 1
    const overlap = matched.size / denom
    scored.push({ condition, score: overlap * prior, matched: [...matched] })
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, topN)
}

function addHit(map: Map<string, Set<string>>, id: string, token: string) {
  if (!map.has(id)) map.set(id, new Set())
  map.get(id)!.add(token)
}
