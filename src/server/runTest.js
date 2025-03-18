const testHeyGenAPI = require('./heygenTest');

async function runTest() {
  try {
    const result = await testHeyGenAPI();
    console.log('Test completed:', result);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTest(); 