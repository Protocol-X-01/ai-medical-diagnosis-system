// Creates the DynamoDB tables used by the system. Idempotent: skips tables that
// already exist. Run once AWS credentials are available:
//   NVIDIA... not needed here; needs AWS_REGION + AWS credentials in the env.
//   cd frontend && npm run setup-db
//
// Both tables are PAY_PER_REQUEST (on-demand) — no capacity planning, ideal for
// a demo and for the required "AWS database usage" screenshot.

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
  ResourceNotFoundException,
} from '@aws-sdk/client-dynamodb'

const region = process.env.AWS_REGION || 'us-east-1'
const client = new DynamoDBClient({ region })

const CONDITIONS_TABLE = process.env.DDB_CONDITIONS_TABLE || 'MedicalConditions'
const DIAGNOSES_TABLE = process.env.DDB_DIAGNOSES_TABLE || 'Diagnoses'
const PATIENTS_TABLE = process.env.DDB_PATIENTS_TABLE || 'Patients'

async function exists(name: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: name }))
    return true
  } catch (e) {
    if (e instanceof ResourceNotFoundException) return false
    throw e
  }
}

async function createTable(name: string, pk: string): Promise<void> {
  if (await exists(name)) {
    console.log(`✓ ${name} already exists — skipping`)
    return
  }
  console.log(`… creating ${name} (PK: ${pk})`)
  await client.send(
    new CreateTableCommand({
      TableName: name,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [{ AttributeName: pk, AttributeType: 'S' }],
      KeySchema: [{ AttributeName: pk, KeyType: 'HASH' }],
      Tags: [
        { Key: 'project', Value: 'ai-medical-diagnosis' },
        { Key: 'hackathon', Value: 'h0-zero-stack' },
      ],
    })
  )
  await waitUntilTableExists({ client, maxWaitTime: 120 }, { TableName: name })
  console.log(`✓ ${name} ready`)
}

async function main() {
  console.log(`Region: ${region}`)
  await createTable(CONDITIONS_TABLE, 'conditionId')
  await createTable(DIAGNOSES_TABLE, 'requestId')
  await createTable(PATIENTS_TABLE, 'patientId')
  console.log('Done.')
}

main().catch((e) => {
  console.error('setup-dynamodb failed:', e?.message || e)
  process.exit(1)
})
