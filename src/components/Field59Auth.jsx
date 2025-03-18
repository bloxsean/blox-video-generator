import { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

const Field59Auth = ({ username, password, onSuccess, onError, onUploadComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [url, setUrl] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!url.trim()) return;

    setCreating(true);
    setError(null);

    try {
      // Create the video with URL
      const fileName = url.split('/').pop()?.split('?')[0] || '';
      const title = fileName.replace(/\.[^/.]+$/, ''); // Remove file extension
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<video>
  <title><![CDATA[${title}]]></title>
  <url><![CDATA[${url}]]></url>
</video>`;

      console.log('Creating video with URL:', url);
      console.log('XML payload:', xml);

      // Send video metadata as URL-encoded form data
      const params = new URLSearchParams();
      params.append('xml', xml);

      const createResponse = await axios.post('/v2/video/create', params, {
        headers: {
          'Authorization': `Basic ${btoa(username + ':' + password)}`,
          'Accept': 'application/xml'
        },
        responseType: 'text'
      });

      // Parse response to get video key
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(createResponse.data, 'text/xml');
      const key = xmlDoc.querySelector('key')?.textContent;

      if (!key) {
        throw new Error('Failed to get video key from response');
      }

      console.log('Video created successfully with key:', key);
      onUploadComplete?.(key);
      setUrl(''); // Clear the input
    } catch (err) {
      console.error('Video creation failed:', err);
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    const fetchVideos = async () => {
      if (hasFetched) return; // Skip if we've already fetched
      
      setLoading(true);
      setError(null);
      
      try {
        // Create Base64 encoded credentials
        const credentials = btoa(`${username}:${password}`);
        
        console.log('Making API request to Field59...');
        // Make the authenticated request with XML response type
        const response = await axios.get('/v2/search?limit=5', {
          responseType: 'text',
          headers: {
            'Authorization': `Basic ${credentials}`,
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
        const videos = Array.from(videoElements).map(videoEl => ({
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

        console.log('API request successful');
        onSuccess(videos);
        setHasFetched(true);
      } catch (err) {
        console.log('API request failed:', err);
        const errorMessage = err.response?.data?.message || err.message;
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (username && password) {
      fetchVideos();
    }
  }, [username, password, onSuccess, onError, hasFetched]);

  // Render URL input and loading/error states
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter video URL"
          disabled={loading || creating}
          required
          style={{
            flex: '1 1 auto',
            minWidth: '500px',
            padding: '8px 12px',
            fontSize: '16px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontFamily: 'monospace' // Better for displaying URLs
          }}
        />
        <button 
          type="submit" 
          disabled={loading || creating || !url.trim()}
          style={{
            padding: '8px 16px',
            fontSize: '16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: loading || creating || !url.trim() ? '#ccc' : '#007bff',
            color: 'white',
            cursor: loading || creating || !url.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          {creating ? 'Creating...' : 'Create Video'}
        </button>
      </form>
      
      {loading && <div style={{ textAlign: 'center' }}>Loading videos...</div>}
      {error && <div style={{ color: 'red', marginTop: '10px' }}>Error: {error}</div>}
    </div>
  );
};

Field59Auth.propTypes = {
  username: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func,
  onUploadComplete: PropTypes.func
};

export default Field59Auth;
