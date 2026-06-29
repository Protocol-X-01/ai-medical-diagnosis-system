// Bulk import of the Human Phenotype Ontology (HPO) disease->phenotype annotations
// into DynamoDB as Tier-3 (ontology-derived) ConditionEntry records.
//
// Inputs (download once, then run offline):
//   hp.obo           : HPO term id -> name      (http://purl.obolibrary.org/obo/hp.obo)
//   phenotype.hpoa   : disease -> phenotype TSV (https://purl.obolibrary.org/obo/hp/hpoa/phenotype.hpoa)
//
// Records are tagged source='hpo', prior=0.5 (lower commonality weight than the
// curated guideline set) and carry real provenance (OMIM/Orphanet/DECIPHER URLs).
//
//   HP_OBO=/tmp/hp.obo HPOA=/tmp/phenotype.hpoa MAX=0 npm run import-hpo   (MAX=0 = all)

import { readFileSync } from 'fs'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import type { ConditionEntry, Citation } from '../lib/types'

const HP_OBO = process.env.HP_OBO || '/tmp/hp.obo'
const HPOA = process.env.HPOA || '/tmp/phenotype.hpoa'
const TABLE = process.env.DDB_CONDITIONS_TABLE || 'MedicalConditions'
const MAX = Number(process.env.MAX || '0') // 0 = no limit
const MAX_SYMPTOMS = 30

const region = process.env.AWS_REGION || 'us-east-1'
const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), {
  marshallOptions: { removeUndefinedValues: true },
})

function parseHpoTerms(): Map<string, string> {
  const map = new Map<string, string>()
  const text = readFileSync(HP_OBO, 'utf8')
  let id = ''
  for (const line of text.split('\n')) {
    if (line === '[Term]') { id = '' ; continue }
    if (line.startsWith('id: HP:')) id = line.slice(4).trim()
    else if (line.startsWith('name:') && id) map.set(id, line.slice(5).trim())
  }
  return map
}

function provenance(databaseId: string, name: string): Citation {
  const [db, num] = databaseId.split(':')
  let url = ''
  if (db === 'OMIM') url = `https://omim.org/entry/${num}`
  else if (db === 'ORPHA') url = `https://www.orpha.net/en/disease/detail/${num}`
  else if (db === 'DECIPHER') url = `https://www.deciphergenomics.org/syndrome/${num}`
  else url = `https://hpo.jax.org/app/browse/disease/${databaseId}`
  return { id: `${databaseId}`, title: name, source: db, url, identifier: databaseId }
}

interface Acc { name: string; symptoms: Set<string>; db: string }

function buildConditions(terms: Map<string, string>): ConditionEntry[] {
  const lines = readFileSync(HPOA, 'utf8').split('\n')
  const byDisease = new Map<string, Acc>()

  for (const line of lines) {
    if (!line || line.startsWith('#') || line.startsWith('database_id')) continue
    const f = line.split('\t')
    const databaseId = f[0]          // OMIM:619340
    const diseaseName = f[1]
    const qualifier = f[2]           // 'NOT' => phenotype excluded
    const hpoId = f[3]               // HP:0002187
    const aspect = f[10]             // 'P' = phenotypic abnormality
    if (!databaseId || !diseaseName || qualifier === 'NOT' || aspect !== 'P') continue
    const symptom = terms.get(hpoId)
    if (!symptom) continue
    const acc = byDisease.get(databaseId) || { name: diseaseName, symptoms: new Set<string>(), db: databaseId.split(':')[0] }
    if (acc.symptoms.size < MAX_SYMPTOMS) acc.symptoms.add(symptom.toLowerCase())
    byDisease.set(databaseId, acc)
  }

  const now = new Date().toISOString()
  const out: ConditionEntry[] = []
  for (const [databaseId, acc] of byDisease) {
    if (acc.symptoms.size === 0) continue
    out.push({
      conditionId: databaseId,
      name: acc.name,
      icd10Code: databaseId,         // HPO has no ICD-10; the source id is the identifier
      category: acc.db === 'ORPHA' ? 'Rare disease (Orphanet)' : acc.db === 'OMIM' ? 'Genetic/Mendelian (OMIM)' : acc.db,
      symptoms: [...acc.symptoms],
      citations: [provenance(databaseId, acc.name)],
      source: 'hpo',
      prior: 0.5,
      updatedAt: now,
    })
  }
  return out
}

async function batchWrite(items: ConditionEntry[]) {
  let written = 0
  for (let i = 0; i < items.length; i += 25) {
    const chunk = items.slice(i, i + 25)
    let req: Record<string, { PutRequest: { Item: ConditionEntry } }[]> = {
      [TABLE]: chunk.map((Item) => ({ PutRequest: { Item } })),
    }
    // handle unprocessed items with simple backoff
    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await doc.send(new BatchWriteCommand({ RequestItems: req }))
      const un = res.UnprocessedItems?.[TABLE]
      if (!un || un.length === 0) break
      req = { [TABLE]: un as { PutRequest: { Item: ConditionEntry } }[] }
      await new Promise((r) => setTimeout(r, 150 * (attempt + 1)))
    }
    written += chunk.length
    if (written % 1000 < 25) console.log(`  …${written}/${items.length}`)
  }
  return written
}

async function main() {
  console.log(`Parsing HPO terms from ${HP_OBO} …`)
  const terms = parseHpoTerms()
  console.log(`  ${terms.size} HPO terms`)
  console.log(`Building conditions from ${HPOA} …`)
  let conditions = buildConditions(terms)
  console.log(`  ${conditions.length} diseases with phenotypes`)
  if (MAX > 0) conditions = conditions.slice(0, MAX)
  console.log(`Writing ${conditions.length} records to ${TABLE} (source=hpo, prior=0.5) …`)
  const n = await batchWrite(conditions)
  console.log(`Done. ${n} HPO conditions written.`)
}

main().catch((e) => { console.error('import-hpo failed:', e?.message || e); process.exit(1) })
