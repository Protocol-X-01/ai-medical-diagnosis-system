import InfoPage from '@/components/InfoPage'

export default function AboutPage() {
  return (
    <InfoPage
      title="About Us"
      description="Building the future of AI-powered medical diagnosis"
    >
      <p className="text-gray-700 mb-4">
        We're on a mission to make AI clinical decision support trustworthy — by grounding every output in cited, verified sources through a multi-model quorum.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Mission</h2>
      <p className="text-gray-700 mb-4">
        To provide healthcare providers with AI decision-support tools they can trust — every assessment backed by verified medical literature and traceable citations, designed to support clinical judgement rather than replace it.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Built for AWS + Vercel Hackathon</h2>
      <p className="text-gray-700 mb-4">
        Track 2: B2B Healthcare • Leveraging AWS Databases and Vercel for production-ready deployment.
      </p>
    </InfoPage>
  )
}
