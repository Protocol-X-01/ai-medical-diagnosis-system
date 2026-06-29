import { NextRequest, NextResponse } from 'next/server'
import { getPatient, listDiagnosesByPatient } from '@/lib/dynamodb'

export const runtime = 'nodejs'
export const maxDuration = 20

// GET /api/patients/:id — patient record + their linked assessments.
export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const patient = await getPatient(id)
    if (!patient) return NextResponse.json({ error: 'Patient not found.' }, { status: 404 })
    const assessments = await listDiagnosesByPatient(id)
    return NextResponse.json({ patient, assessments })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
