'use client'

import { useEffect, useState } from 'react'
import { Activity, BookOpen, CheckCircle2, Gauge, ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Item {
  requestId: string
  diagnosis: string | null
  confidence: number
  reached: boolean
  safe: boolean
  timestamp: string
}
interface Stats {
  totalAssessments: number
  encyclopediaSize: number
  consensusRate: number
  avgConfidence: number
}

const pct = (n: number) => `${Math.round(n * 100)}%`
const fmt = (s: string) => (s ? new Date(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')

export default function Dashboard() {
  const [items, setItems] = useState<Item[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/diagnoses')
      .then((r) => r.json())
      .then((d) => { setItems(d.items || []); setStats(d.stats || null) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    { icon: Activity, label: 'Assessments run', value: stats ? stats.totalAssessments.toLocaleString() : '—', tint: 'bg-teal-50 text-teal-600' },
    { icon: BookOpen, label: 'Encyclopedia conditions', value: stats ? stats.encyclopediaSize.toLocaleString() : '—', tint: 'bg-blue-50 text-blue-600' },
    { icon: CheckCircle2, label: 'Consensus reached', value: stats ? pct(stats.consensusRate) : '—', tint: 'bg-emerald-50 text-emerald-600' },
    { icon: Gauge, label: 'Avg confidence (grounded)', value: stats ? pct(stats.avgConfidence) : '—', tint: 'bg-indigo-50 text-indigo-600' },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500">Live figures from the assessment audit trail.</p>
          </div>
          <Link href="/diagnose" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            New assessment <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${c.tint}`}><c.icon className="h-5 w-5" /></span>
              <div className="text-2xl font-bold text-slate-900">{c.value}</div>
              <div className="text-sm text-slate-500">{c.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <h2 className="font-semibold text-slate-900">Recent assessments</h2>
            <Link href="/diagnoses" className="text-sm font-medium text-blue-600 hover:text-blue-700">View all</Link>
          </div>
          {loading ? (
            <p className="p-8 text-center text-sm text-slate-400">Loading audit trail…</p>
          ) : items.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">No assessments recorded yet.</p>
              <Link href="/diagnose" className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline">Run the first one →</Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((it) => (
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
                    <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 text-sm font-bold text-white">{Math.round(it.confidence * 100)}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Every assessment is written to the DynamoDB audit trail with its grounded sources, votes and safety verdict.
        </p>
      </main>
      <Footer />
    </div>
  )
}
