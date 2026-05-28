import InfoPage from '@/components/InfoPage'

export default function SecurityPage() {
  return (
    <InfoPage
      title="Security"
      description="Enterprise-grade security for healthcare data"
    >
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Infrastructure Security</h2>
      <p className="text-gray-700 mb-4">
        Built on AWS with enterprise-grade security, including VPC isolation, encryption at rest and in transit, and regular security audits.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Protection</h2>
      <p className="text-gray-700 mb-4">
        All patient data is encrypted using AES-256 encryption and stored in HIPAA-compliant AWS infrastructure.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Access Control</h2>
      <p className="text-gray-700 mb-4">
        Multi-factor authentication, role-based access control, and comprehensive audit logging for all system access.
      </p>
    </InfoPage>
  )
}
