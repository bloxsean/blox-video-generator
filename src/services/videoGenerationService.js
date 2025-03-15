import axios from 'axios';

// API configuration with proxy server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create an axios instance for the proxy server
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Generate a video using the HeyGen API
 * @param {Object} data - The video generation data
 * @param {Object} data.avatar - The selected avatar object
 * @param {Object} data.voice - The selected voice object
 * @param {string} data.script - The script content
 * @param {Object} data.settings - Additional settings for video generation
 * @returns {Promise<Object>} - The API response with video_id
 */
export const generateVideo = async (data) => {
  console.log('VideoGenerationService - generateVideo called with:', {
    avatar: data.avatar ? {
      avatar_id: data.avatar.avatar_id,
      avatar_name: data.avatar.avatar_name || data.avatar.name,
    } : 'No avatar provided',
    voice: data.voice ? {
      voice_id: data.voice.voice_id,
      voice_name: data.voice.voice_name || data.voice.name,
    } : 'No voice provided',
    script: data.script ? `${data.script.substring(0, 20)}${data.script.length > 20 ? '...' : ''}` : 'No script provided',
    settings: data.settings ? {
      ...data.settings,
      // Don't log full background data if it's an image or video
      background: data.settings.background ? {
        type: data.settings.background.type,
        ...(data.settings.background.type === 'color' && { value: data.settings.background.value }),
        ...(data.settings.background.type !== 'color' && { url: 'URL present but not logged' }),
      } : 'Default background',
    } : 'No settings provided',
  });
  
  try {
    const { avatar, voice, script, settings = {} } = data;
    
    // Validate required fields
    if (!avatar || !avatar.avatar_id) {
      console.error('VideoGenerationService - Missing required field: avatar.avatar_id');
      throw new Error('Missing required field: avatar.avatar_id');
    }
    if (!voice || !voice.voice_id) {
      console.error('VideoGenerationService - Missing required field: voice.voice_id');
      throw new Error('Missing required field: voice.voice_id');
    }
    if (!script) {
      console.error('VideoGenerationService - Missing required field: script');
      throw new Error('Missing required field: script');
    }
    
    // Logging voice_id and avatar_id specifically
    console.log('VideoGenerationService - Critical IDs:', {
      avatar_id: avatar.avatar_id,
      voice_id: voice.voice_id,
    });
    
    // Construct the request payload based on the HeyGen API structure
    const payload = {
      title: settings.title || "Generated Video",
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: avatar.avatar_id,
            scale: settings.avatarScale || 1,
            avatar_style: settings.avatarStyle || "normal",
            offset: settings.avatarOffset || { x: 0, y: 0 },
            matting: settings.avatarMatting || "false",
          },
          voice: {
            type: "text",
            voice_id: voice.voice_id,
            input_text: script,
            speed: settings.voiceSpeed || 1,
            pitch: settings.voicePitch || 0,
            // ...(settings.voiceEmotion && { emotion: settings.voiceEmotion }),
            // ...(settings.voiceLocale && { locale: settings.voiceLocale }),
          },
          // background: settings.background || {
          //   type: "color",
          //   value: "#f6f6fc",
          // },
        },
      ],
      dimension: {
        width: 1280,
        height: 720,
      },
      // caption: settings.caption || false,
    };

    console.log('VideoGenerationService - Submitting video generation request:', payload);
    
    // Call our proxy server instead of the HeyGen API directly
    const response = await apiClient.post('/generate-video', payload);
    console.log('VideoGenerationService - Video generation successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('VideoGenerationService - Error generating video:', error);
    
    // Enhanced error handling with detailed logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('VideoGenerationService - API Response Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      });
      throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('VideoGenerationService - No Response Error Details:', {
        request: error.request,
      });
      throw new Error('No response received from server. Please check your connection.');
    } else {
      // Something happened in setting up the request
      console.error('VideoGenerationService - Request Setup Error Details:', {
        message: error.message,
        stack: error.stack,
      });
      throw new Error(`Request Error: ${error.message}`);
    }
  }
};

/**
 * Check the status of a video generation request
 * @param {string} videoId - The ID of the video to check
 * @returns {Promise<Object>} - The API response with status information
 */
export const checkVideoStatus = async (videoId) => {
  console.log('VideoGenerationService - Checking video status:', { videoId });
  try {
    const response = await apiClient.get(`/video-status/${videoId}`);
    console.log('VideoGenerationService - Video status:', response.data);
    return response.data;
  } catch (error) {
    console.error('VideoGenerationService - Error checking video status:', {
      error: error.message,
      videoId,
      response: error.response?.data,
    });
    throw new Error('Failed to check video status');
  }
};

/**
 * Get video details including the video URL
 * @param {string} videoId - The ID of the video
 * @returns {Promise<Object>} - The API response with video details
 */
export const getVideoDetails = async (videoId) => {
  console.log('VideoGenerationService - Getting video details:', { videoId });
  try {
    const response = await apiClient.get(`/videos/${videoId}`);
    console.log('VideoGenerationService - Video details retrieved:', {
      video_id: response.data.id,
      status: response.data.status,
      hasVideoUrl: !!response.data.video_url,
    });
    return response.data;
  } catch (error) {
    console.error('VideoGenerationService - Error getting video details:', {
      error: error.message,
      videoId,
      response: error.response?.data,
    });
    throw new Error('Failed to get video details');
  }
};

/**
 * Delete a generated video
 * @param {string} videoId - The ID of the video to delete
 * @returns {Promise<Object>} - The API response
 */
export const deleteVideo = async (videoId) => {
  console.log('VideoGenerationService - Deleting video:', { videoId });
  try {
    const response = await apiClient.delete(`/videos/${videoId}`);
    console.log('VideoGenerationService - Video deleted successfully:', { videoId });
    return response.data;
  } catch (error) {
    console.error('VideoGenerationService - Error deleting video:', {
      error: error.message,
      videoId,
      response: error.response?.data,
    });
    throw new Error('Failed to delete video');
  }
};

/**
 * Get the list of videos associated with the user
 * @param {string} token - Optional pagination token for fetching next page of videos
 * @returns {Promise<Object>} - The API response with the list of videos
 */
export const getVideoList = async (token = null) => {
  try {
    // Construct query params if token is provided
    const params = token ? { token } : {};
    
    // Make the API request
    console.log('Making request to videos-with-details endpoint...');
    const response = await apiClient.get('/videos-with-details', { params });
    
    // Debug the response structure before processing
    console.log('Raw API response structure:', {
      status: response.status,
      statusText: response.statusText,
      hasData: !!response.data,
      dataKeys: Object.keys(response.data || {}),
      hasVideos: !!(response.data && response.data.data && response.data.data.videos),
      videosCount: response.data?.data?.videos?.length || 0
    });
    
    // Debug the response BEFORE returning it
    console.log('videoGenerationService raw API response:', response);
    
    if (response.data && response.data.data && response.data.data.videos && response.data.data.videos.length > 0) {
      const firstVideo = response.data.data.videos[0];
      console.log('First video in enhanced list:', firstVideo);
      
      // Add explicit check for each critical field
      console.log('VIDEO FIELD DETAILS (BEFORE PROCESSING):', {
        // Check video_title field
        'has video_title': !!firstVideo.video_title,
        'video_title value': firstVideo.video_title,
        'video_title type': typeof firstVideo.video_title,
        
        // Check title field
        'has title': !!firstVideo.title,
        'title value': firstVideo.title || 'NOT PRESENT',
        'title type': firstVideo.title ? typeof firstVideo.title : 'N/A',
        
        // Check thumbnail_url field
        'has thumbnail_url': !!firstVideo.thumbnail_url,
        'thumbnail_url value': firstVideo.thumbnail_url || 'NOT PRESENT',
        'thumbnail_url type': firstVideo.thumbnail_url ? typeof firstVideo.thumbnail_url : 'N/A',
        
        // Check proxied_video_url field
        'has proxied_video_url': !!firstVideo.proxied_video_url,
        'proxied_video_url value': firstVideo.proxied_video_url || 'NOT PRESENT',
        'proxied_video_url type': firstVideo.proxied_video_url ? typeof firstVideo.proxied_video_url : 'N/A',
        
        // Check HeyGen specific fields if they exist
        'has video_url (HeyGen)': !!firstVideo.video_url,
        'video_url value (HeyGen)': firstVideo.video_url || 'NOT PRESENT',
      });
      
      // Optional: Attempt to enhance the response with API status data
      if (firstVideo.video_id && firstVideo.status === 'completed' && 
          (!firstVideo.thumbnail_url || !firstVideo.proxied_video_url)) {
        console.log(`Video ${firstVideo.video_id} is completed but missing media URLs. Should call HeyGen status.get API directly`);
        // Note: You'd implement a check here to call the status.get API if needed
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching video list:', error);
    throw error;
  }
}; 