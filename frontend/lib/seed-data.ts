// Verified encyclopedia seed — the grounded knowledge base the quorum reasons within.
//
// Curation principle (governor rule): every condition is anchored to authoritative,
// verifiable sources — landmark consensus definitions and national/international
// clinical guideline bodies (NICE, ESC, IDSA/ATS, ADA, GOLD, GINA, KDIGO, AHA/ASA,
// WHO, CDC). Stable guideline URLs are used rather than risk inexact identifiers.
// This is a curated DEMO subset, not an exhaustive corpus — see roadmap.

import type { ConditionEntry } from './types'

const now = () => new Date().toISOString()

export const SEED_CONDITIONS: ConditionEntry[] = [
  {
    conditionId: 'A41', name: 'Sepsis', icd10Code: 'A41.9', category: 'Infectious Disease',
    symptoms: ['fever', 'rapid heart rate', 'rapid breathing', 'confusion', 'low blood pressure', 'raised white cell count', 'raised lactate'],
    redFlags: ['systolic BP < 90 mmHg', 'lactate > 2 mmol/L', 'altered mental state', 'mottled skin'],
    causes: ['bacterial infection', 'fungal infection', 'viral infection'],
    treatments: ['early broad-spectrum antibiotics', 'IV fluid resuscitation', 'source control', 'vasopressors if refractory'],
    differentials: ['septic shock', 'hypovolaemia', 'cardiogenic shock', 'anaphylaxis'],
    citations: [
      { id: 'sepsis-3', title: 'The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3)', source: 'JAMA (Singer et al.)', url: 'https://jamanetwork.com/journals/jama/fullarticle/2492881', identifier: 'doi:10.1001/jama.2016.0287', year: 2016 },
      { id: 'ssc-2021', title: 'Surviving Sepsis Campaign: International Guidelines 2021', source: 'SCCM/ESICM', url: 'https://www.sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-guidelines-2021', year: 2021 },
    ], updatedAt: now(),
  },
  {
    conditionId: 'J18', name: 'Community-acquired pneumonia', icd10Code: 'J18.9', category: 'Respiratory',
    symptoms: ['fever', 'productive cough', 'pleuritic chest pain', 'dyspnoea', 'raised CRP', 'crackles on auscultation'],
    redFlags: ['SpO2 < 92%', 'confusion (CURB-65)', 'respiratory rate >= 30', 'systolic BP < 90 mmHg'],
    causes: ['Streptococcus pneumoniae', 'Haemophilus influenzae', 'Mycoplasma pneumoniae', 'respiratory viruses'],
    treatments: ['antibiotics per severity (CURB-65)', 'oxygen', 'fluids', 'analgesia'],
    differentials: ['pulmonary embolism', 'acute bronchitis', 'heart failure', 'COVID-19'],
    citations: [
      { id: 'cap-nice', title: 'Pneumonia (community-acquired): antimicrobial prescribing', source: 'NICE', url: 'https://www.nice.org.uk/guidance/ng138', identifier: 'NG138', year: 2019 },
      { id: 'cap-idsa', title: 'Diagnosis and Treatment of Adults with Community-acquired Pneumonia', source: 'ATS/IDSA', url: 'https://www.atsjournals.org/doi/10.1164/rccm.201908-1581ST', identifier: 'doi:10.1164/rccm.201908-1581ST', year: 2019 },
    ], updatedAt: now(),
  },
  {
    conditionId: 'I21', name: 'ST-elevation myocardial infarction (STEMI)', icd10Code: 'I21.3', category: 'Cardiovascular',
    symptoms: ['central chest pain', 'radiation to arm or jaw', 'sweating', 'nausea', 'dyspnoea', 'ST-segment elevation on ECG', 'elevated troponin'],
    redFlags: ['ongoing chest pain', 'haemodynamic instability', 'new ST elevation', 'cardiac arrest'],
    causes: ['coronary plaque rupture', 'coronary thrombosis'],
    treatments: ['primary PCI within 90 minutes', 'dual antiplatelet therapy', 'aspirin 300 mg', 'anticoagulation'],
    differentials: ['NSTEMI / unstable angina', 'pericarditis', 'aortic dissection', 'pulmonary embolism'],
    citations: [
      { id: 'mi-4thdef', title: 'Fourth Universal Definition of Myocardial Infarction (2018)', source: 'ESC/ACC/AHA/WHF (Thygesen et al.)', url: 'https://academic.oup.com/eurheartj/article/40/3/237/5079081', identifier: 'doi:10.1093/eurheartj/ehy462', year: 2018 },
      { id: 'mi-esc-acs', title: 'ESC Guidelines for the management of acute coronary syndromes', source: 'ESC', url: 'https://academic.oup.com/eurheartj/article/44/38/3720/7243210', identifier: 'doi:10.1093/eurheartj/ehad191', year: 2023 },
    ], updatedAt: now(),
  },
  {
    conditionId: 'I26', name: 'Pulmonary embolism', icd10Code: 'I26.9', category: 'Cardiovascular',
    symptoms: ['pleuritic chest pain', 'dyspnoea', 'tachycardia', 'haemoptysis', 'hypoxia', 'calf swelling'],
    redFlags: ['syncope', 'hypotension', 'right heart strain on echo'],
    causes: ['deep vein thrombosis', 'immobility', 'malignancy', 'thrombophilia'],
    treatments: ['anticoagulation', 'thrombolysis if massive PE', 'oxygen'],
    differentials: ['community-acquired pneumonia', 'acute coronary syndrome', 'aortic dissection', 'pneumothorax'],
    citations: [
      { id: 'pe-esc', title: 'ESC Guidelines for the diagnosis and management of acute pulmonary embolism', source: 'ESC', url: 'https://academic.oup.com/eurheartj/article/41/4/543/5556136', identifier: 'doi:10.1093/eurheartj/ehz405', year: 2020 },
    ], updatedAt: now(),
  },
  {
    conditionId: 'I63', name: 'Acute ischaemic stroke', icd10Code: 'I63.9', category: 'Neurology',
    symptoms: ['sudden facial droop', 'arm weakness', 'speech disturbance', 'visual loss', 'unilateral numbness'],
    redFlags: ['symptom onset < 4.5 hours (thrombolysis window)', 'reduced consciousness', 'large vessel occlusion signs'],
    causes: ['cerebral artery thromboembolism', 'atrial fibrillation', 'carotid atherosclerosis'],
    treatments: ['IV thrombolysis if eligible', 'mechanical thrombectomy for LVO', 'stroke-unit care', 'antiplatelets'],
    differentials: ['intracerebral haemorrhage', 'hypoglycaemia', 'seizure with Todd paresis', 'migraine aura'],
    citations: [
      { id: 'stroke-aha', title: 'Guidelines for the Early Management of Patients With Acute Ischemic Stroke', source: 'AHA/ASA', url: 'https://www.ahajournals.org/doi/10.1161/STR.0000000000000211', identifier: 'doi:10.1161/STR.0000000000000211', year: 2019 },
    ], updatedAt: now(),
  },
  {
    conditionId: 'J44', name: 'COPD exacerbation', icd10Code: 'J44.1', category: 'Respiratory',
    symptoms: ['increased breathlessness', 'increased sputum volume', 'sputum purulence', 'wheeze', 'cough'],
    redFlags: ['acidotic respiratory failure', 'SpO2 below target', 'confusion', 'use of accessory muscles'],
    causes: ['respiratory infection', 'air pollutants', 'smoking'],
    treatments: ['controlled oxygen', 'inhaled bronchodilators', 'oral corticosteroids', 'antibiotics if infective', 'NIV for type 2 failure'],
    differentials: ['heart failure', 'pneumonia', 'pulmonary embolism', 'asthma'],
    citations: [
      { id: 'copd-gold', title: 'Global Strategy for Prevention, Diagnosis and Management of COPD (GOLD Report)', source: 'GOLD', url: 'https://goldcopd.org/2024-gold-report/', year: 2024 },
      { id: 'copd-nice', title: 'Chronic obstructive pulmonary disease in over 16s: diagnosis and management', source: 'NICE', url: 'https://www.nice.org.uk/guidance/ng115', identifier: 'NG115', year: 2019 },
    ], updatedAt: now(),
  },
  {
    conditionId: 'J45', name: 'Asthma exacerbation', icd10Code: 'J45.901', category: 'Respiratory',
    symptoms: ['wheeze', 'breathlessness', 'chest tightness', 'cough', 'reduced peak flow'],
    redFlags: ['silent chest', 'SpO2 < 92%', 'exhaustion', 'PEF < 33% predicted'],
    causes: ['allergen exposure', 'viral infection', 'poor adherence', 'exercise'],
    treatments: ['high-dose inhaled SABA', 'oral or IV corticosteroids', 'oxygen to target', 'ipratropium', 'magnesium sulphate if severe'],
    differentials: ['COPD', 'anaphylaxis', 'inhaled foreign body', 'vocal cord dysfunction'],
    citations: [
      { id: 'asthma-gina', title: 'Global Strategy for Asthma Management and Prevention (GINA)', source: 'GINA', url: 'https://ginasthma.org/2024-report/', year: 2024 },
      { id: 'asthma-bts', title: 'BTS/SIGN British Guideline on the Management of Asthma', source: 'BTS/SIGN', url: 'https://www.brit-thoracic.org.uk/quality-improvement/guidelines/asthma/', year: 2019 },
    ], updatedAt: now(),
  },
  {
    conditionId: 'E11', name: 'Type 2 diabetes mellitus', icd10Code: 'E11.9', category: 'Endocrinology',
    symptoms: ['polyuria', 'polydipsia', 'fatigue', 'blurred vision', 'unintended weight loss', 'raised HbA1c'],
    redFlags: ['ketones with hyperglycaemia', 'HbA1c very high', 'dehydration', 'reduced consciousness (HHS)'],
    causes: ['insulin resistance', 'relative insulin deficiency', 'obesity', 'genetic predisposition'],
    treatments: ['lifestyle modification', 'metformin first-line', 'SGLT2 inhibitors / GLP-1 agonists', 'individualised HbA1c targets'],
    differentials: ['type 1 diabetes', 'diabetes insipidus', 'secondary diabetes', 'MODY'],
    citations: [
      { id: 'dm-ada', title: 'Standards of Care in Diabetes', source: 'American Diabetes Association', url: 'https://diabetesjournals.org/care/issue/47/Supplement_1', identifier: 'Diabetes Care Suppl', year: 2024 },
      { id: 'dm-nice', title: 'Type 2 diabetes in adults: management', source: 'NICE', url: 'https://www.nice.org.uk/guidance/ng28', identifier: 'NG28', year: 2022 },
    ], updatedAt: now(),
  },
  {
    conditionId: 'I10', name: 'Essential hypertension', icd10Code: 'I10', category: 'Cardiovascular',
    symptoms: ['often asymptomatic', 'headache', 'elevated clinic blood pressure', 'raised ambulatory blood pressure'],
    redFlags: ['BP >= 180/120 with symptoms (hypertensive emergency)', 'papilloedema', 'chest pain', 'neurological deficit'],
    causes: ['primary/essential', 'renal disease', 'endocrine causes', 'high salt intake'],
    treatments: ['lifestyle modification', 'ACE inhibitor or ARB', 'calcium channel blocker', 'thiazide-like diuretic'],
    differentials: ['white-coat hypertension', 'secondary hypertension', 'phaeochromocytoma', 'primary aldosteronism'],
    citations: [
      { id: 'htn-nice', title: 'Hypertension in adults: diagnosis and management', source: 'NICE', url: 'https://www.nice.org.uk/guidance/ng136', identifier: 'NG136', year: 2023 },
      { id: 'htn-esc', title: 'ESH Guidelines for the management of arterial hypertension', source: 'ESH', url: 'https://journals.lww.com/jhypertension/fulltext/2023/12000/2023_esh_guidelines.2.aspx', year: 2023 },
    ], updatedAt: now(),
  },
  {
    conditionId: 'N39', name: 'Urinary tract infection', icd10Code: 'N39.0', category: 'Genitourinary',
    symptoms: ['dysuria', 'urinary frequency', 'urgency', 'suprapubic pain', 'cloudy urine'],
    redFlags: ['loin pain and fever (pyelonephritis)', 'rigors', 'systemic sepsis features', 'pregnancy'],
    causes: ['Escherichia coli', 'other coliforms', 'catheter-associated organisms'],
    treatments: ['short-course antibiotics per local resistance', 'increased fluids', 'analgesia'],
    differentials: ['pyelonephritis', 'vaginitis', 'urethritis (STI)', 'bladder pain syndrome'],
    citations: [
      { id: 'uti-nice', title: 'Urinary tract infection (lower): antimicrobial prescribing', source: 'NICE', url: 'https://www.nice.org.uk/guidance/ng109', identifier: 'NG109', year: 2018 },
    ], updatedAt: now(),
  },
  {
    conditionId: 'N17', name: 'Acute kidney injury', icd10Code: 'N17.9', category: 'Renal',
    symptoms: ['reduced urine output', 'rising serum creatinine', 'fluid overload', 'fatigue', 'nausea'],
    redFlags: ['hyperkalaemia', 'severe acidosis', 'pulmonary oedema', 'uraemic encephalopathy'],
    causes: ['pre-renal hypoperfusion', 'sepsis', 'nephrotoxins', 'obstruction'],
    treatments: ['treat underlying cause', 'optimise fluid status', 'stop nephrotoxins', 'renal replacement therapy if indicated'],
    differentials: ['chronic kidney disease', 'acute-on-chronic kidney disease', 'urinary obstruction'],
    citations: [
      { id: 'aki-kdigo', title: 'KDIGO Clinical Practice Guideline for Acute Kidney Injury', source: 'KDIGO', url: 'https://kdigo.org/guidelines/acute-kidney-injury/', identifier: 'Kidney Int Suppl', year: 2012 },
    ], updatedAt: now(),
  },
  {
    conditionId: 'G00', name: 'Bacterial meningitis', icd10Code: 'G00.9', category: 'Neurology',
    symptoms: ['fever', 'severe headache', 'neck stiffness', 'photophobia', 'altered consciousness', 'non-blanching rash (meningococcal)'],
    redFlags: ['reduced GCS', 'purpuric rash', 'seizures', 'focal neurology', 'shock'],
    causes: ['Neisseria meningitidis', 'Streptococcus pneumoniae', 'Haemophilus influenzae', 'Listeria (extremes of age)'],
    treatments: ['immediate empirical IV antibiotics (do not delay for LP)', 'dexamethasone', 'supportive care', 'public health notification'],
    differentials: ['viral meningitis', 'encephalitis', 'subarachnoid haemorrhage', 'brain abscess'],
    citations: [
      { id: 'men-idsa', title: 'Practice Guidelines for the Management of Bacterial Meningitis', source: 'IDSA', url: 'https://academic.oup.com/cid/article/39/9/1267/402080', identifier: 'doi:10.1086/425368', year: 2004 },
      { id: 'men-nice', title: 'Meningitis (bacterial) and meningococcal disease: recognition, diagnosis and management', source: 'NICE', url: 'https://www.nice.org.uk/guidance/ng240', identifier: 'NG240', year: 2024 },
    ], updatedAt: now(),
  },
]
