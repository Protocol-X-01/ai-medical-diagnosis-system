// Materialises a read snapshot of the conditions table to a bundled JSON asset.
// DynamoDB remains the system of record (and handles real-time audit writes); this
// snapshot is the fast read/grounding cache, exported at deploy time so serverless
// cold starts never pay a full-table scan over the network.
//
//   npm run export-snapshot   (needs AWS creds)

import { writeFileSync, mkdirSync } from 'fs'
import { dirname, resolve } from 'path'
import { getAllConditions } from '../lib/dynamodb'

const OUT = resolve(process.cwd(), 'data/conditions.json')

async function main() {
  console.log('Scanning conditions from DynamoDB …')
  const all = await getAllConditions()
  console.log(`  ${all.length} conditions`)
  mkdirSync(dirname(OUT), { recursive: true })
  // Compact JSON to keep the bundle small.
  writeFileSync(OUT, JSON.stringify(all))
  const mb = (JSON.stringify(all).length / 1e6).toFixed(1)
  console.log(`Wrote ${OUT} (${mb} MB)`)
}

main().catch((e) => { console.error('export-snapshot failed:', e?.message || e); process.exit(1) })
