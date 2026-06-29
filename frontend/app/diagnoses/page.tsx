'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Search, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react'

interface Item {
  requestId: string
  diagnosis: string | null
  confidence: number
  reached: boolean
  safe: boolean
  timestamp: string
}

const fmt = (s: string) => (s ? new Date(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')

export default function DiagnosesPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    fetch('/api/diagnoses?limit=50')
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return items
    return items.filter((i) => (i.diagnosis || 'ranked options').toLowerCase().includes(term) || i.requestId.toLowerCase().includes(term))
  }, [items, q])

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">Assessments</h1>
          <p className="text-sm text-slate-500">Every assessment recorded in the DynamoDB audit trail.</p>
        </div>

        <div className="mb-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Search className="h-5 w-5 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by condition or request id…" className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none" />
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <p className="flex items-center justify-center gap-2 p-10 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading audit trail…</p>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              {items.length === 0 ? 'No assessments recorded yet.' : `No assessments match “${q}”.`}
              {items.length === 0 && <Link href="/diagnose" className="mt-2 block text-blue-600 hover:underline">Run the first one →</Link>}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((it) => (
                <Link key={it.requestId} href={`/diagnosis/${it.requestId}`} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                  <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${it.safe ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {it.safe ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{it.reached ? it.diagnosis : 'Ranked options (no single consensus)'}</p>
                    <p className="truncate font-mono text-xs text-slate-400">{it.requestId}</p>
                  </div>
                  <span className="hidden text-xs text-slate-400 sm:block">{fmt(it.timestamp)}</span>
                  {it.reached && (
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 text-sm font-bold text-white">{Math.round(it.confidence * 100)}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
