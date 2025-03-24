const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());  // Make sure this is here to parse JSON requests

// app.post('/api/generate-video', async (req, res) => {
//   console.log('Proxy-generate-video-API Request received:', JSON.stringify(req.body, null, 2));
//   // try {
//   //   console.log('API Request received:', JSON.stringify(req.body, null, 2));
    
//   //   // Check request format
//   //   console.log('Request body type:', typeof req.body);
//   //   console.log('Request keys:', Object.keys(req.body));
    
//   //   // Is your proxy expecting the HeyGen format or your own custom format?
//   //   // if (!req.body.video_inputs && !req.body.avatar) {
//   //   //   return res.status(400).json({
//   //   //     error: 'Invalid data format',
//   //   //     details: 'Request must contain either video_inputs or avatar property'
//   //   //   });
//   //   // }
    
//   //   // Prepare HeyGen request data
//   //   let heygenRequest;
    
//   //   // If client sends HeyGen format directly
//   //   // if (req.body.video_inputs) {
//   //   //   console.log('Request is in HeyGen format, using directly');
//   //   //   heygenRequest = req.body;
//   //   // } 
//   //   // If client sends your custom format
//   //  // else if (req.body.avatar) {

//   //     console.log('Request is in custom format, transforming to HeyGen format');
//   //     const { video_inputs, title, dimension} = req.body;

     
      
//   //     // if (!avatar || !avatar.avatar_id) {
//   //     //   return res.status(400).json({
//   //     //     error: 'Invalid data format',
//   //     //     details: 'The avatar object must have an avatar_id property'
//   //     //   });
//   //     // }
      
//   //     // if (!voice || !voice.voice_id) {
//   //     //   return res.status(400).json({
//   //     //     error: 'Invalid data format',
//   //     //     details: 'The voice object must have a voice_id property'
//   //     //   });
//   //     // }
      
//   //     // Convert to HeyGen format
//   //     heygenRequest = {
//   //       caption: false,
//   //       dimension: {
//   //         width: 1280,
//   //         height: 720
//   //       },
//   //       title: settings?.title || `Generated Video - ${new Date().toLocaleString()}`,
//   //       callback_id: "proxy_" + Math.floor(Math.random() * 100000),
//   //       video_inputs: [
//   //         {
//   //           character: {
//   //             type: "avatar",
//   //             scale: 1,
//   //             avatar_style: "normal",
//   //             avatar_id: video_inputs[0].character.avatar_id
//   //           },
//   //           voice: {
//   //             voice_id: video_inputs[0].voice.voice_id,
//   //             type: "text",
//   //             input_text: video_inputs[0].voice.input_text
//   //           }
//   //         }
//   //       ]
//   //     };
//   //  // }
    
//   //   // Make sure you have the HeyGen API key
//   //   if (!process.env.HEYGEN_API_KEY) {
//   //     console.error('HEYGEN_API_KEY environment variable is not set');
//   //     return res.status(500).json({
//   //       error: 'Server configuration error',
//   //       details: 'Missing API key'
//   //     });
//   //   }
    
//   //   console.log('Sending request to HeyGen API:', JSON.stringify(heygenRequest, null, 2));
//   //   console.log('Using API key:', process.env.HEYGEN_API_KEY ? 'Key is set (not shown for security)' : 'NO API KEY');
    
//   //   // Forward to HeyGen
//   //   //comment out to test locally
//   //   const response = await axios.post('https://api.heygen.com/v2/video/generate', heygenRequest, {
//   //     headers: {
//   //       'Content-Type': 'application/json',
//   //       'x-api-key': process.env.HEYGEN_API_KEY
//   //     }
//   //   });
    
//   //   console.log('HeyGen API response:', response.data);
//   //   res.json(response.data);

//   // } catch (error) {
//   //   // Error handling
//   //   console.error('Proxy error:', error);
    
//   //   if (error.response) {
//   //     // Forward HeyGen error
//   //     console.error('HeyGen API error:', {
//   //       status: error.response.status,
//   //       statusText: error.response.statusText,
//   //       data: error.response.data
//   //     });
//   //     res.status(error.response.status).json(error.response.data);
//   //   } else {
//   //     res.status(500).json({
//   //       error: 'Server error',
//   //       details: error.message
//   //     });
//   //   }
//   // }
// });

// Add a test endpoint to verify the proxy is working
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ status: 'ok', message: 'Proxy server is running' });
});

// Add this simple test endpoint
app.post('/api/test-echo', (req, res) => {
  console.log('Test endpoint received:', req.body);
  res.json({
    success: true,
    receivedData: req.body,
    message: 'Request received successfully'
  });
});

// Add the new direct test function
app.post('/api/test-heygen-direct', async (req, res) => {
  try {
    console.log('Direct HeyGen test endpoint hit');
    
    // Hardcoded test data matching the exact format
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
    
    console.log('Sending test request to HeyGen:', JSON.stringify(testData, null, 2));
    
    // Make the request to HeyGen with exact headers
    const response = await axios.post('https://api.heygen.com/v2/video/generate', testData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': process.env.HEYGEN_API_KEY
      }
    });
    
    console.log('HeyGen test response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Direct test error:', error);
    
    if (error.response) {
      console.error('HeyGen API error details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: 'Server error',
        details: error.message
      });
    }
  }
});

// Add a parameterized version that accepts custom inputs
app.post('/api/test-heygen-custom', async (req, res) => {
  try {
    console.log('Custom HeyGen test endpoint hit');
    
    const { avatarId, voiceId, inputText } = req.body;
    
    // Validate required fields
    if (!avatarId || !voiceId || !inputText) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'avatarId, voiceId, and inputText are required'
      });
    }
    
    // Create request data with custom inputs
    const requestData = {
      caption: false,
      dimension: {
        width: 1280,
        height: 720
      },
      title: `Custom Test - ${new Date().toLocaleString()}`,
      callback_id: "custom_test_" + Math.floor(Math.random() * 100000),
      video_inputs: [
        {
          character: {
            type: "avatar",
            scale: 1,
            avatar_style: "normal",
            avatar_id: avatarId
          },
          voice: {
            voice_id: voiceId,
            type: "text",
            input_text: inputText
          }
        }
      ]
    };
    
    console.log('Sending custom request to HeyGen:', JSON.stringify(requestData, null, 2));
    
    const response = await axios.post('https://api.heygen.com/v2/video/generate', requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': process.env.HEYGEN_API_KEY
      }
    });
    
    console.log('HeyGen custom response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Custom test error:', error);
    
    if (error.response) {
      console.error('HeyGen API error details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: 'Server error',
        details: error.message
      });
    }
  }
});

module.exports = app; 