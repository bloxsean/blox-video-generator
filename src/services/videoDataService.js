/**
 * videoDataService.js
 * 
 * This service makes direct calls to the HeyGen API without relying on a proxy server:
 * 1. Fetches the complete list of videos directly from HeyGen API
 * 2. Gets detailed information for each completed video
 * 3. Combines all data into a complete video objects array
 */

import axios from 'axios';

// HeyGen API configuration - should be stored in environment variables in production
const HEYGEN_API_KEY = import.meta.env.VITE_HEYGEN_API_KEY;
const HEYGEN_API_URL = 'https://api.heygen.com/v1';

// Create an axios instance for direct HeyGen API calls
const heygenClient = axios.create({
  baseURL: HEYGEN_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Api-Key': HEYGEN_API_KEY
  },
});

/**
 * Fetch a complete list of videos with all details directly from HeyGen
 * @param {string} token - Optional pagination token
 * @returns {Promise<Object>} - Complete video data with all details
 */
export const getEnrichedVideoList = async (token = null) => {
  try {
    console.log('videoDataService: Starting direct HeyGen API video list fetch...');
    
    // Step 1: Get the basic list of videos
    const basicVideoList = await fetchVideoListFromHeyGen(token);
    console.log(`videoDataService: Fetched ${basicVideoList.videos.length} videos from HeyGen API`);
    
    // Step 2: Enhance completed videos with additional details
    const enhancedVideos = await enrichVideosWithDetails(basicVideoList.videos);
    
    // Return the complete data structure with enhanced videos
    return {
      videos: enhancedVideos,
      token: basicVideoList.token
    };
  } catch (error) {
    console.error('videoDataService: Error fetching video list from HeyGen:', error);
    throw new Error(`Failed to fetch videos from HeyGen API: ${error.message}`);
  }
};

/**
 * Fetch the basic list of videos directly from HeyGen API
 * @param {string} token - Optional pagination token
 * @returns {Promise<Object>} - Basic video list data
 */
const fetchVideoListFromHeyGen = async (token = null) => {
  try {
    const params = token ? { token } : {};
    console.log('videoDataService: Fetching basic video list from HeyGen...');
    
    // Call HeyGen's video.list endpoint
    const response = await heygenClient.get('/video.list', { params });
    
    // Validate response structure
    if (!response.data || !response.data.data || !Array.isArray(response.data.data.videos)) {
      throw new Error('Unexpected response format from HeyGen API video.list');
    }
    
    console.log(`videoDataService: Received ${response.data.data.videos.length} videos from HeyGen`);
    
    // Return standardized format
    return {
      videos: response.data.data.videos.map(normalizeBasicVideoData),
      token: response.data.data.token || null
    };
  } catch (error) {
    console.error('videoDataService: Error fetching videos from HeyGen:', error);
    
    // If it's an API error with a response, provide more details
    if (error.response) {
      throw new Error(`HeyGen API error (${error.response.status}): ${
        error.response.data?.message || 'Unknown API error'
      }`);
    }
    
    throw error;
  }
};

/**
 * Normalize basic video data to ensure consistent field names
 * @param {Object} video - Raw video data from HeyGen API
 * @returns {Object} - Normalized video data
 */
const normalizeBasicVideoData = (video) => {
  return {
    video_id: video.video_id,
    title: video.video_title || `Untitled Video`,
    status: video.status || 'unknown',
    created_at: video.created_at || new Date().toISOString(),
    updated_at: video.updated_at || video.created_at || new Date().toISOString(),
    thumbnail_url: video.thumbnail_url || null,
    _hasValidThumbnail: !!video.thumbnail_url,
    _hasValidVideoUrl: false, // Will be updated during enrichment
    _originalResponse: video // Keep original data for reference
  };
};

/**
 * Enhance videos with detailed information
 * @param {Array<Object>} videos - List of basic video objects
 * @returns {Promise<Array<Object>>} - Enhanced video objects
 */
const enrichVideosWithDetails = async (videos) => {
  console.log(`videoDataService: Enhancing ${videos.length} videos with detailed information...`);
  
  // Process videos in parallel with Promise.all
  const enhancedVideosPromises = videos.map(async (video) => {
    // Only completed videos need enhancement to get media URLs
    if (video.status === 'completed') {
      try {
        console.log(`videoDataService: Fetching details for completed video ${video.video_id}...`);
        
        // Get detailed video information
        const detailedVideo = await fetchVideoDetailsFromHeyGen(video.video_id);
        
        // Merge basic info with detailed info
        return {
          ...video,
          ...detailedVideo,
          _enriched: true,
          _enrichedAt: new Date().toISOString(),
          _hasValidThumbnail: !!detailedVideo.thumbnail_url || !!video.thumbnail_url,
          _hasValidVideoUrl: !!detailedVideo.video_url
        };
      } catch (error) {
        console.error(`videoDataService: Failed to get details for video ${video.video_id}:`, error);
        
        // Don't fail the whole batch if one video fails
        return {
          ...video,
          _enriched: false,
          _enrichError: error.message
        };
      }
    }
    
    // For non-completed videos, return as is
    return {
      ...video,
      _enriched: false,
      _enrichMessage: 'Video not completed, no need for detailed information'
    };
  });
  
  // Wait for all enhancement operations to complete
  const enhancedVideos = await Promise.all(enhancedVideosPromises);
  console.log(`videoDataService: Enhancement complete: ${enhancedVideos.filter(v => v._enriched).length} videos enriched`);
  
  return enhancedVideos;
};

/**
 * Fetch detailed information for a specific video from HeyGen API
 * @param {string} videoId - The ID of the video
 * @returns {Promise<Object>} - Detailed video information
 */
const fetchVideoDetailsFromHeyGen = async (videoId) => {
  try {
    console.log(`videoDataService: Calling HeyGen API for video ${videoId} details...`);
    
    // Call HeyGen's video_status.get endpoint
    const response = await heygenClient.get('/video_status.get', { 
      params: { video_id: videoId } 
    });
    
    // Validate response structure
    if (!response.data || !response.data.data) {
      throw new Error('Unexpected response format from HeyGen API video_status.get');
    }
    
    const detailData = response.data.data;
    console.log(`videoDataService: Successfully received details for video ${videoId}`);
    console.log('videoDataService: Video URL found:', detailData.video_url);
    
    // Log detailed information about the video for debugging
    console.log('videoDataService: Full video details:', JSON.stringify({
      video_id: detailData.video_id,
      status: detailData.status,
      has_video_url: !!detailData.video_url,
      has_thumbnail: !!detailData.thumbnail_url,
      has_audio: detailData.has_audio || 'unknown', // Check if API provides this
      audio_info: detailData.audio_info || 'not provided', // Check if API provides this
      format: detailData.format || 'unknown',
      duration: detailData.duration || 'unknown',
      resolution: detailData.resolution || 'unknown'
    }, null, 2));
    
    // Return normalized detailed data with enhanced video URL handling
    return {
      video_id: detailData.video_id,
      thumbnail_url: detailData.thumbnail_url || null,
      video_url: detailData.video_url || null,
      proxied_video_url: detailData.video_url || null, // Add this for backward compatibility
      gif_url: detailData.gif_url || null,
      download_url: detailData.download_url || null,
      duration: detailData.duration || null,
      resolution: detailData.resolution || null,
      has_audio: detailData.has_audio || null, // Add this if available
      _detailedResponse: detailData, // Keep the original response for reference
      _videoUrlSource: detailData.video_url ? 'heygen_direct' : 'none'
    };
  } catch (error) {
    console.error(`videoDataService: Error fetching video details from HeyGen:`, error);
    
    // If it's an API error with a response, provide more details
    if (error.response) {
      throw new Error(`HeyGen API error (${error.response.status}): ${
        error.response.data?.message || 'Unknown API error'
      }`);
    }
    
    throw error;
  }
};

/**
 * Delete a video from HeyGen
 * @param {string} videoId - The ID of the video to delete
 * @returns {Promise<Object>} - The API response
 */
export const deleteVideo = async (videoId) => {
  try {
    console.log(`videoDataService: Deleting video ${videoId} from HeyGen...`);
    
    // Call HeyGen's video.delete endpoint
    const response = await heygenClient.post('/video.delete', {
      video_id: videoId
    });
    
    console.log(`videoDataService: Video ${videoId} successfully deleted from HeyGen`);
    return response.data;
  } catch (error) {
    console.error(`videoDataService: Error deleting video ${videoId} from HeyGen:`, error);
    
    // If it's an API error with a response, provide more details
    if (error.response) {
      throw new Error(`HeyGen API error (${error.response.status}): ${
        error.response.data?.message || 'Unknown API error'
      }`);
    }
    
    throw error;
  }
};

export default {
  getEnrichedVideoList,
  deleteVideo,
}; 