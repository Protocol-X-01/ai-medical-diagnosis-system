import Link from 'next/link'
import { ArrowRight, CheckCircle, Shield, Zap } from 'lucide-react'

import Header from '@/components/Header'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />

      <main className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Benefits */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Start Your 30-Day Free Trial
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Citation-grounded clinical decision support — every assessment traceable to a verified source
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">No Credit Card Required</h3>
                  <p className="text-gray-600">Start your trial instantly, upgrade when ready</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Setup in 5 Minutes</h3>
                  <p className="text-gray-600">Quick onboarding, start diagnosing immediately</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">HIPAA-aligned design</h3>
                  <p className="text-gray-600">Encryption, audit logging, de-identified inputs — certification on the roadmap</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-bold text-blue-900 mb-2">What's Included:</h3>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li>• Unlimited diagnoses during trial</li>
                <li>• Citation-grounded knowledge base</li>
                <li>• 3-model quorum (2-of-3 consensus)</li>
                <li>• Full API access</li>
                <li>• Priority support</li>
              </ul>
            </div>
          </div>

          {/* Right: Signup Form */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Your Account</h2>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  placeholder="Your Hospital or Clinic"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Work Email
                </label>
                <input
                  type="email"
                  placeholder="doctor@hospital.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Dr. John Smith"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1"
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-6">
              Already have an account? <Link href="/dashboard" className="text-blue-600 hover:underline font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

// Made with Bob
