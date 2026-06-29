'use client'

import { useState, useEffect } from 'react'
import {
  Plus, X, Loader2, ShieldCheck, ShieldAlert, AlertTriangle, ArrowUpRight,
  Stethoscope, FileText, Gavel, Sparkles, Activity, ImagePlus, Eye,
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import type { DiagnosisResponse } from '@/lib/types'

const EXAMPLES: { label: string; symptoms: string[]; vitals?: Record<string, string>; age?: string; sex?: string }[] = [
  { label: 'Septic patient', symptoms: ['fever', 'rapid heart rate', 'confusion', 'low blood pressure', 'raised lactate'], vitals: { temperature: '39.1C', heartRate: '118', systolicBP: '86' }, age: '60-70' },
  { label: 'Chest pain', symptoms: ['central chest pain', 'sweating', 'radiation to arm', 'elevated troponin'], vitals: { heartRate: '92', systolicBP: '140' }, age: '55-65' },
  { label: 'Breathless + cough', symptoms: ['short of breath', 'productive cough', 'pleuritic chest pain', 'fever'], age: '40-50' },
  { label: 'Burning on urination', symptoms: ['painful urination', 'urinary frequency', 'suprapubic pain'], age: '25-35', sex: 'female' },
]

const pct = (n: number) => `${Math.round(n * 100)}%`
function confColor(c: number) {
  if (c >= 0.8) return 'text-emerald-600'
  if (c >= 0.6) return 'text-amber-600'
  return 'text-rose-600'
}
function barColor(c: number) {
  if (c >= 0.8) return 'bg-emerald-500'
  if (c >= 0.6) return 'bg-amber-500'
  return 'bg-rose-500'
}

function Bar({ value, color }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div className={`h-full rounded-full ${color || 'bg-blue-500'}`} style={{ width: `${Math.max(2, Math.round(value * 100))}%` }} />
    </div>
  )
}

const VOTE_ICONS = [Sparkles, Stethoscope, FileText, Gavel]

export default function DiagnosePage() {
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [current, setCurrent] = useState('')
  const [vitals, setVitals] = useState({ temperature: '', bloodPressure: '', heartRate: '', respiratoryRate: '', oxygenSaturation: '' })
  const [history, setHistory] = useState('')
  const [ageBand, setAgeBand] = useState('')
  const [sex, setSex] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [imageName, setImageName] = useState('')
  const [patientRef, setPatientRef] = useState('')

  // Linked from a patient record (/diagnose?patientRef=...) so the assessment is filed against them.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('patientRef')
    if (ref) setPatientRef(ref)
  }, [])
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<DiagnosisResponse | null>(null)
  const [error, setError] = useState('')

  const addSymptom = (text?: string) => {
    const v = (text ?? current).trim()
    if (v && !symptoms.includes(v)) setSymptoms((s) => [...s, v])
    setCurrent('')
  }
  const removeSymptom = (t: string) => setSymptoms((s) => s.filter((x) => x !== t))

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 6 * 1024 * 1024) { setError('Image must be under 6MB'); setStatus('error'); return }
    const reader = new FileReader()
    reader.onload = () => { setImage(reader.result as string); setImageName(file.name) }
    reader.readAsDataURL(file)
  }

  const loadExample = (ex: (typeof EXAMPLES)[number]) => {
    setSymptoms(ex.symptoms)
    setVitals({ temperature: ex.vitals?.temperature || '', bloodPressure: ex.vitals?.bloodPressure || '', heartRate: ex.vitals?.heartRate || '', respiratoryRate: '', oxygenSaturation: '' })
    setAgeBand(ex.age || '')
    setSex(ex.sex || '')
    setHistory('')
    setImage(null)
    setImageName('')
    setResult(null)
    setStatus('idle')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (symptoms.length === 0) return
    setStatus('loading')
    setResult(null)
    setError('')
    try {
      const vitalSigns = Object.fromEntries(Object.entries(vitals).filter(([, v]) => v.trim()))
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms,
          vitalSigns: Object.keys(vitalSigns).length ? vitalSigns : undefined,
          medicalHistory: history.trim() ? history.split(/[,\n]/).map((s) => s.trim()).filter(Boolean) : undefined,
          ageBand: ageBand || undefined,
          sex: sex || undefined,
          imageDataUrl: image || undefined,
          patientRef: patientRef || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || `Request failed (${res.status})`)
      setResult(await res.json())
      setStatus('done')
    } catch (err) {
      setError((err as Error).message)
      setStatus('error')
    }
  }

  const c = result?.consensus

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">New clinical assessment</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter a de-identified presentation. A multi-model quorum grounds every assessment in verified, cited sources.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* ---- Input ---- */}
          <form onSubmit={submit} className="space-y-5 lg:col-span-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-900">Presenting symptoms</label>
                <span className="text-xs text-slate-400">{symptoms.length} added</span>
              </div>
              <div className="flex gap-2">
                <input
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSymptom())}
                  placeholder="e.g. short of breath — press Enter"
                  className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                />
                <button type="button" onClick={() => addSymptom()} className="rounded-lg bg-slate-900 px-3 text-white transition-colors hover:bg-slate-800" aria-label="Add symptom">
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              {symptoms.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {symptoms.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 py-1 pl-3 pr-1.5 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
                      {s}
                      <button type="button" onClick={() => removeSymptom(s)} className="rounded-full p-0.5 hover:bg-blue-100" aria-label={`Remove ${s}`}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="mb-2 text-xs font-medium text-slate-400">Quick-fill an example</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLES.map((ex) => (
                    <button key={ex.label} type="button" onClick={() => loadExample(ex)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50">
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Vitals &amp; context <span className="font-normal text-slate-400">(optional)</span></h3>
                <button
                  type="button"
                  onClick={() => setVitals({ temperature: '37.0', bloodPressure: '120/80', heartRate: '72', respiratoryRate: '16', oxygenSaturation: '98' })}
                  className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100 hover:bg-emerald-100"
                  title="Fill the normal adult reference values"
                >Normal vitals</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {([['temperature', 'Temp (°C)', '37.0'], ['bloodPressure', 'BP (mmHg)', '120/80'], ['heartRate', 'HR (bpm)', '72'], ['respiratoryRate', 'Resp rate', '16'], ['oxygenSaturation', 'SpO₂ %', '98']] as const).map(([k, lbl, ph]) => (
                  <div key={k}>
                    <label className="mb-1 block text-xs text-slate-500">{lbl}</label>
                    <input value={vitals[k]} onChange={(e) => setVitals({ ...vitals, [k]: e.target.value })} placeholder={ph} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none" />
                  </div>
                ))}
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Age band</label>
                  <input value={ageBand} onChange={(e) => setAgeBand(e.target.value)} placeholder="e.g. 50-60" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none" />
                </div>
              </div>
              <div className="mt-3">
                <label className="mb-1 block text-xs text-slate-500">Relevant history (comma-separated)</label>
                <textarea value={history} onChange={(e) => setHistory(e.target.value)} rows={2} placeholder="e.g. type 2 diabetes, smoker" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none" />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-1 text-sm font-semibold text-slate-900">Image <span className="font-normal text-slate-400">(optional)</span></h3>
              <p className="mb-3 text-xs text-slate-500">A vision model extracts <em>visible features</em> (e.g. lesion shape, erythema) and adds them to the case. Assistive only — not a diagnostic imaging read.</p>
              {image ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="upload preview" className="h-16 w-16 rounded-lg object-cover ring-1 ring-slate-200" />
                  <span className="flex-1 truncate text-sm text-slate-600">{imageName}</span>
                  <button type="button" onClick={() => { setImage(null); setImageName('') }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Remove image"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500 transition-colors hover:border-blue-400 hover:bg-blue-50/40">
                  <ImagePlus className="h-5 w-5" /> Upload an image (JPG/PNG, &lt; 6MB)
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onImage} />
                </label>
              )}
            </section>

            <button
              type="submit"
              disabled={status === 'loading' || (symptoms.length === 0 && !image)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 py-3.5 font-semibold text-white shadow-sm transition-all hover:from-teal-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === 'loading' ? <><Loader2 className="h-5 w-5 animate-spin" /> Consulting the quorum…</> : <>Run quorum assessment <ArrowUpRight className="h-4 w-4" /></>}
            </button>
            <p className="text-center text-xs text-slate-400">De-identified inputs only. Decision support — not a diagnosis.</p>
          </form>

          {/* ---- Results ---- */}
          <div className="lg:col-span-3">
            {status === 'idle' && <EmptyState />}
            {status === 'loading' && <LoadingState />}
            {status === 'error' && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
                <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-5 w-5" /> Something went wrong</div>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            )}

            {status === 'done' && result && c && (
              <div className="space-y-5">
                {!c.reached ? (
                  <section className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
                    <div className="border-b border-amber-100 bg-amber-50 p-6">
                      <div className="flex items-center gap-2 font-semibold text-amber-800"><AlertTriangle className="h-5 w-5" /> Ambiguous presentation — ranked options</div>
                      <p className="mt-1 text-sm text-amber-700">
                        No single condition dominates. Rather than over-commit, here are the most likely grounded possibilities for clinician review.
                      </p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {(c.differentials.length ? c.differentials.map((d) => ({ name: d.diagnosis, icd10: d.icd10, w: d.weight })) : result.groundedConditions.map((g) => ({ name: g.name, icd10: g.icd10Code, w: g.matchStrength }))).slice(0, 6).map((o, i) => (
                        <div key={o.name + i} className="flex items-center justify-between gap-3 px-6 py-3">
                          <span className="text-sm font-medium text-slate-800">{i + 1}. {o.name}{o.icd10 && !o.icd10.includes(':') ? ` (${o.icd10})` : ''}</span>
                          <div className="flex w-32 items-center gap-2">
                            <Bar value={o.w} color="bg-amber-500" /><span className="w-9 text-right text-xs text-slate-400">{pct(o.w)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : (
                  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Quorum consensus</p>
                          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{c.diagnosis}</h2>
                          <p className="mt-0.5 text-sm text-slate-500">ICD-10 {c.icd10} · agreement {c.agreement} · weighted share {pct(c.topWeightShare)}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${confColor(c.confidence)}`}>{pct(c.confidence)}</div>
                          <div className="text-xs text-slate-400">confidence</div>
                        </div>
                      </div>
                      <div className="mt-4"><Bar value={c.confidence} color={barColor(c.confidence)} /></div>
                    </div>

                    {result.escalation.triggered && (
                      <div className="flex items-start gap-2.5 border-b border-slate-100 bg-indigo-50 px-6 py-3 text-sm text-indigo-800">
                        <Gavel className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span><strong>Escalated to senior adjudicator</strong> — {result.escalation.reason}. {result.escalation.changedOutcome ? 'The adjudicator changed the leading conclusion.' : 'The adjudicator confirmed the consensus.'}</span>
                      </div>
                    )}

                    {c.contested && c.closeContenders && c.closeContenders.length > 0 && (
                      <div className="flex items-start gap-2.5 border-b border-slate-100 bg-amber-50 px-6 py-3 text-sm text-amber-800">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span><strong>Close call</strong> — the models nearly split. Keep {c.closeContenders.map((cc, i) => <span key={cc.diagnosis}>{i > 0 ? ' and ' : ''}<strong>{cc.diagnosis}</strong> ({pct(cc.weight)})</span>)} in mind as {c.closeContenders.length > 1 ? 'differentials' : 'a differential'}.</span>
                      </div>
                    )}

                    <div className={`flex items-center gap-2.5 px-6 py-3 text-sm ${result.safety.safe ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {result.safety.safe ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                      {result.safety.safe ? 'Passed independent safety screening' : 'Flagged by safety screening'}
                      {result.safety.flags.length > 0 && <span className="text-slate-400">· {result.safety.flags.join(', ')}</span>}
                    </div>
                  </section>
                )}

                {/* Visual findings from image */}
                {result.visualFindings && result.visualFindings.length > 0 && (
                  <section className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-sm">
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-indigo-900"><Eye className="h-4 w-4" /> Visual findings from image</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.visualFindings.map((f) => (
                        <span key={f} className="rounded-lg bg-white px-2.5 py-1 text-sm text-indigo-800 ring-1 ring-inset ring-indigo-100">{f}</span>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-indigo-500">Extracted visible features, fed into the assessment as additional input. Not a diagnostic imaging read.</p>
                  </section>
                )}

                {/* Visual differential — look-alike conditions with reference images */}
                {result.groundedConditions.some((g) => g.imageUrl) && (
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900"><Eye className="h-4 w-4 text-indigo-500" /> Visual differential</h3>
                    <p className="mb-4 text-xs text-slate-500">Look-alike conditions for side-by-side comparison. Reference images are illustrative (open-licensed, Wikimedia) — confirm clinically.</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {image && (
                        <figure className="overflow-hidden rounded-xl ring-2 ring-blue-500">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image} alt="uploaded" className="h-28 w-full object-cover" />
                          <figcaption className="bg-blue-500 px-2 py-1 text-center text-xs font-medium text-white">Uploaded image</figcaption>
                        </figure>
                      )}
                      {result.groundedConditions.filter((g) => g.imageUrl).slice(0, 8).map((g) => (
                        <figure key={g.conditionId} className="overflow-hidden rounded-xl ring-1 ring-slate-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={g.imageUrl} alt={g.name} loading="lazy" className="h-28 w-full bg-slate-100 object-cover" />
                          <figcaption className="px-2 py-1.5">
                            <p className="truncate text-xs font-medium text-slate-800">{g.name}</p>
                            <p className="text-[11px] text-slate-400">match {pct(g.matchStrength)}</p>
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  </section>
                )}

                {/* Suggested management */}
                {result.recommendations && (result.recommendations.treatments.length > 0 || result.recommendations.redFlags.length > 0) && (
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">Suggested management</h3>
                    {result.recommendations.treatments.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-600"><Stethoscope className="h-3.5 w-3.5" /> First-line considerations</p>
                        <div className="flex flex-wrap gap-2">
                          {result.recommendations.treatments.map((t) => (
                            <span key={t} className="rounded-lg bg-teal-50 px-2.5 py-1 text-sm text-teal-800 ring-1 ring-inset ring-teal-100">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.recommendations.redFlags.length > 0 && (
                      <div>
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-600"><AlertTriangle className="h-3.5 w-3.5" /> Escalate immediately if</p>
                        <ul className="space-y-1">
                          {result.recommendations.redFlags.map((r) => (
                            <li key={r} className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-400" />{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="mt-4 text-xs text-slate-400">Guideline-derived for the consensus condition. Verify against current local protocols before any clinical action.</p>
                  </section>
                )}

                {/* Model votes */}
                {result.votes.length > 0 && (
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-slate-900">Independent model votes</h3>
                    <div className="space-y-3">
                      {result.votes.map((v, i) => {
                        const Icon = VOTE_ICONS[i % VOTE_ICONS.length]
                        return (
                          <div key={v.model + i} className="flex items-center gap-3">
                            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Icon className="h-4 w-4" /></span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-medium text-slate-800">{v.agent}</p>
                                <span className={`text-xs font-semibold ${v.insufficientEvidence ? 'text-slate-400' : confColor(v.confidence)}`}>{v.insufficientEvidence ? 'abstained' : pct(v.confidence)}</span>
                              </div>
                              <p className="truncate text-xs text-slate-500">{v.insufficientEvidence ? 'insufficient grounded evidence' : `${v.diagnosis} (${v.icd10})`}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}

                {/* Grounded candidates */}
                {result.groundedConditions.length > 0 && (
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">Grounded candidates <span className="font-normal text-slate-400">(retrieval match strength)</span></h3>
                    <div className="space-y-2.5">
                      {result.groundedConditions.map((g) => (
                        <div key={g.conditionId} className="flex items-center gap-3">
                          <span className="w-44 truncate text-sm text-slate-700">{g.name}</span>
                          <div className="flex-1"><Bar value={g.matchStrength} color="bg-teal-500" /></div>
                          <span className="w-10 text-right text-xs text-slate-400">{pct(g.matchStrength)}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Citations */}
                {result.citations.length > 0 && (
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">Verified sources ({result.citations.length})</h3>
                    <div className="space-y-2.5">
                      {result.citations.map((cit) => (
                        <a key={cit.id} href={cit.url} target="_blank" rel="noopener noreferrer" className="group flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 transition-colors hover:border-blue-200 hover:bg-blue-50/50">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 group-hover:text-blue-700">{cit.title}</p>
                            <p className="text-xs text-slate-500">{cit.source}{cit.identifier ? ` · ${cit.identifier}` : ''}{cit.year ? ` · ${cit.year}` : ''}</p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-blue-600" />
                        </a>
                      ))}
                    </div>
                  </section>
                )}

                {/* Differentials */}
                {c?.differentials && c.differentials.length > 1 && (
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">Differential considerations</h3>
                    <div className="flex flex-wrap gap-2">
                      {c.differentials.slice(1).map((d) => {
                        const img = result.groundedConditions.find((g) => g.imageUrl && (g.name.toLowerCase() === d.diagnosis.toLowerCase() || g.icd10Code === d.icd10))?.imageUrl
                        return (
                          <span key={d.diagnosis} className="inline-flex items-center gap-2 rounded-lg bg-slate-100 py-1 pl-1 pr-2.5 text-xs text-slate-600">
                            {img
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={img} alt="" loading="lazy" className="h-6 w-6 rounded object-cover" />
                              : <span className="ml-1.5" />}
                            {d.diagnosis}{d.icd10 ? ` (${d.icd10})` : ''} · {pct(d.weight)}
                          </span>
                        )
                      })}
                    </div>
                  </section>
                )}

                <p className="rounded-xl bg-slate-100 p-4 text-xs leading-relaxed text-slate-500">{result.disclaimer}</p>
                <p className="text-center text-[11px] text-slate-400">
                  {result.metadata.modelsConsulted.length} models · {result.metadata.processingTimeMs} ms · grounding: {result.metadata.groundingSource || 'dynamodb'} · {result.requestId}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 text-white shadow-sm"><Activity className="h-7 w-7" /></span>
      <h3 className="mt-4 text-base font-semibold text-slate-800">Awaiting a presentation</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">Add symptoms (or quick-fill an example) and run the assessment. Three independent models vote, ground in verified sources, and reach weighted consensus.</p>
    </div>
  )
}

function LoadingState() {
  const steps = ['Retrieving grounded candidates from DynamoDB', 'Nemotron-3 Super 120B voting', 'Llama 3.3 70B voting', 'Mistral Nemotron voting', 'Weighing consensus & screening safety']
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 font-semibold text-slate-800"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /> Running the quorum</div>
      <div className="mt-4 space-y-3">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-3 text-sm text-slate-500" style={{ animationDelay: `${i * 120}ms` }}>
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" /> {s}
          </div>
        ))}
      </div>
    </div>
  )
}
