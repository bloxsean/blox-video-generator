const axios = require('axios');
require('dotenv').config();  // Make sure to have this if using .env file

/**
 * Standalone function to test HeyGen API directly
 * @returns {Promise<Object>} The API response
 */
async function testHeyGenAPI() {
  try {
    console.log('Starting direct HeyGen API test');
    
    // Exact test data matching HeyGen's format
    const testData = {
      caption: false,
      dimension: {
        width: 1280,
        height: 720
      },
      title: `Test Video - ${new Date().toLocaleString()}`,
      callback_id: "direct_test_" + Math.floor(Math.random() * 100000),
      video_inputs: [
        {
          character: {
            type: "avatar",
            scale: 1,
            avatar_style: "normal",
            avatar_id: "Brent_sitting_office_front"
          },
          voice: {
            voice_id: "1985984feded457b9d013b4f6551ac94",
            type: "text",
            input_text: "This is a direct test of the video generation service."
          }
        }
      ]
    };
    
    console.log('Test request data:', JSON.stringify(testData, null, 2));
    
    // Make sure API key is available
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
      throw new Error('HEYGEN_API_KEY not found in environment variables');
    }
    
    // Make the request to HeyGen
    const response = await axios.post('https://api.heygen.com/v2/video/generate', testData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': apiKey
      }
    });
    
    console.log('HeyGen API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('HeyGen API Test Error:', error);
    if (error.response) {
      console.error('Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testHeyGenAPI()
    .then(result => {
      console.log('Test completed successfully:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = testHeyGenAPI; 