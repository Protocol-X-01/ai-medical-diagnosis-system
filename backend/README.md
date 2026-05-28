# AI Medical Diagnosis - Backend Services

Backend services for the AI Medical Diagnosis System, including Bright Data integration for medical knowledge ingestion.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Bright Data API credentials
- AWS credentials (for production)

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Copy the Bright Data credentials from `/home/omnip01/Documents/SecurityResearch/.env`:

```bash
# Create .env file in backend directory
cat > .env << EOF
BRIGHT_DATA_API_KEY=55f76765-b2fc-4046-9edd-2cbca28c7665
BRIGHT_DATA_UNLOCKER_ZONE=omniscan_unlocker
BRIGHT_DATA_SERP_ZONE=omniscan_serp
BRIGHT_DATA_BROWSER_ZONE=scraping_browser
EOF
```

## 📚 Building the Medical Encyclopedia

The encyclopedia builder uses Bright Data to discover and ingest medical knowledge from verified sources.

### Run the Encyclopedia Builder

```bash
npm run build-encyclopedia
```

This will:
1. Process 25+ medical conditions across 10 specialties
2. Discover research papers from PubMed, Google Scholar
3. Find clinical guidelines from WHO, CDC, NIH, NICE, etc.
4. Locate medical textbooks and educational resources
5. Save structured data to `data/encyclopedia/`

### Output Structure

```
data/encyclopedia/
├── complete_encyclopedia.json          # Full encyclopedia
├── encyclopedia_summary.json           # Statistics and metadata
└── conditions/
    ├── I21_Acute_Myocardial_Infarction.json
    ├── E11_Type_2_Diabetes_Mellitus.json
    ├── J44_Chronic_Obstructive_Pulmonary_Disease.json
    └── ... (25+ conditions)
```

### Covered Medical Conditions

**Cardiology (3)**
- Acute Myocardial Infarction (I21)
- Hypertension (I10)
- Atrial Fibrillation (I48)

**Endocrinology (2)**
- Type 2 Diabetes Mellitus (E11)
- Hypothyroidism (E03)

**Pulmonology (3)**
- COPD (J44)
- Asthma (J45)
- Pneumonia (J18)

**Neurology (3)**
- Alzheimer Disease (G30)
- Migraine (G43)
- Stroke (I63)

**Gastroenterology (2)**
- GERD (K21)
- Inflammatory Bowel Disease (K50-K51)

**Infectious Disease (2)**
- COVID-19 (U07.1)
- Influenza (J10-J11)

**Oncology (2)**
- Lung Cancer (C34)
- Breast Cancer (C50)

**Rheumatology (2)**
- Rheumatoid Arthritis (M05-M06)
- Osteoarthritis (M15-M19)

**Nephrology (1)**
- Chronic Kidney Disease (N18)

**Dermatology (2)**
- Psoriasis (L40)
- Melanoma (C43)

## 🔧 Services

### Bright Data Service

Located in `services/brightdata.service.ts`

**Features:**
- SERP API for medical research discovery
- Crawl API for content extraction
- Browser API for complex sites
- Automatic rate limiting
- Legitimate source validation

**Usage:**

```typescript
import { brightDataService } from './services/brightdata.service'

// Discover research papers
const papers = await brightDataService.discoverMedicalResearch(
  'myocardial infarction',
  ['pubmed', 'scholar']
)

// Crawl medical content
const content = await brightDataService.crawlMedicalContent([
  'https://pubmed.ncbi.nlm.nih.gov/30165617/'
])

// Discover clinical guidelines
const guidelines = await brightDataService.discoverClinicalGuidelines(
  'diabetes'
)
```

## 📊 Data Sources

The system ingests data from:

### Research Databases
- PubMed (pubmed.ncbi.nlm.nih.gov)
- Google Scholar
- Cochrane Library
- Nature Medicine
- The Lancet
- NEJM
- JAMA

### Clinical Guidelines
- WHO (World Health Organization)
- CDC (Centers for Disease Control)
- NIH (National Institutes of Health)
- NICE (UK National Institute for Health)
- AHA (American Heart Association)
- ACC (American College of Cardiology)
- ESC (European Society of Cardiology)
- ADA (American Diabetes Association)

### Medical Textbooks
- Open-access medical textbooks
- University medical libraries
- Professional medical education resources

## 🔒 Compliance

All data collection follows:
- ✅ Public-only content
- ✅ Respects robots.txt
- ✅ No paywall bypass
- ✅ No personal/patient data
- ✅ Proper attribution and citations
- ✅ HIPAA-compliant storage

## 🚀 Next Steps

After building the encyclopedia:

1. **Import to AWS**
   ```bash
   # Upload to S3
   aws s3 sync data/encyclopedia/ s3://medical-diagnosis-encyclopedia/
   ```

2. **Index in OpenSearch**
   ```bash
   npm run index-encyclopedia
   ```

3. **Train AI Agents**
   ```bash
   npm run train-agents
   ```

## 📝 Scripts

- `npm run build-encyclopedia` - Build medical encyclopedia
- `npm run ingest` - Ingest new medical data
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

## 🐛 Troubleshooting

### Rate Limiting
If you hit rate limits, the system automatically:
- Waits between batches (5 seconds)
- Retries failed requests
- Logs progress for resume

### Missing Data
If some conditions have no sources:
- Check Bright Data zone names
- Verify API key is active
- Check network connectivity

### TypeScript Errors
```bash
npm install --save-dev @types/node
```

## 📞 Support

For issues with:
- Bright Data API: https://brightdata.com/support
- AWS Services: https://aws.amazon.com/support
- Project: Create GitHub issue

## 📄 License

MIT License - See LICENSE file for details