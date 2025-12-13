# AWS Infrastructure for PDFMasterTool
# Terraform Configuration

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# S3 Bucket for file uploads
resource "aws_s3_bucket" "pdf_uploads" {
  bucket = var.s3_bucket_name
  
  tags = {
    Name        = "PDFMasterTool Uploads"
    Environment = var.environment
  }
}

# S3 Bucket Lifecycle Configuration (Auto-delete after 1 hour)
resource "aws_s3_bucket_lifecycle_configuration" "pdf_uploads_lifecycle" {
  bucket = aws_s3_bucket.pdf_uploads.id

  rule {
    id     = "delete-old-files"
    status = "Enabled"

    expiration {
      days = 0
      expired_object_delete_marker = true
    }

    noncurrent_version_expiration {
      noncurrent_days = 1
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }

    # Delete files after 1 hour
    transition {
      days          = 0
      storage_class = "GLACIER"
    }
  }
}

# S3 Bucket CORS Configuration
resource "aws_s3_bucket_cors_configuration" "pdf_uploads_cors" {
  bucket = aws_s3_bucket.pdf_uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = [var.site_url, "http://localhost:3000"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "pdf_uploads" {
  bucket = aws_s3_bucket.pdf_uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lambda Execution Role
resource "aws_iam_role" "lambda_execution_role" {
  name = "pdf-converter-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# Lambda Role Policy
resource "aws_iam_role_policy" "lambda_policy" {
  name = "pdf-converter-lambda-policy"
  role = aws_iam_role.lambda_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.pdf_uploads.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Lambda Function
resource "aws_lambda_function" "pdf_converter" {
  filename      = "../lambda/converter.zip"
  function_name = "pdf-converter"
  role         = aws_iam_role.lambda_execution_role.arn
  handler      = "converter.handler"
  runtime      = "nodejs20.x"
  timeout      = 300
  memory_size  = 3008

  environment {
    variables = {
      S3_BUCKET  = aws_s3_bucket.pdf_uploads.id
      AWS_REGION = var.aws_region
    }
  }

  layers = [
    aws_lambda_layer_version.libreoffice_layer.arn,
    aws_lambda_layer_version.ghostscript_layer.arn,
  ]

  tags = {
    Name        = "PDF Converter"
    Environment = var.environment
  }
}

# Lambda Layer for LibreOffice
resource "aws_lambda_layer_version" "libreoffice_layer" {
  filename   = "../layers/libreoffice.zip"
  layer_name = "libreoffice"

  compatible_runtimes = ["nodejs20.x"]
}

# Lambda Layer for Ghostscript
resource "aws_lambda_layer_version" "ghostscript_layer" {
  filename   = "../layers/ghostscript.zip"
  layer_name = "ghostscript"

  compatible_runtimes = ["nodejs20.x"]
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  price_class         = "PriceClass_All"
  default_root_object = "index.html"

  origin {
    domain_name = aws_s3_bucket.pdf_uploads.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.pdf_uploads.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.pdf_uploads.id}"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "PDFMasterTool CDN"
    Environment = var.environment
  }
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for PDFMasterTool"
}

# Variables
variable "aws_region" {
  description = "AWS Region"
  default     = "us-east-1"
}

variable "s3_bucket_name" {
  description = "S3 Bucket Name for uploads"
  default     = "pdfmastertool-uploads"
}

variable "site_url" {
  description = "Site URL"
  default     = "https://pdfmastertool.com"
}

variable "environment" {
  description = "Environment"
  default     = "production"
}

# Outputs
output "s3_bucket_name" {
  value = aws_s3_bucket.pdf_uploads.id
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.cdn.domain_name
}

output "lambda_function_arn" {
  value = aws_lambda_function.pdf_converter.arn
}
















