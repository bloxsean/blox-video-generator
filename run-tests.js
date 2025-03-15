const { exec } = require('child_process');
const fs = require('fs').promises;

async function runTests() {
  console.log('=== Running All Tests ===\n');
  
  // Run the direct API test
  console.log('Running direct API test...');
  try {
    const apiTestOutput = await runCommand('node test-voice-api.js');
    await fs.writeFile('api-test-results.txt', apiTestOutput);
    console.log('API test completed. Results saved to api-test-results.txt');
    console.log('\nAPI Test Summary:');
    console.log(apiTestOutput.split('\n=== Test Summary ===')[1] || 'No summary available');
  } catch (error) {
    console.error('Error running API test:', error);
  }
  
  // Check if server is running
  console.log('\nChecking if server is running...');
  try {
    await runCommand('curl -s http://localhost:3001/api/voices -o /dev/null -w "%{http_code}"');
    console.log('Server is running. Running server endpoint test...');
    
    const serverTestOutput = await runCommand('node test-server-endpoint.js');
    await fs.writeFile('server-test-results.txt', serverTestOutput);
    console.log('Server test completed. Results saved to server-test-results.txt');
    console.log('\nServer Test Output:');
    console.log(serverTestOutput);
  } catch (error) {
    console.log('Server is not running. Skipping server endpoint test.');
  }
  
  console.log('\n=== All Tests Completed ===');
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`${error.message}\n${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });
}

runTests().catch(console.error); 