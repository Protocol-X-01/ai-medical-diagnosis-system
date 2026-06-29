import InfoPage from '@/components/InfoPage'

export default function HIPAAPage() {
  return (
    <InfoPage
      title="HIPAA Compliance"
      description="Our commitment to healthcare data security"
    >
      <p className="text-gray-700 mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4">
        <strong>Status: pre-certification.</strong> The platform is engineered against HIPAA
        Privacy and Security Rule safeguards, but is not yet formally HIPAA-certified and is not a
        certified medical device. Production deployment moves PHI onto HIPAA-eligible AWS services
        (e.g. AWS HealthLake) under a signed Business Associate Addendum.
      </p>
      <p className="text-gray-700 mb-4">
        We design to the Health Insurance Portability and Accountability Act (HIPAA) safeguards and
        maintain strong standards of patient data protection.
      </p>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Technical Safeguards</h2>
      <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
        <li>End-to-end encryption for all data in transit and at rest</li>
        <li>Multi-factor authentication for all user accounts</li>
        <li>Regular security audits and penetration testing</li>
        <li>Automated backup and disaster recovery systems</li>
      </ul>
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Administrative Safeguards</h2>
      <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
        <li>Comprehensive security policies and procedures</li>
        <li>Regular staff training on HIPAA compliance</li>
        <li>Business Associate Agreements with all vendors</li>
        <li>Incident response and breach notification procedures</li>
      </ul>
    </InfoPage>
  )
}
