// Pings every hand-authored citation URL (NICE CKS, DermNet, Wikipedia, guideline
// domains) and reports any that don't resolve, with the conditions that use them.
// Templated ontology URLs (omim/orphanet/medlineplus/decipher) are validated by a
// small sample, not exhaustively (they're generated from real IDs).
//
//   npm run check-citations

import conditions from '../data/conditions.json'
import type { ConditionEntry } from '../lib/types'

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

const AUTHORED_HOSTS = new Set([
  'cks.nice.org.uk', 'dermnetnz.org', 'en.wikipedia.org', 'www.nice.org.uk',
  'academic.oup.com', 'diabetesjournals.org', 'jamanetwork.com', 'www.sccm.org',
  'kdigo.org', 'journals.lww.com', 'ginasthma.org', 'www.brit-thoracic.org.uk',
  'goldcopd.org', 'www.atsjournals.org', 'www.ahajournals.org',
])
const SAMPLE_HOSTS = new Set(['omim.org', 'www.orpha.net', 'medlineplus.gov', 'www.deciphergenomics.org'])

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function ping(url: string): Promise<number> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 20000)
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA } })
    return res.status
  } catch {
    return 0
  } finally {
    clearTimeout(t)
  }
}

async function main() {
  const data = conditions as unknown as ConditionEntry[]
  const usedBy = new Map<string, string[]>() // url -> conditionIds
  for (const c of data) for (const ci of c.citations || []) {
    if (!ci.url) continue
    if (!usedBy.has(ci.url)) usedBy.set(ci.url, [])
    usedBy.get(ci.url)!.push(c.conditionId)
  }

  const authored: string[] = []
  const samples: Record<string, string[]> = {}
  for (const url of usedBy.keys()) {
    let host = ''
    try { host = new URL(url).host } catch { continue }
    if (AUTHORED_HOSTS.has(host)) authored.push(url)
    else if (SAMPLE_HOSTS.has(host)) { (samples[host] ||= []).push(url) }
  }

  console.log(`Checking ${authored.length} hand-authored URLs…\n`)
  const broken: { url: string; status: number; ids: string[] }[] = []
  for (let i = 0; i < authored.length; i += 6) {
    const batch = authored.slice(i, i + 6)
    const results = await Promise.all(batch.map(async (u) => ({ u, s: await ping(u) })))
    for (const { u, s } of results) {
      if (s === 404 || s === 0 || s >= 500) broken.push({ url: u, status: s, ids: usedBy.get(u)! })
    }
    await sleep(250)
  }

  console.log('=== BROKEN (404 / unreachable / 5xx) ===')
  if (broken.length === 0) console.log('  none 🎉')
  for (const b of broken.sort((a, b) => a.url.localeCompare(b.url))) {
    console.log(`  [${b.status}] ${b.url}  -> ${b.ids.join(', ')}`)
  }

  console.log('\n=== SAMPLE of templated ontology URLs (1 per host) ===')
  for (const [host, urls] of Object.entries(samples)) {
    const s = await ping(urls[0])
    console.log(`  [${s}] ${urls[0]}  (host total: ${urls.length})`)
    await sleep(250)
  }
  console.log(`\nDone. ${broken.length} broken of ${authored.length} authored URLs.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
