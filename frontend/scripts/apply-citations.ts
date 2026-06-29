// Canonical citation-URL correction layer. Some importer specs use NICE CKS slugs
// that 404 (or a condition is better served by an NHS / DermNet page). This maps
// each known-broken URL to a verified replacement and rewrites it in the
// MedicalConditions table. Idempotent. Run as the last build step:
//   import-* -> apply-citations -> export-snapshot   (needs AWS creds)
//
//   npm run apply-citations
//
// To re-audit after running, use:  npm run check-citations

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import type { ConditionEntry } from '../lib/types'

const TABLE = process.env.DDB_CONDITIONS_TABLE || 'MedicalConditions'
const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' }), { marshallOptions: { removeUndefinedValues: true } })

const cks = (s: string) => `https://cks.nice.org.uk/topics/${s}/`
const dn = (s: string) => `https://dermnetnz.org/topics/${s}`

// known-broken URL -> verified replacement { url, source, title } (all confirmed 200)
export const MAP: Record<string, { url: string; source: string; title: string }> = {
  [cks('ankylosing-spondylitis')]: { url: 'https://www.nhs.uk/conditions/ankylosing-spondylitis/', source: 'NHS', title: 'Ankylosing spondylitis' },
  [cks('blood-pressure-low')]: { url: 'https://www.nhs.uk/conditions/low-blood-pressure-hypotension/', source: 'NHS', title: 'Low blood pressure (hypotension)' },
  [cks('bronchiolitis')]: { url: 'https://www.nhs.uk/conditions/bronchiolitis/', source: 'NHS', title: 'Bronchiolitis' },
  [cks('cluster-headache')]: { url: cks('headache-cluster'), source: 'NICE CKS', title: 'Headache - cluster' },
  [cks('dvt-deep-vein-thrombosis')]: { url: cks('deep-vein-thrombosis'), source: 'NICE CKS', title: 'Deep vein thrombosis' },
  [cks('fibromyalgia')]: { url: 'https://www.nhs.uk/conditions/fibromyalgia/', source: 'NHS', title: 'Fibromyalgia' },
  [cks('glandular-fever-infectious-mononucleosis')]: { url: 'https://www.nhs.uk/conditions/glandular-fever/', source: 'NHS', title: 'Glandular fever' },
  [cks('gord')]: { url: cks('dyspepsia-proven-gord'), source: 'NICE CKS', title: 'Dyspepsia - proven GORD' },
  [cks('hidradenitis-suppurativa')]: { url: dn('hidradenitis-suppurativa'), source: 'DermNet', title: 'Hidradenitis suppurativa' },
  [cks('lactose-intolerance')]: { url: 'https://www.nhs.uk/conditions/lactose-intolerance/', source: 'NHS', title: 'Lactose intolerance' },
  [cks('mastitis-and-breast-abscess')]: { url: 'https://www.nhs.uk/conditions/mastitis/', source: 'NHS', title: 'Mastitis' },
  [cks('menorrhagia')]: { url: cks('menorrhagia-heavy-menstrual-bleeding'), source: 'NICE CKS', title: 'Menorrhagia (heavy menstrual bleeding)' },
  [cks('panic-disorder')]: { url: cks('generalized-anxiety-disorder'), source: 'NICE CKS', title: 'Generalized anxiety disorder' },
  [cks('psoriatic-arthritis')]: { url: cks('psoriasis'), source: 'NICE CKS', title: 'Psoriasis' },
  [cks('scrotal-pain-and-swelling')]: { url: cks('scrotal-pain-swelling'), source: 'NICE CKS', title: 'Scrotal pain and swelling' },
  [cks('stroke-and-tia')]: { url: 'https://www.nhs.uk/conditions/stroke/', source: 'NHS', title: 'Stroke' },
  [cks('styes-meibomian-cysts')]: { url: cks('meibomian-cyst-chalazion'), source: 'NICE CKS', title: 'Meibomian cyst (chalazion)' },
  [cks('tenosynovitis')]: { url: 'https://www.nhs.uk/conditions/tendonitis/', source: 'NHS', title: 'Tendonitis' },
  [cks('vitamin-d-deficiency')]: { url: cks('vitamin-d-deficiency-in-adults'), source: 'NICE CKS', title: 'Vitamin D deficiency in adults' },
  [dn('bcc')]: { url: dn('basal-cell-carcinoma'), source: 'DermNet', title: 'Basal cell carcinoma' },
  [dn('erythema-migrans')]: { url: dn('lyme-disease'), source: 'DermNet', title: 'Lyme disease' },
  [dn('urticaria')]: { url: dn('urticaria-an-overview'), source: 'DermNet', title: 'Urticaria - an overview' },
}

async function main() {
  let scanned = 0, changed = 0
  let ExclusiveStartKey: Record<string, unknown> | undefined
  do {
    const res = await doc.send(new ScanCommand({ TableName: TABLE, ExclusiveStartKey }))
    for (const raw of (res.Items || []) as ConditionEntry[]) {
      scanned++
      let dirty = false
      for (const ci of raw.citations || []) {
        const fix = ci.url && MAP[ci.url]
        if (fix) { ci.url = fix.url; ci.source = fix.source; ci.title = fix.title; dirty = true }
      }
      if (dirty) { await doc.send(new PutCommand({ TableName: TABLE, Item: raw })); changed++; console.log(`  ✓ fixed ${raw.conditionId} (${raw.name})`) }
    }
    ExclusiveStartKey = res.LastEvaluatedKey
  } while (ExclusiveStartKey)
  console.log(`\nScanned ${scanned}, fixed ${changed} conditions.`)
}
main().catch((e) => { console.error('apply-citations failed:', e?.message || e); process.exit(1) })
