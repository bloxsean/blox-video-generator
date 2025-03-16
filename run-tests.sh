#!/bin/bash

# Set text colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== HeyGen Voice API Integration Tests ===${NC}\n"

# Check if server is running
echo -e "Checking if server is running..."
if curl -s http://localhost:3001/api/voices -o /dev/null; then
  SERVER_RUNNING=true
  echo -e "${GREEN}✓ Server is running${NC}"
else
  SERVER_RUNNING=false
  echo -e "${YELLOW}⚠ Server is not running. Starting server...${NC}"
  # Start server in background
  node server.js > server.log 2>&1 &
  SERVER_PID=$!
  echo -e "Server started with PID: $SERVER_PID"
  # Wait for server to start
  echo -e "Waiting for server to start..."
  sleep 5
fi

# Run API test
echo -e "\n${YELLOW}Running direct API test...${NC}"
node test-voice-api.js
API_TEST_EXIT=$?

if [ $API_TEST_EXIT -eq 0 ]; then
  echo -e "${GREEN}✓ API test completed successfully${NC}"
else
  echo -e "${RED}✗ API test failed${NC}"
fi

# Run server endpoint test if server is running
if [ "$SERVER_RUNNING" = true ] || [ -n "$SERVER_PID" ]; then
  echo -e "\n${YELLOW}Running server endpoint test...${NC}"
  node test-server-endpoint.js
  SERVER_TEST_EXIT=$?
  
  if [ $SERVER_TEST_EXIT -eq 0 ]; then
    echo -e "${GREEN}✓ Server endpoint test completed successfully${NC}"
  else
    echo -e "${RED}✗ Server endpoint test failed${NC}"
  fi
else
  echo -e "\n${RED}✗ Skipping server endpoint test because server is not running${NC}"
fi

# Kill server if we started it
if [ -n "$SERVER_PID" ]; then
  echo -e "\nStopping server (PID: $SERVER_PID)..."
  kill $SERVER_PID
  echo -e "${GREEN}✓ Server stopped${NC}"
fi

echo -e "\n${YELLOW}=== All Tests Completed ===${NC}"

# Check if sample response file was created
if [ -f "voice-api-sample-response.json" ]; then
  echo -e "\n${GREEN}✓ Sample API response saved to voice-api-sample-response.json${NC}"
  echo -e "\nSample response structure:"
  grep -A 10 "voices" voice-api-sample-response.json | head -n 10
  echo -e "..."
fi

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Check the test results above"
echo -e "2. If all tests passed, the VoiceBrowser component should work correctly"
echo -e "3. Start the application with: npm run dev (frontend) and npm run server (backend)"
echo -e "4. Navigate to the VoiceBrowser component to see the voices" 