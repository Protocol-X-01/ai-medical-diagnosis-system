import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function PricingPage() {
  const plans = [
    {
      name: 'Starter',
      price: '$499',
      period: '/month',
      description: 'For small clinics and front-desk teams',
      features: [
        'Up to 100 assessments/month',
        '3-model quorum (2-of-3 consensus)',
        'Citation-grounded encyclopedia (11,000+ conditions)',
        'Staff encyclopedia lookup',
        'Treatments & red-flag guidance',
        'Image analysis & visual differential',
        'Audit trail of every assessment',
        'API access',
        'HIPAA-aligned design',
        'Email support',
      ],
      cta: 'Start Free Trial',
      highlighted: false
    },
    {
      name: 'Professional',
      price: '$999',
      period: '/month',
      description: 'For medium-sized healthcare facilities',
      features: [
        'Everything in Starter',
        'Up to 500 assessments/month',
        'Rare-disease coverage (8,000+ conditions)',
        'Ranked differential options on ambiguous cases',
        'Usage analytics dashboard',
        'Full API access',
        'Custom integrations (on request)',
        'Priority support',
      ],
      cta: 'Start Free Trial',
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: '$1,999',
      period: '/month',
      description: 'For large hospitals and healthcare networks',
      features: [
        'Everything in Professional',
        'Unlimited assessments',
        'Custom condition sets & domain tuning (on request)',
        'On-premise / private-VPC deployment option',
        'SSO & dedicated support',
        '99.9% uptime target',
      ],
      cta: 'Contact Sales',
      highlighted: false
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />

      <main className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Choose the plan that fits your practice. All plans include 30-day free trial.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 ${
                plan.highlighted
                  ? 'bg-blue-600 text-white shadow-2xl scale-105'
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}
            >
              {plan.highlighted && (
                <div className="text-center mb-4">
                  <span className="bg-white text-blue-600 px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                {plan.name}
              </h3>
              
              <div className="mb-4">
                <span className={`text-5xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  {plan.price}
                </span>
                <span className={plan.highlighted ? 'text-blue-100' : 'text-gray-600'}>
                  {plan.period}
                </span>
              </div>
              
              <p className={`mb-6 ${plan.highlighted ? 'text-blue-100' : 'text-gray-600'}`}>
                {plan.description}
              </p>
              
              <Link
                href="/signup"
                className={`block w-full py-3 rounded-lg font-semibold text-center mb-6 transition-colors ${
                  plan.highlighted
                    ? 'bg-white text-blue-600 hover:bg-blue-50'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {plan.cta}
              </Link>
              
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      plan.highlighted ? 'text-white' : 'text-green-600'
                    }`} />
                    <span className={plan.highlighted ? 'text-blue-50' : 'text-gray-700'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Is there a free trial?</h3>
              <p className="text-gray-600">
                Yes! All plans include a 30-day free trial with full access to all features. No credit card required.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Can I change plans later?</h3>
              <p className="text-gray-600">
                Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Is my data secure?</h3>
              <p className="text-gray-600">
                Security is foundational: encryption in transit, audit logging, least-privilege access, and de-identified inputs on AWS infrastructure. The platform is built to align with HIPAA controls; formal HIPAA/SOC 2 certification is on our roadmap.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">What happens if I exceed my diagnosis limit?</h3>
              <p className="text-gray-600">
                We'll notify you when you're approaching your limit. You can upgrade your plan or purchase additional diagnoses as needed.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start your 30-day free trial today. No credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}

// Made with Bob
