/**
 * Direct Medical Encyclopedia Builder
 * 
 * Bypasses SERP API and directly crawls known medical URLs
 * More efficient use of $250 Bright Data budget
 * 
 * Strategy:
 * - Use known medical URLs for each condition
 * - Direct crawling via Bright Data Crawl API
 * - Focus budget on content extraction, not discovery
 */

import * as dotenv from 'dotenv'
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config()

interface MedicalCondition {
  name: string
  icd10Code: string
  category: string
  keywords: string[]
  knownUrls: string[]
}

interface CrawlResult {
  url: string
  title: string
  content: string
  success: boolean
}

class DirectEncyclopediaBuilder {
  private outputDir: string
  private conditions: MedicalCondition[]
  private budgetRemaining: number = 250
  private budgetUsed: number = 0
  private apiKey: string
  private crawlEndpoint: string

  constructor() {
    this.outputDir = path.join(__dirname, '../../data/encyclopedia')
    this.ensureOutputDir()
    this.apiKey = process.env.BRIGHT_DATA_API_KEY || ''
    this.crawlEndpoint = `https://api.brightdata.com/request`
    this.conditions = this.loadConditionsWithUrls()
  }

  /**
   * Load conditions with pre-built URLs for known medical sites
   */
  private loadConditionsWithUrls(): MedicalCondition[] {
    return [
      // CARDIOLOGY
      {
        name: 'Acute Myocardial Infarction',
        icd10Code: 'I21',
        category: 'Cardiology',
        keywords: ['heart attack', 'myocardial infarction', 'MI', 'STEMI', 'NSTEMI'],
        knownUrls: [
          'https://www.mayoclinic.org/diseases-conditions/heart-attack/symptoms-causes/syc-20373106',
          'https://www.webmd.com/heart-disease/guide/heart-disease-heart-attacks',
          'https://medlineplus.gov/heartattack.html',
          'https://www.heart.org/en/health-topics/heart-attack',
          'https://www.nhlbi.nih.gov/health/heart-attack'
        ]
      },
      {
        name: 'Hypertension',
        icd10Code: 'I10',
        category: 'Cardiology',
        keywords: ['high blood pressure', 'hypertension', 'HTN'],
        knownUrls: [
          'https://www.mayoclinic.org/diseases-conditions/high-blood-pressure/symptoms-causes/syc-20373410',
          'https://www.webmd.com/hypertension-high-blood-pressure/default.htm',
          'https://medlineplus.gov/highbloodpressure.html',
          'https://www.heart.org/en/health-topics/high-blood-pressure',
          'https://www.cdc.gov/bloodpressure/index.htm'
        ]
      },
      {
        name: 'Atrial Fibrillation',
        icd10Code: 'I48',
        category: 'Cardiology',
        keywords: ['AFib', 'atrial fibrillation', 'irregular heartbeat'],
        knownUrls: [
          'https://www.mayoclinic.org/diseases-conditions/atrial-fibrillation/symptoms-causes/syc-20350624',
          'https://www.webmd.com/heart-disease/atrial-fibrillation/default.htm',
          'https://medlineplus.gov/atrialfibrillation.html',
          'https://www.heart.org/en/health-topics/atrial-fibrillation',
          'https://www.nhlbi.nih.gov/health/atrial-fibrillation'
        ]
      },

      // ENDOCRINOLOGY
      {
        name: 'Type 2 Diabetes Mellitus',
        icd10Code: 'E11',
        category: 'Endocrinology',
        keywords: ['diabetes', 'type 2 diabetes', 'T2DM', 'insulin resistance'],
        knownUrls: [
          'https://www.mayoclinic.org/diseases-conditions/type-2-diabetes/symptoms-causes/syc-20351193',
          'https://www.webmd.com/diabetes/type-2-diabetes',
          'https://medlineplus.gov/diabetestype2.html',
          'https://www.cdc.gov/diabetes/basics/type2.html',
          'https://www.niddk.nih.gov/health-information/diabetes/overview/what-is-diabetes/type-2-diabetes'
        ]
      },
      {
        name: 'Hypothyroidism',
        icd10Code: 'E03',
        category: 'Endocrinology',
        keywords: ['hypothyroidism', 'underactive thyroid', 'low thyroid'],
        knownUrls: [
          'https://www.mayoclinic.org/diseases-conditions/hypothyroidism/symptoms-causes/syc-20350284',
          'https://www.webmd.com/women/hypothyroidism-underactive-thyroid-symptoms-causes-treatments',
          'https://medlineplus.gov/hypothyroidism.html',
          'https://www.niddk.nih.gov/health-information/endocrine-diseases/hypothyroidism'
        ]
      },

      // PULMONOLOGY
      {
        name: 'Chronic Obstructive Pulmonary Disease',
        icd10Code: 'J44',
        category: 'Pulmonology',
        keywords: ['COPD', 'chronic bronchitis', 'emphysema'],
        knownUrls: [
          'https://www.mayoclinic.org/diseases-conditions/copd/symptoms-causes/syc-20353679',
          'https://www.webmd.com/lung/copd/default.htm',
          'https://medlineplus.gov/copd.html',
          'https://www.lung.org/lung-health-diseases/lung-disease-lookup/copd',
          'https://www.nhlbi.nih.gov/health/copd'
        ]
      },
      {
        name: 'Asthma',
        icd10Code: 'J45',
        category: 'Pulmonology',
        keywords: ['asthma', 'bronchial asthma', 'reactive airway'],
        knownUrls: [
          'https://www.mayoclinic.org/diseases-conditions/asthma/symptoms-causes/syc-20369653',
          'https://www.webmd.com/asthma/default.htm',
          'https://medlineplus.gov/asthma.html',
          'https://www.lung.org/lung-health-diseases/lung-disease-lookup/asthma',
          'https://www.cdc.gov/asthma/default.htm'
        ]
      },
      {
        name: 'Pneumonia',
        icd10Code: 'J18',
        category: 'Pulmonology',
        keywords: ['pneumonia', 'lung infection', 'pneumonitis'],
        knownUrls: [
          'https://www.mayoclinic.org/diseases-conditions/pneumonia/symptoms-causes/syc-20354204',
          'https://www.webmd.com/lung/understanding-pneumonia-basics',
          'https://medlineplus.gov/pneumonia.html',
          'https://www.lung.org/lung-health-diseases/lung-disease-lookup/pneumonia',
          'https://www.cdc.gov/pneumonia/index.html'
        ]
      },

      // NEUROLOGY
      {
        name: 'Stroke',
        icd10Code: 'I63',
        category: 'Neurology',
        keywords: ['stroke', 'CVA', 'cerebrovascular accident', 'brain attack'],
        knownUrls: [
          'https://www.mayoclinic.org/diseases-conditions/stroke/symptoms-causes/syc-20350113',
          'https://www.webmd.com/stroke/default.htm',
          'https://medlineplus.gov/stroke.html',
          'https://www.stroke.org/en/about-stroke',
          'https://www.cdc.gov/stroke/index.htm'
        ]
      },
      {
        name: 'Alzheimer Disease',
        icd10Code: 'G30',
        category: 'Neurology',
        keywords: ['Alzheimer', 'dementia', 'memory loss', 'cognitive decline'],
        knownUrls: [
          'https://www.mayoclinic.org/diseases-conditions/alzheimers-disease/symptoms-causes/syc-20350447',
          'https://www.webmd.com/alzheimers/default.htm',
          'https://medlineplus.gov/alzheimersdisease.html',
          'https://www.alz.org/alzheimers-dementia/what-is-alzheimers',
          'https://www.nia.nih.gov/health/alzheimers-disease-fact-sheet'
        ]
      }
    ]
  }

  /**
   * Ensure output directory exists
   */
  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
  }

  /**
   * Build encyclopedia by directly crawling known URLs
   */
  async buildEncyclopedia(): Promise<void> {
    console.log('🏥 Direct Medical Encyclopedia Builder')
    console.log('=' .repeat(60))
    console.log(`📊 Total Conditions: ${this.conditions.length}`)
    console.log(`💰 Budget: $${this.budgetRemaining}`)
    console.log(`🎯 Strategy: Direct URL crawling (no SERP API)`)
    console.log('=' .repeat(60))
    console.log('')

    let processedCount = 0
    const startTime = Date.now()

    for (const condition of this.conditions) {
      if (this.budgetRemaining <= 10) {
        console.log(`\n⚠️  Budget low ($${this.budgetRemaining.toFixed(2)} remaining). Stopping.`)
        break
      }

      try {
        console.log(`\n[${++processedCount}/${this.conditions.length}] Processing: ${condition.name}`)
        console.log(`   Category: ${condition.category} | ICD-10: ${condition.icd10Code}`)
        console.log(`   URLs to crawl: ${condition.knownUrls.length}`)
        console.log(`   Budget remaining: $${this.budgetRemaining.toFixed(2)}`)

        const results = await this.crawlConditionUrls(condition)
        await this.saveConditionData(condition, results)

        console.log(`   ✅ Saved ${results.filter(r => r.success).length}/${results.length} sources`)
        
        // Rate limiting
        await this.sleep(2000)
      } catch (error) {
        console.error(`   ❌ Error processing ${condition.name}:`, error)
      }
    }

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2)
    console.log('\n' + '='.repeat(60))
    console.log('📊 Encyclopedia Build Complete!')
    console.log(`   Processed: ${processedCount} conditions`)
    console.log(`   Budget used: $${this.budgetUsed.toFixed(2)}`)
    console.log(`   Budget remaining: $${this.budgetRemaining.toFixed(2)}`)
    console.log(`   Duration: ${duration} minutes`)
    console.log('='.repeat(60))
  }

  /**
   * Crawl all URLs for a condition using Bright Data
   */
  private async crawlConditionUrls(condition: MedicalCondition): Promise<CrawlResult[]> {
    const results: CrawlResult[] = []

    for (const url of condition.knownUrls) {
      try {
        console.log(`     Crawling: ${url}`)
        
        const response = await axios.post(
          this.crawlEndpoint,
          {
            url: url,
            format: 'raw',
            zone: process.env.BRIGHT_DATA_UNLOCKER_ZONE || 'omniscan_unlocker'
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        )

        if (response.data) {
          results.push({
            url,
            title: this.extractTitle(response.data),
            content: this.extractContent(response.data),
            success: true
          })

          // Estimate cost: ~$0.02 per page
          this.updateBudget(0.02)
          console.log(`     ✓ Success`)
        }
      } catch (error: any) {
        console.log(`     ✗ Failed: ${error.message}`)
        results.push({
          url,
          title: '',
          content: '',
          success: false
        })
      }

      // Rate limiting between requests
      await this.sleep(1000)
    }

    return results
  }

  /**
   * Extract title from HTML
   */
  private extractTitle(html: string): string {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    return titleMatch ? titleMatch[1].trim() : 'Unknown Title'
  }

  /**
   * Extract main content from HTML (simple text extraction)
   */
  private extractContent(html: string): string {
    // Remove scripts and styles
    let content = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    
    // Remove HTML tags
    content = content.replace(/<[^>]+>/g, ' ')
    
    // Clean up whitespace
    content = content.replace(/\s+/g, ' ').trim()
    
    // Limit to first 5000 characters
    return content.substring(0, 5000)
  }

  /**
   * Save condition data to file
   */
  private async saveConditionData(condition: MedicalCondition, results: CrawlResult[]): Promise<void> {
    const data = {
      condition: {
        name: condition.name,
        icd10Code: condition.icd10Code,
        category: condition.category,
        keywords: condition.keywords
      },
      sources: results.filter(r => r.success),
      totalSources: results.filter(r => r.success).length,
      lastUpdated: new Date().toISOString()
    }

    const filename = `${condition.icd10Code.replace(/\./g, '_')}_${condition.name.replace(/\s+/g, '_')}.json`
    const filepath = path.join(this.outputDir, filename)
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2))
  }

  /**
   * Update budget tracking
   */
  private updateBudget(cost: number): void {
    this.budgetUsed += cost
    this.budgetRemaining -= cost
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
  const builder = new DirectEncyclopediaBuilder()
  await builder.buildEncyclopedia()
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error)
}

export { DirectEncyclopediaBuilder }

// Made with Bob
