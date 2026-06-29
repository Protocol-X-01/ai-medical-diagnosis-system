'use client'

import { useEffect, useState } from 'react'
import { Send, Loader2, AlertTriangle, CalendarCheck, Leaf, RotateCcw, ShieldCheck } from 'lucide-react'

interface Triage {
  disposition: 'urgent' | 'book' | 'self-care'
  headline: string
  message: string
  watchFor: string[]
  possibleAreas: string[]
  selfCare: string[]
  disclaimer: string
}

const QUICK = ['Sore throat', 'Headache', 'Itchy rash', 'Cough', 'Earache', 'Back pain']

export default function WidgetPage() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<Triage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [booking, setBooking] = useState('')
  const [clinic, setClinic] = useState('')

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setBooking(p.get('booking') || '')
    setClinic(p.get('clinic') || '')
  }, [])

  const submit = async () => {
    if (!text.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/pre-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setResult(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const theme = {
    urgent: { ring: 'ring-rose-200', bg: 'bg-rose-50', text: 'text-rose-800', icon: AlertTriangle, dot: 'bg-rose-500' },
    book: { ring: 'ring-amber-200', bg: 'bg-amber-50', text: 'text-amber-800', icon: CalendarCheck, dot: 'bg-amber-500' },
    'self-care': { ring: 'ring-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-800', icon: Leaf, dot: 'bg-emerald-500' },
  } as const

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      {/* Compact header */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 text-white"><ShieldCheck className="h-4 w-4" /></span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">{clinic || 'Quick symptom check'}</p>
          <p className="text-[11px] text-slate-400">Helps you decide what to do next</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {!result && (
          <>
            <p className="text-sm text-slate-600">Briefly describe your symptoms. This won’t diagnose you — it helps point you to the right next step.</p>
            <div className="flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button key={q} onClick={() => setText((t) => (t ? `${t}, ${q.toLowerCase()}` : q.toLowerCase()))} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200">{q}</button>
              ))}
            </div>
          </>
        )}

        {result && (
          (() => {
            const t = theme[result.disposition]
            const Icon = t.icon
            return (
              <div className="space-y-4">
                <div className={`rounded-xl ${t.bg} p-4 ring-1 ring-inset ${t.ring}`}>
                  <div className={`flex items-center gap-2 font-semibold ${t.text}`}><Icon className="h-5 w-5" /> {result.headline}</div>
                  <p className="mt-1 text-sm text-slate-700">{result.message}</p>
                </div>

                {result.disposition !== 'urgent' && result.selfCare.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">In the meantime</p>
                    <ul className="space-y-1">
                      {result.selfCare.map((s) => <li key={s} className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />{s}</li>)}
                    </ul>
                  </div>
                )}

                {result.watchFor.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-rose-600">Seek urgent care if you develop</p>
                    <ul className="space-y-1">
                      {result.watchFor.map((s) => <li key={s} className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-400" />{s}</li>)}
                    </ul>
                  </div>
                )}

                {result.possibleAreas.length > 0 && (
                  <p className="text-xs text-slate-400">You might mention to the team: {result.possibleAreas.join(', ')}. (Not a diagnosis.)</p>
                )}

                {booking && result.disposition !== 'urgent' && (
                  <a href={booking} target="_top" className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-blue-600 py-3 text-sm font-semibold text-white hover:from-teal-500 hover:to-blue-500">
                    <CalendarCheck className="h-4 w-4" /> Book an appointment
                  </a>
                )}

                <button onClick={() => { setResult(null); setText('') }} className="flex w-full items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
                  <RotateCcw className="h-3.5 w-3.5" /> Start over
                </button>
                <p className="text-[11px] leading-relaxed text-slate-400">{result.disclaimer}</p>
              </div>
            )
          })()
        )}

        {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      </div>

      {!result && (
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
              rows={2}
              placeholder="e.g. sore throat and a mild fever for two days"
              className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
            />
            <button onClick={submit} disabled={loading || !text.trim()} className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white disabled:opacity-40">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-400">Pre-triage assistant · not a diagnosis · in an emergency call your local emergency number</p>
        </div>
      )}
    </div>
  )
}
