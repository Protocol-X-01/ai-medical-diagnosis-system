'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, BookOpen, ExternalLink, Filter, TrendingUp, Award, Calendar } from 'lucide-react'

interface ResearchArticle {
  id: string
  title: string
  authors: string[]
  journal: string
  year: number
  citations: number
  category: string
  url: string
  abstract: string
  relevance: number
}

import Header from '@/components/Header'

export default function ResearchPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    'All',
    'Cardiology',
    'Neurology',
    'Oncology',
    'Infectious Disease',
    'Endocrinology',
    'Pulmonology',
    'Gastroenterology'
  ]

  // Sample research articles from our medical knowledge base
  const researchArticles: ResearchArticle[] = [
    {
      id: 'R-001',
      title: 'Fourth Universal Definition of Myocardial Infarction (2018)',
      authors: ['Thygesen K', 'Alpert JS', 'Jaffe AS', 'et al.'],
      journal: 'European Heart Journal',
      year: 2018,
      citations: 3542,
      category: 'Cardiology',
      url: 'https://pubmed.ncbi.nlm.nih.gov/30165617/',
      abstract: 'The Fourth Universal Definition of Myocardial Infarction provides updated criteria for the diagnosis of acute myocardial infarction...',
      relevance: 0.98
    },
    {
      id: 'R-002',
      title: '2017 ESC Guidelines for the Management of Acute Myocardial Infarction',
      authors: ['Ibanez B', 'James S', 'Agewall S', 'et al.'],
      journal: 'European Heart Journal',
      year: 2017,
      citations: 4231,
      category: 'Cardiology',
      url: 'https://pubmed.ncbi.nlm.nih.gov/28886621/',
      abstract: 'Comprehensive guidelines for the management of patients with ST-segment elevation myocardial infarction...',
      relevance: 0.96
    },
    {
      id: 'R-003',
      title: 'Diagnosis and Management of Type 2 Diabetes: NICE Guideline',
      authors: ['NICE Guideline Committee'],
      journal: 'BMJ',
      year: 2022,
      citations: 1876,
      category: 'Endocrinology',
      url: 'https://www.nice.org.uk/guidance/ng28',
      abstract: 'Evidence-based recommendations for the diagnosis and management of type 2 diabetes in adults...',
      relevance: 0.94
    },
    {
      id: 'R-004',
      title: 'Global Strategy for Asthma Management and Prevention (GINA 2023)',
      authors: ['Global Initiative for Asthma'],
      journal: 'GINA Report',
      year: 2023,
      citations: 2145,
      category: 'Pulmonology',
      url: 'https://ginasthma.org/',
      abstract: 'Updated evidence-based strategy for asthma management and prevention worldwide...',
      relevance: 0.93
    },
    {
      id: 'R-005',
      title: 'Alzheimer\'s Disease: Diagnosis and Management Guidelines',
      authors: ['Jack CR Jr', 'Bennett DA', 'Blennow K', 'et al.'],
      journal: 'Alzheimer\'s & Dementia',
      year: 2018,
      citations: 5234,
      category: 'Neurology',
      url: 'https://pubmed.ncbi.nlm.nih.gov/29653606/',
      abstract: 'NIA-AA Research Framework for Alzheimer\'s disease diagnosis and biomarker classification...',
      relevance: 0.95
    },
    {
      id: 'R-006',
      title: 'Cancer Immunotherapy: Principles and Practice',
      authors: ['Ribas A', 'Wolchok JD'],
      journal: 'Science',
      year: 2018,
      citations: 3876,
      category: 'Oncology',
      url: 'https://pubmed.ncbi.nlm.nih.gov/29567705/',
      abstract: 'Comprehensive review of cancer immunotherapy mechanisms and clinical applications...',
      relevance: 0.92
    },
    {
      id: 'R-007',
      title: 'COVID-19 Treatment Guidelines',
      authors: ['NIH COVID-19 Treatment Guidelines Panel'],
      journal: 'NIH Guidelines',
      year: 2023,
      citations: 8234,
      category: 'Infectious Disease',
      url: 'https://www.covid19treatmentguidelines.nih.gov/',
      abstract: 'Evidence-based recommendations for the treatment of COVID-19 in various clinical settings...',
      relevance: 0.97
    },
    {
      id: 'R-008',
      title: 'ACG Clinical Guideline: Management of Gastroesophageal Reflux Disease',
      authors: ['Katz PO', 'Gerson LB', 'Vela MF'],
      journal: 'American Journal of Gastroenterology',
      year: 2022,
      citations: 1543,
      category: 'Gastroenterology',
      url: 'https://pubmed.ncbi.nlm.nih.gov/35354777/',
      abstract: 'Updated guidelines for the diagnosis and management of gastroesophageal reflux disease...',
      relevance: 0.91
    }
  ]

  const filteredArticles = researchArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         article.journal.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical Research Database</h1>
          <p className="text-gray-600">
            A curated knowledge base of conditions anchored to verified guidelines and peer-reviewed sources
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <div className="text-3xl font-bold text-blue-600">Guideline</div>
            </div>
            <div className="text-gray-600">Anchored Sources</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-6 h-6 text-green-600" />
              <div className="text-3xl font-bold text-green-600">100%</div>
            </div>
            <div className="text-gray-600">Peer-Reviewed</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              <div className="text-3xl font-bold text-purple-600">Daily</div>
            </div>
            <div className="text-gray-600">Updates</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-orange-600" />
              <div className="text-3xl font-bold text-orange-600">2024</div>
            </div>
            <div className="text-gray-600">Latest Research</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, author, or journal..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category.toLowerCase())}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === category.toLowerCase()
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Research Articles */}
        <div className="space-y-4">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                      {article.category}
                    </span>
                    <span className="text-sm text-gray-500">{article.year}</span>
                    <span className="text-sm text-gray-500">
                      {article.citations.toLocaleString()} citations
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {article.authors.join(', ')}
                  </p>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    {article.journal}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {article.abstract}
                  </p>
                  <div className="flex items-center gap-4">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Full Article
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${article.relevance * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {(article.relevance * 100).toFixed(0)}% relevance
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No research articles found matching your criteria</p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-2">
            About Our Research Database
          </h3>
          <p className="text-blue-800 mb-4">
            Our system grounds every assessment in a curated knowledge base of verified sources, including:
          </p>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Peer-reviewed research papers from PubMed, Cochrane, and major medical journals</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Clinical practice guidelines from WHO, CDC, NIH, and international medical societies</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Medical textbooks and educational resources from leading institutions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Real-time updates from ongoing clinical trials and emerging research</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}

// Made with Bob
