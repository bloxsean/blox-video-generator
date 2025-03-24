import express from 'express';
import axios from 'axios';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import xml2js from 'xml2js';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const result = dotenv.config();

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

// Log environment configuration (remove sensitive data in production)
console.log('Environment Configuration:', {
  PORT: process.env.PORT,
  FIELD59_USERNAME_SET: !!process.env.FIELD59_USERNAME,
  FIELD59_PASSWORD_SET: !!process.env.FIELD59_PASSWORD
});

const app = express();

//app.use(cors());

// Update CORS configuration to explicitly allow POST
app.use(cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // allow all needed methods
  origin: 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'X-Api-Key', 'Accept', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

const PORT = process.env.PORT || 3001;
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const API_BASE_URL_V2 = 'https://api.heygen.com/v2';
const API_BASE_URL_V1 = 'https://api.heygen.com/v1';

// Add this temporary test endpoint
app.post('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint working', HEYGEN_API_KEY: HEYGEN_API_KEY });
});

// Validate API key middleware
const validateApiKey = (req, res, next) => {
  if (!HEYGEN_API_KEY) {
    console.error('HeyGen API key is not configured');
    return res.status(500).json({ 
      error: 'API key is not configured',
      details: 'Please check your .env file and ensure HEYGEN_API_KEY is set correctly'
    });
  }
  next();
};

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Add this middleware before your API routes:
app.use((req, res, next) => {
  if (req.path === '/api/generate-video' && req.method === 'POST') {
    console.log('==== GENERATE VIDEO REQUEST ====');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Raw body:', JSON.stringify(req.body, null, 2));
    console.log('Body type:', typeof req.body);
    console.log('video_inputs exists:', !!req.body.video_inputs);
    if (req.body.video_inputs?.[0]?.character) {
      console.log('Character type:', typeof req.body.video_inputs[0].character);
      console.log('Character has avatar_id:', 'avatar_id' in req.body.video_inputs[0].character);
      console.log('Character properties:', Object.keys(req.body.video_inputs[0].character));
    }
  }
  next();
});

// List voices
app.get('/api/voices', validateApiKey, async (req, res) => {
  try {
    console.log('Fetching voices from HeyGen API...');
    
    const response = await axios.get(`${API_BASE_URL_V2}/voices`, {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Accept': 'application/json'
      }
    });

    console.log('Raw API response:', JSON.stringify(response.data, null, 2));

    // According to v2 docs, response should be { data: { voices: [] } }
    if (!response.data?.data?.voices || !Array.isArray(response.data.data.voices)) {
      throw new Error('Invalid response format from HeyGen API');
    }

    // Transform the response to include preview URLs and normalize fields
    const transformedVoices = response.data.data.voices.map(voice => ({
      voice_id: voice.voice_id,
      name: voice.name,
      language: voice.language || 'Unknown',
      gender: voice.gender || 'Not specified',
      preview_url: voice.preview_url || voice.preview_audio || voice.sample_url,
      tags: voice.tags || [],
      premium: voice.is_premium || false,
      emotion_support: voice.emotion_support || false,
      support_pause: voice.support_pause || false
    }));
    
    console.log(`Successfully transformed ${transformedVoices.length} voices`);
    
    res.json({
      error: null,
      data: {
        voices: transformedVoices
      }
    });
  } catch (error) {
    console.error('Error fetching voices:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      stack: error.stack
    });
    
    const errorResponse = {
      error: 'Failed to fetch voices',
      details: error.response?.data?.message || error.message,
      status: error.response?.status || 500,
      timestamp: new Date().toISOString()
    };

    console.log('Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
});

// List avatars
app.get('/api/avatars', validateApiKey, async (req, res) => {
  try {
    console.log('Fetching avatars from HeyGen API...');
    
    const response = await axios.get(`${API_BASE_URL_V2}/avatars`, {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Accept': 'application/json'
      }
    });

    console.log('Raw avatar API response:', JSON.stringify(response.data, null, 2));

    // According to v2 docs, response should be { data: { avatars: [] } }
    if (!response.data?.data?.avatars || !Array.isArray(response.data.data.avatars)) {
      throw new Error('Invalid response format from HeyGen Avatar API');
    }

    // Transform the response to normalize fields according to v2 API
    const transformedAvatars = response.data.data.avatars.map(avatar => ({
      avatar_id: avatar.avatar_id,
      name: avatar.name,
      preview_url: avatar.preview_url || null,
      preview_video_url: avatar.preview_video_url || null,
      preview_image_url: avatar.preview_image_url || null,
      type: avatar.type || 'unknown',
      gender: avatar.gender || 'unknown',
      tags: avatar.tags || [],
      premium: avatar.is_premium || false,
      description: avatar.description || '',
      language: avatar.language || 'unknown',
      voice_id: avatar.voice_id || null,
      style_list: avatar.style_list || [],
      created_at: avatar.created_at || new Date().toISOString(),
      updated_at: avatar.updated_at || new Date().toISOString()
    }));
    
    console.log(`Successfully transformed ${transformedAvatars.length} avatars`);
    
    res.json({
      error: null,
      data: {
        avatars: transformedAvatars
      }
    });
  } catch (error) {
    console.error('Error fetching avatars:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      stack: error.stack
    });
    
    const errorResponse = {
      error: 'Failed to fetch avatars',
      details: error.response?.data?.message || error.message,
      status: error.response?.status || 500,
      timestamp: new Date().toISOString()
    };

    console.log('Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
});


// restore from git on 3-22-25
app.post('/api/generate-video', validateApiKey, async (req, res) => {
  console.log('==== GENERATE VIDEO REQUEST ====');
  try {
    console.log('Starting video generation with data:', JSON.stringify(req.body, null, 2));
    
    // Debug the request structure more deeply
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request body constructor:', req.body.constructor.name);
    console.log('Request body avatar (if any):', req.body.avatar);
    
    
    // Prepare the request payload according to HeyGen v2 API structure
    const payload = req.body;
    // const payload = {
    //   video_inputs: [
    //     {
    //       character: {
    //         type: "avatar",
    //         avatar_id: avatar.avatar_id,
    //         scale: 1.0
    //       },
    //       voice: {
    //         type: "text",
    //         voice_id: voice.voice_id,
    //         input_text: script
    //       },
    //       background: {
    //         type: "color",
    //         value: settings?.backgroundColor || "#f6f6fc"
    //       }
    //     }
    //   ],
    //   title: settings?.title || "Generated Video",
    //   dimension: {
    //     width: 1920,
    //     height: 1080
    //   }
    // };
    
    console.log('Sending payload to HeyGen API:', JSON.stringify(payload, null, 2));
    
    // Call HeyGen's v2 video generation API with the correct endpoint
    const response = await axios.post(`https://api.heygen.com/v2/video/generate`, payload, {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('Video generation response:', response.data);
    //Video generation response: { error: null, data: { video_id: 'd2a52555fcc24541bf5e9b3e6d66c17b' } }
    
    // Return the video ID from the HeyGen API
    // res.json({
    //   error: null,
    //   video_id: response.data.video_id // Note: The direct structure from v2 API
    // });
    res.json({
      error: null,
      video_id: response.data// Note: The direct structure from v2 API
    });
  } catch (error) {
    console.error('Error generating video:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      stack: error.stack
    });
    
    res.status(error.response?.status || 500).json({
      error: 'Failed to generate video',
      details: error.response?.data?.message || error.message
    });
  }
});

//en





// Field59 API endpoint
// app.post('/api/field59/upload', async (req, res) => {
//   console.log('Field59 Upload Request:', {
//     url: req.body.url,
//     title: req.body.title
//   });

//   try {
//     const { url, title } = req.body;
//     const username = process.env.FIELD59_USERNAME;
//     const password = process.env.FIELD59_PASSWORD;
    
//     // Debug logging for authentication
//     console.log('Field59 auth check:', {
//       usernameSet: !!username,
//       passwordSet: !!password
//     });
    
//     // Validate inputs
//     if (!url) {
//       return res.status(400).json({
//         error: 'Missing required parameters',
//         details: 'URL is required'
//       });
//     }
    
//     if (!username || !password) {
//       return res.status(500).json({
//         error: 'Configuration error',
//         details: 'Field59 credentials not configured'
//       });
//     }
    
//     // Create the XML payload with URL-encoded URL inside CDATA
//     const fileName = url.split('/').pop()?.split('?')[0] || '';
//     const videoTitle = title || fileName.replace(/\.[^/.]+$/, '');
//     const xml = `<?xml version="1.0" encoding="UTF-8"?>
// <video>
//   <title><![CDATA[${videoTitle}]]></title>
//   <url><![CDATA[${url}]]></url>
// </video>`;

//     console.log('Prepared XML payload:', xml);

//     // Format params and auth correctly
//     const params = new URLSearchParams();
//     params.append('xml', xml);
    
//     // Log full debug info (sanitized)
//     console.log('Field59 Request Debug:', {
//       username_length: username.trim().length,
//       password_length: password.trim().length,
//       xml_length: xml.length,
//       url: 'https://api.field59.com/v2/video/create'
//     });

//     // Try a different auth header encoding approach
//     const authString = username.trim() + ':' + password.trim();
//     const authBuf = Buffer.from(authString, 'utf8');
//     const base64Auth = authBuf.toString('base64');
    
//     // Ensure XML is properly encoded
//     const xmlParam = encodeURIComponent(xml);
//     const requestBody = `xml=${xmlParam}`;

//     // First make an unauthenticated request to get the auth challenge
//     const initialResponse = await axios({
//       method: 'post',
//       url: 'https://api.field59.com/v2/video/create',
//       validateStatus: null
//     });

//     // Get realm from WWW-Authenticate header
//     const authHeader = initialResponse.headers['www-authenticate'];
//     const realm = authHeader ? authHeader.match(/realm="([^"]+)"/) : null;
//     const realmString = realm ? realm[1] : 'api.field59.com';

//     // Create properly formatted auth header with realm
//     const headers = {
//       'Authorization': `${username}:${password}#`,
//       'Content-Type': 'application/x-www-form-urlencoded',
//       'Content-Length': Buffer.byteLength(requestBody),
//       'Accept': 'application/xml',
//       'Host': 'api.field59.com'
//     };

//     console.log('Using auth challenge info:', {
//       realm: realmString,
//       authHeaderPresent: !!authHeader,
//       headerLength: headers['Authorization'].length
//     });

//     // Make authenticated request
//     const field59Response = await axios({
//       method: 'post',
//       url: 'https://api.field59.com/v2/video/create',
//       data: requestBody,
//       headers: headers,
//       auth: {
//         username: username.trim(),
//         password: password.trim()
//       },
//       // Capture exact request/response data
//       transformRequest: [(data) => {
//         console.log('Raw request body:', data);
//         console.log('Request headers:', headers);
//         return data;
//       }],
//       transformResponse: [(data) => {
//         console.log('Raw response:', {
//           data: data?.substring(0, 200),
//           type: typeof data,
//           length: data?.length
//         });
//         return data;
//       }],
//       responseType: 'text',
//       validateStatus: null,
//       maxRedirects: 0
//     });

//     // Log the exact request details
//     console.log('Field59 Request:', {
//       url: 'https://api.field59.com/v2/video/create',
//       method: 'POST',
//       bodyLength: requestBody.length,
//       xmlLength: xml.length,
//       encodedXmlLength: xmlParam.length
//     });

//     // Log full response details
//     console.log('Field59 Response:', {
//       status: field59Response.status,
//       statusText: field59Response.statusText,
//       headers: field59Response.headers,
//       auth_header: field59Response.headers['www-authenticate'],
//       data_length: field59Response.data?.length || 0,
//       response_type: typeof field59Response.data,
//       data_preview: field59Response.data ? field59Response.data.substring(0, 100) : null
//     });

//     // Handle auth failure with more detail
//     if (field59Response.status === 401) {
//       const authHeader = field59Response.headers['www-authenticate'];
//       const errorDetail = field59Response.data || 'No additional error details provided';
//       throw new Error(`Authentication failed (${authHeader}) - ${errorDetail}`);
//     }

//     console.log('Field59 API Response:', {
//       status: field59Response.status,
//       headers: field59Response.headers,
//       data: field59Response.data
//     });

//     // Parse XML response
//     const parseXml = promisify(xml2js.parseString);
//     const result = await parseXml(field59Response.data);
//     const key = result?.video?.key?.[0];

//     if (!key) {
//       console.error('No key found in parsed response:', result);
//       return res.status(500).json({
//         error: 'Invalid response',
//         details: 'No video key in Field59 response'
//       });
//     }

//     // Return JSON response
//     res.json({
//       error: null,
//       key,
//       message: 'Video uploaded successfully'
//     });
    
//   } catch (error) {
//     console.error('Error in Field59 upload:', {
//       message: error.message,
//       response: {
//         status: error.response?.status,
//         statusText: error.response?.statusText,
//         data: error.response?.data,
//         headers: error.response?.headers
//       }
//     });
    
//     res.status(error.response?.status || 500).json({
//       error: 'Failed to upload video to Field59',
//       details: error.response?.data || error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// });

function generateVideoXML(title, url) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<video>
  <title><![CDATA[${title}]]></title>
  <url><![CDATA[${encodeURIComponent(url)}]]></url>
</video>`;
}


// This function will run immediately when the file is loaded
// const checkField59Status = async () => {
//   console.log('Checking Field59 status...');
//   try {
//     const response = await axios.get('https://api.field59.com/v2/video/status/80917ce2b7ea3e39407cbffdb94ca4786f0b5af9', {
//       headers: {
//         'Authorization': process.env.FIELD59_USERNAME + ':' + process.env.FIELD59_PASSWORD
//       }
//     });
    
//     if (response.data.key) {
//       console.log('Worked successful:', response.data);
//       // Handle success - perhaps save to database or take some action
//       return response.data; // Return data in case you need it elsewhere
//     }
//   } catch (error) {
//     console.error('Failed:', error.response?.data || error);
//     // Handle error - perhaps send notification or log to monitoring system
//   }
//   console.log('Field59 status check completed.');
// };

// // Execute the function immediately when this file is loaded
// checkField59Status();






// Route to upload video to Field59 (v2)
app.post('/api/field59/upload', async (req, res) => {
  try {
    // Extract title and URL from the request body
    const { title, url } = req.body;

    // Validate required fields
    if (!title || !url) {
      return res.status(400).json({ error: 'Title and URL are required.' });
    }

    // Generate XML payload
    const xmlPayload = generateVideoXML(title, url);

    // Create Basic Authentication header
    const authHeader = `Basic ${Buffer.from(`${FIELD59_USERNAME}:${FIELD59_PASSWORD}`).toString('base64')}`;

    // Field59 v2 API endpoint
    const apiUrl = 'https://api.field59.com/v2/video/create';

    // Send POST request to Field59
    const field59Response = await axios.post(apiUrl, `xml=${xmlPayload}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Respond with the Field59 API response
    res.status(201).json({ message: 'Video created successfully.', data: field59Response.data });
  } catch (error) {
    console.error('Error uploading to Field59:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to upload video.', details: error.response?.data || error.message });
  }
});

// Check video status
app.get('/api/videos/:videoId/status', validateApiKey, async (req, res) => {
  try {
    const { videoId } = req.params;
    console.log(`Checking status for video ID: ${videoId}`);
    
    // Call HeyGen's v1 video status API
    const response = await axios.get(`${API_BASE_URL_V1}/video_status.get`, {
      params: { video_id: videoId },
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    console.log('Video status response:', response.data);
    
    // Map HeyGen status to our frontend expected format
    const statusMapping = {
      pending: 'processing',
      processing: 'processing',
      completed: 'completed',
      failed: 'failed'
    };
    
    res.json({
      error: null,
      status: response.data.status,
      progress: response.data.progress || 0
    });
  } catch (error) {
    console.error('Error checking video status:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    res.status(error.response?.status || 500).json({
      error: 'Failed to check video status',
      details: error.response?.data?.message || error.message
    });
  }
});

// Get video details
app.get('/api/videos/:videoId', validateApiKey, async (req, res) => {
  try {
    const { videoId } = req.params;
    console.log(`Getting details for video ID: ${videoId}`);
    
    // Call HeyGen's v2 video details API
    const response = await axios.get(`${API_BASE_URL_V2}/video.get`, {
      params: { video_id: videoId },
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    console.log('Video details response:', response.data);
    
    // Format the response for our frontend
    res.json({
      error: null,
      id: response.data.data.video_id,
      status: response.data.data.status,
      video_url: response.data.data.video_url,
      proxied_video_url: response.data.data.video_url, // Original URL
      thumbnail_url: response.data.data.thumbnail_url,
      created_at: response.data.data.created_at
    });
  } catch (error) {
    console.error('Error getting video details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    res.status(error.response?.status || 500).json({
      error: 'Failed to get video details',
      details: error.response?.data?.message || error.message
    });
  }
});

// Add this new test proxy function endpoint with Field59 API integration
app.post('/api/test-proxy', async (req, res) => {
  try {
    // Get the title and video URL from the request
    const { title, videoUrl } = req.body;
    
    // Construct the XML with CDATA sections
    const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<video>
<title><![CDATA[${title}]]></title>
<url><![CDATA[${encodeURIComponent(videoUrl)}]]></url>
</video>`;
    
    // Set up authentication credentials
    const username = process.env.FIELD59_USERNAME;
    const password = process.env.FIELD59_PASSWORD;
    
    // Create base64 encoded auth string
    const auth = ` "${username}:${password}"`;
    
    // Make the request to Field59 API
    const response = await axios({
      method: 'post',
      url: 'https://api.field59.com/v2/video/create',
      headers: {
        'Content-Type': 'application/xml',
        'Authorization': auth,
        'Accept': 'text/xml',
        'Expect': '100-continue'
      },
      data: xmlData
    });
    
    // Return the response to the client
    res.json(response.data);
  } catch (error) {
    console.error('Error in proxy:', error);
    
    // Forward the error response
    if (error.response) {
      res.status(error.response.status).json({
        error: 'API Error',
        details: error.response.data
      });
    } else {
      res.status(500).json({ 
        error: 'Proxy server error',
        message: error.message
      });
    }
  }
  // const video = req.body;
  
  // console.log('==== TEST PROXY FUNCTION CALLED ====');
  // //console.log('Received video object:', JSON.stringify(video, null, 2));
  
  // try {
  //   // Extract a key/ID from the video object to use as FILE KEY
  //   // You can use video_id or another identifier from your video object
  //   const fileKey = '80917ce2b7ea3e39407cbffdb94ca4786f0b5af9';//video.video_id || 'default-key';
    
  //   // Field59 credentials from environment variables
  //   const username = process.env.FIELD59_USERNAME;
  //   const password = process.env.FIELD59_PASSWORD;
    
  //   if (!username || !password) {
  //     throw new Error('Field59 credentials not configured');
  //   }
    
  //   console.log(`Making POST request to /v2/video/${fileKey}`);
    
  //   // Create Basic Auth header (equivalent to PHP curl CURLOPT_USERPWD)
  //   const auth = `${username}:${password}`;
    
  //   // Prepare the form data (equivalent to PHP curl CURLOPT_POSTFIELDS)
  //   const formData = new URLSearchParams();
  //   formData.append('title', video.title || 'Updated title');
  //   formData.append('description', video.description || 'Updated via proxy test');
    
  //   // Make POST request to the Field59 API
  //   const field59Response = await axios.post(`https://api.field59.com/v2/video/${fileKey}`, formData, {
  //     headers: {
  //       'Authorization': `Basic ${auth}`,
  //       'Content-Type': 'application/x-www-form-urlencoded'
  //     }
  //   });
    
  //   console.log('Field59 API Response:', field59Response.data);
  //   console.log('Proxy test function worked as expected!');
    
  //   // Send response back to client
  //   res.json({
  //     success: true,
  //     message: 'Proxy test function executed successfully with Field59 API call',
  //     videoId: video.video_id,
  //     fileKey: fileKey,
  //     field59Response: field59Response.data,
  //     timestamp: new Date().toISOString()
  //   });
  // } catch (error) {
  //   console.error('Proxy test error:', error.message);
  //   console.error('Response data:', error.response?.data);
    
  //   res.status(500).json({
  //     success: false,
  //     message: 'Proxy test function failed',
  //     error: error.message,
  //     details: error.response?.data,
  //     timestamp: new Date().toISOString()
  //   });
  // }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Add this right before your app.listen() call
console.log('=== Registered Routes ===');
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log(`${Object.keys(r.route.methods)} ${r.route.path}`);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`HeyGen API Key configured: ${HEYGEN_API_KEY ? 'Yes' : 'No'}`);
});

// Add this simple POST test endpoint
app.post('/api/test-post', (req, res) => {
  console.log('Received POST data:', req.body);
  res.json({
    message: 'POST test successful',
    receivedData: req.body
  });
});
