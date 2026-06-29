# System Architecture Documentation

> ⚠️ **Historical planning document.** Some figures and claims here predate the current build and
> may be outdated or overstated. The canonical, accurate architecture is in
> [`README.md`](README.md), [`docs/SUBMISSION.md`](docs/SUBMISSION.md) and
> [`docs/architecture-diagram.svg`](docs/architecture-diagram.svg).


## AI Hallucination-free Medical Diagnosis System

### Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Component Details](#component-details)
4. [Data Flow](#data-flow)
5. [Quorum Agent System](#quorum-agent-system)
6. [Security Architecture](#security-architecture)
7. [Scalability Design](#scalability-design)
8. [Deployment Strategy](#deployment-strategy)

---

## System Overview

### Design Philosophy
The system is built on a **3-layer architecture** designed for:
- **Reliability**: 99.9% uptime SLA
- **Accuracy**: Zero-hallucination guarantee through quorum consensus
- **Scalability**: Handle millions of diagnoses globally
- **Compliance**: HIPAA-compliant from ground up
- **Performance**: Sub-30-second diagnosis generation

### Technology Choices

#### Why Aurora PostgreSQL?
- **ACID Transactions**: Critical for medical record integrity
- **Complex Queries**: Support for joins across patient data, diagnoses, and medical literature
- **PostgreSQL Extensions**: PostGIS for location data, pg_vector for embeddings
- **Scalability**: Read replicas for high-traffic scenarios
- **Backup & Recovery**: Point-in-time recovery for compliance
- **HIPAA Eligible**: AWS BAA (Business Associate Agreement) available

#### Why OpenSearch?
- **Semantic Search**: Vector similarity search for medical literature
- **Full-Text Search**: Fast keyword search across millions of documents
- **Faceted Search**: Filter by publication date, source, medical specialty
- **Real-time Indexing**: Immediate availability of new research
- **Scalability**: Horizontal scaling for growing knowledge base

#### Why DynamoDB?
- **Low Latency**: Single-digit millisecond reads for metadata
- **Flexible Schema**: Handle varying document metadata structures
- **Global Tables**: Multi-region replication for disaster recovery
- **Serverless**: Auto-scaling based on demand
- **Cost-Effective**: Pay-per-request pricing for variable workloads

---

## Architecture Layers

### Layer 1: Frontend (Next.js on Vercel)

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │  Patient Input │  │   Document     │  │  Diagnosis   │ │
│  │   Interface    │  │    Browser     │  │   Display    │ │
│  └────────────────┘  └────────────────┘  └──────────────┘ │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │  Medical Image │  │   Citation     │  │   Source     │ │
│  │     Viewer     │  │    Tracker     │  │ Verification │ │
│  └────────────────┘  └────────────────┘  └──────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Authentication & Authorization            │ │
│  │         (NextAuth.js + AWS Cognito)                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Server-side rendering for SEO and performance
- API routes for backend communication
- Real-time updates via WebSockets
- Responsive design for mobile/tablet access
- Accessibility compliance (WCAG 2.1 AA)

**Tech Stack:**
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/ui components
- React Query for data fetching
- Zustand for state management

### Layer 2: Orchestration (AWS Services)

```
┌─────────────────────────────────────────────────────────────┐
│                  Orchestration Layer                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              API Gateway (REST + WebSocket)            │ │
│  │  - Rate Limiting  - Authentication  - Logging          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Lambda     │  │     ECS      │  │ Step Functions   │ │
│  │  Functions   │  │   Fargate    │  │   Workflows      │ │
│  │              │  │              │  │                  │ │
│  │ - Auth       │  │ - Agents     │  │ - Data Pipeline  │ │
│  │ - Query      │  │ - Workers    │  │ - Diagnosis Flow │ │
│  │ - Retrieval  │  │ - Crawlers   │  │ - Consensus      │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              EventBridge (Event Bus)                   │ │
│  │  - Diagnosis Requested  - Data Ingested  - Alert      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   SQS Queues                           │ │
│  │  - Diagnosis Queue  - Crawl Queue  - Index Queue      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Workflow Orchestration:**

1. **Diagnosis Request Flow:**
   ```
   User Request → API Gateway → Lambda (Auth) → SQS → 
   Step Function → Quorum Agents → Consensus → Response
   ```

2. **Data Ingestion Flow:**
   ```
   Scheduled Event → Lambda → Bright Data API → S3 → 
   Lambda (Process) → OpenSearch + Aurora → Complete
   ```

3. **Real-time Update Flow:**
   ```
   New Research → EventBridge → Lambda → Index → 
   WebSocket → Frontend Update
   ```

### Layer 3: Data Layer (AWS Databases)

```
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Amazon Aurora PostgreSQL                     │ │
│  │                                                        │ │
│  │  Tables:                                               │ │
│  │  - patients (demographics, history)                   │ │
│  │  - diagnoses (results, confidence, citations)         │ │
│  │  - medical_documents (metadata, source info)          │ │
│  │  - agent_votes (quorum consensus tracking)            │ │
│  │  - audit_logs (HIPAA compliance)                      │ │
│  │  - users (healthcare providers)                       │ │
│  │                                                        │ │
│  │  Features:                                             │ │
│  │  - Multi-AZ deployment                                │ │
│  │  - Automated backups (35-day retention)               │ │
│  │  - Read replicas (3x for scaling)                     │ │
│  │  - Encryption at rest (KMS)                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Amazon OpenSearch Service                    │ │
│  │                                                        │ │
│  │  Indices:                                              │ │
│  │  - medical_literature (vector + text)                 │ │
│  │  - clinical_guidelines (structured)                   │ │
│  │  - research_papers (full-text)                        │ │
│  │  - medical_textbooks (chunked)                        │ │
│  │                                                        │ │
│  │  Features:                                             │ │
│  │  - k-NN vector search (embeddings)                    │ │
│  │  - Full-text search (BM25)                            │ │
│  │  - Aggregations (faceted search)                      │ │
│  │  - 3-node cluster (HA)                                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Amazon DynamoDB                           │ │
│  │                                                        │ │
│  │  Tables:                                               │ │
│  │  - document_metadata (fast lookups)                   │ │
│  │  - crawl_status (job tracking)                        │ │
│  │  - cache_results (query cache)                        │ │
│  │  - session_data (user sessions)                       │ │
│  │                                                        │ │
│  │  Features:                                             │ │
│  │  - On-demand capacity                                 │ │
│  │  - Global tables (multi-region)                       │ │
│  │  - Point-in-time recovery                             │ │
│  │  - DynamoDB Streams (change capture)                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  Amazon S3                             │ │
│  │                                                        │ │
│  │  Buckets:                                              │ │
│  │  - medical-documents-raw (PDFs, HTML)                 │ │
│  │  - medical-images (DICOM, scans)                      │ │
│  │  - processed-content (extracted text)                 │ │
│  │  - embeddings (vector files)                          │ │
│  │  - audit-logs (compliance)                            │ │
│  │                                                        │ │
│  │  Features:                                             │ │
│  │  - Versioning enabled                                 │ │
│  │  - Lifecycle policies (archival)                      │ │
│  │  - Server-side encryption (SSE-KMS)                   │ │
│  │  - Cross-region replication                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Amazon ElastiCache (Redis)                  │ │
│  │                                                        │ │
│  │  - Query result caching                                │ │
│  │  - Session management                                  │ │
│  │  - Rate limiting counters                              │ │
│  │  - Real-time agent coordination                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Quorum Agent System

The core innovation preventing hallucinations:

```
┌─────────────────────────────────────────────────────────────┐
│                  Quorum Agent Architecture                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                    ┌──────────────────┐                     │
│                    │  Diagnosis Query │                     │
│                    └────────┬─────────┘                     │
│                             │                                │
│                             ▼                                │
│              ┌──────────────────────────┐                   │
│              │   Agent Coordinator      │                   │
│              │  (ECS Fargate Service)   │                   │
│              └──────────┬───────────────┘                   │
│                         │                                    │
│         ┌───────────────┼───────────────┐                   │
│         │               │               │                   │
│         ▼               ▼               ▼                   │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐               │
│  │Diagnostic│   │ Research │   │ Imaging  │               │
│  │  Agent   │   │  Agent   │   │  Agent   │               │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘               │
│       │              │              │                       │
│       │              ▼              │                       │
│       │       ┌──────────┐         │                       │
│       │       │Validation│         │                       │
│       │       │  Agent   │         │                       │
│       │       └────┬─────┘         │                       │
│       │            │               │                       │
│       └────────────┼───────────────┘                       │
│                    │                                        │
│                    ▼                                        │
│           ┌─────────────────┐                              │
│           │  Consensus      │                              │
│           │  Agent          │                              │
│           │                 │                              │
│           │ Vote Threshold: │                              │
│           │   4/5 Required  │                              │
│           └────────┬────────┘                              │
│                    │                                        │
│                    ▼                                        │
│           ┌─────────────────┐                              │
│           │ Final Diagnosis │                              │
│           │ + Citations     │                              │
│           │ + Confidence    │                              │
│           └─────────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

**Agent Specifications:**

#### Diagnostic Agent
- **Purpose**: Analyze symptoms and patient history
- **Data Sources**: 
  - Disease databases (ICD-10, SNOMED CT)
  - Symptom-disease mappings
  - Patient historical data
- **Output**: List of potential diagnoses with probabilities
- **LLM**: Claude 3.5 Sonnet with medical fine-tuning

#### Research Agent
- **Purpose**: Find supporting evidence in medical literature
- **Data Sources**:
  - PubMed indexed papers
  - Medical textbooks
  - Clinical trial results
- **Output**: Relevant citations with evidence strength
- **Search**: Hybrid (vector + keyword) search in OpenSearch

#### Imaging Agent
- **Purpose**: Interpret medical scans and imaging
- **Data Sources**:
  - DICOM image analysis
  - Radiology reports
  - Imaging guidelines
- **Output**: Imaging findings with confidence scores
- **Model**: Vision-language model (GPT-4V or specialized medical model)

#### Validation Agent
- **Purpose**: Cross-reference against clinical guidelines
- **Data Sources**:
  - WHO guidelines
  - CDC recommendations
  - FDA databases
  - Medical society protocols
- **Output**: Validation status with guideline references
- **Logic**: Rule-based + LLM verification

#### Consensus Agent
- **Purpose**: Coordinate voting and resolve conflicts
- **Algorithm**:
  ```python
  def reach_consensus(agent_votes):
      # Require 4/5 agents to agree
      if count_agreement(agent_votes) >= 4:
          return create_diagnosis(majority_vote)
      else:
          # Trigger additional research
          return request_expert_review()
  ```
- **Output**: Final diagnosis with confidence metrics

### 2. Data Ingestion Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│              Medical Data Ingestion Pipeline                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: Discovery                                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Bright Data SERP API                                  │ │
│  │  - Query: "cardiology research 2024"                   │ │
│  │  - Sources: PubMed, Google Scholar, medical journals   │ │
│  │  - Output: List of URLs + metadata                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ▼                                   │
│  Step 2: Collection                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Bright Data Crawl API / Browser API                   │ │
│  │  - Extract: Title, abstract, full text, references     │ │
│  │  - Format: Markdown, HTML, JSON                        │ │
│  │  - Store: S3 (raw content)                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ▼                                   │
│  Step 3: Processing                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Lambda Function (Document Processor)                  │ │
│  │  - Parse: Extract structured data                      │ │
│  │  - Clean: Remove boilerplate, normalize                │ │
│  │  - Chunk: Split into semantic sections                 │ │
│  │  - Validate: Check license, quality                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ▼                                   │
│  Step 4: Embedding                                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  SageMaker Endpoint (Embedding Model)                  │ │
│  │  - Model: BioBERT or PubMedBERT                        │ │
│  │  - Generate: 768-dim vectors per chunk                 │ │
│  │  - Store: S3 (embeddings) + OpenSearch (indexed)      │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ▼                                   │
│  Step 5: Indexing                                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Multi-Database Storage                                │ │
│  │  - Aurora: Metadata, relationships                     │ │
│  │  - OpenSearch: Vectors + full-text                     │ │
│  │  - DynamoDB: Fast lookup cache                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ▼                                   │
│  Step 6: Verification                                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Quality Assurance                                     │ │
│  │  - Citation validation                                 │ │
│  │  - Duplicate detection                                 │ │
│  │  - Source credibility scoring                          │ │
│  │  - Update status in DynamoDB                           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3. Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Security & Compliance Layer                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Authentication & Authorization                        │ │
│  │                                                        │ │
│  │  - AWS Cognito (user pools)                           │ │
│  │  - MFA enforcement                                     │ │
│  │  - SAML 2.0 / OAuth 2.0                               │ │
│  │  - Role-based access control (RBAC)                   │ │
│  │  - Session management (Redis)                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Encryption                                            │ │
│  │                                                        │ │
│  │  - At Rest: AWS KMS (all databases, S3)               │ │
│  │  - In Transit: TLS 1.3 (all connections)              │ │
│  │  - Application: Field-level encryption (PHI)          │ │
│  │  - Key Rotation: Automated (90 days)                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Network Security                                      │ │
│  │                                                        │ │
│  │  - VPC with private subnets                           │ │
│  │  - Security groups (least privilege)                  │ │
│  │  - NACLs (network ACLs)                               │ │
│  │  - AWS WAF (web application firewall)                 │ │
│  │  - DDoS protection (Shield Standard)                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Audit & Compliance                                    │ │
│  │                                                        │ │
│  │  - CloudTrail (all API calls)                         │ │
│  │  - CloudWatch Logs (application logs)                 │ │
│  │  - AWS Config (compliance monitoring)                 │ │
│  │  - GuardDuty (threat detection)                       │ │
│  │  - Audit log retention (7 years)                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  HIPAA Compliance                                      │ │
│  │                                                        │ │
│  │  - BAA with AWS                                        │ │
│  │  - PHI data classification                            │ │
│  │  - Access logging (all PHI access)                    │ │
│  │  - Data retention policies                            │ │
│  │  - Breach notification procedures                     │ │
│  │  - Regular security assessments                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Diagnosis Request Flow (Detailed)

```
1. User submits patient data via Next.js frontend
   ↓
2. Frontend validates input, sends to Vercel API route
   ↓
3. API route authenticates via Cognito, checks authorization
   ↓
4. Request forwarded to AWS API Gateway
   ↓
5. API Gateway triggers Lambda (Request Handler)
   ↓
6. Lambda publishes event to EventBridge
   ↓
7. EventBridge triggers Step Function workflow
   ↓
8. Step Function orchestrates:
   a. Retrieve patient history (Aurora)
   b. Fetch relevant medical literature (OpenSearch)
   c. Launch 5 agent containers (ECS Fargate)
   d. Agents process in parallel:
      - Diagnostic Agent: Analyze symptoms
      - Research Agent: Search literature
      - Imaging Agent: Process scans
      - Validation Agent: Check guidelines
      - Consensus Agent: Coordinate voting
   e. Collect agent votes (Redis)
   f. Reach consensus (4/5 threshold)
   g. Generate final diagnosis with citations
   h. Store result (Aurora + cache in Redis)
   ↓
9. Step Function returns result to Lambda
   ↓
10. Lambda sends response to API Gateway
    ↓
11. API Gateway returns to Vercel API route
    ↓
12. Frontend receives diagnosis, displays to user
    ↓
13. Audit log written (CloudTrail + S3)
```

**Performance Targets:**
- Total latency: <30 seconds (p95)
- Agent processing: <20 seconds (parallel)
- Database queries: <100ms (p99)
- Cache hit rate: >80%

---

## Scalability Design

### Horizontal Scaling Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                  Scaling Architecture                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (Vercel)                                          │
│  - Auto-scaling: Unlimited                                  │
│  - CDN: Global edge network                                 │
│  - Serverless: No capacity planning                         │
│                                                              │
│  API Gateway                                                │
│  - Throttling: 10,000 req/sec per account                  │
│  - Burst: 5,000 requests                                    │
│  - Regional endpoints for low latency                       │
│                                                              │
│  Lambda Functions                                           │
│  - Concurrency: 1,000 (default, can increase)              │
│  - Auto-scaling: Automatic                                  │
│  - Reserved concurrency for critical functions              │
│                                                              │
│  ECS Fargate (Agents)                                       │
│  - Auto-scaling: Based on CPU/memory                        │
│  - Target: 70% CPU utilization                             │
│  - Min: 5 tasks, Max: 100 tasks                            │
│  - Scale-out: 2 minutes, Scale-in: 5 minutes               │
│                                                              │
│  Aurora PostgreSQL                                          │
│  - Read replicas: 3 (can add up to 15)                     │
│  - Auto-scaling: Storage (up to 128 TB)                    │
│  - Connection pooling: RDS Proxy                           │
│  - Failover: <30 seconds                                    │
│                                                              │
│  OpenSearch                                                 │
│  - Nodes: 3 (data) + 3 (master)                            │
│  - Auto-scaling: Based on CPU/JVM                          │
│  - Sharding: 5 primary + 1 replica per index               │
│  - Index lifecycle: Hot → Warm → Cold → Delete            │
│                                                              │
│  DynamoDB                                                   │
│  - Capacity: On-demand (auto-scaling)                      │
│  - Partitions: Automatic                                    │
│  - Global tables: Multi-region replication                 │
│                                                              │
│  ElastiCache (Redis)                                        │
│  - Cluster mode: Enabled (sharding)                        │
│  - Nodes: 3 (can scale to 90)                              │
│  - Replication: Multi-AZ                                    │
│  - Failover: Automatic                                      │
└─────────────────────────────────────────────────────────────┘
```

### Load Testing Targets

- **Concurrent Users**: 10,000
- **Diagnoses per Second**: 100
- **Data Ingestion**: 1M documents/day
- **Storage Growth**: 10 TB/year
- **Query Latency**: <100ms (p95)

---

## Deployment Strategy

### Multi-Region Architecture

```
Primary Region: us-east-1 (N. Virginia)
Secondary Region: eu-west-1 (Ireland)
Tertiary Region: ap-southeast-1 (Singapore)

┌─────────────────────────────────────────────────────────────┐
│                  Multi-Region Setup                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Active-Active Configuration:                               │
│  - Vercel: Global CDN (automatic)                           │
│  - Route 53: Geolocation routing                            │
│  - Aurora: Global database (cross-region replication)       │
│  - DynamoDB: Global tables (multi-region)                   │
│  - S3: Cross-region replication                             │
│                                                              │
│  Disaster Recovery:                                         │
│  - RTO (Recovery Time Objective): 1 hour                    │
│  - RPO (Recovery Point Objective): 5 minutes                │
│  - Automated failover for databases                         │
│  - Backup retention: 35 days                                │
│  - Point-in-time recovery enabled                           │
└─────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                  Deployment Pipeline                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Code Commit (GitHub)                                    │
│     ↓                                                        │
│  2. GitHub Actions Triggered                                │
│     - Run tests (Jest, Playwright)                          │
│     - Lint code (ESLint, Prettier)                          │
│     - Security scan (Snyk, Trivy)                           │
│     - Build Docker images                                   │
│     ↓                                                        │
│  3. Push to ECR (Elastic Container Registry)                │
│     ↓                                                        │
│  4. Deploy to Staging                                       │
│     - Update ECS task definitions                           │
│     - Run integration tests                                 │
│     - Performance tests                                     │
│     ↓                                                        │
│  5. Manual Approval (for production)                        │
│     ↓                                                        │
│  6. Deploy to Production                                    │
│     - Blue/green deployment                                 │
│     - Canary release (10% → 50% → 100%)                    │
│     - Automated rollback on errors                          │
│     ↓                                                        │
│  7. Post-Deployment                                         │
│     - Smoke tests                                           │
│     - Monitor metrics (CloudWatch)                          │
│     - Alert on anomalies                                    │
└─────────────────────────────────────────────────────────────┘
```

### Infrastructure as Code

**Tools:**
- Terraform for AWS infrastructure
- AWS CDK for complex constructs
- Vercel CLI for frontend deployment
- Docker for containerization

**Repository Structure:**
```
/infrastructure
  /terraform
    - main.tf
    - variables.tf
    - outputs.tf
    /modules
      /aurora
      /opensearch
      /ecs
      /lambda
  /docker
    - Dockerfile.agent
    - Dockerfile.worker
  /scripts
    - deploy.sh
    - rollback.sh
```

---

## Monitoring & Observability

### Metrics Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│                  CloudWatch Dashboard                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Application Metrics:                                       │
│  - Diagnosis requests/min                                   │
│  - Average diagnosis latency                                │
│  - Agent consensus rate                                     │
│  - Citation accuracy                                        │
│  - Error rate (4xx, 5xx)                                    │
│                                                              │
│  Infrastructure Metrics:                                    │
│  - Aurora: CPU, connections, replication lag               │
│  - OpenSearch: CPU, JVM, query latency                     │
│  - ECS: CPU, memory, task count                            │
│  - Lambda: Invocations, duration, errors                   │
│  - API Gateway: Request count, latency, errors             │
│                                                              │
│  Business Metrics:                                          │
│  - Active users                                             │
│  - Diagnoses per customer                                   │
│  - Revenue (usage-based)                                    │
│  - Customer satisfaction score                              │
│                                                              │
│  Alerts:                                                    │
│  - High error rate (>1%)                                    │
│  - Slow response time (>30s)                                │
│  - Database connection pool exhaustion                      │
│  - Agent consensus failure                                  │
│  - Security anomalies (GuardDuty)                          │
└─────────────────────────────────────────────────────────────┘
```

### Logging Strategy

- **Application Logs**: CloudWatch Logs
- **Access Logs**: S3 (API Gateway, ALB)
- **Audit Logs**: S3 + Glacier (7-year retention)
- **Trace**: AWS X-Ray (distributed tracing)
- **Log Analysis**: CloudWatch Insights + Athena

---

## Cost Optimization

### Estimated Monthly Costs (Production)

```
Service                    | Cost/Month | Notes
---------------------------|------------|---------------------------
Aurora PostgreSQL          | $500       | db.r6g.xlarge + storage
OpenSearch                 | $800       | 3 r6g.large.search nodes
DynamoDB                   | $200       | On-demand, 10M reads/writes
S3                         | $300       | 10 TB storage + requests
Lambda                     | $150       | 10M invocations
ECS Fargate                | $600       | 10 tasks, 24/7
ElastiCache                | $200       | cache.r6g.large
API Gateway                | $100       | 10M requests
CloudWatch                 | $100       | Logs + metrics
Data Transfer              | $200       | Cross-region + internet
Bright Data APIs           | $500       | Crawling + SERP
---------------------------|------------|---------------------------
Total                      | $3,650/mo  | ~$44K/year
```

**Cost Optimization Strategies:**
- Use Savings Plans for ECS/Lambda (30% savings)
- S3 Intelligent-Tiering for automatic archival
- Aurora Serverless v2 for variable workloads
- Reserved capacity for OpenSearch (40% savings)
- Spot instances for non-critical batch jobs

---

## Conclusion

This architecture provides:
- ✅ **Reliability**: Multi-AZ, auto-scaling, automated failover
- ✅ **Accuracy**: Quorum-based consensus, citation tracking
- ✅ **Security**: HIPAA-compliant, encrypted, audited
- ✅ **Scalability**: Horizontal scaling, global distribution
- ✅ **Performance**: <30s diagnosis, <100ms queries
- ✅ **Cost-Effective**: ~$3,650/month for production

The system is designed to be **production-ready from day one**, with enterprise-grade reliability, security, and compliance built in.