import InfoPage from '@/components/InfoPage'

export default function FeaturesPage() {
  return (
    <InfoPage
      title="Features"
      description="Powerful AI-driven medical diagnosis capabilities"
    >
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Multi-Model Quorum</h2>
      <p className="text-gray-700 mb-4">
        Three independent AI models from different families (NVIDIA Nemotron, Meta Llama, Mistral),
        served on NVIDIA NIM, assess each case separately. A 2-of-3 consensus is required, and a
        dedicated content-safety model screens every result before it is shown.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Citation-Grounded, Not Generative Guesswork</h2>
      <p className="text-gray-700 mb-4">
        Every case is grounded in a curated knowledge base anchored to authoritative guidelines
        (NICE, ESC, IDSA/ATS, ADA, GOLD, KDIGO, WHO). Models may only cite sources that exist in
        that store — any fabricated citation is dropped, and an assessment with no verified source is withheld.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Transparent &amp; Fast</h2>
      <p className="text-gray-700 mb-4">
        Results return in seconds with each model&apos;s vote, the consensus, confidence, and full
        source citations — designed to support, not replace, a clinician&apos;s judgement.
      </p>
    </InfoPage>
  )
}
