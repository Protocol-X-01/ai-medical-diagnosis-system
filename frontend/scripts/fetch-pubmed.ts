// Fetches REAL recent literature from PubMed (NCBI E-utilities) for a set of
// clinical topics and writes data/research.json (bundled into the deploy). The
// API key is read from NCBI_API_KEY at run time and never persisted. NCBI allows
// 10 req/s with a key; we stay well under with a delay between calls.
//
//   NCBI_API_KEY=... npm run fetch-pubmed

import { writeFileSync } from 'fs'
import { join } from 'path'

const KEY = process.env.NCBI_API_KEY || ''
const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
const TOOL = 'ai-medical-diagnosis'

const TOPICS: { category: string; query: string }[] = [
  { category: 'Cardiology', query: 'ST-elevation myocardial infarction management' },
  { category: 'Infectious disease', query: 'sepsis early recognition management' },
  { category: 'Respiratory', query: 'community-acquired pneumonia treatment guidelines' },
  { category: 'Endocrinology', query: 'type 2 diabetes management guideline' },
  { category: 'Neurology', query: 'acute ischaemic stroke thrombolysis' },
  { category: 'Dermatology', query: 'melanoma early diagnosis dermoscopy' },
  { category: 'Neurology', query: 'migraine prophylaxis treatment' },
  { category: 'Rare disease', query: 'rare disease diagnostic delay' },
  { category: 'Emergency', query: 'pulmonary embolism diagnosis Wells score' },
  { category: 'Decision support', query: 'clinical decision support artificial intelligence safety' },
]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const withKey = (url: string) => `${url}&tool=${TOOL}${KEY ? `&api_key=${KEY}` : ''}`

interface Article { pmid: string; title: string; authors: string[]; journal: string; year: number | null; doi?: string; url: string }

async function esearch(query: string): Promise<string[]> {
  const url = withKey(`${BASE}/esearch.fcgi?db=pubmed&retmode=json&retmax=6&sort=relevance&term=${encodeURIComponent(query)}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`esearch ${res.status}`)
  const data = await res.json()
  return data?.esearchresult?.idlist || []
}

async function esummary(ids: string[]): Promise<Article[]> {
  if (ids.length === 0) return []
  const url = withKey(`${BASE}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`esummary ${res.status}`)
  const data = await res.json()
  const result = data?.result || {}
  return (result.uids || []).map((uid: string): Article => {
    const r = result[uid] || {}
    const authors = (r.authors || []).map((a: { name: string }) => a.name).filter(Boolean)
    const doiId = (r.articleids || []).find((a: { idtype: string; value: string }) => a.idtype === 'doi')
    const yearMatch = String(r.pubdate || '').match(/\d{4}/)
    return {
      pmid: uid,
      title: String(r.title || '').replace(/\.$/, ''),
      authors: authors.slice(0, 3).concat(authors.length > 3 ? ['et al.'] : []),
      journal: r.fulljournalname || r.source || '',
      year: yearMatch ? Number(yearMatch[0]) : null,
      doi: doiId?.value,
      url: `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
    }
  })
}

async function main() {
  if (!KEY) console.warn('NCBI_API_KEY not set — running without a key (3 req/s limit).')
  const out: { category: string; query: string; articles: Article[] }[] = []
  for (const t of TOPICS) {
    try {
      const ids = await esearch(t.query)
      await sleep(180)
      const articles = await esummary(ids)
      await sleep(180)
      out.push({ category: t.category, query: t.query, articles })
      console.log(`  ${t.query}: ${articles.length} articles`)
    } catch (e) {
      console.warn(`  ${t.query}: FAILED — ${(e as Error).message}`)
      out.push({ category: t.category, query: t.query, articles: [] })
    }
  }
  const total = out.reduce((s, g) => s + g.articles.length, 0)
  const payload = { fetchedAt: new Date().toISOString(), source: 'PubMed (NCBI E-utilities)', total, topics: out }
  const path = join(process.cwd(), 'data', 'research.json')
  writeFileSync(path, JSON.stringify(payload, null, 2))
  console.log(`Wrote ${path} — ${total} real PubMed articles across ${out.length} topics.`)
}

main().catch((e) => { console.error('fetch-pubmed failed:', e?.message || e); process.exit(1) })
