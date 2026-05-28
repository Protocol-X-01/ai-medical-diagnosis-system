import InfoPage from '@/components/InfoPage'

export default function AboutPage() {
  return (
    <InfoPage
      title="About Us"
      description="Building the future of AI-powered medical diagnosis"
    >
      <p className="text-gray-700 mb-4">
        We're on a mission to eliminate AI hallucinations in medical diagnosis through our innovative quorum-based system.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Mission</h2>
      <p className="text-gray-700 mb-4">
        To provide healthcare providers with AI-powered diagnostic tools they can trust, backed by verified medical literature and zero hallucinations.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Built for AWS + Vercel Hackathon</h2>
      <p className="text-gray-700 mb-4">
        Track 2: B2B Healthcare • Leveraging AWS Databases and Vercel for production-ready deployment.
      </p>
    </InfoPage>
  )
}
