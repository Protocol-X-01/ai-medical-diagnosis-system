# AI Medical Diagnosis System - AWS Infrastructure
# Terraform Configuration for Production Deployment

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
  
  backend "s3" {
    bucket         = "ai-medical-diagnosis-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "AI-Medical-Diagnosis"
      Environment = var.environment
      ManagedBy   = "Terraform"
      CostCenter  = "Healthcare-AI"
      Compliance  = "HIPAA"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# Local variables
locals {
  account_id = data.aws_caller_identity.current.account_id
  azs        = slice(data.aws_availability_zones.available.names, 0, 3)
  
  common_tags = {
    Project     = "AI-Medical-Diagnosis"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ============================================================================
# VPC and Networking
# ============================================================================

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
  
  name = "${var.project_name}-vpc-${var.environment}"
  cidr = var.vpc_cidr
  
  azs              = local.azs
  private_subnets  = var.private_subnet_cidrs
  public_subnets   = var.public_subnet_cidrs
  database_subnets = var.database_subnet_cidrs
  
  enable_nat_gateway   = true
  single_nat_gateway   = var.environment == "dev" ? true : false
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  # VPC Flow Logs for security monitoring
  enable_flow_log                      = true
  create_flow_log_cloudwatch_iam_role  = true
  create_flow_log_cloudwatch_log_group = true
  
  tags = local.common_tags
}

# Security Groups
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-alb-"
  description = "Security group for Application Load Balancer"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from internet"
  }
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from internet (redirect to HTTPS)"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-alb-sg"
  })
}

resource "aws_security_group" "ecs_tasks" {
  name_prefix = "${var.project_name}-ecs-tasks-"
  description = "Security group for ECS tasks"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow traffic from ALB"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-ecs-tasks-sg"
  })
}

resource "aws_security_group" "aurora" {
  name_prefix = "${var.project_name}-aurora-"
  description = "Security group for Aurora PostgreSQL"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
    description     = "PostgreSQL from ECS tasks"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-aurora-sg"
  })
}

resource "aws_security_group" "opensearch" {
  name_prefix = "${var.project_name}-opensearch-"
  description = "Security group for OpenSearch"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
    description     = "HTTPS from ECS tasks"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-opensearch-sg"
  })
}

resource "aws_security_group" "elasticache" {
  name_prefix = "${var.project_name}-elasticache-"
  description = "Security group for ElastiCache Redis"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
    description     = "Redis from ECS tasks"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-elasticache-sg"
  })
}

# ============================================================================
# KMS Keys for Encryption
# ============================================================================

resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project_name} encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-kms-key"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-${var.environment}"
  target_key_id = aws_kms_key.main.key_id
}

# ============================================================================
# S3 Buckets
# ============================================================================

# Medical documents bucket
resource "aws_s3_bucket" "medical_documents" {
  bucket = "${var.project_name}-medical-documents-${var.environment}-${local.account_id}"
  
  tags = merge(local.common_tags, {
    Name        = "Medical Documents"
    DataType    = "PHI"
    Compliance  = "HIPAA"
  })
}

resource "aws_s3_bucket_versioning" "medical_documents" {
  bucket = aws_s3_bucket.medical_documents.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "medical_documents" {
  bucket = aws_s3_bucket.medical_documents.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "medical_documents" {
  bucket = aws_s3_bucket.medical_documents.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "medical_documents" {
  bucket = aws_s3_bucket.medical_documents.id
  
  rule {
    id     = "archive-old-documents"
    status = "Enabled"
    
    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 365
      storage_class = "GLACIER"
    }
  }
}

# Audit logs bucket
resource "aws_s3_bucket" "audit_logs" {
  bucket = "${var.project_name}-audit-logs-${var.environment}-${local.account_id}"
  
  tags = merge(local.common_tags, {
    Name       = "Audit Logs"
    Compliance = "HIPAA"
    Retention  = "7-years"
  })
}

resource "aws_s3_bucket_versioning" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id
  
  rule {
    id     = "retain-7-years"
    status = "Enabled"
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    expiration {
      days = 2555  # 7 years
    }
  }
}

# ============================================================================
# Aurora PostgreSQL
# ============================================================================

resource "random_password" "aurora_master" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "aurora_master" {
  name_prefix             = "${var.project_name}-aurora-master-"
  description             = "Master password for Aurora PostgreSQL"
  recovery_window_in_days = 30
  kms_key_id              = aws_kms_key.main.arn
  
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "aurora_master" {
  secret_id = aws_secretsmanager_secret.aurora_master.id
  secret_string = jsonencode({
    username = "postgres"
    password = random_password.aurora_master.result
  })
}

resource "aws_db_subnet_group" "aurora" {
  name       = "${var.project_name}-aurora-subnet-group"
  subnet_ids = module.vpc.database_subnets
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-aurora-subnet-group"
  })
}

resource "aws_rds_cluster" "aurora" {
  cluster_identifier      = "${var.project_name}-aurora-${var.environment}"
  engine                  = "aurora-postgresql"
  engine_version          = "15.4"
  database_name           = "medical_diagnosis"
  master_username         = "postgres"
  master_password         = random_password.aurora_master.result
  
  db_subnet_group_name    = aws_db_subnet_group.aurora.name
  vpc_security_group_ids  = [aws_security_group.aurora.id]
  
  backup_retention_period = 35
  preferred_backup_window = "03:00-04:00"
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.main.arn
  
  skip_final_snapshot     = var.environment == "dev" ? true : false
  final_snapshot_identifier = var.environment == "dev" ? null : "${var.project_name}-aurora-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-aurora-cluster"
  })
}

resource "aws_rds_cluster_instance" "aurora" {
  count              = var.aurora_instance_count
  identifier         = "${var.project_name}-aurora-${var.environment}-${count.index}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = var.aurora_instance_class
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version
  
  performance_insights_enabled = true
  performance_insights_kms_key_id = aws_kms_key.main.arn
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-aurora-instance-${count.index}"
  })
}

# ============================================================================
# OpenSearch
# ============================================================================

resource "aws_opensearch_domain" "main" {
  domain_name    = "${var.project_name}-${var.environment}"
  engine_version = "OpenSearch_2.11"
  
  cluster_config {
    instance_type            = var.opensearch_instance_type
    instance_count           = var.opensearch_instance_count
    dedicated_master_enabled = var.opensearch_instance_count >= 3
    dedicated_master_type    = var.opensearch_instance_count >= 3 ? "r6g.large.search" : null
    dedicated_master_count   = var.opensearch_instance_count >= 3 ? 3 : null
    zone_awareness_enabled   = var.opensearch_instance_count >= 2
    
    dynamic "zone_awareness_config" {
      for_each = var.opensearch_instance_count >= 2 ? [1] : []
      content {
        availability_zone_count = min(var.opensearch_instance_count, 3)
      }
    }
  }
  
  ebs_options {
    ebs_enabled = true
    volume_size = var.opensearch_volume_size
    volume_type = "gp3"
    iops        = 3000
    throughput  = 125
  }
  
  encrypt_at_rest {
    enabled    = true
    kms_key_id = aws_kms_key.main.arn
  }
  
  node_to_node_encryption {
    enabled = true
  }
  
  domain_endpoint_options {
    enforce_https       = true
    tls_security_policy = "Policy-Min-TLS-1-2-2019-07"
  }
  
  vpc_options {
    subnet_ids         = slice(module.vpc.private_subnets, 0, min(var.opensearch_instance_count, 3))
    security_group_ids = [aws_security_group.opensearch.id]
  }
  
  advanced_security_options {
    enabled                        = true
    internal_user_database_enabled = true
    master_user_options {
      master_user_name     = "admin"
      master_user_password = random_password.opensearch_master.result
    }
  }
  
  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch_application.arn
    log_type                 = "INDEX_SLOW_LOGS"
  }
  
  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch_search.arn
    log_type                 = "SEARCH_SLOW_LOGS"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-opensearch"
  })
}

resource "random_password" "opensearch_master" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "opensearch_master" {
  name_prefix             = "${var.project_name}-opensearch-master-"
  description             = "Master password for OpenSearch"
  recovery_window_in_days = 30
  kms_key_id              = aws_kms_key.main.arn
  
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "opensearch_master" {
  secret_id = aws_secretsmanager_secret.opensearch_master.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.opensearch_master.result
    endpoint = aws_opensearch_domain.main.endpoint
  })
}

resource "aws_cloudwatch_log_group" "opensearch_application" {
  name              = "/aws/opensearch/${var.project_name}-${var.environment}/application"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn
  
  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "opensearch_search" {
  name              = "/aws/opensearch/${var.project_name}-${var.environment}/search"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn
  
  tags = local.common_tags
}

# ============================================================================
# DynamoDB Tables
# ============================================================================

resource "aws_dynamodb_table" "document_metadata" {
  name           = "${var.project_name}-document-metadata-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "document_id"
  
  attribute {
    name = "document_id"
    type = "S"
  }
  
  attribute {
    name = "pmid"
    type = "S"
  }
  
  attribute {
    name = "doi"
    type = "S"
  }
  
  attribute {
    name = "source_domain"
    type = "S"
  }
  
  attribute {
    name = "crawl_date"
    type = "N"
  }
  
  global_secondary_index {
    name            = "pmid-index"
    hash_key        = "pmid"
    projection_type = "ALL"
  }
  
  global_secondary_index {
    name            = "doi-index"
    hash_key        = "doi"
    projection_type = "ALL"
  }
  
  global_secondary_index {
    name            = "source-crawl-index"
    hash_key        = "source_domain"
    range_key       = "crawl_date"
    projection_type = "KEYS_ONLY"
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }
  
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  
  tags = merge(local.common_tags, {
    Name = "Document Metadata"
  })
}

resource "aws_dynamodb_table" "crawl_status" {
  name           = "${var.project_name}-crawl-status-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "job_id"
  
  attribute {
    name = "job_id"
    type = "S"
  }
  
  attribute {
    name = "status"
    type = "S"
  }
  
  attribute {
    name = "created_at"
    type = "N"
  }
  
  global_secondary_index {
    name            = "status-created-index"
    hash_key        = "status"
    range_key       = "created_at"
    projection_type = "ALL"
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }
  
  tags = merge(local.common_tags, {
    Name = "Crawl Status"
  })
}

resource "aws_dynamodb_table" "query_cache" {
  name           = "${var.project_name}-query-cache-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "query_hash"
  
  attribute {
    name = "query_hash"
    type = "S"
  }
  
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }
  
  tags = merge(local.common_tags, {
    Name = "Query Cache"
  })
}

# ============================================================================
# ElastiCache Redis
# ============================================================================

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.project_name}-redis-subnet-group"
  subnet_ids = module.vpc.private_subnets
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-redis-subnet-group"
  })
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${var.project_name}-redis-${var.environment}"
  replication_group_description = "Redis cluster for ${var.project_name}"
  
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = var.redis_node_type
  num_cache_clusters   = var.redis_num_nodes
  parameter_group_name = "default.redis7"
  port                 = 6379
  
  subnet_group_name    = aws_elasticache_subnet_group.redis.name
  security_group_ids   = [aws_security_group.elasticache.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token_enabled         = true
  auth_token                 = random_password.redis_auth.result
  
  automatic_failover_enabled = var.redis_num_nodes > 1
  multi_az_enabled           = var.redis_num_nodes > 1
  
  snapshot_retention_limit = 5
  snapshot_window          = "03:00-05:00"
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-redis"
  })
}

resource "random_password" "redis_auth" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "redis_auth" {
  name_prefix             = "${var.project_name}-redis-auth-"
  description             = "Auth token for Redis"
  recovery_window_in_days = 30
  kms_key_id              = aws_kms_key.main.arn
  
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "redis_auth" {
  secret_id = aws_secretsmanager_secret.redis_auth.id
  secret_string = jsonencode({
    auth_token = random_password.redis_auth.result
    endpoint   = aws_elasticache_replication_group.redis.primary_endpoint_address
  })
}

# ============================================================================
# Outputs
# ============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "aurora_cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.aurora.endpoint
  sensitive   = true
}

output "opensearch_endpoint" {
  description = "OpenSearch endpoint"
  value       = aws_opensearch_domain.main.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  sensitive   = true
}

output "s3_medical_documents_bucket" {
  description = "S3 bucket for medical documents"
  value       = aws_s3_bucket.medical_documents.id
}

output "s3_audit_logs_bucket" {
  description = "S3 bucket for audit logs"
  value       = aws_s3_bucket.audit_logs.id
}