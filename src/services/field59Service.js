import axios from 'axios';
import Field59Video from '../models/Field59Video';

/**
 * Service for interacting with Field59 API through our proxy server
 */
class Field59Service {
  /**
   * Create a new Field59Service 
   * @param {string} username - Field59 API username (used by server)
   * @param {string} password - Field59 API password (used by server)
   */
  constructor(username, password) {
    this.username = username;
    this.password = password;
    // No longer need to store credentials in the client
    // as we'll use our server as a proxy
  }

  /**
   * Create a video in Field59
   * @param {Field59Video} videoData - The video data
   * @returns {Promise<string>} - Promise resolving to the video key
   */
  async createVideo(videoData) {
    if (!(videoData instanceof Field59Video)) {
      throw new Error('videoData must be an instance of Field59Video');
    }

    if (!videoData.url || !videoData.title) {
      throw new Error('Video must have a URL and title');
    }

    console.log('Creating video with URL:', videoData.url);
    
    try {
      // Use our server endpoint instead of calling Field59 directly
      const response = await axios.post('/api/field59/videos', {
        url: videoData.url,
        title: videoData.title,
        summary: videoData.summary || '',
        tags: videoData.tags || []
      });

      if (!response.data?.videoKey) {
        throw new Error('Failed to get video key from response');
      }

      console.log('Video created successfully with key:', response.data.videoKey);
      return response.data.videoKey;
    } catch (err) {
      console.error('Video creation failed:', err);
      throw new Error(err.response?.data?.details || err.message);
    }
  }

  /**
   * Get recent videos from Field59
   * @param {number} limit - Maximum number of videos to return
   * @returns {Promise<Array>} - Promise resolving to array of videos
   */
  async getVideos(limit = 5) {
    try {
      const response = await axios.get(`/v2/search?limit=${limit}`, {
        responseType: 'text',
        headers: {
          'Authorization': `Basic ${this.credentials}`,
          'Accept': 'application/xml'
        }
      });

      // Parse XML response using browser's DOMParser
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response.data, 'text/xml');
      
      // Helper function to extract CDATA content
      const getCData = (element, tagName) => {
        const node = element.querySelector(tagName);
        return node ? node.textContent.replace(/^\[CDATA\[(.*)\]\]$/, '$1') : '';
      };

      // Transform the data into a structured format
      const videoElements = xmlDoc.querySelectorAll('video');
      return Array.from(videoElements).map(videoEl => ({
        key: getCData(videoEl, 'key'),
        title: getCData(videoEl, 'title'),
        category: getCData(videoEl, 'category'),
        tags: Array.from(videoEl.querySelectorAll('tags tag')).map(tag => 
          tag.textContent.replace(/^\[CDATA\[(.*)\]\]$/, '$1')
        ),
        url: getCData(videoEl, 'url'),
        adaptiveStream: getCData(videoEl, 'adaptive_stream'),
        duration: getCData(videoEl, 'duration'),
        summary: getCData(videoEl, 'summary'),
        description: getCData(videoEl, 'description'),
        thumbnails: {
          full: getCData(videoEl, 'thumb'),
          small: getCData(videoEl, 'thumbSmall'),
          medium: getCData(videoEl, 'thumbMedium')
        },
        playlists: Array.from(videoEl.querySelectorAll('playlists playlist')).map(playlist => 
          playlist.textContent.replace(/^\[CDATA\[(.*)\]\]$/, '$1')
        ),
        createDate: getCData(videoEl, 'createDate'),
        lastModifiedDate: getCData(videoEl, 'lastModifiedDate'),
        liveDate: getCData(videoEl, 'liveDate'),
        owner: getCData(videoEl, 'owner'),
        user: getCData(videoEl, 'user'),
        id: getCData(videoEl, 'id')
      }));
    } catch (err) {
      console.error('Error fetching Field59 videos:', err);
      throw new Error(err.response?.data?.message || err.message);
    }
  }
}

export default Field59Service; 