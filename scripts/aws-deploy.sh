#!/bin/bash

# AWS CLI deployment script for infrastructure management
# Handles S3 uploads, CloudWatch monitoring, and EC2 management

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# AWS Configuration
AWS_REGION="ap-northeast-2"
S3_BUCKET="digitalbook-assets"
INSTANCE_ID="i-0123456789abcdef"  # Replace with actual instance ID
CLOUDWATCH_GROUP="digitalbook-logs"

echo -e "${GREEN}=== AWS Infrastructure Deployment ===${NC}"
echo -e "Region: ${AWS_REGION}"
echo -e "Time: $(date)"

# Check AWS CLI configuration
echo -e "${YELLOW}Checking AWS credentials...${NC}"
aws sts get-caller-identity > /dev/null 2>&1 || {
    echo -e "${RED}AWS credentials not configured. Run 'aws configure'${NC}"
    exit 1
}

# 1. Upload static assets to S3
echo -e "${YELLOW}Uploading static assets to S3...${NC}"
if [ -d ".next/static" ]; then
    aws s3 sync .next/static s3://${S3_BUCKET}/static/ \
        --region ${AWS_REGION} \
        --cache-control "public, max-age=31536000" \
        --delete
    echo -e "${GREEN}✓ Static assets uploaded${NC}"
fi

# 2. Upload public files
echo -e "${YELLOW}Uploading public files...${NC}"
if [ -d "public" ]; then
    aws s3 sync public s3://${S3_BUCKET}/public/ \
        --region ${AWS_REGION} \
        --exclude "*.local" \
        --exclude ".git*"
    echo -e "${GREEN}✓ Public files uploaded${NC}"
fi

# 3. Check EC2 instance status
echo -e "${YELLOW}Checking EC2 instance status...${NC}"
INSTANCE_STATE=$(aws ec2 describe-instances \
    --instance-ids ${INSTANCE_ID} \
    --region ${AWS_REGION} \
    --query 'Reservations[0].Instances[0].State.Name' \
    --output text)

if [ "$INSTANCE_STATE" != "running" ]; then
    echo -e "${RED}Instance is not running. Current state: ${INSTANCE_STATE}${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Instance is running${NC}"

# 4. Create CloudWatch dashboard if not exists
echo -e "${YELLOW}Setting up CloudWatch monitoring...${NC}"
aws cloudwatch put-dashboard \
    --dashboard-name DigitalBookDashboard \
    --dashboard-body file://monitoring/cloudwatch-dashboard.json \
    --region ${AWS_REGION} 2>/dev/null || true

# 5. Send deployment metric
echo -e "${YELLOW}Recording deployment metric...${NC}"
aws cloudwatch put-metric-data \
    --namespace "DigitalBook/Deployments" \
    --metric-name "DeploymentCount" \
    --value 1 \
    --region ${AWS_REGION}

# 6. Create/update CloudFormation stack for infrastructure
echo -e "${YELLOW}Updating infrastructure stack...${NC}"
if [ -f "infrastructure/cloudformation.yaml" ]; then
    aws cloudformation deploy \
        --template-file infrastructure/cloudformation.yaml \
        --stack-name digitalbook-stack \
        --region ${AWS_REGION} \
        --capabilities CAPABILITY_IAM \
        --no-fail-on-empty-changeset
    echo -e "${GREEN}✓ Infrastructure updated${NC}"
fi

# 7. Invalidate CloudFront cache (if configured)
DISTRIBUTION_ID="E1234567890ABC"  # Replace with actual distribution ID
if [ ! -z "$DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}Invalidating CloudFront cache...${NC}"
    aws cloudfront create-invalidation \
        --distribution-id ${DISTRIBUTION_ID} \
        --paths "/*" \
        --region ${AWS_REGION} > /dev/null
    echo -e "${GREEN}✓ Cache invalidated${NC}"
fi

# 8. Tag the deployment
echo -e "${YELLOW}Tagging deployment...${NC}"
DEPLOYMENT_TAG="deployment-$(date +%Y%m%d-%H%M%S)"
aws ec2 create-tags \
    --resources ${INSTANCE_ID} \
    --tags Key=LastDeployment,Value="${DEPLOYMENT_TAG}" \
    --region ${AWS_REGION}

echo -e "${GREEN}=== AWS Deployment Complete ===${NC}"
echo -e "Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}"