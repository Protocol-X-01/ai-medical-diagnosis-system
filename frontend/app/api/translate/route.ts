import { NextRequest, NextResponse } from 'next/server'
import { translateTexts, LANGUAGES } from '@/lib/translate'

export const runtime = 'nodejs'
export const maxDuration = 60

// POST /api/translate { texts: string[], lang: 'es'|'zh'|'fr' } -> { translations: string[] }
export async function POST(request: NextRequest) {
  try {
    const { texts, lang } = await request.json()
    if (!Array.isArray(texts) || typeof lang !== 'string') {
      return NextResponse.json({ error: 'Provide texts[] and lang.' }, { status: 400 })
    }
    if (!(lang in LANGUAGES)) {
      return NextResponse.json({ translations: texts }) // unknown/English — passthrough
    }
    const translations = await translateTexts(texts.map(String).slice(0, 40), lang)
    return NextResponse.json({ translations })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
