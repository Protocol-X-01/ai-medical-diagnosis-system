// Seeds the verified encyclopedia into DynamoDB. Idempotent (PutItem overwrites).
// Requires AWS credentials + AWS_REGION in the env (and tables created via setup-db).
//   cd frontend && npm run seed-db

import { SEED_CONDITIONS } from '../lib/seed-data'
import { putCondition, CONDITIONS_TABLE } from '../lib/dynamodb'

async function main() {
  console.log(`Seeding ${SEED_CONDITIONS.length} conditions into ${CONDITIONS_TABLE} …`)
  let n = 0
  for (const c of SEED_CONDITIONS) {
    await putCondition(c)
    n++
    console.log(`  ✓ ${c.icd10Code.padEnd(8)} ${c.name}  (${c.citations.length} citations)`)
  }
  console.log(`Done. ${n} conditions seeded.`)
}

main().catch((e) => {
  console.error('seed-encyclopedia failed:', e?.message || e)
  process.exit(1)
})
