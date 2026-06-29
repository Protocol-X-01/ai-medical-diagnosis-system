'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Loader2, ShieldCheck, ShieldAlert, AlertTriangle, Stethoscope, ExternalLink, ArrowLeft } from 'lucide-react'
import type { DiagnosisResponse } from '@/lib/types'

const pct = (n: number) => `${Math.round(n * 100)}%`

export default function DiagnosisDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [data, setData] = useState<DiagnosisResponse | null>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading')

  useEffect(() => {
    if (!id) return
    fetch(`/api/diagnoses/${id}`)
      .then(async (r) => {
        if (r.status === 404) { setStatus('notfound'); return }
        if (!r.ok) { setStatus('error'); return }
        setData(await r.json()); setStatus('ok')
      })
      .catch(() => setStatus('error'))
  }, [id])

  const c = data?.consensus

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link href="/diagnoses" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> All assessments
        </Link>

        {status === 'loading' && (
          <div className="flex items-center gap-2 py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /> Loading assessment…</div>
        )}
        {status === 'notfound' && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Assessment <span className="font-mono text-xs">{id}</span> was not found in the audit trail.</div>
        )}
        {status === 'error' && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-600">Could not load this assessment.</div>
        )}

        {status === 'ok' && data && c && (
          <div className="space-y-5">
            <div>
              <p className="font-mono text-xs text-slate-400">{data.requestId}</p>
              <p className="text-xs text-slate-400">{data.metadata?.timestamp ? new Date(data.metadata.timestamp).toLocaleString() : ''}</p>
            </div>

            {/* Consensus */}
            {c.reached ? (
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">Consensus</p>
                    <h1 className="text-2xl font-bold text-slate-900">{c.diagnosis}</h1>
                    <p className="text-sm text-slate-500">{c.icd10} · agreement {c.agreement}</p>
                  </div>
                  <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 text-xl font-bold text-white">{Math.round(c.confidence * 100)}</span>
                </div>
                <div className="flex gap-6 p-6 text-sm text-slate-600">
                  <span>Weighted share <strong className="text-slate-900">{pct(c.topWeightShare)}</strong></span>
                  <span>Margin <strong className="text-slate-900">{pct(c.margin)}</strong></span>
                  <span className={`ml-auto inline-flex items-center gap-1.5 ${data.safety?.safe ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {data.safety?.safe ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />} {data.safety?.safe ? 'Safety passed' : 'Safety flagged'}
                  </span>
                </div>
              </section>
            ) : (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <div className="flex items-center gap-2 font-semibold text-amber-800"><AlertTriangle className="h-5 w-5" /> Ranked options (no single consensus)</div>
                <div className="mt-3 space-y-1">
                  {c.differentials.map((d, i) => (
                    <p key={d.diagnosis + i} className="text-sm text-slate-700">{i + 1}. {d.diagnosis}{d.icd10 ? ` (${d.icd10})` : ''} · {pct(d.weight)}</p>
                  ))}
                </div>
              </section>
            )}

            {/* Recommendations */}
            {data.recommendations && (data.recommendations.treatments.length > 0 || data.recommendations.redFlags.length > 0) && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Suggested management</h3>
                {data.recommendations.treatments.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {data.recommendations.treatments.map((t) => <span key={t} className="rounded-lg bg-teal-50 px-2.5 py-1 text-sm text-teal-800"><Stethoscope className="mr-1 inline h-3.5 w-3.5" />{t}</span>)}
                  </div>
                )}
                {data.recommendations.redFlags.length > 0 && (
                  <ul className="space-y-1">
                    {data.recommendations.redFlags.map((r) => <li key={r} className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-400" />{r}</li>)}
                  </ul>
                )}
              </section>
            )}

            {/* Votes */}
            {data.votes?.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Independent model votes</h3>
                <div className="space-y-2">
                  {data.votes.map((v, i) => (
                    <div key={v.model + i} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate text-slate-700">{v.agent}</span>
                      <span className="truncate text-slate-500">{v.insufficientEvidence ? 'abstained' : `${v.diagnosis} (${v.icd10})`}</span>
                      <span className="w-10 text-right text-xs text-slate-400">{v.insufficientEvidence ? '—' : pct(v.confidence)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Citations */}
            {data.citations?.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Sources</h3>
                <ul className="space-y-1.5">
                  {data.citations.map((ci) => (
                    <li key={ci.id}>
                      <a href={ci.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                        {ci.source}: {ci.title} <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <p className="rounded-xl bg-slate-100 p-4 text-xs leading-relaxed text-slate-500">{data.disclaimer}</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
