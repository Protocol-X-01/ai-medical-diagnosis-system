'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { CheckCircle2, Loader2, ShieldCheck, ArrowRight } from 'lucide-react'

const INCLUDED = [
  'Unlimited assessments during trial',
  'Citation-grounded encyclopedia (11,000+ conditions)',
  '3-model quorum (2-of-3 consensus)',
  'Visual differential + treatments & red flags',
  'Staff encyclopedia lookup + embeddable pre-triage widget',
  'Full API access',
]

export default function SignupPage() {
  const [form, setForm] = useState({ organization: '', email: '', name: '' })
  const [agreed, setAgreed] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email.trim() || !agreed) return
    setStatus('saving'); setError('')
    try {
      const res = await fetch('/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Something went wrong')
      setStatus('done')
    } catch (err) {
      setError((err as Error).message); setStatus('error')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white">
      <Header />
      <main className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 gap-10 px-4 py-12 md:grid-cols-2">
        {/* Left: value */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Start a 30-day trial</h1>
          <p className="mt-2 text-slate-600">Tell us about your practice and we&apos;ll set you up. No card required.</p>
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-6">
            <h2 className="mb-3 font-bold text-blue-900">What&apos;s included</h2>
            <ul className="space-y-2 text-sm text-blue-800">
              {INCLUDED.map((i) => <li key={i} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />{i}</li>)}
            </ul>
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-slate-500"><ShieldCheck className="h-4 w-4 text-teal-600" /> HIPAA-aligned design · de-identified inputs · certification on the roadmap</p>
        </div>

        {/* Right: form / success */}
        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-xl">
          {status === 'done' ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-7 w-7" /></span>
              <h2 className="text-xl font-bold text-slate-900">Request received</h2>
              <p className="mt-1 text-sm text-slate-600">Thanks{form.name ? `, ${form.name}` : ''} — we&apos;ve logged your request and will be in touch at <strong>{form.email}</strong> to provision access.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Request access</h2>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-900">Organization</label>
                <input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} placeholder="Your hospital or clinic" className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-900">Work email *</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@clinic.com" className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-900">Full name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Jane Smith" className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500" />
              </div>
              <label className="flex items-start gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" />
                <span>I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms</a> and <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.</span>
              </label>
              {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
              <button type="submit" disabled={status === 'saving' || !form.email.trim() || !agreed} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-blue-600 py-3.5 font-semibold text-white hover:from-teal-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
                {status === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Request access <ArrowRight className="h-4 w-4" /></>}
              </button>
              <p className="text-center text-xs text-slate-400">No payment required. We provision accounts manually during the pilot.</p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
