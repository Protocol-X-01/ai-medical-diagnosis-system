import InfoPage from '@/components/InfoPage'

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      description="How we collect, use, and protect your data"
    >
      <p className="text-gray-700 mb-4">
        Last updated: May 28, 2026
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Information We Collect</h2>
      <p className="text-gray-700 mb-4">
        We collect information necessary to provide our AI medical diagnosis services while maintaining HIPAA compliance and protecting patient privacy.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How We Use Your Information</h2>
      <p className="text-gray-700 mb-4">
        Your data is used solely to provide medical diagnosis services and improve our AI models. We never sell or share patient data.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Security</h2>
      <p className="text-gray-700 mb-4">
        We employ enterprise-grade security measures including end-to-end encryption, regular security audits, and HIPAA-compliant infrastructure.
      </p>
    </InfoPage>
  )
}
