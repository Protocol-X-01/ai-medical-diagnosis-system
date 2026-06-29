// Seeds common VISIBLE conditions (dermatology / eye / infectious rashes) with a
// representative open-licensed reference image (Wikimedia, via the Wikipedia REST
// summary endpoint). Powers the visual-differential: an uploaded image + symptoms
// surfaces look-alike candidates the clinician can compare side by side.
//
//   npm run import-visual   (needs AWS creds + network)

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import type { ConditionEntry } from '../lib/types'

const TABLE = process.env.DDB_CONDITIONS_TABLE || 'MedicalConditions'
const region = process.env.AWS_REGION || 'us-east-1'
const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), { marshallOptions: { removeUndefinedValues: true } })

interface Spec {
  id: string; name: string; icd10: string; wiki: string; dermnet?: string
  symptoms: string[]; treatments: string[]; redFlags: string[]
}

const VISIBLE: Spec[] = [
  { id: 'C43', name: 'Melanoma', icd10: 'C43.9', wiki: 'Melanoma', dermnet: 'melanoma',
    symptoms: ['asymmetric pigmented lesion', 'irregular border', 'changing mole', 'new dark spot', 'itching', 'bleeding lesion', 'multiple colours in a mole'],
    treatments: ['urgent dermatology referral', 'excision biopsy', 'staging'], redFlags: ['rapid change in size or colour', 'ulceration or bleeding', 'nodular dark lesion'] },
  { id: 'L40', name: 'Psoriasis', icd10: 'L40.9', wiki: 'Psoriasis', dermnet: 'psoriasis',
    symptoms: ['well-demarcated red plaques', 'silvery scale', 'itching', 'extensor surfaces', 'nail pitting'],
    treatments: ['topical corticosteroids', 'vitamin D analogues', 'phototherapy'], redFlags: ['erythroderma', 'rapidly spreading pustules'] },
  { id: 'L03', name: 'Cellulitis', icd10: 'L03.90', wiki: 'Cellulitis', dermnet: 'cellulitis',
    symptoms: ['spreading erythema', 'warmth', 'swelling', 'tenderness', 'fever', 'poorly demarcated border'],
    treatments: ['oral or IV antibiotics', 'limb elevation', 'mark the border to monitor'], redFlags: ['rapidly spreading', 'systemic sepsis', 'severe pain out of proportion (necrotising fasciitis)'] },
  { id: 'B02', name: 'Herpes zoster (shingles)', icd10: 'B02.9', wiki: 'Herpes zoster', dermnet: 'herpes-zoster',
    symptoms: ['painful vesicular rash', 'dermatomal distribution', 'unilateral', 'burning pain', 'tingling before rash'],
    treatments: ['oral antivirals within 72h', 'analgesia'], redFlags: ['ophthalmic involvement', 'disseminated rash in immunocompromised'] },
  { id: 'H10', name: 'Conjunctivitis', icd10: 'H10.9', wiki: 'Conjunctivitis', dermnet: 'conjunctivitis',
    symptoms: ['red eye', 'discharge', 'gritty sensation', 'watering', 'crusting of lashes'],
    treatments: ['hygiene measures', 'topical antibiotics if bacterial', 'lubricants'], redFlags: ['severe pain', 'photophobia', 'visual loss'] },
  { id: 'L20', name: 'Atopic dermatitis (eczema)', icd10: 'L20.9', wiki: 'Atopic dermatitis', dermnet: 'atopic-dermatitis',
    symptoms: ['itchy red rash', 'dry skin', 'flexural distribution', 'lichenification', 'oozing or crusting'],
    treatments: ['emollients', 'topical corticosteroids', 'avoid triggers'], redFlags: ['eczema herpeticum (punched-out erosions, unwell)'] },
  { id: 'L01', name: 'Impetigo', icd10: 'L01.0', wiki: 'Impetigo', dermnet: 'impetigo',
    symptoms: ['golden crusted lesions', 'around mouth and nose', 'itching', 'blisters'],
    treatments: ['topical or oral antibiotics', 'hygiene'], redFlags: ['widespread bullous lesions', 'systemic symptoms'] },
  { id: 'C44.B', name: 'Basal cell carcinoma', icd10: 'C44.91', wiki: 'Basal-cell carcinoma', dermnet: 'bcc',
    symptoms: ['pearly papule', 'rolled border', 'telangiectasia', 'non-healing sore', 'sun-exposed site'],
    treatments: ['dermatology referral', 'excision', 'topical therapy for superficial'], redFlags: ['rapid growth', 'ulceration'] },
  { id: 'L50', name: 'Urticaria (hives)', icd10: 'L50.9', wiki: 'Hives', dermnet: 'urticaria',
    symptoms: ['itchy raised wheals', 'transient', 'red or pale weals', 'angioedema'],
    treatments: ['antihistamines', 'avoid triggers'], redFlags: ['lip or tongue swelling', 'breathing difficulty (anaphylaxis)'] },
  { id: 'L23', name: 'Contact dermatitis', icd10: 'L25.9', wiki: 'Contact dermatitis', dermnet: 'contact-dermatitis',
    symptoms: ['itchy red rash', 'well-demarcated to contact area', 'vesicles', 'scaling'],
    treatments: ['identify and avoid allergen', 'emollients', 'topical corticosteroids'], redFlags: ['severe widespread reaction'] },
  { id: 'B35', name: 'Tinea (ringworm)', icd10: 'B35.9', wiki: 'Dermatophytosis', dermnet: 'fungal-skin-infections',
    symptoms: ['annular scaly rash', 'central clearing', 'raised edge', 'itching'],
    treatments: ['topical antifungals', 'oral antifungals for extensive disease'], redFlags: ['widespread in immunocompromised'] },
  { id: 'B86', name: 'Scabies', icd10: 'B86', wiki: 'Scabies', dermnet: 'scabies',
    symptoms: ['intense itching worse at night', 'burrows', 'finger webs', 'widespread excoriations'],
    treatments: ['topical permethrin', 'treat close contacts'], redFlags: ['crusted (Norwegian) scabies'] },
  { id: 'L70', name: 'Acne vulgaris', icd10: 'L70.0', wiki: 'Acne', dermnet: 'acne',
    symptoms: ['comedones', 'papules', 'pustules', 'face and back', 'oily skin'],
    treatments: ['topical retinoids', 'benzoyl peroxide', 'oral antibiotics if moderate'], redFlags: ['nodulocystic acne with scarring'] },
  { id: 'B01', name: 'Chickenpox (varicella)', icd10: 'B01.9', wiki: 'Chickenpox', dermnet: 'chickenpox',
    symptoms: ['itchy vesicular rash', 'lesions at different stages', 'fever', 'starts on trunk'],
    treatments: ['supportive care', 'antivirals in at-risk groups'], redFlags: ['pneumonia', 'immunocompromised', 'pregnancy'] },
  { id: 'A69', name: 'Lyme disease (erythema migrans)', icd10: 'A69.20', wiki: 'Erythema migrans', dermnet: 'erythema-migrans',
    symptoms: ['expanding red rash', 'target or bullseye appearance', 'recent tick bite', 'fatigue', 'fever'],
    treatments: ['oral doxycycline', 'remove tick'], redFlags: ['neurological or cardiac involvement'] },
  { id: 'B05', name: 'Measles', icd10: 'B05.9', wiki: 'Measles', dermnet: 'measles',
    symptoms: ['maculopapular rash', 'high fever', 'cough', 'coryza', 'conjunctivitis', 'Koplik spots', 'rash spreads from face'],
    treatments: ['supportive care', 'vitamin A in children', 'isolation'], redFlags: ['pneumonia', 'encephalitis', 'immunocompromised'] },
  { id: 'L71', name: 'Rosacea', icd10: 'L71.9', wiki: 'Rosacea', dermnet: 'rosacea',
    symptoms: ['facial flushing', 'central facial redness', 'papules and pustules', 'telangiectasia', 'burning sensation'],
    treatments: ['topical metronidazole or ivermectin', 'avoid triggers', 'oral antibiotics if moderate'], redFlags: ['ocular rosacea', 'rhinophyma'] },
  { id: 'L80', name: 'Vitiligo', icd10: 'L80', wiki: 'Vitiligo', dermnet: 'vitiligo',
    symptoms: ['well-demarcated white patches', 'depigmentation', 'symmetrical distribution', 'no scaling'],
    treatments: ['topical corticosteroids', 'phototherapy', 'sun protection'], redFlags: ['rapidly spreading depigmentation'] },
  { id: 'B00', name: 'Herpes simplex (cold sore)', icd10: 'B00.1', wiki: 'Herpes simplex', dermnet: 'herpes-simplex',
    symptoms: ['grouped vesicles', 'tingling before lesions', 'lips or genital area', 'painful ulcers', 'crusting'],
    treatments: ['topical or oral antivirals', 'analgesia'], redFlags: ['eczema herpeticum', 'immunocompromised', 'neonatal exposure'] },
  { id: 'B37', name: 'Oral candidiasis (thrush)', icd10: 'B37.0', wiki: 'Oral candidiasis', dermnet: 'oral-candidiasis',
    symptoms: ['white plaques in mouth', 'plaques wipe off leaving red base', 'soreness', 'altered taste'],
    treatments: ['topical or oral antifungals', 'review inhaler technique / dentures'], redFlags: ['extensive disease suggesting immunosuppression'] },
  { id: 'B08.4', name: 'Hand, foot and mouth disease', icd10: 'B08.4', wiki: 'Hand, foot, and mouth disease', dermnet: 'hand-foot-and-mouth-disease',
    symptoms: ['vesicles on hands and feet', 'mouth ulcers', 'fever', 'sore throat', 'young child'],
    treatments: ['supportive care', 'hydration', 'analgesia'], redFlags: ['dehydration', 'neurological signs'] },
  { id: 'B08.1', name: 'Molluscum contagiosum', icd10: 'B08.1', wiki: 'Molluscum contagiosum', dermnet: 'molluscum-contagiosum',
    symptoms: ['pearly umbilicated papules', 'clustered', 'usually painless', 'children or immunocompromised'],
    treatments: ['often self-limiting', 'cryotherapy if needed'], redFlags: ['widespread in immunocompromised'] },
  { id: 'L42', name: 'Pityriasis rosea', icd10: 'L42', wiki: 'Pityriasis rosea', dermnet: 'pityriasis-rosea',
    symptoms: ['herald patch', 'christmas-tree distribution', 'oval scaly plaques', 'mild itching'],
    treatments: ['reassurance', 'emollients', 'topical steroids for itch'], redFlags: ['atypical or persistent rash needing review'] },
  { id: 'L21', name: 'Seborrhoeic dermatitis', icd10: 'L21.9', wiki: 'Seborrhoeic dermatitis', dermnet: 'seborrhoeic-dermatitis',
    symptoms: ['greasy yellow scale', 'scalp and nasolabial folds', 'redness', 'flaking', 'itching'],
    treatments: ['antifungal shampoo or cream', 'mild topical steroid'], redFlags: ['severe widespread disease (consider HIV)'] },
  { id: 'B07', name: 'Viral wart (verruca)', icd10: 'B07.9', wiki: 'Wart', dermnet: 'viral-wart',
    symptoms: ['rough keratotic papule', 'hands or feet', 'black dots (thrombosed capillaries)', 'painful on pressure'],
    treatments: ['topical salicylic acid', 'cryotherapy', 'often self-resolving'], redFlags: ['atypical or rapidly growing lesion'] },
]

async function wikiImage(title: string): Promise<string | undefined> {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, { headers: { 'User-Agent': 'ai-medical-diagnosis/1.0' } })
    if (!res.ok) return undefined
    const d = await res.json()
    return d?.thumbnail?.source || d?.originalimage?.source || undefined
  } catch { return undefined }
}

async function main() {
  const now = new Date().toISOString()
  const items: ConditionEntry[] = []
  for (const s of VISIBLE) {
    const imageUrl = await wikiImage(s.wiki)
    items.push({
      conditionId: s.id, name: s.name, icd10Code: s.icd10, category: 'Visible / dermatology',
      symptoms: s.symptoms, treatments: s.treatments, redFlags: s.redFlags,
      citations: [
        { id: `${s.id}-dermnet`, title: `${s.name} — DermNet`, source: 'DermNet NZ', url: `https://dermnetnz.org/topics/${s.dermnet}`, identifier: 'DermNet' },
        { id: `${s.id}-wiki`, title: `${s.name} (reference image) — Wikimedia Commons`, source: 'Wikimedia Commons', url: `https://en.wikipedia.org/wiki/${encodeURIComponent(s.wiki)}` },
      ],
      source: 'visual', prior: 1.0, imageUrl, updatedAt: now,
    })
    console.log(`  ${s.name}: ${imageUrl ? 'image ✓' : 'no image'}`)
  }
  for (let i = 0; i < items.length; i += 25) {
    await doc.send(new BatchWriteCommand({ RequestItems: { [TABLE]: items.slice(i, i + 25).map((Item) => ({ PutRequest: { Item } })) } }))
  }
  console.log(`Done. ${items.length} visible conditions written (${items.filter((i) => i.imageUrl).length} with images).`)
}

main().catch((e) => { console.error('import-visual failed:', e?.message || e); process.exit(1) })
