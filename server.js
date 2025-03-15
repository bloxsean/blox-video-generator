import express from 'express';
import axios from 'axios';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { exec } from 'child_process';
import net from 'net';

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

// List templates
app.get('/api/templates', validateApiKey, async (req, res) => {
  try {
    console.log('Fetching templates from HeyGen API...');
    const response = await axios.get(`${API_BASE_URL}/templates`, {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Templates fetched successfully');
    console.log('HeyGen API Response Structure:', JSON.stringify(response.data, null, 2));
    
    // Return the response as is, let the frontend handle the structure
    res.json({
      error: null,
      data: response.data
    });
  } catch (error) {
    console.error('Error fetching templates:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    // Send more detailed error information
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch templates',
      details: error.response?.data || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// List voices
app.get('/api/voices', validateApiKey, async (req, res) => {
  try {
    console.log('Fetching voices from HeyGen API...');
    
    // Use the V2 endpoint according to documentation
    const response = await axios.get(`${API_BASE_URL}/voices`, {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    // V2 API response has a different structure
    console.log(`Successfully fetched ${response.data?.voices?.length || 0} voices`);
    
    // Format response consistently with our other endpoints
    res.json({
      error: null,
      data: response.data
    });
  } catch (error) {
    console.error('Error fetching voices:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    res.status(500).json({ 
      error: 'Failed to fetch voices', 
      details: error.response?.data || error.message 
    });
  }
});

// List avatars
app.get('/api/avatars', validateApiKey, async (req, res) => {
  try {
    console.log('Fetching avatars from HeyGen API...');
    
    const response = await axios.get(`${API_BASE_URL}/avatars`, {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Successfully fetched ${response.data?.avatars?.length || 0} avatars and ${response.data?.talking_photos?.length || 0} talking photos`);
    
    res.json({
      error: null,
      data: response.data
    });
  } catch (error) {
    console.error('Error fetching avatars:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    res.status(500).json({ 
      error: 'Failed to fetch avatars', 
      details: error.response?.data || error.message 
    });
  }
});

// Get template details
app.get('/api/templates/:templateId', validateApiKey, async (req, res) => {
  try {
    const { templateId } = req.params;
    console.log(`Fetching details for template ${templateId}...`);
    
    const response = await axios.get(`${API_BASE_URL}/templates/${templateId}`, {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Template details fetched successfully');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching template details:', {
      templateId: req.params.templateId,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch template details',
      details: error.response?.data || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Generate video from template
app.post('/api/generate-video', validateApiKey, async (req, res) => {
  try {
    const { templateId, inputs } = req.body;
    console.log('Generating video with template:', templateId);
    
    const response = await axios.post(`${API_BASE_URL}/templates.generate`, {
      template_id: templateId,
      task_name: "POC Video Generation",
      config: {
        inputs: inputs
      }
    }, {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Video generation initiated successfully');
    res.json(response.data);
  } catch (error) {
    console.error('Error generating video:', {
      templateId: req.body.templateId,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    res.status(error.response?.status || 500).json({
      error: 'Failed to generate video',
      details: error.response?.data || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Check video status
app.get('/api/videos/:videoId', validateApiKey, async (req, res) => {
  try {
    const { videoId } = req.params;
    console.log(`Checking status for video ${videoId}...`);
    
    const response = await axios.get(`${API_BASE_URL}/videos/${videoId}`, {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Video status fetched successfully');
    res.json(response.data);
  } catch (error) {
    console.error('Error checking video status:', {
      videoId: req.params.videoId,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    res.status(error.response?.status || 500).json({
      error: 'Failed to check video status',
      details: error.response?.data || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Create API client for HeyGen
const heygenClient = axios.create({
  baseURL: 'https://api.heygen.com',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': HEYGEN_API_KEY,
  },
});

// Proxy endpoint for video list
app.get('/api/videos', async (req, res) => {
  try {
    const token = req.query.token || null;
    const url = token ? 
      `/v1/video.list?token=${encodeURIComponent(token)}` : 
      '/v1/video.list';
    
    const response = await heygenClient.get(url);
    
    // Return the videos
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching videos:', error.message);
    return res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Proxy endpoint for detailed video information
app.get('/api/videos/:videoId', async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const response = await heygenClient.get(`/v1/videos/${videoId}`);
    return res.json(response.data);
  } catch (error) {
    console.error(`Error fetching video ${req.params.videoId}:`, error.message);
    return res.status(500).json({ error: 'Failed to fetch video details' });
  }
});

// Proxy endpoint for video status (alternative to full details)
app.get('/api/video-status/:videoId', async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const response = await heygenClient.get(`/v1/video_status?video_id=${videoId}`);
    return res.json(response.data);
  } catch (error) {
    console.error(`Error fetching status for video ${req.params.videoId}:`, error.message);
    return res.status(500).json({ error: 'Failed to fetch video status' });
  }
});

// Proxy for video content - streams the video to avoid CORS issues
app.get('/api/video-content/:videoId', async (req, res) => {
  try {
    const videoId = req.params.videoId;
    
    // First get the video details to get the video URL
    const detailsResponse = await heygenClient.get(`/v1/videos/${videoId}`);
    const videoUrl = detailsResponse.data.video_url;
    
    if (!videoUrl) {
      return res.status(404).json({ error: 'Video URL not found' });
    }
    
    // Stream the video content
    const videoResponse = await axios({
      method: 'get',
      url: videoUrl,
      responseType: 'stream'
    });
    
    // Set the appropriate headers
    res.set('Content-Type', videoResponse.headers['content-type']);
    res.set('Content-Length', videoResponse.headers['content-length']);
    res.set('Accept-Ranges', 'bytes');
    
    // Pipe the video stream to the response
    videoResponse.data.pipe(res);
  } catch (error) {
    console.error(`Error streaming video ${req.params.videoId}:`, error.message);
    return res.status(500).json({ error: 'Failed to stream video' });
  }
});

// Proxy for thumbnails - serves the thumbnail to avoid CORS issues
app.get('/api/thumbnail/:videoId', async (req, res) => {
  try {
    const videoId = req.params.videoId;
    
    // First get the video details to get the thumbnail URL
    const detailsResponse = await heygenClient.get(`/v1/videos/${videoId}`);
    const thumbnailUrl = detailsResponse.data.thumbnail_url || detailsResponse.data.cover_image_url;
    
    if (!thumbnailUrl) {
      return res.status(404).json({ error: 'Thumbnail URL not found' });
    }
    
    // Stream the thumbnail content
    const thumbnailResponse = await axios({
      method: 'get',
      url: thumbnailUrl,
      responseType: 'stream'
    });
    
    // Set the appropriate headers
    res.set('Content-Type', thumbnailResponse.headers['content-type']);
    
    // Pipe the thumbnail stream to the response
    thumbnailResponse.data.pipe(res);
  } catch (error) {
    console.error(`Error streaming thumbnail for video ${req.params.videoId}:`, error.message);
    return res.status(500).json({ error: 'Failed to stream thumbnail' });
  }
});

// Delete video proxy
app.delete('/api/videos/:videoId', async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const response = await heygenClient.delete(`/v1/videos/${videoId}`);
    return res.json(response.data);
  } catch (error) {
    console.error(`Error deleting video ${req.params.videoId}:`, error.message);
    return res.status(500).json({ error: 'Failed to delete video' });
  }
});

// Enhanced video list with details and thumbnails
app.get('/api/videos-with-details', async (req, res) => {
  try {
    const token = req.query.token || null;
    const url = token ? 
      `/v1/video.list?token=${encodeURIComponent(token)}` : 
      '/v1/video.list';
    
    // Get the basic video list
    const listResponse = await heygenClient.get(url);
    const videos = listResponse.data.data?.videos || [];
    
    // For each completed video, get additional details
    const enhancedVideos = await Promise.all(
      videos.map(async (video) => {
        if (video.status === 'completed') {
          try {
            // Get detailed information
            const detailsResponse = await heygenClient.get(`/v1/videos/${video.video_id}`);
            const details = detailsResponse.data;
            
            // Add proxied URLs for frontend use
            return {
              ...video,
              ...details,
              // Replace actual URLs with our proxy URLs
              thumbnail_url: `/api/thumbnail/${video.video_id}`,
              proxied_video_url: `/api/video-content/${video.video_id}`,
              // Keep original URLs for reference
              original_video_url: details.video_url,
              original_thumbnail_url: details.thumbnail_url || details.cover_image_url,
            };
          } catch (error) {
            console.warn(`Failed to get details for video ${video.video_id}:`, error.message);
            return {
              ...video,
              thumbnail_url: null,
              proxied_video_url: null,
            };
          }
        }
        return video;
      })
    );
    
    // Return the enhanced response
    return res.json({
      ...listResponse.data,
      data: {
        ...listResponse.data.data,
        videos: enhancedVideos,
      }
    });
  } catch (error) {
    console.error('Error fetching enhanced videos:', error.message);
    return res.status(500).json({ error: 'Failed to fetch enhanced videos' });
  }
});

// Fallback route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
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

// Function to check if port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', () => {
        // Port is in use
        resolve(true);
      })
      .once('listening', () => {
        // Port is free
        server.close();
        resolve(false);
      })
      .listen(port);
  });
}

// Function to find and kill process using the port
function killProcessOnPort(port) {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' 
      ? `netstat -ano | findstr :${port} | findstr LISTENING` 
      : `lsof -i :${port} | grep LISTEN`;
    
    exec(command, (error, stdout) => {
      if (error) {
        console.log(`No process found using port ${port}`);
        resolve(false);
        return;
      }
      
      // Extract PID
      let pid;
      if (process.platform === 'win32') {
        pid = stdout.split(/\s+/).pop();
      } else {
        pid = stdout.split(/\s+/)[1];
      }
      
      if (!pid) {
        console.log(`Could not extract PID for port ${port}`);
        resolve(false);
        return;
      }
      
      // Kill the process
      const killCommand = process.platform === 'win32' 
        ? `taskkill /F /PID ${pid}` 
        : `kill -9 ${pid}`;
      
      exec(killCommand, (killError) => {
        if (killError) {
          console.error(`Failed to kill process on port ${port}:`, killError);
          resolve(false);
          return;
        }
        
        console.log(`Successfully killed process ${pid} using port ${port}`);
        resolve(true);
      });
    });
  });
}

// Start server with port management
async function startServer() {
  try {
    const portInUse = await isPortInUse(PORT);
    
    if (portInUse) {
      console.log(`Port ${PORT} is already in use. Attempting to free it...`);
      const killed = await killProcessOnPort(PORT);
      
      if (!killed) {
        console.log(`Could not free port ${PORT}. Trying to start server anyway...`);
      } else {
        // Wait a moment for the port to be fully released
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`HeyGen API Key configured: ${HEYGEN_API_KEY ? 'Yes' : 'No'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Replace the direct app.listen call with our managed start function
startServer(); 