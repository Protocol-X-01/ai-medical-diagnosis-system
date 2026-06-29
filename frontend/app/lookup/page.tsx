'use client'

import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Search, Loader2, BookOpen, ExternalLink, Stethoscope, AlertTriangle } from 'lucide-react'

interface Condition {
  conditionId: string
  name: string
  icd10Code: string
  category: string
  source: string
  symptoms: string[]
  treatments: string[]
  redFlags: string[]
  citations: { id: string; title: string; source: string; url: string }[]
  imageUrl?: string
}

const SOURCE_LABEL: Record<string, string> = {
  curated: 'Guideline-cited',
  visual: 'Visual / dermatology',
  hpo: 'Rare disease (HPO)',
  medlineplus: 'NIH MedlinePlus',
}

const EXAMPLES = ['psoriasis', 'chest pain', 'itchy rash', 'meningitis', 'fever', 'asymmetric mole']

export default function LookupPage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Condition[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState<string | null>(null)

  const run = useCallback(async (query: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/conditions?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.results || [])
      setTotal(data.total ?? null)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search.
  useEffect(() => {
    const t = setTimeout(() => run(q), q ? 250 : 0)
    return () => clearTimeout(t)
  }, [q, run])

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <div className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-100">
            <BookOpen className="h-3.5 w-3.5" /> Staff encyclopedia
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Condition lookup</h1>
          <p className="mt-1 text-slate-600">
            Search {total ? `${total.toLocaleString()} ` : ''}verified conditions by name, ICD-10 or symptom — for staff to reference at the point of contact. Every entry is source-cited.
          </p>
        </div>

        <div className="sticky top-2 z-10 mb-5">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. psoriasis, R07.9, itchy rash…"
              className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => setQ(ex)} className="rounded-full bg-white px-3 py-1 text-xs text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-100">{ex}</button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {results.map((c) => {
            const isOpen = open === c.conditionId
            return (
              <div key={c.conditionId} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <button onClick={() => setOpen(isOpen ? null : c.conditionId)} className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50">
                  {c.imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={c.imageUrl} alt={c.name} loading="lazy" className="h-12 w-12 flex-shrink-0 rounded-lg object-cover ring-1 ring-slate-200" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{c.name}</p>
                    <p className="truncate text-xs text-slate-500">{c.icd10Code} · {c.category}</p>
                  </div>
                  <span className="hidden flex-shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 sm:inline">{SOURCE_LABEL[c.source] || c.source}</span>
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 p-4">
                    {c.imageUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={c.imageUrl} alt={c.name} className="mb-4 max-h-56 rounded-lg object-contain ring-1 ring-slate-200" />
                    )}
                    {c.symptoms.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Symptoms</p>
                        <div className="flex flex-wrap gap-1.5">
                          {c.symptoms.map((s) => <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-sm text-slate-700">{s}</span>)}
                        </div>
                      </div>
                    )}
                    {c.treatments.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-teal-600"><Stethoscope className="h-3.5 w-3.5" /> Management</p>
                        <div className="flex flex-wrap gap-1.5">
                          {c.treatments.map((t) => <span key={t} className="rounded-md bg-teal-50 px-2 py-0.5 text-sm text-teal-800">{t}</span>)}
                        </div>
                      </div>
                    )}
                    {c.redFlags.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-rose-600"><AlertTriangle className="h-3.5 w-3.5" /> Red flags</p>
                        <ul className="space-y-0.5">
                          {c.redFlags.map((r) => <li key={r} className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-400" />{r}</li>)}
                        </ul>
                      </div>
                    )}
                    {c.citations.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Sources</p>
                        <ul className="space-y-1">
                          {c.citations.map((ci) => (
                            <li key={ci.id}>
                              <a href={ci.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                                {ci.source}: {ci.title} <ExternalLink className="h-3 w-3" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {!loading && results.length === 0 && (
            <p className="py-12 text-center text-slate-400">No conditions match “{q}”. Try a different term.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
