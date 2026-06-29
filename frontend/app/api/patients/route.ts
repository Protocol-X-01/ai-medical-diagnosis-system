import { NextRequest, NextResponse } from 'next/server'
import { listPatients, putPatient, type Patient } from '@/lib/dynamodb'

export const runtime = 'nodejs'
export const maxDuration = 20

// GET /api/patients — list clinic patient records.
export async function GET() {
  try {
    return NextResponse.json({ patients: await listPatients() })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/patients — create a patient record { name, ageBand?, sex?, notes? }.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    if (!name) return NextResponse.json({ error: 'Patient name is required.' }, { status: 400 })
    const patient: Patient = {
      patientId: `pt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      ageBand: typeof body?.ageBand === 'string' ? body.ageBand : undefined,
      sex: typeof body?.sex === 'string' ? body.sex : undefined,
      notes: typeof body?.notes === 'string' ? body.notes : undefined,
      createdAt: new Date().toISOString(),
    }
    await putPatient(patient)
    return NextResponse.json({ patient }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
