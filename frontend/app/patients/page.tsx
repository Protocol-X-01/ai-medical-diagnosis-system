'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Plus, User, Loader2, X, Search } from 'lucide-react'

interface Patient {
  patientId: string
  name: string
  ageBand?: string
  sex?: string
  notes?: string
  createdAt: string
}

const AGE_BANDS = ['0-1', '1-12', '12-18', '18-30', '30-40', '40-50', '50-60', '60-70', '70-80', '80+']

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', ageBand: '', sex: '', notes: '' })

  const load = () => {
    setLoading(true)
    fetch('/api/patients').then((r) => r.json()).then((d) => setPatients(d.patients || [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/patients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { setForm({ name: '', ageBand: '', sex: '', notes: '' }); setShowForm(false); load() }
    } finally { setSaving(false) }
  }

  const filtered = patients.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
            <p className="text-sm text-slate-500">Clinic patient records — visible to authorised front-desk staff.</p>
          </div>
          <button onClick={() => setShowForm((s) => !s)} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            <Plus className="h-4 w-4" /> Add patient
          </button>
        </div>

        <p className="mb-5 rounded-lg bg-blue-50 p-3 text-xs text-blue-700 ring-1 ring-inset ring-blue-100">
          Records here are the clinic&apos;s own (the data controller&apos;s). The AI assessment engine only ever
          receives a <strong>pseudonymous reference</strong> — never the patient&apos;s identity.
        </p>

        {showForm && (
          <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">New patient</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name *" className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.ageBand} onChange={(e) => setForm({ ...form, ageBand: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none">
                  <option value="">Age band</option>
                  {AGE_BANDS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none">
                  <option value="">Sex</option>
                  <option>Female</option><option>Male</option><option>Other</option>
                </select>
              </div>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes (optional)" rows={2} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none sm:col-span-2" />
            </div>
            <button onClick={save} disabled={saving || !form.name.trim()} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save patient
            </button>
          </div>
        )}

        <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patients…" className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none" />
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <p className="flex items-center justify-center gap-2 p-10 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">{patients.length === 0 ? 'No patients yet — add the first record above.' : `No patients match “${q}”.`}</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <Link key={p.patientId} href={`/patients/${p.patientId}`} className="flex items-center gap-3 p-4 hover:bg-slate-50">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"><User className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="truncate text-xs text-slate-400">{[p.ageBand && `${p.ageBand} yrs`, p.sex].filter(Boolean).join(' · ') || '—'}</p>
                  </div>
                  <span className="font-mono text-[11px] text-slate-300">{p.patientId.slice(0, 12)}</span>
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
