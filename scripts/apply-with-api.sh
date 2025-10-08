#!/bin/bash

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Read SQL file
SQL=$(cat sql/create_aadhar_records_table.sql)

# Use Supabase Management API to execute SQL
curl -X POST "https://api.supabase.com/v1/projects/wbbvhmmhhjgleoyvuxtq/database/query" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL" | jq -Rs .)}"
