# Database Schema Documentation

## AI Hallucination-free Medical Diagnosis System

### Overview
This document defines the database schemas for all three AWS databases used in the system:
1. **Amazon Aurora PostgreSQL** - Primary relational database
2. **Amazon OpenSearch** - Vector and full-text search
3. **Amazon DynamoDB** - Fast metadata lookups

---

## 1. Amazon Aurora PostgreSQL Schema

### Design Principles
- **ACID Compliance**: All medical records require transactional integrity
- **Normalization**: 3NF to reduce redundancy
- **Audit Trail**: Every table includes created_at, updated_at, and audit fields
- **Soft Deletes**: Use deleted_at instead of hard deletes for compliance
- **Encryption**: All PHI fields encrypted at application level

### Tables

#### 1.1 users
Healthcare providers and system users.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'physician', 'nurse', 'researcher', 'viewer')),
    organization_id UUID REFERENCES organizations(id),
    license_number VARCHAR(100),
    specialty VARCHAR(100),
    phone VARCHAR(20),
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_organization ON users(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
```

#### 1.2 organizations
Healthcare institutions using the system.

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('hospital', 'clinic', 'research', 'pharmaceutical')),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(50),
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    license_number VARCHAR(100),
    subscription_tier VARCHAR(50) CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
    subscription_status VARCHAR(50) CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
    monthly_diagnosis_limit INTEGER,
    monthly_diagnosis_count INTEGER DEFAULT 0,
    billing_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_organizations_type ON organizations(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_subscription ON organizations(subscription_status) WHERE deleted_at IS NULL;
```

#### 1.3 patients
Patient demographic and basic information (PHI).

```sql
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    medical_record_number VARCHAR(100) NOT NULL,
    first_name_encrypted BYTEA NOT NULL, -- Encrypted PHI
    last_name_encrypted BYTEA NOT NULL,  -- Encrypted PHI
    date_of_birth_encrypted BYTEA NOT NULL, -- Encrypted PHI
    gender VARCHAR(20),
    blood_type VARCHAR(10),
    allergies TEXT[],
    chronic_conditions TEXT[],
    current_medications JSONB,
    emergency_contact_encrypted BYTEA, -- Encrypted PHI
    insurance_info_encrypted BYTEA,    -- Encrypted PHI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(organization_id, medical_record_number)
);

CREATE INDEX idx_patients_organization ON patients(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_mrn ON patients(organization_id, medical_record_number) WHERE deleted_at IS NULL;
```

#### 1.4 patient_history
Historical medical records for patients.

```sql
CREATE TABLE patient_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) NOT NULL,
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
    visit_type VARCHAR(50) CHECK (visit_type IN ('emergency', 'routine', 'follow-up', 'consultation')),
    chief_complaint TEXT,
    symptoms TEXT[],
    vital_signs JSONB, -- {temperature, blood_pressure, heart_rate, respiratory_rate, oxygen_saturation}
    physical_examination TEXT,
    lab_results JSONB,
    imaging_results JSONB,
    diagnosis_codes TEXT[], -- ICD-10 codes
    treatment_plan TEXT,
    medications_prescribed JSONB,
    notes TEXT,
    provider_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_patient_history_patient ON patient_history(patient_id);
CREATE INDEX idx_patient_history_visit_date ON patient_history(visit_date DESC);
CREATE INDEX idx_patient_history_provider ON patient_history(provider_id);
```

#### 1.5 diagnoses
AI-generated diagnoses with quorum consensus.

```sql
CREATE TABLE diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) NOT NULL,
    request_id VARCHAR(100) UNIQUE NOT NULL, -- For idempotency
    symptoms TEXT[] NOT NULL,
    patient_history_summary TEXT,
    imaging_data_s3_keys TEXT[], -- S3 keys for DICOM files
    lab_results JSONB,
    
    -- Diagnosis results
    primary_diagnosis VARCHAR(255) NOT NULL,
    icd10_code VARCHAR(20) NOT NULL,
    confidence_score DECIMAL(5,4) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    differential_diagnoses JSONB, -- [{diagnosis, icd10_code, probability}]
    
    -- Quorum consensus
    agent_votes JSONB NOT NULL, -- {diagnostic: {vote, confidence}, research: {...}, ...}
    consensus_reached BOOLEAN NOT NULL,
    consensus_threshold INTEGER DEFAULT 4,
    votes_in_favor INTEGER NOT NULL,
    
    -- Citations and evidence
    citations JSONB NOT NULL, -- [{source, title, url, relevance_score}]
    evidence_summary TEXT,
    guideline_references TEXT[],
    
    -- Recommendations
    recommended_tests TEXT[],
    recommended_treatments TEXT[],
    specialist_referral VARCHAR(100),
    urgency_level VARCHAR(20) CHECK (urgency_level IN ('routine', 'urgent', 'emergency')),
    
    -- Metadata
    processing_time_ms INTEGER,
    requested_by UUID REFERENCES users(id) NOT NULL,
    reviewed_by UUID REFERENCES users(id),
    review_status VARCHAR(50) CHECK (review_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
    review_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_diagnoses_patient ON diagnoses(patient_id);
CREATE INDEX idx_diagnoses_request ON diagnoses(request_id);
CREATE INDEX idx_diagnoses_created ON diagnoses(created_at DESC);
CREATE INDEX idx_diagnoses_confidence ON diagnoses(confidence_score DESC);
CREATE INDEX idx_diagnoses_review_status ON diagnoses(review_status);
```

#### 1.6 agent_votes
Detailed voting records from each agent in the quorum.

```sql
CREATE TABLE agent_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagnosis_id UUID REFERENCES diagnoses(id) NOT NULL,
    agent_type VARCHAR(50) NOT NULL CHECK (agent_type IN ('diagnostic', 'research', 'imaging', 'validation', 'consensus')),
    agent_version VARCHAR(20) NOT NULL,
    
    -- Vote details
    vote_diagnosis VARCHAR(255) NOT NULL,
    vote_icd10_code VARCHAR(20),
    confidence_score DECIMAL(5,4) NOT NULL,
    reasoning TEXT NOT NULL,
    
    -- Supporting evidence
    sources_consulted JSONB, -- [{source_id, relevance_score}]
    key_findings TEXT[],
    contradictions TEXT[],
    
    -- Performance metrics
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_votes_diagnosis ON agent_votes(diagnosis_id);
CREATE INDEX idx_agent_votes_agent_type ON agent_votes(agent_type);
CREATE INDEX idx_agent_votes_confidence ON agent_votes(confidence_score DESC);
```

#### 1.7 medical_documents
Metadata for medical literature and research papers.

```sql
CREATE TABLE medical_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('research_paper', 'textbook', 'guideline', 'clinical_trial', 'case_study')),
    
    -- Document metadata
    title TEXT NOT NULL,
    authors TEXT[],
    publication_date DATE,
    journal VARCHAR(255),
    doi VARCHAR(255),
    pmid VARCHAR(50), -- PubMed ID
    isbn VARCHAR(50),
    
    -- Source information
    source_url TEXT NOT NULL,
    source_domain VARCHAR(255),
    crawl_date TIMESTAMP WITH TIME ZONE NOT NULL,
    last_verified_date TIMESTAMP WITH TIME ZONE,
    
    -- Content storage
    s3_raw_key VARCHAR(500) NOT NULL, -- S3 key for raw HTML/PDF
    s3_processed_key VARCHAR(500), -- S3 key for processed text
    s3_embeddings_key VARCHAR(500), -- S3 key for embeddings
    
    -- Content metadata
    abstract TEXT,
    keywords TEXT[],
    medical_specialties TEXT[],
    diseases_covered TEXT[], -- ICD-10 codes
    word_count INTEGER,
    language VARCHAR(10) DEFAULT 'en',
    
    -- Quality metrics
    citation_count INTEGER DEFAULT 0,
    credibility_score DECIMAL(5,4), -- 0-1 score based on source, citations, etc.
    peer_reviewed BOOLEAN,
    open_access BOOLEAN,
    
    -- License and usage
    license_type VARCHAR(100),
    usage_rights TEXT,
    copyright_holder VARCHAR(255),
    
    -- Indexing status
    indexed_in_opensearch BOOLEAN DEFAULT false,
    opensearch_index_name VARCHAR(100),
    chunk_count INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_medical_documents_type ON medical_documents(document_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_medical_documents_pmid ON medical_documents(pmid) WHERE pmid IS NOT NULL;
CREATE INDEX idx_medical_documents_doi ON medical_documents(doi) WHERE doi IS NOT NULL;
CREATE INDEX idx_medical_documents_specialties ON medical_documents USING GIN(medical_specialties);
CREATE INDEX idx_medical_documents_diseases ON medical_documents USING GIN(diseases_covered);
CREATE INDEX idx_medical_documents_credibility ON medical_documents(credibility_score DESC);
CREATE INDEX idx_medical_documents_indexed ON medical_documents(indexed_in_opensearch);
```

#### 1.8 document_chunks
Text chunks for semantic search and retrieval.

```sql
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES medical_documents(id) NOT NULL,
    chunk_index INTEGER NOT NULL,
    
    -- Chunk content
    content TEXT NOT NULL,
    content_type VARCHAR(50) CHECK (content_type IN ('abstract', 'introduction', 'methods', 'results', 'discussion', 'conclusion', 'reference')),
    
    -- Chunk metadata
    start_position INTEGER,
    end_position INTEGER,
    word_count INTEGER,
    
    -- Embedding information
    embedding_model VARCHAR(100),
    embedding_dimension INTEGER,
    opensearch_doc_id VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, chunk_index)
);

CREATE INDEX idx_document_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_type ON document_chunks(content_type);
```

#### 1.9 audit_logs
Comprehensive audit trail for HIPAA compliance.

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL, -- 'patient_access', 'diagnosis_created', 'data_export', etc.
    event_category VARCHAR(50) CHECK (event_category IN ('authentication', 'authorization', 'data_access', 'data_modification', 'system')),
    
    -- Actor information
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    ip_address INET,
    user_agent TEXT,
    
    -- Resource information
    resource_type VARCHAR(50), -- 'patient', 'diagnosis', 'document', etc.
    resource_id UUID,
    
    -- Event details
    action VARCHAR(100) NOT NULL, -- 'create', 'read', 'update', 'delete', 'export'
    status VARCHAR(20) CHECK (status IN ('success', 'failure', 'denied')),
    details JSONB,
    
    -- PHI access tracking
    phi_accessed BOOLEAN DEFAULT false,
    phi_fields TEXT[], -- List of PHI fields accessed
    
    -- Request metadata
    request_id VARCHAR(100),
    session_id VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_phi ON audit_logs(phi_accessed) WHERE phi_accessed = true;
```

#### 1.10 crawl_jobs
Track data ingestion jobs from Bright Data.

```sql
CREATE TABLE crawl_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('discovery', 'crawl', 'browser', 'archive')),
    
    -- Job configuration
    bright_data_api VARCHAR(50), -- 'serp', 'crawl', 'browser', 'unlocker'
    query_params JSONB NOT NULL,
    target_urls TEXT[],
    
    -- Job status
    status VARCHAR(50) CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Results
    documents_discovered INTEGER DEFAULT 0,
    documents_crawled INTEGER DEFAULT 0,
    documents_processed INTEGER DEFAULT 0,
    documents_indexed INTEGER DEFAULT 0,
    
    -- Error tracking
    error_count INTEGER DEFAULT 0,
    error_messages TEXT[],
    
    -- Cost tracking
    api_calls_made INTEGER DEFAULT 0,
    estimated_cost_usd DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_crawl_jobs_status ON crawl_jobs(status);
CREATE INDEX idx_crawl_jobs_created ON crawl_jobs(created_at DESC);
CREATE INDEX idx_crawl_jobs_type ON crawl_jobs(job_type);
```

---

## 2. Amazon OpenSearch Schema

### Index Design

#### 2.1 medical_literature
Main index for semantic and full-text search.

```json
{
  "settings": {
    "index": {
      "number_of_shards": 5,
      "number_of_replicas": 1,
      "refresh_interval": "30s",
      "knn": true,
      "knn.algo_param.ef_search": 512
    },
    "analysis": {
      "analyzer": {
        "medical_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "medical_synonyms", "english_stemmer"]
        }
      },
      "filter": {
        "medical_synonyms": {
          "type": "synonym",
          "synonyms": [
            "myocardial infarction, heart attack, MI",
            "cerebrovascular accident, stroke, CVA",
            "diabetes mellitus, diabetes, DM"
          ]
        },
        "english_stemmer": {
          "type": "stemmer",
          "language": "english"
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "document_id": {
        "type": "keyword"
      },
      "chunk_id": {
        "type": "keyword"
      },
      "title": {
        "type": "text",
        "analyzer": "medical_analyzer",
        "fields": {
          "keyword": {
            "type": "keyword"
          }
        }
      },
      "content": {
        "type": "text",
        "analyzer": "medical_analyzer"
      },
      "abstract": {
        "type": "text",
        "analyzer": "medical_analyzer"
      },
      "authors": {
        "type": "keyword"
      },
      "publication_date": {
        "type": "date"
      },
      "journal": {
        "type": "keyword"
      },
      "doi": {
        "type": "keyword"
      },
      "pmid": {
        "type": "keyword"
      },
      "document_type": {
        "type": "keyword"
      },
      "medical_specialties": {
        "type": "keyword"
      },
      "diseases_covered": {
        "type": "keyword"
      },
      "keywords": {
        "type": "keyword"
      },
      "citation_count": {
        "type": "integer"
      },
      "credibility_score": {
        "type": "float"
      },
      "peer_reviewed": {
        "type": "boolean"
      },
      "open_access": {
        "type": "boolean"
      },
      "source_url": {
        "type": "keyword"
      },
      "content_embedding": {
        "type": "knn_vector",
        "dimension": 768,
        "method": {
          "name": "hnsw",
          "space_type": "cosinesimil",
          "engine": "nmslib",
          "parameters": {
            "ef_construction": 512,
            "m": 16
          }
        }
      },
      "indexed_at": {
        "type": "date"
      }
    }
  }
}
```

#### 2.2 Query Examples

**Semantic Search (k-NN):**
```json
{
  "size": 10,
  "query": {
    "knn": {
      "content_embedding": {
        "vector": [0.123, 0.456, ...],
        "k": 10
      }
    }
  },
  "post_filter": {
    "bool": {
      "must": [
        {"term": {"peer_reviewed": true}},
        {"range": {"credibility_score": {"gte": 0.7}}}
      ]
    }
  }
}
```

**Hybrid Search (Vector + Text):**
```json
{
  "size": 10,
  "query": {
    "bool": {
      "should": [
        {
          "knn": {
            "content_embedding": {
              "vector": [0.123, 0.456, ...],
              "k": 10,
              "boost": 0.7
            }
          }
        },
        {
          "multi_match": {
            "query": "myocardial infarction treatment",
            "fields": ["title^3", "abstract^2", "content"],
            "type": "best_fields",
            "boost": 0.3
          }
        }
      ]
    }
  },
  "post_filter": {
    "terms": {
      "medical_specialties": ["cardiology"]
    }
  }
}
```

**Faceted Search:**
```json
{
  "size": 0,
  "aggs": {
    "by_specialty": {
      "terms": {
        "field": "medical_specialties",
        "size": 20
      }
    },
    "by_year": {
      "date_histogram": {
        "field": "publication_date",
        "calendar_interval": "year"
      }
    },
    "by_document_type": {
      "terms": {
        "field": "document_type"
      }
    }
  }
}
```

---

## 3. Amazon DynamoDB Schema

### Table Design

#### 3.1 document_metadata
Fast lookups for document metadata.

```json
{
  "TableName": "document_metadata",
  "KeySchema": [
    {
      "AttributeName": "document_id",
      "KeyType": "HASH"
    }
  ],
  "AttributeDefinitions": [
    {
      "AttributeName": "document_id",
      "AttributeType": "S"
    },
    {
      "AttributeName": "pmid",
      "AttributeType": "S"
    },
    {
      "AttributeName": "doi",
      "AttributeType": "S"
    },
    {
      "AttributeName": "source_domain",
      "AttributeType": "S"
    },
    {
      "AttributeName": "crawl_date",
      "AttributeType": "N"
    }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "pmid-index",
      "KeySchema": [
        {
          "AttributeName": "pmid",
          "KeyType": "HASH"
        }
      ],
      "Projection": {
        "ProjectionType": "ALL"
      }
    },
    {
      "IndexName": "doi-index",
      "KeySchema": [
        {
          "AttributeName": "doi",
          "KeyType": "HASH"
        }
      ],
      "Projection": {
        "ProjectionType": "ALL"
      }
    },
    {
      "IndexName": "source-crawl-index",
      "KeySchema": [
        {
          "AttributeName": "source_domain",
          "KeyType": "HASH"
        },
        {
          "AttributeName": "crawl_date",
          "KeyType": "RANGE"
        }
      ],
      "Projection": {
        "ProjectionType": "KEYS_ONLY"
      }
    }
  ],
  "BillingMode": "PAY_PER_REQUEST",
  "StreamSpecification": {
    "StreamEnabled": true,
    "StreamViewType": "NEW_AND_OLD_IMAGES"
  },
  "PointInTimeRecoverySpecification": {
    "PointInTimeRecoveryEnabled": true
  },
  "SSESpecification": {
    "Enabled": true,
    "SSEType": "KMS"
  }
}
```

**Item Structure:**
```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Novel Treatment Approaches for Myocardial Infarction",
  "authors": ["Smith J", "Johnson A", "Williams B"],
  "publication_date": "2024-03-15",
  "journal": "Journal of Cardiology",
  "pmid": "38123456",
  "doi": "10.1234/jcard.2024.001",
  "document_type": "research_paper",
  "source_url": "https://pubmed.ncbi.nlm.nih.gov/38123456/",
  "source_domain": "pubmed.ncbi.nlm.nih.gov",
  "crawl_date": 1710518400,
  "s3_raw_key": "medical-documents-raw/2024/03/550e8400.html",
  "s3_processed_key": "processed-content/2024/03/550e8400.txt",
  "indexed_in_opensearch": true,
  "credibility_score": 0.92,
  "citation_count": 45,
  "medical_specialties": ["cardiology", "emergency_medicine"],
  "ttl": 1742054400
}
```

#### 3.2 crawl_status
Track crawling job status and progress.

```json
{
  "TableName": "crawl_status",
  "KeySchema": [
    {
      "AttributeName": "job_id",
      "KeyType": "HASH"
    }
  ],
  "AttributeDefinitions": [
    {
      "AttributeName": "job_id",
      "AttributeType": "S"
    },
    {
      "AttributeName": "status",
      "AttributeType": "S"
    },
    {
      "AttributeName": "created_at",
      "AttributeType": "N"
    }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "status-created-index",
      "KeySchema": [
        {
          "AttributeName": "status",
          "KeyType": "HASH"
        },
        {
          "AttributeName": "created_at",
          "KeyType": "RANGE"
        }
      ],
      "Projection": {
        "ProjectionType": "ALL"
      }
    }
  ],
  "BillingMode": "PAY_PER_REQUEST"
}
```

#### 3.3 query_cache
Cache diagnosis query results.

```json
{
  "TableName": "query_cache",
  "KeySchema": [
    {
      "AttributeName": "query_hash",
      "KeyType": "HASH"
    }
  ],
  "AttributeDefinitions": [
    {
      "AttributeName": "query_hash",
      "AttributeType": "S"
    }
  ],
  "TimeToLiveSpecification": {
    "Enabled": true,
    "AttributeName": "ttl"
  },
  "BillingMode": "PAY_PER_REQUEST"
}
```

**Item Structure:**
```json
{
  "query_hash": "sha256_of_query_params",
  "query_params": {
    "symptoms": ["chest pain", "shortness of breath"],
    "patient_age": 55,
    "patient_gender": "male"
  },
  "result": {
    "diagnosis": "Myocardial Infarction",
    "confidence": 0.89,
    "citations": [...]
  },
  "created_at": 1710518400,
  "ttl": 1710522000,
  "hit_count": 3
}
```

#### 3.4 session_data
User session management.

```json
{
  "TableName": "session_data",
  "KeySchema": [
    {
      "AttributeName": "session_id",
      "KeyType": "HASH"
    }
  ],
  "AttributeDefinitions": [
    {
      "AttributeName": "session_id",
      "AttributeType": "S"
    },
    {
      "AttributeName": "user_id",
      "AttributeType": "S"
    }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "user-index",
      "KeySchema": [
        {
          "AttributeName": "user_id",
          "KeyType": "HASH"
        }
      ],
      "Projection": {
        "ProjectionType": "KEYS_ONLY"
      }
    }
  ],
  "TimeToLiveSpecification": {
    "Enabled": true,
    "AttributeName": "ttl"
  },
  "BillingMode": "PAY_PER_REQUEST"
}
```

---

## 4. Data Relationships

### Entity Relationship Diagram

```
organizations (1) ──────< (N) users
     │
     │ (1)
     │
     ▼
     (N) patients (1) ──────< (N) patient_history
                │
                │ (1)
                │
                ▼
                (N) diagnoses (1) ──────< (N) agent_votes
                        │
                        │ (N)
                        │
                        ▼
                        (N) medical_documents (1) ──────< (N) document_chunks
                                    │
                                    │ (1)
                                    │
                                    ▼
                                    (N) crawl_jobs
```

---

## 5. Data Migration Strategy

### Initial Data Load

1. **Medical Literature (Phase 1)**
   - PubMed: 35M+ articles
   - Medical textbooks: 1,000+ books
   - Clinical guidelines: 10,000+ documents
   - Estimated time: 2-3 weeks
   - Estimated cost: $5,000 (Bright Data + processing)

2. **Indexing (Phase 2)**
   - Chunk documents: 100M+ chunks
   - Generate embeddings: 768-dim vectors
   - Index in OpenSearch: 100M+ documents
   - Estimated time: 1 week
   - Estimated cost: $2,000 (compute)

### Ongoing Updates

- **Daily**: New PubMed articles (~5,000/day)
- **Weekly**: Clinical guideline updates
- **Monthly**: Textbook revisions
- **Quarterly**: Full re-indexing for quality

---

## 6. Backup and Recovery

### Aurora PostgreSQL
- **Automated Backups**: Daily, 35-day retention
- **Manual Snapshots**: Before major changes
- **Point-in-Time Recovery**: 5-minute granularity
- **Cross-Region Replication**: us-east-1 → eu-west-1

### OpenSearch
- **Automated Snapshots**: Hourly to S3
- **Manual Snapshots**: Before index changes
- **Snapshot Retention**: 30 days
- **Restore Time**: ~2 hours for full cluster

### DynamoDB
- **Point-in-Time Recovery**: Enabled (35 days)
- **On-Demand Backups**: Weekly
- **Global Tables**: Multi-region replication
- **Restore Time**: ~30 minutes

---

## 7. Performance Optimization

### Aurora PostgreSQL
- **Connection Pooling**: RDS Proxy (max 1,000 connections)
- **Read Replicas**: 3 replicas for read scaling
- **Query Optimization**: Indexes on all foreign keys
- **Partitioning**: patient_history by year
- **Caching**: Query results in ElastiCache (5-minute TTL)

### OpenSearch
- **Shard Strategy**: 5 primary shards per index
- **Replica Strategy**: 1 replica per shard
- **Index Lifecycle**: Hot (7 days) → Warm (30 days) → Cold (1 year) → Delete
- **Query Optimization**: Use filters instead of queries when possible
- **Caching**: Field data cache, request cache enabled

### DynamoDB
- **Partition Key Design**: High cardinality (document_id, session_id)
- **GSI Strategy**: Sparse indexes for optional attributes
- **Batch Operations**: Use BatchGetItem, BatchWriteItem
- **Caching**: DAX for sub-millisecond reads (if needed)

---

## 8. Security Measures

### Encryption
- **At Rest**: AWS KMS encryption for all databases
- **In Transit**: TLS 1.3 for all connections
- **Application-Level**: PHI fields encrypted with AES-256

### Access Control
- **IAM Roles**: Least privilege for all services
- **Database Users**: Separate users per service
- **Network**: VPC with private subnets
- **Secrets**: AWS Secrets Manager for credentials

### Audit
- **Database Audit**: Aurora audit logs to CloudWatch
- **Access Logs**: All queries logged
- **Change Tracking**: DynamoDB Streams for audit trail
- **Retention**: 7 years for HIPAA compliance

---

## Conclusion

This database schema provides:
- ✅ **HIPAA Compliance**: Encryption, audit trails, access controls
- ✅ **Scalability**: Sharding, replication, caching
- ✅ **Performance**: Optimized indexes, query patterns
- ✅ **Reliability**: Backups, point-in-time recovery, multi-AZ
- ✅ **Flexibility**: Support for complex medical data structures

The schema is designed to support millions of diagnoses while maintaining sub-second query performance and ensuring data integrity for medical applications.