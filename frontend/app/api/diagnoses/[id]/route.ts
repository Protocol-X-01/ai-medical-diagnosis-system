import { NextRequest, NextResponse } from 'next/server'
import { getDiagnosis } from '@/lib/dynamodb'

export const runtime = 'nodejs'
export const maxDuration = 20

// GET /api/diagnoses/:id — fetch a single stored assessment from the audit trail.
export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const record = await getDiagnosis(id)
    if (!record) {
      return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 })
    }
    return NextResponse.json(record)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
