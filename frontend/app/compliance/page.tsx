import InfoPage from '@/components/InfoPage'

export default function CompliancePage() {
  return (
    <InfoPage
      title="Compliance"
      description="Meeting healthcare regulatory requirements"
    >
      <p className="text-gray-700 mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4">
        <strong>Status: pre-certification.</strong> This platform is built to align with healthcare
        compliance standards, but formal certifications are part of our roadmap and are not yet in
        place. The platform provides clinical decision support and is not a certified medical device.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">HIPAA-aligned design</h2>
      <p className="text-gray-700 mb-4">
        Architected against HIPAA Privacy and Security Rule controls: encryption in transit,
        audit logging, and least-privilege access. Production roadmap migrates PHI onto
        HIPAA-eligible AWS services (e.g. AWS HealthLake) under a signed Business Associate
        Addendum, following the AWS Well-Architected Healthcare Industry Lens.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">SOC 2 — roadmap</h2>
      <p className="text-gray-700 mb-4">
        Engineered toward SOC 2 Type II controls (security, availability, confidentiality).
        Independent audit and attestation are planned, not yet completed.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">GDPR by design</h2>
      <p className="text-gray-700 mb-4">
        Built on data-minimisation and pseudonymisation principles — the system works from
        de-identified case data and never requires direct patient identifiers. A full GDPR
        compliance programme (DPA, records of processing, DPIA) is on the roadmap for EU deployment.
      </p>
    </InfoPage>
  )
}
