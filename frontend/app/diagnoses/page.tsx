'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Filter, Calendar, Activity, Clock } from 'lucide-react'

interface Diagnosis {
  id: string
  patientId: string
  patientName: string
  diagnosis: string
  icd10Code: string
  confidence: number
  date: string
  urgency: 'routine' | 'urgent' | 'emergency'
}

import Header from '@/components/Header'

export default function DiagnosesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterUrgency, setFilterUrgency] = useState<string>('all')

  // Sample diagnoses data
  const diagnoses: Diagnosis[] = [
    {
      id: '1',
      patientId: 'P-2024-001',
      patientName: 'John Doe',
      diagnosis: 'ST-Elevation Myocardial Infarction',
      icd10Code: 'I21.3',
      confidence: 0.94,
      date: '2024-05-27T10:30:00Z',
      urgency: 'emergency'
    },
    {
      id: '2',
      patientId: 'P-2024-002',
      patientName: 'Jane Smith',
      diagnosis: 'Type 2 Diabetes Mellitus',
      icd10Code: 'E11.9',
      confidence: 0.89,
      date: '2024-05-26T09:15:00Z',
      urgency: 'routine'
    },
    {
      id: '3',
      patientId: 'P-2024-003',
      patientName: 'Robert Johnson',
      diagnosis: 'Community-Acquired Pneumonia',
      icd10Code: 'J18.9',
      confidence: 0.92,
      date: '2024-05-25T16:45:00Z',
      urgency: 'urgent'
    },
    {
      id: '4',
      patientId: 'P-2024-004',
      patientName: 'Mary Williams',
      diagnosis: 'Migraine without Aura',
      icd10Code: 'G43.909',
      confidence: 0.87,
      date: '2024-05-24T14:20:00Z',
      urgency: 'routine'
    },
    {
      id: '5',
      patientId: 'P-2024-005',
      patientName: 'James Brown',
      diagnosis: 'Chronic Obstructive Pulmonary Disease',
      icd10Code: 'J44.9',
      confidence: 0.91,
      date: '2024-05-23T11:00:00Z',
      urgency: 'urgent'
    }
  ]

  const filteredDiagnoses = diagnoses.filter(diagnosis => {
    const matchesSearch = diagnosis.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         diagnosis.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         diagnosis.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterUrgency === 'all' || diagnosis.urgency === filterUrgency
    return matchesSearch && matchesFilter
  })

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-100 text-red-700 border-red-200'
      case 'urgent': return 'bg-orange-100 text-orange-700 border-orange-200'
      default: return 'bg-green-100 text-green-700 border-green-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Diagnoses</h1>
          <p className="text-gray-600">
            Complete history of AI-powered diagnoses with full transparency
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by patient name, ID, or diagnosis..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterUrgency('all')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  filterUrgency === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterUrgency('emergency')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  filterUrgency === 'emergency'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Emergency
              </button>
              <button
                onClick={() => setFilterUrgency('urgent')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  filterUrgency === 'urgent'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Urgent
              </button>
              <button
                onClick={() => setFilterUrgency('routine')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  filterUrgency === 'routine'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Routine
              </button>
            </div>
          </div>
        </div>

        {/* Diagnoses List */}
        <div className="space-y-4">
          {filteredDiagnoses.map((diagnosis) => (
            <Link
              key={diagnosis.id}
              href={`/diagnosis/${diagnosis.id}`}
              className="block bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-medium text-gray-500">
                      {diagnosis.patientId}
                    </span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm font-medium text-gray-700">
                      {diagnosis.patientName}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(diagnosis.urgency)}`}>
                      {diagnosis.urgency.charAt(0).toUpperCase() + diagnosis.urgency.slice(1)}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {diagnosis.diagnosis}
                  </h3>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      ICD-10: {diagnosis.icd10Code}
                    </span>
                    <span className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Confidence: {(diagnosis.confidence * 100).toFixed(1)}%
                    </span>
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(diagnosis.date)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">
                      {Math.round(diagnosis.confidence * 100)}
                    </div>
                    <div className="text-xs text-gray-500">Confidence</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredDiagnoses.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No diagnoses found matching your criteria</p>
          </div>
        )}
      </main>
    </div>
  )
}

// Made with Bob
