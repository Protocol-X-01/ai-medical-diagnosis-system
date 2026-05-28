import InfoPage from '@/components/InfoPage'

export default function FeaturesPage() {
  return (
    <InfoPage
      title="Features"
      description="Powerful AI-driven medical diagnosis capabilities"
    >
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Quorum-Based AI System</h2>
      <p className="text-gray-700 mb-4">
        Five specialized AI agents analyze each case independently. 4 out of 5 must agree before presenting any diagnosis, ensuring zero hallucinations.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">35M+ Medical Documents</h2>
      <p className="text-gray-700 mb-4">
        Access to peer-reviewed research, clinical guidelines, and medical textbooks from trusted sources worldwide.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Real-Time Analysis</h2>
      <p className="text-gray-700 mb-4">
        Get accurate diagnoses in under 30 seconds with complete transparency and source citations.
      </p>
    </InfoPage>
  )
}
