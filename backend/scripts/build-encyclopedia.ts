/**
 * Medical Encyclopedia Builder
 * Uses Bright Data to discover and ingest medical knowledge
 */

import * as dotenv from 'dotenv'
import { brightDataService } from '../services/brightdata.service'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config()

interface MedicalCondition {
  name: string
  icd10Code: string
  category: string
  symptoms: string[]
  causes: string[]
  treatments: string[]
  sources: string[]
}

interface EncyclopediaEntry {
  condition: MedicalCondition
  researchPapers: any[]
  clinicalGuidelines: any[]
  textbookReferences: any[]
}

class MedicalEncyclopediaBuilder {
  private outputDir: string
  private conditions: MedicalCondition[]

  constructor() {
    this.outputDir = path.join(__dirname, '../../data/encyclopedia')
    this.ensureOutputDir()
    this.conditions = this.loadConditionsList()
  }

  /**
   * Load comprehensive list of medical conditions to research
   */
  private loadConditionsList(): MedicalCondition[] {
    return [
      // Cardiovascular
      {
        name: 'Acute Myocardial Infarction',
        icd10Code: 'I21',
        category: 'Cardiology',
        symptoms: ['chest pain', 'shortness of breath', 'nausea', 'sweating', 'arm pain'],
        causes: ['coronary artery disease', 'atherosclerosis', 'blood clot'],
        treatments: ['aspirin', 'thrombolytics', 'PCI', 'CABG'],
        sources: []
      },
      {
        name: 'Hypertension',
        icd10Code: 'I10',
        category: 'Cardiology',
        symptoms: ['headache', 'dizziness', 'blurred vision', 'chest pain'],
        causes: ['obesity', 'high sodium', 'stress', 'genetics'],
        treatments: ['ACE inhibitors', 'beta blockers', 'lifestyle changes'],
        sources: []
      },
      {
        name: 'Atrial Fibrillation',
        icd10Code: 'I48',
        category: 'Cardiology',
        symptoms: ['palpitations', 'fatigue', 'shortness of breath', 'dizziness'],
        causes: ['heart disease', 'hypertension', 'thyroid problems'],
        treatments: ['anticoagulants', 'rate control', 'cardioversion'],
        sources: []
      },

      // Endocrinology
      {
        name: 'Type 2 Diabetes Mellitus',
        icd10Code: 'E11',
        category: 'Endocrinology',
        symptoms: ['increased thirst', 'frequent urination', 'fatigue', 'blurred vision'],
        causes: ['insulin resistance', 'obesity', 'genetics', 'sedentary lifestyle'],
        treatments: ['metformin', 'insulin', 'lifestyle modification', 'GLP-1 agonists'],
        sources: []
      },
      {
        name: 'Hypothyroidism',
        icd10Code: 'E03',
        category: 'Endocrinology',
        symptoms: ['fatigue', 'weight gain', 'cold intolerance', 'constipation'],
        causes: ['autoimmune thyroiditis', 'iodine deficiency', 'medications'],
        treatments: ['levothyroxine', 'thyroid hormone replacement'],
        sources: []
      },

      // Pulmonology
      {
        name: 'Chronic Obstructive Pulmonary Disease',
        icd10Code: 'J44',
        category: 'Pulmonology',
        symptoms: ['chronic cough', 'shortness of breath', 'wheezing', 'chest tightness'],
        causes: ['smoking', 'air pollution', 'occupational exposure'],
        treatments: ['bronchodilators', 'corticosteroids', 'oxygen therapy', 'smoking cessation'],
        sources: []
      },
      {
        name: 'Asthma',
        icd10Code: 'J45',
        category: 'Pulmonology',
        symptoms: ['wheezing', 'shortness of breath', 'chest tightness', 'coughing'],
        causes: ['allergens', 'exercise', 'cold air', 'stress'],
        treatments: ['inhaled corticosteroids', 'bronchodilators', 'leukotriene modifiers'],
        sources: []
      },
      {
        name: 'Pneumonia',
        icd10Code: 'J18',
        category: 'Pulmonology',
        symptoms: ['fever', 'cough', 'chest pain', 'shortness of breath'],
        causes: ['bacteria', 'viruses', 'fungi'],
        treatments: ['antibiotics', 'antivirals', 'supportive care'],
        sources: []
      },

      // Neurology
      {
        name: 'Alzheimer Disease',
        icd10Code: 'G30',
        category: 'Neurology',
        symptoms: ['memory loss', 'confusion', 'difficulty speaking', 'personality changes'],
        causes: ['age', 'genetics', 'amyloid plaques', 'tau tangles'],
        treatments: ['cholinesterase inhibitors', 'memantine', 'supportive care'],
        sources: []
      },
      {
        name: 'Migraine',
        icd10Code: 'G43',
        category: 'Neurology',
        symptoms: ['severe headache', 'nausea', 'light sensitivity', 'aura'],
        causes: ['genetics', 'triggers', 'hormonal changes'],
        treatments: ['triptans', 'NSAIDs', 'preventive medications'],
        sources: []
      },
      {
        name: 'Stroke',
        icd10Code: 'I63',
        category: 'Neurology',
        symptoms: ['sudden weakness', 'speech difficulty', 'vision problems', 'severe headache'],
        causes: ['blood clot', 'hemorrhage', 'atherosclerosis'],
        treatments: ['thrombolytics', 'thrombectomy', 'rehabilitation'],
        sources: []
      },

      // Gastroenterology
      {
        name: 'Gastroesophageal Reflux Disease',
        icd10Code: 'K21',
        category: 'Gastroenterology',
        symptoms: ['heartburn', 'regurgitation', 'chest pain', 'difficulty swallowing'],
        causes: ['hiatal hernia', 'obesity', 'pregnancy', 'smoking'],
        treatments: ['PPIs', 'H2 blockers', 'lifestyle changes', 'surgery'],
        sources: []
      },
      {
        name: 'Inflammatory Bowel Disease',
        icd10Code: 'K50-K51',
        category: 'Gastroenterology',
        symptoms: ['abdominal pain', 'diarrhea', 'weight loss', 'fatigue'],
        causes: ['immune dysfunction', 'genetics', 'environmental factors'],
        treatments: ['aminosalicylates', 'corticosteroids', 'biologics', 'surgery'],
        sources: []
      },

      // Infectious Disease
      {
        name: 'COVID-19',
        icd10Code: 'U07.1',
        category: 'Infectious Disease',
        symptoms: ['fever', 'cough', 'fatigue', 'loss of taste/smell'],
        causes: ['SARS-CoV-2 virus'],
        treatments: ['antivirals', 'monoclonal antibodies', 'supportive care', 'vaccination'],
        sources: []
      },
      {
        name: 'Influenza',
        icd10Code: 'J10-J11',
        category: 'Infectious Disease',
        symptoms: ['fever', 'cough', 'body aches', 'fatigue'],
        causes: ['influenza virus'],
        treatments: ['antivirals', 'supportive care', 'vaccination'],
        sources: []
      },

      // Oncology
      {
        name: 'Lung Cancer',
        icd10Code: 'C34',
        category: 'Oncology',
        symptoms: ['persistent cough', 'chest pain', 'weight loss', 'hemoptysis'],
        causes: ['smoking', 'radon exposure', 'asbestos', 'genetics'],
        treatments: ['surgery', 'chemotherapy', 'radiation', 'immunotherapy'],
        sources: []
      },
      {
        name: 'Breast Cancer',
        icd10Code: 'C50',
        category: 'Oncology',
        symptoms: ['breast lump', 'nipple discharge', 'skin changes', 'pain'],
        causes: ['genetics', 'hormones', 'age', 'lifestyle factors'],
        treatments: ['surgery', 'chemotherapy', 'radiation', 'hormone therapy'],
        sources: []
      },

      // Rheumatology
      {
        name: 'Rheumatoid Arthritis',
        icd10Code: 'M05-M06',
        category: 'Rheumatology',
        symptoms: ['joint pain', 'swelling', 'stiffness', 'fatigue'],
        causes: ['autoimmune', 'genetics', 'environmental factors'],
        treatments: ['DMARDs', 'biologics', 'NSAIDs', 'physical therapy'],
        sources: []
      },
      {
        name: 'Osteoarthritis',
        icd10Code: 'M15-M19',
        category: 'Rheumatology',
        symptoms: ['joint pain', 'stiffness', 'reduced range of motion'],
        causes: ['age', 'obesity', 'joint injury', 'genetics'],
        treatments: ['NSAIDs', 'physical therapy', 'joint replacement'],
        sources: []
      },

      // Nephrology
      {
        name: 'Chronic Kidney Disease',
        icd10Code: 'N18',
        category: 'Nephrology',
        symptoms: ['fatigue', 'swelling', 'changes in urination', 'nausea'],
        causes: ['diabetes', 'hypertension', 'glomerulonephritis'],
        treatments: ['blood pressure control', 'dialysis', 'kidney transplant'],
        sources: []
      },

      // Dermatology
      {
        name: 'Psoriasis',
        icd10Code: 'L40',
        category: 'Dermatology',
        symptoms: ['red patches', 'silvery scales', 'itching', 'burning'],
        causes: ['immune system', 'genetics', 'triggers'],
        treatments: ['topical corticosteroids', 'phototherapy', 'biologics'],
        sources: []
      },
      {
        name: 'Melanoma',
        icd10Code: 'C43',
        category: 'Dermatology',
        symptoms: ['changing mole', 'irregular borders', 'color variation', 'diameter >6mm'],
        causes: ['UV exposure', 'genetics', 'fair skin'],
        treatments: ['surgical excision', 'immunotherapy', 'targeted therapy'],
        sources: []
      }
    ]
  }

  /**
   * Build complete encyclopedia
   */
  async buildEncyclopedia(): Promise<void> {
    console.log('🏥 Starting Medical Encyclopedia Build...')
    console.log(`📚 Processing ${this.conditions.length} medical conditions\n`)

    const entries: EncyclopediaEntry[] = []

    for (let i = 0; i < this.conditions.length; i++) {
      const condition = this.conditions[i]
      console.log(`\n[${i + 1}/${this.conditions.length}] Processing: ${condition.name}`)
      
      try {
        const entry = await this.buildConditionEntry(condition)
        entries.push(entry)
        
        // Save individual entry
        this.saveEntry(entry)
        
        // Rate limiting
        await this.sleep(3000)
      } catch (error) {
        console.error(`❌ Error processing ${condition.name}:`, error)
      }
    }

    // Save complete encyclopedia
    this.saveCompleteEncyclopedia(entries)
    
    console.log('\n✅ Encyclopedia build complete!')
    console.log(`📊 Total entries: ${entries.length}`)
    console.log(`📁 Output directory: ${this.outputDir}`)
  }

  /**
   * Build encyclopedia entry for a single condition
   */
  private async buildConditionEntry(condition: MedicalCondition): Promise<EncyclopediaEntry> {
    console.log(`  🔍 Discovering research papers...`)
    const researchPapers = await brightDataService.discoverMedicalResearch(
      `${condition.name} ${condition.icd10Code}`,
      ['pubmed', 'scholar']
    )
    console.log(`  ✓ Found ${researchPapers.length} research papers`)

    console.log(`  📋 Discovering clinical guidelines...`)
    const clinicalGuidelines = await brightDataService.discoverClinicalGuidelines(condition.name)
    console.log(`  ✓ Found ${clinicalGuidelines.length} clinical guidelines`)

    console.log(`  📖 Discovering textbook references...`)
    const textbookReferences = await brightDataService.discoverMedicalTextbooks(condition.category)
    console.log(`  ✓ Found ${textbookReferences.length} textbook references`)

    // Update condition with sources
    condition.sources = [
      ...researchPapers.map(p => p.url),
      ...clinicalGuidelines.map(g => g.url),
      ...textbookReferences.map(t => t.url)
    ].slice(0, 50) // Limit to top 50 sources

    return {
      condition,
      researchPapers: researchPapers.slice(0, 20),
      clinicalGuidelines: clinicalGuidelines.slice(0, 10),
      textbookReferences: textbookReferences.slice(0, 10)
    }
  }

  /**
   * Save individual entry
   */
  private saveEntry(entry: EncyclopediaEntry): void {
    const filename = `${entry.condition.icd10Code.replace(/[^a-zA-Z0-9]/g, '_')}_${entry.condition.name.replace(/\s+/g, '_')}.json`
    const filepath = path.join(this.outputDir, 'conditions', filename)
    
    fs.writeFileSync(filepath, JSON.stringify(entry, null, 2))
    console.log(`  💾 Saved to: ${filename}`)
  }

  /**
   * Save complete encyclopedia
   */
  private saveCompleteEncyclopedia(entries: EncyclopediaEntry[]): void {
    const filepath = path.join(this.outputDir, 'complete_encyclopedia.json')
    fs.writeFileSync(filepath, JSON.stringify(entries, null, 2))
    
    // Also save a summary
    const summary = {
      totalConditions: entries.length,
      categories: this.getCategorySummary(entries),
      totalSources: entries.reduce((sum, e) => sum + e.condition.sources.length, 0),
      buildDate: new Date().toISOString()
    }
    
    const summaryPath = path.join(this.outputDir, 'encyclopedia_summary.json')
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
  }

  /**
   * Get category summary
   */
  private getCategorySummary(entries: EncyclopediaEntry[]): Record<string, number> {
    const summary: Record<string, number> = {}
    
    entries.forEach(entry => {
      const category = entry.condition.category
      summary[category] = (summary[category] || 0) + 1
    })
    
    return summary
  }

  /**
   * Ensure output directory exists
   */
  private ensureOutputDir(): void {
    const dirs = [
      this.outputDir,
      path.join(this.outputDir, 'conditions'),
      path.join(this.outputDir, 'research'),
      path.join(this.outputDir, 'guidelines')
    ]
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    })
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Run the builder
async function main() {
  try {
    const builder = new MedicalEncyclopediaBuilder()
    await builder.buildEncyclopedia()
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

main()

// Made with Bob
