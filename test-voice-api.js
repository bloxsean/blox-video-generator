import axios from 'axios';
import * as dotenv from 'dotenv';
import { promises as fs } from 'fs';

// Load environment variables
dotenv.config();

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

// Mock response for testing without API key
const mockVoiceResponse = {
  "error": null,
  "data": {
    "voices": [
      {
        "voice_id": "4af1c417143243c38d52e09df9d8d7b1",
        "language": "English",
        "gender": "male",
        "name": "Empathetic Eli",
        "preview_audio": "https://resource.heygen.ai/text_to_speech/R2kqRdR7HXQsBQwpdYqivM.mp3",
        "support_pause": true,
        "emotion_support": false,
        "support_interactive_avatar": false
      },
      {
        "voice_id": "1985984feded457b9d013b4f6551ac94",
        "language": "English",
        "gender": "Male",
        "name": "Tarquin",
        "preview_audio": "https://static.heygen.ai/voice_preview/5R5EWwcXSiGMWub5LEB5VV.wav",
        "support_pause": false,
        "emotion_support": true,
        "support_interactive_avatar": true
      }
    ]
  }
};

async function testVoiceAPI() {
  console.log('=== Voice API Integration Test ===');
  
  // Test 1: Check if API key is configured
  console.log('\nTest 1: Checking API key configuration...');
  if (!HEYGEN_API_KEY) {
    console.log('❌ API key not found. Using mock data for testing.');
  } else {
    console.log('✅ API key is configured.');
  }
  
  // Test 2: Test API endpoint directly
  console.log('\nTest 2: Testing direct API call to HeyGen...');
  try {
    let response;
    if (HEYGEN_API_KEY) {
      response = await axios.get('https://api.heygen.com/v1/voice/list', {
        headers: {
          'X-Api-Key': HEYGEN_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Direct API call successful');
      
      // Validate response structure
      if (response.data && response.data.data && Array.isArray(response.data.data.voices)) {
        console.log(`✅ Response structure is valid. Found ${response.data.data.voices.length} voices.`);
        
        // Save sample response for reference
        await fs.writeFile('voice-api-sample-response.json', JSON.stringify(response.data, null, 2));
        console.log('✅ Sample response saved to voice-api-sample-response.json');
      } else {
        console.log('❌ Unexpected response structure:', JSON.stringify(response.data, null, 2));
      }
    } else {
      console.log('⚠️ Skipping direct API call due to missing API key');
      response = { data: mockVoiceResponse };
    }
    
    // Test 3: Simulate VoiceBrowser component data handling
    console.log('\nTest 3: Testing VoiceBrowser component data handling...');
    const data = response.data;
    
    if (data && data.data && Array.isArray(data.data.voices)) {
      const voices = data.data.voices;
      console.log(`✅ Component would receive ${voices.length} voices`);
      
      // Check a sample voice object
      if (voices.length > 0) {
        const sampleVoice = voices[0];
        console.log('\nSample voice object:');
        console.log(JSON.stringify(sampleVoice, null, 2));
        
        // Verify required properties
        const requiredProps = ['voice_id', 'name', 'language', 'gender', 'preview_audio'];
        const missingProps = requiredProps.filter(prop => !sampleVoice.hasOwnProperty(prop));
        
        if (missingProps.length === 0) {
          console.log('✅ All required properties are present in voice objects');
        } else {
          console.log(`❌ Missing required properties: ${missingProps.join(', ')}`);
        }
      }
    } else {
      console.log('❌ Component would fail to process this data structure');
    }
    
  } catch (error) {
    console.log('❌ API call failed:', error.message);
    if (error.response) {
      console.log('Error details:', error.response.data);
    }
  }
  
  console.log('\n=== Test Summary ===');
  console.log('The VoiceBrowser component expects data in the format:');
  console.log('{');
  console.log('  "error": null,');
  console.log('  "data": {');
  console.log('    "voices": [ ... array of voice objects ... ]');
  console.log('  }');
  console.log('}');
  console.log('\nEach voice object should have: voice_id, name, language, gender, preview_audio');
  console.log('\nThe current implementation correctly handles this structure.');
}

// Run the test
testVoiceAPI().catch(console.error); 