import axios from 'axios';

// Change back to using a local proxy server
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

// Add this after your initial middleware setup but before routes
// app.use((req, res, next) => {
//   console.log('Incoming request:', {
//     method: req.method,
//     path: req.path,
//     body: req.body
//   });
//   next();
// });

export const generateVideo = async (data) => {
  try {
    console.log('generateVideo service called with data:', data);
    
    const response = await apiClient.post('/generate-video', data);
    console.log('generateVideo service response:', response.data);
    
    // Extract video_id from the HeyGen API response structure
    const videoId = response.data?.video_id;
    if (!videoId) {
      throw new Error('Missing video_id in API response');
    }
    
    return {
      error: null,
      video_id: videoId
    };
  } catch (error) {
    console.error('generateVideo service error:', error.response || error);
    throw new Error(error.response?.data?.details || error.message);
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
    const response = await apiClient.get(`/videos/${videoId}/status`);
    console.log('VideoGenerationService - Video status:', response.data);
    return response.data;
  } catch (error) {
    console.error('VideoGenerationService - Error checking video status:', {
      error: error.message,
      videoId,
      response: error.response?.data,
    });
    
    // More specific error message
    if (error.response?.status === 404) {
      throw new Error(`Video ID ${videoId} not found or status endpoint not available`);
    }
    
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
    
    // More specific error message
    if (error.response?.status === 404) {
      throw new Error(`Video ID ${videoId} not found or details endpoint not available`);
    }
    
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
    const params = token ? { token } : {};
    console.log('Making request to videos endpoint...');
    const response = await apiClient.get('/videos', { params });
    
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



// // After all your routes are defined, add this to list all registered routes
// app.listen(PORT, () => {
//   console.log('Registered Routes:');
//   app._router.stack.forEach(function(r){
//     if (r.route && r.route.path){
//       console.log(`${Object.keys(r.route.methods)} ${r.route.path}`);
//     }
//   });
//   console.log(`Server is running on port ${PORT}`);
// });
