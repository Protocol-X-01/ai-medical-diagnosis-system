'use client'

import { useState } from 'react'
import { Search, FileText, Activity, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface RecentDiagnosis {
  id: string
  patientId: string
  diagnosis: string
  confidence: number
  date: string
  urgency: 'routine' | 'urgent' | 'emergency'
}

export default function Dashboard() {
  const [recentDiagnoses] = useState<RecentDiagnosis[]>([
    {
      id: '1',
      patientId: 'P-2024-001',
      diagnosis: 'ST-Elevation Myocardial Infarction',
      confidence: 0.94,
      date: '2024-03-15T10:30:00Z',
      urgency: 'emergency'
    },
    {
      id: '2',
      patientId: 'P-2024-002',
      diagnosis: 'Type 2 Diabetes Mellitus',
      confidence: 0.89,
      date: '2024-03-15T09:15:00Z',
      urgency: 'routine'
    },
    {
      id: '3',
      patientId: 'P-2024-003',
      diagnosis: 'Community-Acquired Pneumonia',
      confidence: 0.92,
      date: '2024-03-14T16:45:00Z',
      urgency: 'urgent'
    }
  ])

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'urgent':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'routine':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                AI Medical Diagnosis
              </Link>
              <nav className="hidden md:flex items-center gap-6 ml-8">
                <Link href="/dashboard" className="text-blue-600 font-medium">
                  Dashboard
                </Link>
                <Link href="/diagnose" className="text-gray-600 hover:text-gray-900">
                  New Diagnosis
                </Link>
                <Link href="/patients" className="text-gray-600 hover:text-gray-900">
                  Patients
                </Link>
                <Link href="/research" className="text-gray-600 hover:text-gray-900">
                  Research
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                DR
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">+12%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">247</div>
            <div className="text-sm text-gray-600">Total Diagnoses</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">+8%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">94.2%</div>
            <div className="text-sm text-gray-600">Avg Confidence</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">-15%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">24s</div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm text-blue-600 font-medium">Live</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">35.2M</div>
            <div className="text-sm text-gray-600">Medical Sources</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Start a New Diagnosis</h2>
              <p className="text-blue-100">
                Enter patient symptoms and get AI-powered diagnosis in under 30 seconds
              </p>
            </div>
            <Link
              href="/diagnose"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap"
            >
              New Diagnosis
            </Link>
          </div>
        </div>

        {/* Recent Diagnoses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Recent Diagnoses</h2>
              <Link href="/diagnoses" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </Link>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {recentDiagnoses.map((diagnosis) => (
              <Link
                key={diagnosis.id}
                href={`/diagnosis/${diagnosis.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-gray-500">
                        {diagnosis.patientId}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(diagnosis.urgency)}`}>
                        {diagnosis.urgency.charAt(0).toUpperCase() + diagnosis.urgency.slice(1)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {diagnosis.diagnosis}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Activity className="w-4 h-4" />
                        Confidence: {(diagnosis.confidence * 100).toFixed(1)}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(diagnosis.date)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {Math.round(diagnosis.confidence * 100)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-gray-900">System Status</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">All systems operational</p>
            <p className="text-xs text-gray-500">Last updated: 2 minutes ago</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Search className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Knowledge Base</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">35.2M documents indexed</p>
            <p className="text-xs text-gray-500">Updated: Today at 3:00 AM</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Agent Performance</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">99.2% consensus rate</p>
            <p className="text-xs text-gray-500">Last 24 hours</p>
          </div>
        </div>
      </main>
    </div>
  )
}

// Made with Bob
