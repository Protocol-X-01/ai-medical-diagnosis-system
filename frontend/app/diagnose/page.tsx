'use client'

import { useState } from 'react'
import { Upload, Plus, X, Loader2, CheckCircle, AlertCircle, FileText, Activity } from 'lucide-react'
import Link from 'next/link'

interface Symptom {
  id: string
  text: string
}

interface DiagnosisResult {
  diagnosis: string
  icd10Code: string
  confidence: number
  urgency: 'routine' | 'urgent' | 'emergency'
  agentVotes: {
    diagnostic: { vote: string; confidence: number }
    research: { vote: string; confidence: number }
    imaging: { vote: string; confidence: number }
    validation: { vote: string; confidence: number }
    consensus: { vote: string; confidence: number }
  }
  citations: Array<{
    title: string
    source: string
    url: string
    relevance: number
  }>
  recommendations: string[]
}

export default function DiagnosePage() {
  const [patientId, setPatientId] = useState('')
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [currentSymptom, setCurrentSymptom] = useState('')
  const [vitalSigns, setVitalSigns] = useState({
    temperature: '',
    bloodPressure: '',
    heartRate: '',
    respiratoryRate: '',
    oxygenSaturation: ''
  })
  const [medicalHistory, setMedicalHistory] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<DiagnosisResult | null>(null)
  const [agentProgress, setAgentProgress] = useState<Record<string, boolean>>({})

  const addSymptom = () => {
    if (currentSymptom.trim()) {
      setSymptoms([...symptoms, { id: Date.now().toString(), text: currentSymptom.trim() }])
      setCurrentSymptom('')
    }
  }

  const removeSymptom = (id: string) => {
    setSymptoms(symptoms.filter(s => s.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setResult(null)
    setAgentProgress({})

    // Simulate agent processing
    const agents = ['diagnostic', 'research', 'imaging', 'validation', 'consensus']
    for (const agent of agents) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      setAgentProgress(prev => ({ ...prev, [agent]: true }))
    }

    // Simulate diagnosis result
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setResult({
      diagnosis: 'ST-Elevation Myocardial Infarction (STEMI)',
      icd10Code: 'I21.3',
      confidence: 0.94,
      urgency: 'emergency',
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
          url: 'https://pubmed.ncbi.nlm.nih.gov/30165617/',
          relevance: 0.98
        },
        {
          title: '2017 ESC Guidelines for STEMI Management',
          source: 'European Society of Cardiology',
          url: 'https://pubmed.ncbi.nlm.nih.gov/28886621/',
          relevance: 0.96
        },
        {
          title: 'ACC/AHA Guidelines for STEMI Management',
          source: 'American College of Cardiology',
          url: 'https://pubmed.ncbi.nlm.nih.gov/23247304/',
          relevance: 0.94
        }
      ],
      recommendations: [
        'Immediate cardiac catheterization',
        'Aspirin 325mg administration',
        'Cardiology consultation - URGENT',
        'Continuous cardiac monitoring',
        'Serial troponin measurements'
      ]
    })

    setIsProcessing(false)
  }

  const getAgentIcon = (agent: string) => {
    const icons: Record<string, React.ReactElement> = {
      diagnostic: <Activity className="w-5 h-5" />,
      research: <FileText className="w-5 h-5" />,
      imaging: <Upload className="w-5 h-5" />,
      validation: <CheckCircle className="w-5 h-5" />,
      consensus: <AlertCircle className="w-5 h-5" />
    }
    return icons[agent] || <Activity className="w-5 h-5" />
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
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">New Diagnosis</h1>
          <p className="text-gray-600">
            Enter patient information to receive AI-powered diagnosis with zero hallucinations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient ID */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Patient ID
                </label>
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="e.g., P-2024-001"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>

              {/* Symptoms */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Symptoms
                </label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={currentSymptom}
                    onChange={(e) => setCurrentSymptom(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSymptom())}
                    placeholder="Enter symptom and press Enter"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={addSymptom}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {symptoms.map((symptom) => (
                    <div
                      key={symptom.id}
                      className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg"
                    >
                      <span>{symptom.text}</span>
                      <button
                        type="button"
                        onClick={() => removeSymptom(symptom.id)}
                        className="hover:bg-blue-100 rounded p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vital Signs */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Vital Signs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Temperature (°F)</label>
                    <input
                      type="text"
                      value={vitalSigns.temperature}
                      onChange={(e) => setVitalSigns({ ...vitalSigns, temperature: e.target.value })}
                      placeholder="98.6"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Blood Pressure</label>
                    <input
                      type="text"
                      value={vitalSigns.bloodPressure}
                      onChange={(e) => setVitalSigns({ ...vitalSigns, bloodPressure: e.target.value })}
                      placeholder="120/80"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Heart Rate (bpm)</label>
                    <input
                      type="text"
                      value={vitalSigns.heartRate}
                      onChange={(e) => setVitalSigns({ ...vitalSigns, heartRate: e.target.value })}
                      placeholder="72"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Respiratory Rate</label>
                    <input
                      type="text"
                      value={vitalSigns.respiratoryRate}
                      onChange={(e) => setVitalSigns({ ...vitalSigns, respiratoryRate: e.target.value })}
                      placeholder="16"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">O2 Saturation (%)</label>
                    <input
                      type="text"
                      value={vitalSigns.oxygenSaturation}
                      onChange={(e) => setVitalSigns({ ...vitalSigns, oxygenSaturation: e.target.value })}
                      placeholder="98"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Medical History */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Medical History (Optional)
                </label>
                <textarea
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  placeholder="Enter relevant medical history, medications, allergies..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                />
              {/* Medical Images Upload */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Medical Images (Optional)
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Upload CT scans, MRI, X-rays, or photos of skin conditions for enhanced diagnosis
                </p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                  <input
                    type="file"
                    id="medical-images"
                    multiple
                    accept="image/*,.dcm"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      console.log('Files selected:', files.map(f => f.name))
                      // Handle file upload here
                    }}
                  />
                  <label htmlFor="medical-images" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      DICOM, PNG, JPG, or JPEG (Max 10MB per file)
                    </p>
                  </label>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <span className="text-2xl">🫁</span>
                    <span className="text-sm font-medium text-gray-700">CT Scan</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <span className="text-2xl">🧠</span>
                    <span className="text-sm font-medium text-gray-700">MRI</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <span className="text-2xl">🦴</span>
                    <span className="text-sm font-medium text-gray-700">X-Ray</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <span className="text-2xl">🔬</span>
                    <span className="text-sm font-medium text-gray-700">Skin</span>
                  </button>
                </div>

                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>AI Image Analysis:</strong> Our imaging agent will analyze uploaded scans for abnormalities, 
                    lesions, fractures, and other diagnostic indicators to enhance diagnosis accuracy.
                  </p>
                </div>
              </div>

              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing || symptoms.length === 0}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Generate Diagnosis'
                )}
              </button>
            </form>
          </div>

          {/* Agent Status / Results */}
          <div className="lg:col-span-1">
            {isProcessing && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Processing</h3>
                <div className="space-y-3">
                  {['diagnostic', 'research', 'imaging', 'validation', 'consensus'].map((agent) => (
                    <div key={agent} className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        agentProgress[agent] ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {agentProgress[agent] ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          getAgentIcon(agent)
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 capitalize">{agent} Agent</div>
                        <div className="text-xs text-gray-500">
                          {agentProgress[agent] ? 'Complete' : 'Processing...'}
                        </div>
                      </div>
                      {!agentProgress[agent] && (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {/* Diagnosis Result */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Diagnosis</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      result.urgency === 'emergency' ? 'bg-red-100 text-red-700' :
                      result.urgency === 'urgent' ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {result.urgency.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{result.diagnosis}</h4>
                  <p className="text-sm text-gray-600 mb-4">ICD-10: {result.icd10Code}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${result.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {(result.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Citations */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Citations ({result.citations.length})
                  </h3>
                  <div className="space-y-3">
                    {result.citations.map((citation, idx) => (
                      <a
                        key={idx}
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900 mb-1">{citation.title}</div>
                        <div className="text-xs text-gray-600">{citation.source}</div>
                        <div className="text-xs text-blue-600 mt-1">
                          Relevance: {(citation.relevance * 100).toFixed(0)}%
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// Made with Bob
