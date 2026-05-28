# Variables for AI Medical Diagnosis System Infrastructure

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "ai-medical-diagnosis"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"
  
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]
}

# Aurora PostgreSQL Configuration
variable "aurora_instance_class" {
  description = "Instance class for Aurora PostgreSQL"
  type        = string
  default     = "db.r6g.xlarge"
}

variable "aurora_instance_count" {
  description = "Number of Aurora instances (1 writer + N readers)"
  type        = number
  default     = 3
  
  validation {
    condition     = var.aurora_instance_count >= 1 && var.aurora_instance_count <= 15
    error_message = "Aurora instance count must be between 1 and 15."
  }
}

# OpenSearch Configuration
variable "opensearch_instance_type" {
  description = "Instance type for OpenSearch nodes"
  type        = string
  default     = "r6g.large.search"
}

variable "opensearch_instance_count" {
  description = "Number of OpenSearch data nodes"
  type        = number
  default     = 3
  
  validation {
    condition     = var.opensearch_instance_count >= 1
    error_message = "OpenSearch instance count must be at least 1."
  }
}

variable "opensearch_volume_size" {
  description = "EBS volume size for OpenSearch (GB)"
  type        = number
  default     = 500
  
  validation {
    condition     = var.opensearch_volume_size >= 10 && var.opensearch_volume_size <= 3584
    error_message = "OpenSearch volume size must be between 10 and 3584 GB."
  }
}

# ElastiCache Redis Configuration
variable "redis_node_type" {
  description = "Node type for Redis cluster"
  type        = string
  default     = "cache.r6g.large"
}

variable "redis_num_nodes" {
  description = "Number of Redis nodes"
  type        = number
  default     = 3
  
  validation {
    condition     = var.redis_num_nodes >= 1 && var.redis_num_nodes <= 6
    error_message = "Redis node count must be between 1 and 6."
  }
}

# ECS Configuration
variable "ecs_agent_cpu" {
  description = "CPU units for ECS agent tasks"
  type        = number
  default     = 2048
}

variable "ecs_agent_memory" {
  description = "Memory (MB) for ECS agent tasks"
  type        = number
  default     = 4096
}

variable "ecs_agent_desired_count" {
  description = "Desired number of agent tasks"
  type        = number
  default     = 5
}

variable "ecs_agent_min_count" {
  description = "Minimum number of agent tasks"
  type        = number
  default     = 5
}

variable "ecs_agent_max_count" {
  description = "Maximum number of agent tasks"
  type        = number
  default     = 100
}

# Lambda Configuration
variable "lambda_memory_size" {
  description = "Memory size for Lambda functions (MB)"
  type        = number
  default     = 1024
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions (seconds)"
  type        = number
  default     = 300
}

# Monitoring and Alerting
variable "enable_enhanced_monitoring" {
  description = "Enable enhanced monitoring for databases"
  type        = bool
  default     = true
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarms"
  type        = string
  default     = ""
}

# Cost Optimization
variable "enable_savings_plans" {
  description = "Enable Savings Plans recommendations"
  type        = bool
  default     = true
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}