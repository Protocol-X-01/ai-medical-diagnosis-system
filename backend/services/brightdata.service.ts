/**
 * Bright Data Integration Service
 * Handles medical literature discovery, crawling, and data extraction
 */

import axios, { AxiosInstance } from 'axios'

interface BrightDataConfig {
  apiKey: string
  unlockerZone: string
  serpZone: string
  browserZone: string
}

interface SERPResult {
  title: string
  url: string
  snippet: string
  position: number
  source: string
}

interface CrawlResult {
  url: string
  title: string
  content: string
  html: string
  metadata: {
    authors?: string[]
    publishDate?: string
    journal?: string
    doi?: string
    pmid?: string
  }
  extractedText: string
}

export class BrightDataService {
  private config: BrightDataConfig
  private serpClient: AxiosInstance
  private crawlClient: AxiosInstance
  private browserClient: AxiosInstance

  constructor(config: BrightDataConfig) {
    this.config = config

    // SERP API Client
    this.serpClient = axios.create({
      baseURL: 'https://api.brightdata.com/serp',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    // Crawl API Client
    this.crawlClient = axios.create({
      baseURL: 'https://api.brightdata.com/datasets/v3',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    // Browser API Client (for complex sites)
    this.browserClient = axios.create({
      baseURL: 'https://api.brightdata.com/browser',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * Discover medical research papers using SERP API
   */
  async discoverMedicalResearch(query: string, sources: string[] = ['pubmed', 'scholar', 'nih']): Promise<SERPResult[]> {
    try {
      const results: SERPResult[] = []

      for (const source of sources) {
        const searchQuery = this.buildMedicalQuery(query, source)
        
        const response = await this.serpClient.post('/search', {
          query: searchQuery,
          country: 'us',
          language: 'en',
          num_results: 50,
          zone: this.config.serpZone
        })

        if (response.data?.organic_results) {
          results.push(...response.data.organic_results.map((result: any) => ({
            title: result.title,
            url: result.link,
            snippet: result.snippet,
            position: result.position,
            source: source
          })))
        }
      }

      return results
    } catch (error) {
      console.error('SERP API Error:', error)
      throw new Error(`Failed to discover medical research: ${error}`)
    }
  }

  /**
   * Crawl medical websites and extract structured data
   */
  async crawlMedicalContent(urls: string[]): Promise<CrawlResult[]> {
    try {
      const response = await this.crawlClient.post('/trigger', {
        dataset_id: 'gd_l7q7dkf244hwjntr0',  // Web scraper dataset
        discover_by: 'url_list',
        url_list: urls,
        format: 'json',
        include_errors: true,
        notify: false
      })

      const snapshotId = response.data.snapshot_id

      // Poll for results
      const results = await this.pollCrawlResults(snapshotId)
      
      return results.map((item: any) => this.parseMedicalContent(item))
    } catch (error) {
      console.error('Crawl API Error:', error)
      throw new Error(`Failed to crawl medical content: ${error}`)
    }
  }

  /**
   * Use Browser API for complex medical sites (requires JavaScript)
   */
  async crawlComplexSite(url: string): Promise<CrawlResult> {
    try {
      const response = await this.browserClient.post('/scrape', {
        url: url,
        zone: this.config.browserZone,
        format: 'json',
        wait_for_selector: 'article, .abstract, .content',
        extract: {
          title: 'h1',
          authors: '.author-list .author',
          abstract: '.abstract p',
          content: 'article, .main-content',
          metadata: {
            journal: '.journal-name',
            date: '.publication-date',
            doi: '[data-doi]',
            pmid: '[data-pmid]'
          }
        }
      })

      return this.parseMedicalContent(response.data)
    } catch (error) {
      console.error('Browser API Error:', error)
      throw new Error(`Failed to crawl complex site: ${error}`)
    }
  }

  /**
   * Discover and crawl medical textbooks
   */
  async discoverMedicalTextbooks(specialty: string): Promise<SERPResult[]> {
    const queries = [
      `${specialty} medical textbook PDF`,
      `${specialty} clinical guidelines`,
      `${specialty} medical education resources`,
      `open access ${specialty} textbook`
    ]

    const results: SERPResult[] = []

    for (const query of queries) {
      const discovered = await this.discoverMedicalResearch(query, ['scholar', 'nih'])
      results.push(...discovered)
    }

    // Filter for legitimate sources
    return results.filter(result => 
      this.isLegitimateSource(result.url)
    )
  }

  /**
   * Discover clinical guidelines from major organizations
   */
  async discoverClinicalGuidelines(condition: string): Promise<SERPResult[]> {
    const organizations = [
      'WHO',
      'CDC',
      'NIH',
      'NICE',
      'AHA',
      'ACC',
      'ESC',
      'ADA',
      'IDSA'
    ]

    const results: SERPResult[] = []

    for (const org of organizations) {
      const query = `${org} ${condition} clinical guidelines`
      const discovered = await this.discoverMedicalResearch(query, ['scholar'])
      results.push(...discovered)
    }

    return results
  }

  /**
   * Build specialized medical search query
   */
  private buildMedicalQuery(query: string, source: string): string {
    const sourceQueries: Record<string, string> = {
      'pubmed': `site:pubmed.ncbi.nlm.nih.gov ${query}`,
      'scholar': `site:scholar.google.com ${query} medical research`,
      'nih': `site:nih.gov ${query}`,
      'who': `site:who.int ${query}`,
      'cdc': `site:cdc.gov ${query}`,
      'cochrane': `site:cochranelibrary.com ${query}`
    }

    return sourceQueries[source] || query
  }

  /**
   * Parse medical content from crawl results
   */
  private parseMedicalContent(data: any): CrawlResult {
    return {
      url: data.url || '',
      title: data.title || '',
      content: data.content || '',
      html: data.html || '',
      metadata: {
        authors: data.authors || [],
        publishDate: data.publication_date || data.date,
        journal: data.journal,
        doi: data.doi,
        pmid: data.pmid
      },
      extractedText: this.extractCleanText(data.content || data.html)
    }
  }

  /**
   * Extract clean text from HTML
   */
  private extractCleanText(html: string): string {
    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, ' ')
    
    // Remove extra whitespace
    text = text.replace(/\s+/g, ' ').trim()
    
    // Remove special characters but keep medical notation
    text = text.replace(/[^\w\s\-.,;:()\[\]\/]/g, '')
    
    return text
  }

  /**
   * Poll for crawl results
   */
  private async pollCrawlResults(snapshotId: string, maxAttempts: number = 30): Promise<any[]> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await this.crawlClient.get(`/snapshot/${snapshotId}`)
        
        if (response.data.status === 'ready') {
          return response.data.data || []
        }
        
        // Wait 10 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 10000))
      } catch (error) {
        console.error(`Poll attempt ${i + 1} failed:`, error)
      }
    }
    
    throw new Error('Crawl timeout: Results not ready')
  }

  /**
   * Check if URL is from legitimate medical source
   */
  private isLegitimateSource(url: string): boolean {
    const legitimateDomains = [
      'pubmed.ncbi.nlm.nih.gov',
      'nih.gov',
      'who.int',
      'cdc.gov',
      'cochranelibrary.com',
      'nejm.org',
      'thelancet.com',
      'bmj.com',
      'jamanetwork.com',
      'nature.com',
      'sciencedirect.com',
      'springer.com',
      'wiley.com',
      'academic.oup.com',
      'ahajournals.org',
      'acc.org',
      'escardio.org',
      'nice.org.uk',
      'uptodate.com',
      'medscape.com'
    ]

    return legitimateDomains.some(domain => url.includes(domain))
  }

  /**
   * Batch process multiple URLs with rate limiting
   */
  async batchCrawl(urls: string[], batchSize: number = 10): Promise<CrawlResult[]> {
    const results: CrawlResult[] = []
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize)
      console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(urls.length / batchSize)}`)
      
      const batchResults = await this.crawlMedicalContent(batch)
      results.push(...batchResults)
      
      // Rate limiting: wait 5 seconds between batches
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
    
    return results
  }
}

// Export singleton instance
export const brightDataService = new BrightDataService({
  apiKey: process.env.BRIGHT_DATA_API_KEY || '',
  unlockerZone: process.env.BRIGHT_DATA_UNLOCKER_ZONE || 'omniscan_unlocker',
  serpZone: process.env.BRIGHT_DATA_SERP_ZONE || 'omniscan_serp',
  browserZone: process.env.BRIGHT_DATA_BROWSER_ZONE || 'scraping_browser'
})

// Made with Bob
