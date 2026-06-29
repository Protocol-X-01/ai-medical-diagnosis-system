// Translation via NVIDIA NIM riva-translate-4b-instruct. Used to make the
// patient-facing pre-triage widget multilingual (the NY population is heavily
// bi/tri-lingual — Spanish and Chinese are priorities, French a plus).

import { nimChat } from './nim'

export const TRANSLATE_MODEL = process.env.NIM_TRANSLATE_MODEL || 'nvidia/riva-translate-4b-instruct-v1.1'

export const LANGUAGES = {
  es: 'Spanish',
  zh: 'Chinese (Simplified)',
  fr: 'French',
} as const

export type LangCode = keyof typeof LANGUAGES

/**
 * Translate a batch of short strings into the target language in a single call.
 * Uses numbered lines to preserve alignment; falls back to the original string
 * for any line that can't be matched (safe: never drops content).
 */
export async function translateTexts(texts: string[], lang: string): Promise<string[]> {
  const label = LANGUAGES[lang as LangCode]
  if (!label) return texts
  return translateToLabel(texts, label)
}

/**
 * Translate into an explicit target language label (e.g. "English", "Spanish").
 * riva-translate is a pure translation model — it translates ANY text it's given,
 * including instructions — so we translate one string at a time (a short directive
 * + the text), in small concurrent chunks. Any failure falls back to the original.
 */
export async function translateToLabel(texts: string[], label: string): Promise<string[]> {
  if (!label || texts.length === 0) return texts

  const one = async (text: string): Promise<string> => {
    if (!text || !text.trim()) return text
    try {
      const { content } = await nimChat({
        model: TRANSLATE_MODEL,
        user: `Translate the following text to ${label}. Output only the translation, with no quotes or notes.\n\n${text}`,
        temperature: 0,
        maxTokens: 400,
        timeoutMs: 60000,
      })
      const out = content.trim().replace(/^["']|["']$/g, '').trim()
      return out || text
    } catch {
      return text
    }
  }

  const out: string[] = []
  for (let i = 0; i < texts.length; i += 5) {
    out.push(...(await Promise.all(texts.slice(i, i + 5).map(one))))
  }
  return out
}
