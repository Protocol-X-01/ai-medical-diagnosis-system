'use client'

import { useMemo, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Search, ExternalLink, BookOpen, FlaskConical } from 'lucide-react'
import researchData from '@/data/research.json'

interface Article { pmid: string; title: string; authors: string[]; journal: string; year: number | null; doi?: string; url: string }
interface Topic { category: string; query: string; articles: Article[] }

const data = researchData as { fetchedAt: string; source: string; total: number; topics: Topic[] }

function ArticleCard({ a }: { a: Article }) {
  return (
    <a href={a.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/30">
      <p className="font-medium text-slate-900">{a.title}</p>
      <p className="mt-1 text-sm text-slate-500">{a.authors.join(', ')}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        {a.journal && <span className="rounded bg-slate-100 px-2 py-0.5 italic text-slate-600">{a.journal}</span>}
        {a.year && <span className="text-slate-400">{a.year}</span>}
        <span className="ml-auto inline-flex items-center gap-1 font-mono text-blue-600">PMID {a.pmid} <ExternalLink className="h-3 w-3" /></span>
      </div>
    </a>
  )
}

export default function ResearchPage() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')

  const categories = useMemo(() => ['All', ...Array.from(new Set(data.topics.map((t) => t.category)))], [])

  const term = q.trim().toLowerCase()
  const visibleTopics = useMemo(
    () =>
      data.topics
        .filter((t) => cat === 'All' || t.category === cat)
        .map((t) => ({
          ...t,
          articles: term
            ? t.articles.filter((a) => a.title.toLowerCase().includes(term) || a.journal.toLowerCase().includes(term) || a.authors.join(' ').toLowerCase().includes(term))
            : t.articles,
        }))
        .filter((t) => t.articles.length > 0),
    [cat, term]
  )

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-100">
          <FlaskConical className="h-3.5 w-3.5" /> Evidence base
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Research &amp; literature</h1>
        <p className="mt-1 max-w-2xl text-slate-600">
          {data.total} peer-reviewed records pulled live from <strong>PubMed (NCBI)</strong>, across the
          conditions our knowledge base tracks. Built to the depth a clinician or medical student would
          expect — every record links to the source. The diagnostic engine itself cites curated clinical
          guidelines; this library reflects the current literature behind them.
        </p>
        <p className="mt-1 text-xs text-slate-400">Source: {data.source} · last refreshed {new Date(data.fetchedAt).toLocaleDateString()}</p>

        <div className="sticky top-2 z-10 mt-6">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Search className="h-5 w-5 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles, journals, authors…" className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none" />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1 text-xs ring-1 ring-inset transition-colors ${cat === c ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-100'}`}>{c}</button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-8">
          {visibleTopics.map((t) => (
            <section key={t.query}>
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-slate-400" />
                <h2 className="text-lg font-semibold capitalize text-slate-900">{t.query}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{t.category}</span>
              </div>
              <div className="space-y-2.5">
                {t.articles.map((a) => <ArticleCard key={a.pmid} a={a} />)}
              </div>
            </section>
          ))}
          {visibleTopics.length === 0 && <p className="py-12 text-center text-slate-400">No articles match “{q}”.</p>}
        </div>
      </main>
      <Footer />
    </div>
  )
}
