'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Filter, Plus, User, Calendar, Activity, AlertCircle } from 'lucide-react'

interface Patient {
  id: string
  name: string
  age: number
  gender: string
  lastVisit: string
  status: 'active' | 'inactive'
  recentDiagnosis: string
  urgency: 'routine' | 'urgent' | 'emergency'
}

import Header from '@/components/Header'

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  // Sample patient data
  const patients: Patient[] = [
    {
      id: 'P-2024-001',
      name: 'John Doe',
      age: 45,
      gender: 'Male',
      lastVisit: '2024-05-27',
      status: 'active',
      recentDiagnosis: 'Hypertension (I10)',
      urgency: 'routine'
    },
    {
      id: 'P-2024-002',
      name: 'Jane Smith',
      age: 62,
      gender: 'Female',
      lastVisit: '2024-05-26',
      status: 'active',
      recentDiagnosis: 'Type 2 Diabetes (E11.9)',
      urgency: 'urgent'
    },
    {
      id: 'P-2024-003',
      name: 'Robert Johnson',
      age: 58,
      gender: 'Male',
      lastVisit: '2024-05-25',
      status: 'active',
      recentDiagnosis: 'Acute Myocardial Infarction (I21.3)',
      urgency: 'emergency'
    },
    {
      id: 'P-2024-004',
      name: 'Mary Williams',
      age: 34,
      gender: 'Female',
      lastVisit: '2024-05-24',
      status: 'active',
      recentDiagnosis: 'Migraine (G43.909)',
      urgency: 'routine'
    },
    {
      id: 'P-2024-005',
      name: 'James Brown',
      age: 71,
      gender: 'Male',
      lastVisit: '2024-05-23',
      status: 'active',
      recentDiagnosis: 'Chronic Obstructive Pulmonary Disease (J44.9)',
      urgency: 'urgent'
    },
    {
      id: 'P-2024-006',
      name: 'Patricia Davis',
      age: 29,
      gender: 'Female',
      lastVisit: '2024-05-22',
      status: 'active',
      recentDiagnosis: 'Anxiety Disorder (F41.9)',
      urgency: 'routine'
    },
    {
      id: 'P-2024-007',
      name: 'Michael Miller',
      age: 52,
      gender: 'Male',
      lastVisit: '2024-05-21',
      status: 'inactive',
      recentDiagnosis: 'Gastroesophageal Reflux Disease (K21.9)',
      urgency: 'routine'
    },
    {
      id: 'P-2024-008',
      name: 'Linda Wilson',
      age: 67,
      gender: 'Female',
      lastVisit: '2024-05-20',
      status: 'active',
      recentDiagnosis: 'Osteoarthritis (M19.90)',
      urgency: 'routine'
    }
  ]

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || patient.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-100 text-red-700 border-red-200'
      case 'urgent': return 'bg-orange-100 text-orange-700 border-orange-200'
      default: return 'bg-green-100 text-green-700 border-green-200'
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-blue-100 text-blue-700 border-blue-200'
      : 'bg-gray-100 text-gray-700 border-gray-200'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Database</h1>
            <p className="text-gray-600">
              Manage and view patient records with AI-powered diagnosis history
            </p>
          </div>
          <Link
            href="/diagnose"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Patient
          </Link>
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
                placeholder="Search by name or patient ID..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  filterStatus === 'active'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus('inactive')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  filterStatus === 'inactive'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-blue-600 mb-2">{patients.length}</div>
            <div className="text-gray-600">Total Patients</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {patients.filter(p => p.status === 'active').length}
            </div>
            <div className="text-gray-600">Active Patients</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {patients.filter(p => p.urgency === 'urgent' || p.urgency === 'emergency').length}
            </div>
            <div className="text-gray-600">Urgent Cases</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {patients.filter(p => {
                const visitDate = new Date(p.lastVisit)
                const today = new Date()
                const diffTime = Math.abs(today.getTime() - visitDate.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                return diffDays <= 7
              }).length}
            </div>
            <div className="text-gray-600">This Week</div>
          </div>
        </div>

        {/* Patient List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Patient</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Age/Gender</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Last Visit</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Recent Diagnosis</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Urgency</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{patient.name}</div>
                          <div className="text-sm text-gray-500">{patient.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {patient.age} / {patient.gender}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(patient.lastVisit).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 max-w-xs truncate">
                      {patient.recentDiagnosis}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(patient.status)}`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(patient.urgency)}`}>
                        {patient.urgency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No patients found matching your search criteria</p>
          </div>
        )}
      </main>
    </div>
  )
}

// Made with Bob
