import InfoPage from '@/components/InfoPage'

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms of Service"
      description="Terms and conditions for using our platform"
    >
      <p className="text-gray-700 mb-4">
        Last updated: May 28, 2026
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Acceptance of Terms</h2>
      <p className="text-gray-700 mb-4">
        By accessing and using the AI Medical Diagnosis System, you accept and agree to be bound by these Terms of Service.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Use of Service</h2>
      <p className="text-gray-700 mb-4">
        Our service is intended for licensed healthcare professionals. All diagnoses should be verified by qualified medical personnel.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Limitation of Liability</h2>
      <p className="text-gray-700 mb-4">
        While our AI system provides highly accurate diagnoses, it is a decision support tool and should not replace professional medical judgment.
      </p>
    </InfoPage>
  )
}
