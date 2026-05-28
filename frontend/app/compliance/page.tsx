import InfoPage from '@/components/InfoPage'

export default function CompliancePage() {
  return (
    <InfoPage
      title="Compliance"
      description="Meeting healthcare regulatory requirements"
    >
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">HIPAA Compliance</h2>
      <p className="text-gray-700 mb-4">
        Fully compliant with HIPAA Privacy and Security Rules, including Business Associate Agreements with all vendors.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">SOC 2 Type II</h2>
      <p className="text-gray-700 mb-4">
        Certified for security, availability, processing integrity, confidentiality, and privacy.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">GDPR Ready</h2>
      <p className="text-gray-700 mb-4">
        Compliant with EU data protection regulations for international healthcare providers.
      </p>
    </InfoPage>
  )
}
