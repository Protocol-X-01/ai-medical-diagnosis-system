// Enriches existing curated conditions with AMBOSS-style teaching depth
// (pathophysiology, key investigations, learning points). Uses UpdateCommand with
// an attribute_exists guard so it only augments records that already exist.
//
//   npm run import-teaching   (needs AWS creds)

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

const TABLE = process.env.DDB_CONDITIONS_TABLE || 'MedicalConditions'
const region = process.env.AWS_REGION || 'us-east-1'
const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), { marshallOptions: { removeUndefinedValues: true } })

interface Teach { id: string; pathophysiology: string; investigations: string[]; keyPoints: string[] }

const T: Teach[] = [
  { id: 'I48', pathophysiology: 'Disorganised atrial electrical activity (often from pulmonary-vein foci and atrial remodelling) gives an irregular ventricular response and loss of atrial kick, promoting stasis and thromboembolism.', investigations: ['12-lead ECG: irregularly irregular rhythm, absent P waves', 'Bloods: TFTs, U&E, FBC, glucose', 'Transthoracic echocardiogram', 'Ambulatory monitoring for paroxysmal AF'], keyPoints: ['Rate vs rhythm control is individualised', 'Anticoagulate by CHA₂DS₂-VASc; weigh bleeding (ORBIT/HAS-BLED)', 'New AF — hunt for reversible triggers: sepsis, thyrotoxicosis, alcohol', 'Pulse is irregularly irregular, often with an apex-radial deficit'] },
  { id: 'I50', pathophysiology: 'Impaired cardiac output (reduced or preserved ejection fraction) triggers neurohormonal activation (RAAS and sympathetic) causing salt and water retention and congestion.', investigations: ['BNP / NT-proBNP', 'Echocardiogram for ejection fraction', 'ECG, chest X-ray', 'U&E, iron studies'], keyPoints: ['HFrEF: ARNI/ACEi + beta-blocker + MRA + SGLT2 inhibitor improve prognosis', 'Diuretics relieve symptoms but are not prognostic', 'Daily weights detect decompensation early', 'Distinguish HFrEF from HFpEF — management differs'] },
  { id: 'G43', pathophysiology: 'A neurovascular disorder: cortical spreading depression and trigeminovascular activation release CGRP, producing pain and central sensitisation.', investigations: ['Clinical diagnosis', 'Neuroimaging only if red-flag features', 'Headache diary to identify pattern and triggers'], keyPoints: ['Acute: triptan + NSAID ± antiemetic', 'Limit acute analgesics to avoid medication-overuse headache', 'Prophylaxis if frequent: propranolol, topiramate, amitriptyline, CGRP mAbs', 'Aura is not always present'] },
  { id: 'C43', pathophysiology: 'Malignant transformation of melanocytes (UV-driven mutations such as BRAF) with radial then vertical growth; metastatic risk rises with Breslow thickness.', investigations: ['Dermoscopy', 'Excision biopsy for histology and Breslow thickness', 'Staging (e.g. sentinel node, imaging) when indicated'], keyPoints: ['Use ABCDE and the "ugly duckling" sign', 'Breslow thickness is the key prognostic factor', 'Excise — never shave-biopsy a suspected melanoma', 'Examine regional lymph nodes'] },
  { id: 'E10', pathophysiology: 'Autoimmune T-cell destruction of pancreatic β-cells causes absolute insulin deficiency and a tendency to ketosis.', investigations: ['Glucose and HbA1c', 'Blood/urine ketones', 'Islet autoantibodies; C-peptide (low)'], keyPoints: ['Lifelong insulin — never omit basal insulin (DKA risk)', 'Teach sick-day rules', 'Structured education + glucose monitoring (CGM)', 'Screen for complications and associated autoimmune disease'] },
  { id: 'K21', pathophysiology: 'Transient lower-oesophageal-sphincter relaxations allow acid reflux; impaired clearance and hiatus hernia increase mucosal acid exposure.', investigations: ['Clinical diagnosis / PPI trial', 'Upper GI endoscopy if alarm features', 'pH-impedance studies if refractory'], keyPoints: ['Lifestyle measures + proton pump inhibitor', 'Alarm features (dysphagia, weight loss, anaemia, bleeding) → urgent endoscopy', 'Chronic reflux can cause Barrett oesophagus'] },
  { id: 'M10', pathophysiology: 'Hyperuricaemia leads to monosodium urate crystal deposition; crystals trigger NLRP3-inflammasome–mediated acute inflammation.', investigations: ['Clinical; joint aspirate shows negatively birefringent needle-shaped crystals (also excludes septic arthritis)', 'Serum urate (check after the acute attack)', 'Renal function and risk factors'], keyPoints: ['Acute: NSAID, colchicine or corticosteroid', "Don't start urate-lowering during an attack, but continue it if already established", 'Treat-to-target urate < 360 µmol/L', 'Address diet, alcohol and diuretics'] },
  { id: 'E03', pathophysiology: 'Reduced thyroid hormone output — most commonly autoimmune (Hashimoto) — raises TSH and slows metabolism.', investigations: ['TSH (raised)', 'Free T4 (low)', 'TPO antibodies'], keyPoints: ['Levothyroxine; recheck TSH at 6–8 weeks', 'Start low and titrate in the elderly or those with cardiac disease', 'Distinguish overt from subclinical hypothyroidism'] },
  { id: 'D50', pathophysiology: 'Negative iron balance (blood loss, malabsorption or increased demand) reduces haem synthesis, giving a microcytic hypochromic anaemia.', investigations: ['FBC (low MCV)', 'Ferritin (low)', 'Coeliac serology; GI investigation to find the source'], keyPoints: ['Always identify the cause — exclude GI malignancy in men and postmenopausal women', 'Oral iron; recheck haemoglobin to confirm response', 'Ferritin can be falsely normal in inflammation'] },
  { id: 'F32', pathophysiology: 'Multifactorial — monoamine dysregulation, HPA-axis dysfunction and psychosocial stressors interact.', investigations: ['Clinical assessment (e.g. PHQ-9)', 'Exclude organic causes (TFTs, FBC)', 'Risk assessment for self-harm'], keyPoints: ['Always assess suicide risk', 'Psychological therapy ± SSRI for moderate/severe', 'Review within 1–2 weeks (sooner if young or high risk)', 'Safety-net and document a plan'] },
  { id: 'G45', pathophysiology: 'Transient focal cerebral ischaemia (often thromboembolic from a carotid or cardiac source) without infarction — a warning of impending stroke.', investigations: ['Urgent specialist review', 'Brain and carotid imaging', 'ECG for AF; bloods including glucose and lipids'], keyPoints: ['Give an antiplatelet immediately unless contraindicated', 'High early stroke risk — assess urgently', 'Treat AF and significant carotid stenosis', 'Advise on driving restrictions'] },
  { id: 'M06', pathophysiology: 'Autoimmune synovitis (associated with anti-CCP/RF) forms a pannus that erodes cartilage and bone, giving symmetrical small-joint polyarthritis.', investigations: ['Anti-CCP antibodies and rheumatoid factor', 'ESR/CRP', 'X-rays (erosions); joint ultrasound'], keyPoints: ['Start a DMARD (often methotrexate) early in the window of opportunity', 'Treat-to-target remission', 'Screen for extra-articular disease and cardiovascular risk'] },
  { id: 'J11', pathophysiology: 'Orthomyxovirus infection of respiratory epithelium; antigenic drift and shift drive seasonal epidemics.', investigations: ['Clinical diagnosis in season', 'PCR if confirmation needed', 'Chest X-ray if pneumonia suspected'], keyPoints: ['Supportive care for most', 'Antivirals within 48h for at-risk groups', 'Annual vaccination for prevention', 'Watch for secondary bacterial pneumonia'] },
  { id: 'U07', pathophysiology: 'SARS-CoV-2 enters via ACE2 receptors causing a respiratory and systemic inflammatory illness; severity varies with host risk factors.', investigations: ['PCR or antigen test', 'Pulse oximetry', 'Chest imaging if severe'], keyPoints: ['Most cases are mild and self-limiting', 'Antivirals for eligible high-risk patients', 'Watch for silent hypoxia and deterioration around day 7–10'] },
]

async function main() {
  const now = new Date().toISOString()
  let done = 0
  for (const t of T) {
    try {
      await doc.send(new UpdateCommand({
        TableName: TABLE,
        Key: { conditionId: t.id },
        UpdateExpression: 'SET pathophysiology = :p, investigations = :i, keyPoints = :k, updatedAt = :u',
        ExpressionAttributeValues: { ':p': t.pathophysiology, ':i': t.investigations, ':k': t.keyPoints, ':u': now },
        ConditionExpression: 'attribute_exists(conditionId)',
      }))
      console.log(`  ✓ ${t.id}`)
      done++
    } catch (e) {
      console.warn(`  ✗ ${t.id} — ${(e as Error).name}`)
    }
  }
  console.log(`Enriched ${done}/${T.length} conditions with teaching depth.`)
}

main().catch((e) => { console.error('import-teaching failed:', e?.message || e); process.exit(1) })
