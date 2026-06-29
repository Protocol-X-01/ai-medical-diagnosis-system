// Image feature-extraction via an NVIDIA NIM vision model. This does NOT make a
// diagnostic imaging read (a general VLM is not a validated radiology/dermatology
// device). It extracts *visible clinical features* from an uploaded image, which
// are then fed into the grounded quorum as additional case input — exactly like
// typed symptoms. Honest framing: assistive feature extraction, not diagnosis.

const NIM_BASE_URL = process.env.NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1'
export const VISION_MODEL = process.env.NIM_VISION_MODEL || 'meta/llama-3.2-11b-vision-instruct'

function getApiKey(): string {
  const key = process.env.NVIDIA_NIM_API_KEY || process.env.NIM_API_KEY
  if (!key) throw new Error('NVIDIA_NIM_API_KEY is not set.')
  return key
}

const PROMPT =
  'You are assisting a clinician by describing only what is directly VISIBLE in this ' +
  'medical image. List concrete visual findings (e.g. "asymmetric pigmented lesion", ' +
  '"irregular border", "erythema", "swelling", "consolidation"). Do NOT diagnose, name a ' +
  'disease, or speculate. Respond ONLY with JSON: {"findings": string[], "note": string}.'

export interface VisionResult {
  ok: boolean
  findings: string[]
  note: string
}

/** dataUrl: a "data:image/...;base64,..." string. */
export async function describeImage(dataUrl: string, timeoutMs = 45000): Promise<VisionResult> {
  if (!/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(dataUrl)) {
    return { ok: false, findings: [], note: 'Unsupported image payload.' }
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${NIM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getApiKey()}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: PROMPT },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { ok: false, findings: [], note: `Vision model HTTP ${res.status}: ${body.slice(0, 160)}` }
    }
    const data = await res.json()
    const raw = String(data?.choices?.[0]?.message?.content ?? '')
    const m = raw.match(/\{[\s\S]*\}/)
    if (m) {
      try {
        const parsed = JSON.parse(m[0]) as Partial<VisionResult>
        const findings = Array.isArray(parsed.findings) ? parsed.findings.map(String).slice(0, 10) : []
        return { ok: findings.length > 0, findings, note: String(parsed.note || '') }
      } catch {
        /* fall through to text fallback */
      }
    }
    // Fallback: treat the free text as a single finding line.
    const text = raw.replace(/\s+/g, ' ').trim().slice(0, 240)
    return { ok: text.length > 0, findings: text ? [text] : [], note: 'unstructured' }
  } catch (err) {
    return { ok: false, findings: [], note: `Vision error: ${(err as Error).message}` }
  } finally {
    clearTimeout(timer)
  }
}
