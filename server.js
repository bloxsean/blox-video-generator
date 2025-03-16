import express from 'express';
import axios from 'axios';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const API_BASE_URL = 'https://api.heygen.com/v2';

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

// List voices
app.get('/api/voices', validateApiKey, async (req, res) => {
  try {
    console.log('Fetching voices from HeyGen API...');
    
    const response = await axios.get(`${API_BASE_URL}/voices`, {
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
    
    const response = await axios.get(`${API_BASE_URL}/avatars`, {
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

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`HeyGen API Key configured: ${HEYGEN_API_KEY ? 'Yes' : 'No'}`);
});