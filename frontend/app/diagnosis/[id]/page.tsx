import Link from 'next/link'
import { ArrowLeft, Activity, Calendar, FileText, ExternalLink, CheckCircle } from 'lucide-react'

export default function DiagnosisDetailPage({ params }: { params: { id: string } }) {
  // Mock data - in production, fetch based on params.id
  const diagnosis = {
    id: params.id,
    patientId: 'P-2024-001',
    patientName: 'John Doe',
    diagnosis: 'ST-Elevation Myocardial Infarction (STEMI)',
    icd10Code: 'I21.3',
    confidence: 0.94,
    date: '2024-05-27T10:30:00Z',
    urgency: 'emergency',
    symptoms: ['Severe chest pain', 'Shortness of breath', 'Nausea', 'Sweating', 'Left arm pain'],
    vitalSigns: {
      temperature: '98.6°F',
      bloodPressure: '145/95',
      heartRate: '105 bpm',
      respiratoryRate: '22',
      oxygenSaturation: '94%'
    },
    agentVotes: {
      diagnostic: { vote: 'STEMI', confidence: 0.96 },
      research: { vote: 'STEMI', confidence: 0.93 },
      imaging: { vote: 'STEMI', confidence: 0.95 },
      validation: { vote: 'STEMI', confidence: 0.92 },
      consensus: { vote: 'STEMI', confidence: 0.94 }
    },
    citations: [
      {
        title: 'Fourth Universal Definition of Myocardial Infarction (2018)',
        source: 'European Heart Journal',
        url: 'https://pubmed.ncbi.nlm.nih.gov/30165617/'
      },
      {
        title: '2017 ESC Guidelines for STEMI Management',
        source: 'European Society of Cardiology',
        url: 'https://pubmed.ncbi.nlm.nih.gov/28886621/'
      }
    ],
    recommendations: [
      'Immediate cardiac catheterization',
      'Aspirin 325mg administration',
      'Cardiology consultation - URGENT',
      'Continuous cardiac monitoring',
      'Serial troponin measurements'
    ]
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-100 text-red-700 border-red-200'
      case 'urgent': return 'bg-orange-100 text-orange-700 border-orange-200'
      default: return 'bg-green-100 text-green-700 border-green-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
              AI Medical Diagnosis
            </Link>
            <Link href="/diagnoses" className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to All Diagnoses
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-medium text-gray-500">{diagnosis.patientId}</span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm font-medium text-gray-700">{diagnosis.patientName}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(diagnosis.urgency)}`}>
                  {diagnosis.urgency.toUpperCase()}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{diagnosis.diagnosis}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>ICD-10: {diagnosis.icd10Code}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(diagnosis.date).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-1">
                {Math.round(diagnosis.confidence * 100)}%
              </div>
              <div className="text-sm text-gray-600">Confidence</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Symptoms */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Reported Symptoms</h2>
              <div className="flex flex-wrap gap-2">
                {diagnosis.symptoms.map((symptom, index) => (
                  <span key={index} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    {symptom}
                  </span>
                ))}
              </div>
            </div>

            {/* Vital Signs */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Vital Signs</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(diagnosis.vitalSigns).map(([key, value]) => (
                  <div key={key}>
                    <div className="text-sm text-gray-600 mb-1">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent Consensus */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">AI Agent Consensus</h2>
              <div className="space-y-3">
                {Object.entries(diagnosis.agentVotes).map(([agent, data]) => (
                  <div key={agent} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-gray-900 capitalize">{agent} Agent</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">{data.vote}</span>
                      <span className="font-semibold text-blue-600">
                        {Math.round(data.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Citations */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Medical Literature Citations</h2>
              <div className="space-y-4">
                {diagnosis.citations.map((citation, index) => (
                  <div key={index} className="border-l-4 border-blue-600 pl-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{citation.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{citation.source}</p>
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      View Source
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recommendations */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Recommendations</h2>
              <ul className="space-y-3">
                {diagnosis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <Activity className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
              <h3 className="font-bold text-blue-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Export Report
                </button>
                <button className="w-full bg-white text-blue-600 py-2 rounded-lg font-medium border border-blue-600 hover:bg-blue-50 transition-colors">
                  Share with Team
                </button>
                <Link
                  href={`/patients/${diagnosis.patientId}`}
                  className="block w-full bg-white text-gray-700 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors text-center"
                >
                  View Patient Record
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Made with Bob
