import InfoPage from '@/components/InfoPage'

const iframeSnippet = `<iframe
  src="https://ai-medical-diagnosis-dusky.vercel.app/widget?clinic=Your%20Clinic&booking=https://yourclinic.com/book"
  style="width:380px;height:560px;border:1px solid #e2e8f0;border-radius:16px"
  title="Symptom pre-triage"
  loading="lazy"></iframe>`

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm leading-relaxed text-slate-100">
      <code>{children}</code>
    </pre>
  )
}

export default function DocsPage() {
  return (
    <InfoPage
      title="Documentation"
      description="API reference and the embeddable pre-triage widget for healthcare clients."
    >
      <h2 className="mt-8 mb-4 text-2xl font-bold text-slate-900">Getting started</h2>
      <p className="mb-4 text-slate-700">
        The platform is a B2B clinical decision-support tool for provider organisations. Staff run
        grounded assessments from the <a href="/diagnose" className="text-blue-600">assessment console</a>,
        search the verified encyclopedia from <a href="/lookup" className="text-blue-600">Encyclopedia</a>,
        and you can embed the patient-facing <strong>pre-triage widget</strong> on your own website.
        Every assessment is grounded in cited sources; anything that cannot be traced to a source is withheld.
      </p>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-900">API reference</h2>

      <h3 className="mt-6 mb-2 text-lg font-semibold text-slate-900">POST /api/diagnose</h3>
      <p className="mb-3 text-slate-700">
        Runs the 3-model NIM quorum over grounded candidates. Accepts symptoms, optional vitals,
        history, and an optional image (data URL). Returns the consensus, per-model votes, verified
        citations, treatments &amp; red-flags, any extracted visual findings, and a safety verdict.
      </p>
      <Code>{`curl -X POST /api/diagnose -H "Content-Type: application/json" -d '{
  "symptoms": ["fever", "productive cough", "pleuritic chest pain"],
  "vitalSigns": { "temp": 38.6, "rr": 24 },
  "ageBand": "40-50",
  "imageDataUrl": "data:image/png;base64,..."   // optional
}'`}</Code>

      <h3 className="mt-6 mb-2 text-lg font-semibold text-slate-900">GET /api/conditions</h3>
      <p className="mb-3 text-slate-700">
        Free-text encyclopedia lookup across 11,000+ verified entries by name, ICD-10 or symptom.
        Returns conditions with symptoms, treatments, citations and (where available) a reference image.
      </p>
      <Code>{`curl "/api/conditions?q=psoriasis&limit=20"`}</Code>

      <h3 className="mt-6 mb-2 text-lg font-semibold text-slate-900">POST /api/pre-triage</h3>
      <p className="mb-3 text-slate-700">
        Fast, patient-safe pre-triage used by the widget. Never diagnoses — it returns a disposition
        (<code>urgent</code> / <code>book</code> / <code>self-care</code>) with safety-netting.
      </p>
      <Code>{`curl -X POST /api/pre-triage -H "Content-Type: application/json" \\
  -d '{ "text": "mild sore throat for two days" }'`}</Code>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-900">Embeddable pre-triage widget</h2>
      <p className="mb-4 text-slate-700">
        Drop the widget onto your own website to relieve front-desk pressure: patients get an
        immediate, safe next-step (self-care, book, or seek urgent care) before they ever reach your
        team. Paste this snippet where you want it to appear:
      </p>
      <Code>{iframeSnippet}</Code>

      <h3 className="mt-6 mb-2 text-lg font-semibold text-slate-900">Configuration</h3>
      <ul className="mb-4 list-disc space-y-1 pl-6 text-slate-700">
        <li><code>clinic</code> — your organisation&apos;s name, shown in the widget header.</li>
        <li><code>booking</code> — the URL your &ldquo;Book an appointment&rdquo; button links to (your existing booking system).</li>
      </ul>

      <h3 className="mt-6 mb-2 text-lg font-semibold text-slate-900">Behaviour &amp; safety</h3>
      <ul className="mb-4 list-disc space-y-1 pl-6 text-slate-700">
        <li><strong>Urgent</strong> — emergency red-flags (e.g. chest pain, breathing difficulty) prompt the patient to seek immediate care; the booking CTA is suppressed.</li>
        <li><strong>Book</strong> — symptoms that warrant assessment route the patient to your booking link, with notes to mention.</li>
        <li><strong>Self-care</strong> — clearly minor presentations get safe general guidance plus pharmacist signposting, with safety-netting on what to watch for.</li>
        <li>The widget <strong>never gives a diagnosis</strong> or prescription advice, and always shows a disclaimer.</li>
      </ul>
      <p className="text-sm text-slate-500">
        Production note: the widget is served with a permissive <code>frame-ancestors</code> policy for
        easy embedding in this MVP. For a production rollout we restrict it to your verified domains.
      </p>
    </InfoPage>
  )
}
