# Voice API Integration Tests

This document provides instructions for testing the Voice API integration and the VoiceBrowser component.

## Backend API Test

The `test-voice-api.js` script tests the HeyGen Voice API integration and verifies that the response format matches what our frontend component expects.

### Running the API Test

1. Make sure you have a `.env` file with your HeyGen API key:
   ```
   HEYGEN_API_KEY=your_api_key_here
   ```

2. Run the test script:
   ```
   npm run test:api
   ```

3. Check the output for any errors or warnings.

### What the API Test Checks

- Verifies that the API key is configured
- Makes a direct API call to HeyGen's voice list endpoint
- Validates the response structure matches our expected format
- Simulates how the VoiceBrowser component would process the data
- Saves a sample of the API response to `voice-api-sample-response.json`

## Frontend Component Test

The component test verifies that the VoiceBrowser component correctly renders and handles the voice data.

### Running the Component Test

1. Install the required dependencies:
   ```
   npm install axios-mock-adapter --save-dev
   ```

2. Temporarily modify your `main.jsx` file to import the test component:
   ```javascript
   import './test-voice-browser.jsx'
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Open your browser to the development server URL (usually http://localhost:5173)

### What the Component Test Checks

- Renders the VoiceBrowser component with mock data
- Verifies that voice cards display correctly
- Tests the voice selection functionality
- Ensures feature tags are displayed properly

## Expected Results

If everything is working correctly:

1. The API test should show that the response structure is valid and can be processed by the component
2. The component test should display two voice cards with all the expected information
3. Clicking on a voice card should log the selected voice to the console
4. The "Play Sample" button should be present on each card

## Troubleshooting

If you encounter issues:

1. Check that your API key is valid and properly configured
2. Verify that the response format from the API matches what's expected
3. Check the browser console for any JavaScript errors
4. Ensure all dependencies are installed correctly 