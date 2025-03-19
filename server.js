import express from 'express';
import axios from 'axios';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { DOMParser } from '@xmldom/xmldom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

//app.use(cors());

// Update CORS configuration to explicitly allow POST
app.use(cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // allow all needed methods
  origin: 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'X-Api-Key', 'Accept']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

const PORT = process.env.PORT || 3001;
const HEYGEN_API_KEY = 'MmEwZTk5YzIxMmEyNDgxOWFkNjdhNzY2YmZlNGUwZGEtMTc0MTE4Mzk5Ng==';
const API_BASE_URL_V2 = 'https://api.heygen.com/v2';
const API_BASE_URL_V1 = 'https://api.heygen.com/v1';

// Field59 API configuration
const FIELD59_USERNAME = process.env.FIELD59_USERNAME || import.meta.env.VITE_FIELD59_USERNAME;
const FIELD59_PASSWORD = process.env.FIELD59_PASSWORD || import.meta.env.VITE_FIELD59_PASSWORD;
const FIELD59_BASE_URL = 'https://api.field59.com';

// Middleware to validate Field59 credentials
const validateField59Credentials = (req, res, next) => {
  if (!FIELD59_USERNAME || !FIELD59_PASSWORD) {
    console.error('Field59 credentials are not configured');
    return res.status(500).json({ 
      error: 'Field59 credentials are not configured',
      details: 'Please check your .env file and ensure FIELD59_USERNAME and FIELD59_PASSWORD are set correctly'
    });
  }
  next();
};

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

// Video generation endpoints
// Generate a video
// app.post('/api/generate-video', validateApiKey, async (req, res) => {
//   try {
//     console.log('Starting video generation with data:', JSON.stringify(req.body, null, 2));
    
//     // Validate required fields
//     const { video_inputs } = req.body;
    
//     if (!video_inputs?.[0]?.character?.avatar_id) {
//       return res.status(400).json({
//         error: 'Invalid data format',
//         details: 'The character object must have an avatar_id property'
//       });
//     }
    
//     if (!video_inputs?.[0]?.voice?.voice_id) {
//       return res.status(400).json({
//         error: 'Invalid data format',
//         details: 'The voice object must have a voice_id property'
//       });
//     }
    
//     // Prepare the HeyGen API payload
//     const payload = {
//       video_inputs: [
//         {
//           character: {
//             type: "avatar",
//             avatar_id: avatar.avatar_id,
//             scale: 1.0
//           },
//           voice: {
//             type: "text",
//             voice_id: voice.voice_id,
//             input_text: script
//           },
//           background: {
//             type: "color",
//             value: settings?.backgroundColor || "#f6f6fc"
//           }
//         }
//       ],
//       title: settings?.title || "Generated Video",
//       dimension: {
//         width: 1920,
//         height: 1080
//       }
//     };
      // Generate a video
app.post('/api/generate-video', validateApiKey, async (req, res) => {
  try {
    console.log('Starting video generation with data:', JSON.stringify(req.body, null, 2));

    // Validate required fields
    const { video_inputs } = req.body;

    if (!video_inputs?.[0]?.character?.avatar_id) {
      return res.status(400).json({
        error: 'Invalid data format',
        details: 'The character object must have an avatar_id property'
      });
    }

    if (!video_inputs?.[0]?.voice?.voice_id) {
      return res.status(400).json({
        error: 'Invalid data format',
        details: 'The voice object must have a voice_id property'
      });
    }

    // Use the provided payload directly since it already matches HeyGen's format
    const payload = req.body;

    console.log('Sending payload to HeyGen API:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(`${API_BASE_URL_V2}/video/generate`, payload, {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('HeyGen API response:', response.data);
    
    if (!response.data?.data?.video_id) {
      console.error('Invalid HeyGen API response - missing video_id:', response.data);
      return res.status(500).json({
        error: 'Invalid API response',
        details: 'Missing video_id in API response'
      });
    }
    
    res.json({
      error: null,
      video_id: response.data.data.video_id
    });
    
  } catch (error) {
    console.error('Error generating video:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    res.status(error.response?.status || 500).json({
      error: 'Failed to generate video',
      details: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

//from gemini



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
      status: statusMapping[response.data.status] || response.data.status,
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

// Field59 video creation endpoint
app.post('/api/field59/videos', validateField59Credentials, async (req, res) => {
  try {
    const { url, title, summary, tags } = req.body;
    
    if (!url || !title) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Video must have a URL and title'
      });
    }
    
    console.log('Creating Field59 video with URL:', url);
    
    // Create XML payload
    const tagsXml = tags && tags.length > 0 
      ? `<tags>${tags.map(tag => `<tag>${tag}</tag>`).join('')}</tags>` 
      : '<tags></tags>';
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <video>
        <url>${url}</url>
        <title>${title}</title>
        <summary>${summary || ''}</summary>
        ${tagsXml}
      </video>`;
    
    // Send video metadata as URL-encoded form data
    const params = new URLSearchParams();
    params.append('xml', xml);
    
    // Encode credentials for Basic Auth
    const credentials = Buffer.from(`${FIELD59_USERNAME}:${FIELD59_PASSWORD}`).toString('base64');
    
    const response = await axios.post(`${FIELD59_BASE_URL}/v2/video/create`, params, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/xml',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      responseType: 'text'
    });
    
    // Parse response XML to get video key using regex
    const keyMatch = response.data.match(/<key>(.*?)<\/key>/);
    const key = keyMatch?.[1];
    
    if (!key) {
      throw new Error('Failed to get video key from response');
    }
    
    console.log('Field59 video created successfully with key:', key);
    
    res.json({
      error: null,
      videoKey: key
    });
  } catch (error) {
    console.error('Error creating Field59 video:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    res.status(error.response?.status || 500).json({
      error: 'Failed to create Field59 video',
      details: error.response?.data || error.message
    });
  }
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
