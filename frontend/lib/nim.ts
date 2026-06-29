// Thin client for NVIDIA NIM's OpenAI-compatible chat completions API.
// Used by the quorum service. No SDK dependency — plain fetch, so it runs
// unchanged in Vercel serverless (Node runtime) and in scripts.

const NIM_BASE_URL =
  process.env.NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1'

function getApiKey(): string {
  const key = process.env.NVIDIA_NIM_API_KEY || process.env.NIM_API_KEY
  if (!key) {
    throw new Error(
      'NVIDIA_NIM_API_KEY is not set. Add it to the environment (backend/.env or Vercel project env).'
    )
  }
  return key
}

export interface NimChatOptions {
  model: string
  system?: string
  user: string
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
}

export interface NimChatResult {
  content: string
  model: string
}

/** Strip <think>…</think> blocks emitted by reasoning models (e.g. nemotron-super). */
function stripReasoning(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

export async function nimChat(opts: NimChatOptions): Promise<NimChatResult> {
  const {
    model,
    system,
    user,
    temperature = 0.2,
    maxTokens = 900,
    timeoutMs = 45000,
  } = opts

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${NIM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: user },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`NIM ${model} HTTP ${res.status}: ${body.slice(0, 300)}`)
    }

    const data = await res.json()
    const raw = data?.choices?.[0]?.message?.content ?? ''
    return { content: stripReasoning(String(raw)), model: data?.model || model }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Best-effort JSON extraction from a model response. Models sometimes wrap JSON
 * in prose or ```json fences; we pull the first balanced object.
 */
export function extractJson<T = unknown>(text: string): T | null {
  if (!text) return null
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf('{')
  if (start === -1) return null
  let depth = 0
  for (let i = start; i < candidate.length; i++) {
    if (candidate[i] === '{') depth++
    else if (candidate[i] === '}') {
      depth--
      if (depth === 0) {
        try {
          return JSON.parse(candidate.slice(start, i + 1)) as T
        } catch {
          return null
        }
      }
    }
  }
  return null
}
