import { NextRequest, NextResponse } from 'next/server'
import { listRecentDiagnoses, conditionCount } from '@/lib/dynamodb'

export const runtime = 'nodejs'
export const maxDuration = 30

// GET /api/diagnoses — recent assessments from the audit trail + summary stats.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50)
    const [{ items, total }, encyclopedia] = await Promise.all([
      listRecentDiagnoses(limit),
      conditionCount(),
    ])
    const reached = items.filter((i) => i.reached)
    const avgConfidence = reached.length
      ? reached.reduce((s, i) => s + i.confidence, 0) / reached.length
      : 0
    return NextResponse.json({
      items,
      stats: {
        totalAssessments: total,
        encyclopediaSize: encyclopedia,
        consensusRate: total ? reached.length / total : 0,
        avgConfidence,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
