'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Play, Pause, RotateCcw, ArrowRight, CheckCircle, Activity, FileText } from 'lucide-react'

export default function DemoPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const demoSteps = [
    {
      title: 'Patient Intake',
      description: 'Enter patient symptoms, vital signs, and medical history',
      duration: '10 seconds',
      icon: <Activity className="w-6 h-6" />
    },
    {
      title: 'AI Agent Analysis',
      description: '5 specialized agents analyze the case independently',
      duration: '15 seconds',
      icon: <FileText className="w-6 h-6" />
    },
    {
      title: 'Quorum Consensus',
      description: 'Agents reach 4/5 consensus with verified citations',
      duration: '5 seconds',
      icon: <CheckCircle className="w-6 h-6" />
    },
    {
      title: 'Diagnosis Delivery',
      description: 'Complete diagnosis with ICD-10 codes and recommendations',
      duration: '5 seconds',
      icon: <CheckCircle className="w-6 h-6" />
    }
  ]

  const handlePlayDemo = () => {
    setIsPlaying(true)
    setCurrentStep(0)
    
    // Simulate demo progression
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= demoSteps.length - 1) {
          clearInterval(interval)
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 3000)
  }

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentStep(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              AI Medical Diagnosis
            </Link>
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Interactive Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            See how our AI-powered diagnosis system works in real-time with zero hallucinations
          </p>
          
          {/* Demo Video Placeholder */}
          <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl mb-8 aspect-video max-w-4xl mx-auto relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-blue-700 transition-colors"
                     onClick={handlePlayDemo}>
                  {isPlaying ? (
                    <Pause className="w-12 h-12 text-white" />
                  ) : (
                    <Play className="w-12 h-12 text-white ml-2" />
                  )}
                </div>
                <p className="text-white text-lg font-medium">
                  {isPlaying ? 'Demo in Progress...' : 'Click to Start Interactive Demo'}
                </p>
              </div>
            </div>
          </div>

          {/* Demo Controls */}
          <div className="flex gap-4 justify-center mb-12">
            <button
              onClick={handlePlayDemo}
              disabled={isPlaying}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              {isPlaying ? 'Playing...' : 'Start Demo'}
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold border-2 border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </div>
        </div>

        {/* Demo Steps */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {demoSteps.map((step, index) => (
              <div
                key={index}
                className={`bg-white p-6 rounded-xl border-2 transition-all ${
                  currentStep === index && isPlaying
                    ? 'border-blue-600 shadow-lg scale-105'
                    : currentStep > index
                    ? 'border-green-500'
                    : 'border-gray-200'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                  currentStep === index && isPlaying
                    ? 'bg-blue-600 text-white'
                    : currentStep > index
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Step {index + 1}: {step.title}
                </h3>
                <p className="text-gray-600 text-sm mb-2">{step.description}</p>
                <p className="text-blue-600 text-xs font-medium">{step.duration}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Key Features */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            What Makes Us Different
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Zero Hallucinations</h3>
              <p className="text-gray-600 text-sm">
                Every diagnosis requires 4/5 agent consensus and is backed by verified medical literature
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Real-time Processing</h3>
              <p className="text-gray-600 text-sm">
                Get accurate diagnoses in under 30 seconds with full transparency
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">HIPAA Compliant</h3>
              <p className="text-gray-600 text-sm">
                Enterprise-grade security with end-to-end encryption and audit logging
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Try our system with real patient data
          </p>
          <Link
            href="/diagnose"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start New Diagnosis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>
    </div>
  )
}

// Made with Bob
