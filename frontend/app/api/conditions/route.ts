import { NextRequest, NextResponse } from 'next/server'
import { searchConditions, conditionCount } from '@/lib/dynamodb'

export const runtime = 'nodejs'
export const maxDuration = 30

// GET /api/conditions?q=psoriasis&limit=40
// Free-text encyclopedia lookup for front-desk staff. Returns verified entries
// with citations, symptoms, treatments and (where available) a reference image.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const limit = Math.min(Number(searchParams.get('limit')) || 40, 60)
    const [results, total] = await Promise.all([searchConditions(q, limit), conditionCount()])
    return NextResponse.json({
      query: q,
      total,
      count: results.length,
      results: results.map((c) => ({
        conditionId: c.conditionId,
        name: c.name,
        icd10Code: c.icd10Code,
        category: c.category,
        source: c.source || 'curated',
        symptoms: c.symptoms?.slice(0, 12) || [],
        treatments: c.treatments?.slice(0, 8) || [],
        redFlags: c.redFlags?.slice(0, 6) || [],
        citations: c.citations || [],
        imageUrl: c.imageUrl,
        pathophysiology: c.pathophysiology,
        investigations: c.investigations || [],
        keyPoints: c.keyPoints || [],
      })),
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
