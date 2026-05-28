import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface InfoPageProps {
  title: string
  description: string
  children: React.ReactNode
}

export default function InfoPage({ title, description, children }: InfoPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              AI Medical Diagnosis
            </Link>
            <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
          <p className="text-xl text-gray-600 mb-8">{description}</p>
          <div className="prose prose-blue max-w-none">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

// Made with Bob
