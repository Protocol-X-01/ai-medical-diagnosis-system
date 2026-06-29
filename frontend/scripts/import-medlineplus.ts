// Bulk import of NIH MedlinePlus health topics into DynamoDB as common,
// authoritative (Tier-2) ConditionEntry records. Powers both the clinical
// common-condition coverage and the client-facing condition library.
//
// Input: the MedlinePlus topics XML (download once):
//   https://medlineplus.gov/xml/mplus_topics_YYYY-MM-DD.xml
//
//   MPLUS=/tmp/mplus_topics.xml npm run import-mplus

import { readFileSync } from 'fs'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import type { ConditionEntry } from '../lib/types'

const MPLUS = process.env.MPLUS || '/tmp/mplus_topics.xml'
const TABLE = process.env.DDB_CONDITIONS_TABLE || 'MedicalConditions'
const region = process.env.AWS_REGION || 'us-east-1'
const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), { marshallOptions: { removeUndefinedValues: true } })

// Common symptom lexicon — high-precision phrases for extraction from summaries.
const SYMPTOM_LEXICON = [
  'fever', 'chills', 'fatigue', 'weight loss', 'weight gain', 'night sweats', 'cough',
  'productive cough', 'shortness of breath', 'wheezing', 'chest pain', 'palpitations',
  'dizziness', 'fainting', 'headache', 'migraine', 'nausea', 'vomiting', 'diarrhea',
  'constipation', 'abdominal pain', 'bloating', 'heartburn', 'loss of appetite',
  'difficulty swallowing', 'sore throat', 'runny nose', 'congestion', 'sneezing',
  'ear pain', 'hearing loss', 'blurred vision', 'eye pain', 'rash', 'itching', 'hives',
  'swelling', 'joint pain', 'muscle pain', 'back pain', 'neck pain', 'stiffness',
  'weakness', 'numbness', 'tingling', 'tremor', 'seizure', 'confusion', 'memory loss',
  'anxiety', 'depression', 'insomnia', 'frequent urination', 'painful urination',
  'blood in urine', 'incontinence', 'pelvic pain', 'irregular periods', 'hot flashes',
  'jaundice', 'pale skin', 'bruising', 'bleeding', 'swollen lymph nodes', 'sweating',
  'dry mouth', 'excessive thirst', 'dehydration', 'high blood pressure', 'low blood pressure',
  'rapid heartbeat', 'coughing up blood', 'bloody stool', 'dark urine', 'frequent infections',
  'hair loss', 'cold intolerance', 'heat intolerance', 'irritability', 'sensitivity to light',
  'neck stiffness', 'stiff neck', 'double vision', 'slurred speech', 'facial droop',
  'difficulty breathing', 'leg cramps', 'muscle weakness', 'loss of consciousness',
  'shortness of breath on exertion', 'swelling in the legs', 'difficulty concentrating',
]
const lexRegex = SYMPTOM_LEXICON.map((s) => ({ s, re: new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i') }))

const unescapeHtml = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
const stripTags = (s: string) => unescapeHtml(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
const attr = (tag: string, name: string) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] || ''

function extractSymptoms(text: string): string[] {
  const lower = text.toLowerCase()
  const found: string[] = []
  for (const { s, re } of lexRegex) if (re.test(lower)) found.push(s)
  return found.slice(0, 20)
}

function parse(): ConditionEntry[] {
  const data = readFileSync(MPLUS, 'utf8')
  const blocks = data.match(/<health-topic\b[\s\S]*?<\/health-topic>/g) || []
  const now = new Date().toISOString()
  const out: ConditionEntry[] = []
  for (const b of blocks) {
    const open = b.match(/<health-topic\b[^>]*>/)?.[0] || ''
    if (attr(open, 'language') !== 'English') continue
    const title = attr(open, 'title')
    const url = attr(open, 'url')
    const id = attr(open, 'id')
    if (!title || !url) continue
    const summaryRaw = b.match(/<full-summary>([\s\S]*?)<\/full-summary>/)?.[1] || ''
    const metaDesc = attr(open, 'meta-desc')
    const summary = stripTags(summaryRaw)
    const group = (b.match(/<group[^>]*>([^<]*)<\/group>/)?.[1] || 'General Health').trim()
    const aliases = [...b.matchAll(/<also-called>([^<]*)<\/also-called>/g)].map((m) => m[1])
    const symptoms = extractSymptoms(`${title} ${metaDesc} ${summary}`)
    out.push({
      conditionId: `MPLUS:${id}`,
      name: title,
      icd10Code: `MPLUS:${id}`,
      category: group,
      symptoms,
      causes: aliases.length ? aliases : undefined,
      citations: [{ id: `MPLUS:${id}`, title: `${title} — MedlinePlus`, source: 'MedlinePlus (NIH)', url, identifier: `MedlinePlus:${id}` }],
      source: 'medlineplus',
      prior: 1.0,
      updatedAt: now,
    })
  }
  return out
}

async function batchWrite(items: ConditionEntry[]) {
  let n = 0
  for (let i = 0; i < items.length; i += 25) {
    let req: Record<string, { PutRequest: { Item: ConditionEntry } }[]> = { [TABLE]: items.slice(i, i + 25).map((Item) => ({ PutRequest: { Item } })) }
    for (let a = 0; a < 5; a++) {
      const res = await doc.send(new BatchWriteCommand({ RequestItems: req }))
      const un = res.UnprocessedItems?.[TABLE]
      if (!un || un.length === 0) break
      req = { [TABLE]: un as { PutRequest: { Item: ConditionEntry } }[] }
      await new Promise((r) => setTimeout(r, 150 * (a + 1)))
    }
    n += Math.min(25, items.length - i)
  }
  return n
}

async function main() {
  console.log(`Parsing MedlinePlus topics from ${MPLUS} …`)
  const items = parse()
  const withSymptoms = items.filter((i) => i.symptoms.length > 0).length
  console.log(`  ${items.length} English topics (${withSymptoms} with extracted symptoms)`)
  console.log(`Writing to ${TABLE} (source=medlineplus, prior=1.0) …`)
  const n = await batchWrite(items)
  console.log(`Done. ${n} MedlinePlus topics written.`)
}

main().catch((e) => { console.error('import-medlineplus failed:', e?.message || e); process.exit(1) })
