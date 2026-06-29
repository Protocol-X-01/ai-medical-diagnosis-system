import { NextRequest, NextResponse } from 'next/server'
import { matchConditions } from '@/lib/dynamodb'

export const runtime = 'nodejs'
export const maxDuration = 20

// Patient-facing PRE-TRIAGE for the embeddable widget. This is intentionally NOT
// the diagnostic quorum: it never tells a patient what they have. It does a fast
// retrieval + emergency red-flag screen and returns a disposition (urgent / book /
// self-care) plus safety-netting. Honest, safe, and quick enough for a chatbot.

const EMERGENCY = [
  'chest pain', 'crushing chest', 'difficulty breathing', 'shortness of breath', 'cannot breathe',
  'severe bleeding', 'coughing up blood', 'vomiting blood', 'unconscious', 'unresponsive',
  'fainted', 'seizure', 'stroke', 'face drooping', 'slurred speech', 'weakness on one side',
  'suicidal', 'overdose', 'anaphylaxis', 'throat swelling', 'lips swelling', 'severe allergic',
  'stiff neck', 'rash that does not fade', 'severe abdominal pain', 'severe headache', 'worst headache',
  'blue lips', 'not waking', 'severe burn', 'sudden vision loss',
]

// General, safe self-care steps that never substitute for assessment.
const GENERAL_SELF_CARE = [
  'Rest and keep well hydrated',
  'A pharmacist can advise on over-the-counter relief and whether you need to be seen',
  'Monitor your symptoms and how they change over the next 24–48 hours',
]

// Universal, patient-safe safety-netting — sensible for any non-urgent disposition.
const GENERAL_WATCH = [
  'Difficulty breathing or swallowing',
  'A high fever that will not come down',
  'Symptoms that are rapidly getting worse',
  'A stiff neck, or a rash that does not fade when you press a glass against it',
  'You feel confused, very drowsy, or faint',
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const symptoms: string[] = Array.isArray(body?.symptoms)
      ? body.symptoms.map(String)
      : typeof body?.text === 'string'
        ? body.text.split(/[,.;\n]+/).map((s: string) => s.trim()).filter(Boolean)
        : []

    if (symptoms.length === 0) {
      return NextResponse.json({ error: 'Tell us a little about your symptoms.' }, { status: 400 })
    }

    const blob = symptoms.join(' ').toLowerCase()
    const emergencyHit = EMERGENCY.find((k) => blob.includes(k))

    const scored = await matchConditions({ symptoms }, 4)
    const top = scored[0]
    const watchFor = GENERAL_WATCH
    const possibleAreas = scored.map((s) => s.condition.name).slice(0, 3)

    const disclaimer =
      'This is general guidance to help you decide what to do next — not a diagnosis. ' +
      'If you feel very unwell or are worried, seek medical help.'

    if (emergencyHit) {
      return NextResponse.json({
        disposition: 'urgent',
        headline: 'Please seek urgent medical care now',
        message:
          'Some of what you have described can be serious. Call your local emergency number or go to ' +
          'the nearest emergency department. Do not wait for an appointment.',
        watchFor: [],
        possibleAreas: [],
        selfCare: [],
        disclaimer,
      })
    }

    // Non-urgent: recommend booking, and offer safe self-care in the meantime.
    const strong = top && top.score >= 0.5
    return NextResponse.json({
      disposition: strong ? 'book' : 'self-care',
      headline: strong
        ? 'We recommend booking an appointment'
        : 'This may be manageable at home — here is some guidance',
      message: strong
        ? 'Based on what you have described, it would be best to be assessed. You can book below, and ' +
          'mention these symptoms so the team can prepare.'
        : 'Your symptoms do not obviously need urgent care, but a clinician or pharmacist can confirm. ' +
          'You can still book an appointment if you would like to be seen.',
      watchFor,
      possibleAreas,
      selfCare: GENERAL_SELF_CARE,
      disclaimer,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
