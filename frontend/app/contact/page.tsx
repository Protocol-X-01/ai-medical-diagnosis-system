import InfoPage from '@/components/InfoPage'

export default function ContactPage() {
  return (
    <InfoPage
      title="Contact Us"
      description="Get in touch with our team"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sales Inquiries</h2>
          <p className="text-gray-700">Email: sales@aimedicaldiagnosis.com</p>
          <p className="text-gray-700">Phone: +1 (555) 123-4567</p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Technical Support</h2>
          <p className="text-gray-700">Email: support@aimedicaldiagnosis.com</p>
          <p className="text-gray-700">24/7 Support Portal: Available for Professional and Enterprise plans</p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">General Inquiries</h2>
          <p className="text-gray-700">Email: info@aimedicaldiagnosis.com</p>
        </div>
      </div>
    </InfoPage>
  )
}
