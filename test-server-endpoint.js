import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testServerEndpoint() {
  console.log('=== Testing Server Voice API Endpoint ===');
  
  try {
    // First check if server is running
    console.log('\nChecking if server is running...');
    
    // Test the server endpoint
    console.log('\nTesting /api/voices endpoint...');
    const response = await axios.get('http://localhost:3001/api/voices');
    
    console.log('✅ Server endpoint responded with status:', response.status);
    
    // Validate response structure
    if (response.data && response.data.data && Array.isArray(response.data.data.voices)) {
      console.log(`✅ Response structure is valid. Found ${response.data.data.voices.length} voices.`);
      
      // Check a sample voice
      if (response.data.data.voices.length > 0) {
        const sampleVoice = response.data.data.voices[0];
        console.log('\nSample voice from server:');
        console.log(JSON.stringify(sampleVoice, null, 2));
      }
    } else {
      console.log('❌ Unexpected response structure from server:', JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running. Please start the server with: npm run server');
    } else {
      console.log('❌ Error testing server endpoint:', error.message);
      if (error.response) {
        console.log('Error details:', error.response.data);
      }
    }
  }
}

// Run the test
testServerEndpoint().catch(console.error); 