import InfoPage from '@/components/InfoPage'

export default function HIPAAPage() {
  return (
    <InfoPage
      title="HIPAA Compliance"
      description="Our commitment to healthcare data security"
    >
      <p className="text-gray-700 mb-4">
        We are fully compliant with the Health Insurance Portability and Accountability Act (HIPAA) and maintain the highest standards of patient data protection.
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
