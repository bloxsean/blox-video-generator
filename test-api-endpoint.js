import axios from 'axios';

// Test the API endpoint directly
async function testApiEndpoint() {
  try {
    console.log('Testing API endpoint directly...');
    const response = await axios.get('http://localhost:3001/api/voices');
    
    console.log('Response status:', response.status);
    console.log('Response has data object:', Boolean(response.data && response.data.data));
    console.log('Response has voices array:', Boolean(response.data && response.data.data && Array.isArray(response.data.data.voices)));
    
    if (response.data && response.data.data && Array.isArray(response.data.data.voices)) {
      console.log('Number of voices:', response.data.data.voices.length);
      
      if (response.data.data.voices.length > 0) {
        console.log('First voice object:', response.data.data.voices[0]);
      }
    } else {
      console.log('Unexpected response structure:', response.data);
    }
  } catch (error) {
    console.error('Error testing API endpoint:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
  }
}

// Run the test
testApiEndpoint(); 