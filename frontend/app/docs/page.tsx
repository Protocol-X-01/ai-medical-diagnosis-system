import InfoPage from '@/components/InfoPage'

export default function DocsPage() {
  return (
    <InfoPage
      title="Documentation"
      description="Complete guide to using our platform"
    >
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Getting Started</h2>
      <p className="text-gray-700 mb-4">
        Quick start guide for new users, including account setup, first diagnosis, and team collaboration.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">API Documentation</h2>
      <p className="text-gray-700 mb-4">
        Complete API reference for integrating our diagnosis system into your existing healthcare workflows.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Best Practices</h2>
      <p className="text-gray-700 mb-4">
        Guidelines for optimal use of our AI system, including symptom entry, result interpretation, and clinical integration.
      </p>
    </InfoPage>
  )
}
