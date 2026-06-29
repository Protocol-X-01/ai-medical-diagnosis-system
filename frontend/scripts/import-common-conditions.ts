// Seeds common PRIMARY-CARE conditions (curated tier) with treatments, red flags
// and an authoritative NICE CKS citation. These are high-frequency front-desk
// presentations — strengthening the "common cases, utmost accuracy" path.
//
//   npm run import-common   (needs AWS creds)

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import type { ConditionEntry } from '../lib/types'

const TABLE = process.env.DDB_CONDITIONS_TABLE || 'MedicalConditions'
const region = process.env.AWS_REGION || 'us-east-1'
const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), { marshallOptions: { removeUndefinedValues: true } })

interface Spec {
  id: string; name: string; icd10: string; cks: string; category: string
  symptoms: string[]; treatments: string[]; redFlags: string[]
}

const COMMON: Spec[] = [
  { id: 'G43', name: 'Migraine', icd10: 'G43.909', cks: 'migraine', category: 'Neurology',
    symptoms: ['unilateral throbbing headache', 'photophobia', 'phonophobia', 'nausea', 'aura', 'worse with activity'],
    treatments: ['simple analgesia or NSAID', 'triptan for acute attack', 'antiemetic', 'identify and avoid triggers', 'consider prophylaxis if frequent'],
    redFlags: ['thunderclap headache', 'new focal neurology', 'headache with fever and neck stiffness', 'new headache over age 50'] },
  { id: 'G44', name: 'Tension-type headache', icd10: 'G44.209', cks: 'headache-tension-type', category: 'Neurology',
    symptoms: ['bilateral pressing headache', 'band-like tightness', 'mild to moderate', 'not aggravated by activity'],
    treatments: ['simple analgesia', 'limit analgesic use to avoid medication-overuse headache', 'stress and sleep management'],
    redFlags: ['progressive or persistent headache', 'new neurology', 'headache worse lying down or with valsalva'] },
  { id: 'K21', name: 'Gastro-oesophageal reflux disease (GORD)', icd10: 'K21.9', cks: 'gord', category: 'Gastroenterology',
    symptoms: ['heartburn', 'acid regurgitation', 'worse after meals or lying down', 'epigastric discomfort', 'nocturnal cough'],
    treatments: ['lifestyle advice (weight, alcohol, late meals)', 'proton pump inhibitor', 'antacids for breakthrough'],
    redFlags: ['dysphagia', 'unintentional weight loss', 'GI bleeding', 'persistent vomiting'] },
  { id: 'A09', name: 'Acute gastroenteritis', icd10: 'A09', cks: 'gastroenteritis', category: 'Gastroenterology',
    symptoms: ['diarrhoea', 'vomiting', 'abdominal cramps', 'nausea', 'low-grade fever'],
    treatments: ['oral rehydration', 'continue eating as tolerated', 'hygiene to limit spread', 'antibiotics only if specifically indicated'],
    redFlags: ['blood in stool', 'signs of dehydration', 'high fever', 'symptoms beyond a week', 'recent travel'] },
  { id: 'H66', name: 'Acute otitis media', icd10: 'H66.90', cks: 'otitis-media-acute', category: 'ENT',
    symptoms: ['ear pain', 'fever', 'reduced hearing', 'irritability in children', 'bulging red tympanic membrane'],
    treatments: ['analgesia', 'most resolve without antibiotics', 'antibiotics if systemically unwell or no improvement'],
    redFlags: ['mastoid swelling or redness', 'facial weakness', 'severe systemic illness'] },
  { id: 'J01', name: 'Acute sinusitis', icd10: 'J01.90', cks: 'sinusitis', category: 'ENT',
    symptoms: ['nasal congestion', 'facial pain or pressure', 'purulent nasal discharge', 'reduced smell', 'worse on bending forward'],
    treatments: ['analgesia and nasal saline', 'most are viral and self-limiting', 'intranasal steroid if symptoms >10 days'],
    redFlags: ['periorbital swelling or redness', 'severe frontal headache', 'visual disturbance', 'neurological signs'] },
  { id: 'J03', name: 'Acute tonsillitis / pharyngitis', icd10: 'J03.90', cks: 'sore-throat-acute', category: 'ENT',
    symptoms: ['sore throat', 'painful swallowing', 'fever', 'tonsillar exudate', 'tender cervical nodes'],
    treatments: ['analgesia and fluids', 'most are viral', 'consider antibiotics using FeverPAIN/Centor for likely bacterial cases'],
    redFlags: ['difficulty breathing', 'drooling or unable to swallow', 'trismus or muffled voice (quinsy)', 'stridor'] },
  { id: 'J11', name: 'Influenza', icd10: 'J11.1', cks: 'influenza-seasonal', category: 'Infectious disease',
    symptoms: ['sudden fever', 'myalgia', 'headache', 'dry cough', 'fatigue', 'sore throat'],
    treatments: ['rest and fluids', 'antipyretics', 'antivirals for at-risk groups within 48h', 'annual vaccination for prevention'],
    redFlags: ['breathlessness', 'chest pain', 'confusion', 'symptoms worsening after initial improvement'] },
  { id: 'U07', name: 'COVID-19', icd10: 'U07.1', cks: 'coronavirus-covid-19', category: 'Infectious disease',
    symptoms: ['fever', 'continuous cough', 'loss of taste or smell', 'fatigue', 'sore throat', 'shortness of breath'],
    treatments: ['rest and fluids', 'antipyretics', 'isolate per local guidance', 'antivirals for eligible high-risk patients'],
    redFlags: ['severe breathlessness', 'blue lips', 'chest pain', 'confusion', 'unable to stay awake'] },
  { id: 'J30', name: 'Allergic rhinitis', icd10: 'J30.9', cks: 'allergic-rhinitis', category: 'Allergy',
    symptoms: ['sneezing', 'nasal itch', 'watery rhinorrhoea', 'nasal congestion', 'itchy watery eyes', 'seasonal pattern'],
    treatments: ['allergen avoidance', 'non-sedating antihistamine', 'intranasal corticosteroid', 'saline rinses'],
    redFlags: ['unilateral symptoms or bloody discharge', 'nasal obstruction not responding to treatment'] },
  { id: 'M10', name: 'Gout', icd10: 'M10.9', cks: 'gout', category: 'Rheumatology',
    symptoms: ['acute monoarthritis', 'red hot swollen joint', 'first metatarsophalangeal joint', 'severe pain', 'tophi'],
    treatments: ['NSAID or colchicine for acute attack', 'rest and ice', 'urate-lowering therapy (allopurinol) once settled', 'lifestyle advice'],
    redFlags: ['fever with a hot joint (exclude septic arthritis)', 'multiple joints acutely involved'] },
  { id: 'M19', name: 'Osteoarthritis', icd10: 'M19.90', cks: 'osteoarthritis', category: 'Rheumatology',
    symptoms: ['joint pain worse with use', 'stiffness after rest', 'reduced range of movement', 'crepitus', 'bony swelling'],
    treatments: ['exercise and weight management', 'topical NSAID', 'paracetamol or oral NSAID', 'consider physiotherapy'],
    redFlags: ['hot swollen joint', 'rapidly worsening pain', 'systemic symptoms suggesting inflammatory arthritis'] },
  { id: 'M54', name: 'Non-specific low back pain', icd10: 'M54.50', cks: 'back-pain-low-without-radiculopathy', category: 'Musculoskeletal',
    symptoms: ['lower back pain', 'stiffness', 'worse with movement', 'no leg symptoms', 'mechanical pattern'],
    treatments: ['stay active and reassurance', 'NSAID if needed', 'physiotherapy', 'avoid prolonged bed rest'],
    redFlags: ['saddle anaesthesia or bladder/bowel dysfunction (cauda equina)', 'progressive neurology', 'fever', 'unexplained weight loss', 'history of cancer'] },
  { id: 'E03', name: 'Hypothyroidism', icd10: 'E03.9', cks: 'hypothyroidism', category: 'Endocrinology',
    symptoms: ['fatigue', 'weight gain', 'cold intolerance', 'constipation', 'dry skin', 'low mood'],
    treatments: ['levothyroxine replacement', 'monitor TSH and titrate', 'annual review'],
    redFlags: ['confusion or hypothermia (myxoedema)', 'severe bradycardia'] },
  { id: 'D50', name: 'Iron deficiency anaemia', icd10: 'D50.9', cks: 'anaemia-iron-deficiency', category: 'Haematology',
    symptoms: ['fatigue', 'pallor', 'breathlessness on exertion', 'dizziness', 'brittle nails'],
    treatments: ['oral iron replacement', 'investigate and treat the underlying cause', 'dietary advice'],
    redFlags: ['GI bleeding or melaena', 'unexplained weight loss', 'anaemia in a man or postmenopausal woman (consider GI malignancy)'] },
  { id: 'F41', name: 'Generalised anxiety disorder', icd10: 'F41.1', cks: 'generalized-anxiety-disorder', category: 'Mental health',
    symptoms: ['excessive worry', 'restlessness', 'poor concentration', 'irritability', 'sleep disturbance', 'palpitations'],
    treatments: ['psychoeducation and self-help', 'CBT', 'consider SSRI', 'sleep and lifestyle measures'],
    redFlags: ['thoughts of self-harm or suicide', 'severe functional impairment'] },
  { id: 'F32', name: 'Depression', icd10: 'F32.9', cks: 'depression', category: 'Mental health',
    symptoms: ['persistent low mood', 'anhedonia', 'fatigue', 'poor sleep', 'poor concentration', 'appetite change'],
    treatments: ['guided self-help or psychological therapy', 'consider antidepressant for moderate/severe', 'regular review and safety planning'],
    redFlags: ['active suicidal ideation or intent', 'self-neglect', 'psychotic symptoms'] },
  { id: 'K58', name: 'Irritable bowel syndrome', icd10: 'K58.9', cks: 'irritable-bowel-syndrome', category: 'Gastroenterology',
    symptoms: ['abdominal pain relieved by defecation', 'bloating', 'altered bowel habit', 'mucus in stool', 'symptoms worse with stress'],
    treatments: ['dietary modification (e.g. low FODMAP with support)', 'antispasmodics', 'manage constipation or diarrhoea', 'address stress'],
    redFlags: ['rectal bleeding', 'unexplained weight loss', 'anaemia', 'onset over age 60', 'family history of bowel cancer'] },
]

async function main() {
  const now = new Date().toISOString()
  const items: ConditionEntry[] = COMMON.map((s) => ({
    conditionId: s.id, name: s.name, icd10Code: s.icd10, category: s.category,
    symptoms: s.symptoms, treatments: s.treatments, redFlags: s.redFlags,
    citations: [
      { id: `${s.id}-cks`, title: `${s.name} — NICE Clinical Knowledge Summaries`, source: 'NICE CKS', url: `https://cks.nice.org.uk/topics/${s.cks}/`, identifier: 'NICE CKS' },
    ],
    source: 'curated', prior: 1.0, updatedAt: now,
  }))
  for (let i = 0; i < items.length; i += 25) {
    await doc.send(new BatchWriteCommand({ RequestItems: { [TABLE]: items.slice(i, i + 25).map((Item) => ({ PutRequest: { Item } })) } }))
  }
  console.log(`Done. ${items.length} common primary-care conditions written.`)
  items.forEach((i) => console.log(`  ${i.name} (${i.icd10Code})`))
}

main().catch((e) => { console.error('import-common failed:', e?.message || e); process.exit(1) })
