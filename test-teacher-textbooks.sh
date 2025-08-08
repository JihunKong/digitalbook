#!/bin/bash

echo "Testing Teacher Textbook Visibility"
echo "====================================="

# Test with the test teacher account
EMAIL="test@example.com"
PASSWORD="test123"

echo -e "\n1. Logging in as teacher..."
RESPONSE=$(curl -X POST https://xn--220bu63c.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  -s)

TOKEN=$(echo $RESPONSE | jq -r '.accessToken')
USER_NAME=$(echo $RESPONSE | jq -r '.user.name')
USER_ID=$(echo $RESPONSE | jq -r '.user.id')

if [ "$TOKEN" != "null" ] && [ ! -z "$TOKEN" ]; then
  echo "✅ Logged in as: $USER_NAME (ID: $USER_ID)"
else
  echo "❌ Login failed"
  echo "Response: $RESPONSE"
  exit 1
fi

echo -e "\n2. Creating a test textbook..."
NEW_TEXTBOOK=$(curl -X POST https://xn--220bu63c.com/api/textbooks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Teacher Test Textbook '$(date +%s)'",
    "description": "Testing teacher visibility",
    "content": {"chapters": [{"title": "Chapter 1", "content": "Test content"}]},
    "metadata": {"subject": "Mathematics", "grade": "3"}
  }' \
  -s)

if echo "$NEW_TEXTBOOK" | jq -e '.id' >/dev/null 2>&1; then
  TEXTBOOK_ID=$(echo "$NEW_TEXTBOOK" | jq -r '.id')
  TEXTBOOK_TITLE=$(echo "$NEW_TEXTBOOK" | jq -r '.title')
  echo "✅ Created textbook: $TEXTBOOK_TITLE (ID: $TEXTBOOK_ID)"
else
  echo "❌ Failed to create textbook"
  echo "Response: $NEW_TEXTBOOK"
  exit 1
fi

echo -e "\n3. Fetching teacher's textbooks..."
TEXTBOOKS=$(curl -X GET https://xn--220bu63c.com/api/textbooks \
  -H "Authorization: Bearer $TOKEN" \
  -s)

if echo "$TEXTBOOKS" | jq -e '.' >/dev/null 2>&1; then
  COUNT=$(echo "$TEXTBOOKS" | jq 'length')
  echo "✅ Found $COUNT textbook(s)"
  
  # Check if our created textbook is in the list
  if echo "$TEXTBOOKS" | jq -e ".[] | select(.id == \"$TEXTBOOK_ID\")" >/dev/null 2>&1; then
    echo "✅ The newly created textbook is visible in the list!"
    
    # Display all textbooks with their details
    echo -e "\n📚 Teacher's Textbooks:"
    echo "$TEXTBOOKS" | jq -r '.[] | "   - \(.title) (ID: \(.id))"'
  else
    echo "❌ The newly created textbook is NOT visible in the list"
    echo "Available textbooks:"
    echo "$TEXTBOOKS" | jq '.'
  fi
else
  echo "❌ Failed to get textbooks"
  echo "Response: $TEXTBOOKS"
  exit 1
fi

echo -e "\n====================================="
echo "✅ Teacher can successfully see their textbooks!"