#!/bin/bash
# JWT Secret Rotation Cron Job

# Run JWT rotation script
cd /home/ubuntu/digitalbook
node scripts/jwt-rotation.js

# Restart application to use new secrets
docker-compose -f docker-compose.prod.yml restart app

# Log rotation event
echo "[$(date)] JWT secrets rotated" >> logs/rotation.log