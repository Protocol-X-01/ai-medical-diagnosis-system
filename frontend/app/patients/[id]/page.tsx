'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Loader2, User, ArrowLeft, Stethoscope, ShieldCheck, ShieldAlert } from 'lucide-react'

interface Patient { patientId: string; name: string; ageBand?: string; sex?: string; notes?: string; createdAt: string }
interface Assessment { requestId: string; diagnosis: string | null; confidence: number; reached: boolean; safe: boolean; timestamp: string }

const fmt = (s: string) => (s ? new Date(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [status, setStatus] = useState<'loading' | 'ok' | 'notfound'>('loading')

  useEffect(() => {
    if (!id) return
    fetch(`/api/patients/${id}`).then(async (r) => {
      if (r.status === 404) { setStatus('notfound'); return }
      const d = await r.json()
      setPatient(d.patient); setAssessments(d.assessments || []); setStatus('ok')
    }).catch(() => setStatus('notfound'))
  }, [id])

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link href="/patients" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft className="h-4 w-4" /> All patients</Link>

        {status === 'loading' && <p className="flex items-center gap-2 py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</p>}
        {status === 'notfound' && <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Patient not found.</p>}

        {status === 'ok' && patient && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"><User className="h-7 w-7" /></span>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-slate-900">{patient.name}</h1>
                <p className="text-sm text-slate-500">{[patient.ageBand && `${patient.ageBand} yrs`, patient.sex].filter(Boolean).join(' · ') || '—'}</p>
                {patient.notes && <p className="mt-1 text-sm text-slate-600">{patient.notes}</p>}
              </div>
              <Link href={`/diagnose?patientRef=${patient.patientId}`} className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-teal-500 hover:to-blue-500">
                <Stethoscope className="h-4 w-4" /> New assessment
              </Link>
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <h2 className="border-b border-slate-100 p-5 font-semibold text-slate-900">Assessment history</h2>
              {assessments.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-500">No assessments yet for this patient.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {assessments.map((a) => (
                    <Link key={a.requestId} href={`/diagnosis/${a.requestId}`} className="flex items-center gap-3 p-4 hover:bg-slate-50">
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${a.safe ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {a.safe ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{a.reached ? a.diagnosis : 'Ranked options'}</p>
                        <p className="truncate text-xs text-slate-400">{fmt(a.timestamp)}</p>
                      </div>
                      {a.reached && <span className="text-sm font-bold text-slate-700">{Math.round(a.confidence * 100)}%</span>}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
