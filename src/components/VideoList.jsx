import React, { useState, useEffect, useRef } from 'react';
import { getEnrichedVideoList, deleteVideo } from '../services/videoDataService';
import './VideoList.css';
import VideoPlayer from './VideoPlayer';

const VideoList = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const videoRefs = useRef({});
  
  // Format date to a more readable format
  const formatDate = (dateString) => {
    // Handle Unix timestamp or ISO string
    const date = typeof dateString === 'number' 
      ? new Date(dateString * 1000) // Unix timestamp (seconds since epoch)
      : new Date(dateString);       // ISO string
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get status badge class based on status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'status-badge status-completed';
      case 'processing':
      case 'pending':
        return 'status-badge status-processing';
      case 'failed':
        return 'status-badge status-failed';
      default:
        return 'status-badge';
    }
  };
  
  // Load initial videos
  useEffect(() => {
    fetchVideos();
  }, []);

  // Handle playing videos
  useEffect(() => {
    // Pause all videos except the currently playing one
    Object.entries(videoRefs.current).forEach(([videoId, videoElement]) => {
      if (videoId !== playingVideo && videoElement) {
        videoElement.pause();
      }
    });
  }, [playingVideo]);
  
  // Toggle video playback
  const toggleVideoPlayback = (videoId) => {
    const videoElement = videoRefs.current[videoId];
    
    if (!videoElement) return;
    
    if (playingVideo === videoId) {
      // This video is already playing, pause it
      videoElement.pause();
      setPlayingVideo(null);
    } else {
      // Play this video and pause others
      if (playingVideo) {
        const currentlyPlaying = videoRefs.current[playingVideo];
        if (currentlyPlaying) {
          currentlyPlaying.pause();
        }
      }
      
      videoElement.play().catch(err => {
        console.error("Error playing video:", err);
      });
      setPlayingVideo(videoId);
    }
  };
  
  // Fetch videos using the new enriched service
  const fetchVideos = async (token = null) => {
    try {
      if (token) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      console.log(`VideoList: Fetching videos with token: ${token || 'NONE'}`);
      
      // Get fully enriched videos with all details
      const response = await getEnrichedVideoList(token);
      
      console.log('VideoList: Received enriched videos response:', {
        videosCount: response.videos.length,
        hasToken: !!response.token
      });
      
      if (response && response.videos) {
        const videosData = response.videos;
        console.log(`VideoList: Processing ${videosData.length} enriched videos`);
        
        // Log the first video for debugging
        if (videosData.length > 0) {
          const firstVideo = videosData[0];
          console.log('VideoList: First enriched video:', firstVideo);
          console.log('VideoList: Media URLs:', {
            thumbnail_url: firstVideo.thumbnail_url || 'NONE',
            proxied_video_url: firstVideo.proxied_video_url || 'NONE',
            enriched: firstVideo._enriched || false
          });
        }
        
        // Prepare videos for display with consistent field access
        const displayVideos = videosData.map(video => ({
          ...video,
          // Ensure these fields are consistently named
          video_id: video.video_id,
          title: video.video_title || video.title || `Video ${video.video_id.substring(0, 8)}`,
          status: video.status || 'unknown',
          created_at: video.created_at || video.creation_time || new Date().toISOString(),
          // Flag for UI rendering
          _hasValidThumbnail: !!video.thumbnail_url,
          _hasValidVideoUrl: !!video.proxied_video_url,
        }));
        
        if (token) {
          // Append to existing videos
          setVideos(prevVideos => [...prevVideos, ...displayVideos]);
        } else {
          // Replace existing videos
          setVideos(displayVideos);
        }
        
        // Store pagination token for next page if available
        setNextPageToken(response.token || null);
      } else {
        throw new Error('Invalid response format from enriched video service');
      }
    } catch (err) {
      console.error('VideoList: Error fetching videos:', err);
      setError(`Failed to load videos: ${err.message}`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  // Load more videos
  const handleLoadMore = () => {
    if (nextPageToken) {
      fetchVideos(nextPageToken);
    }
  };
  
  // Handle video deletion (using the new service)
  const handleDeleteVideo = async (videoId) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await deleteVideo(videoId);
        // Remove the deleted video from the list
        setVideos(prevVideos => prevVideos.filter(video => video.video_id !== videoId));
      } catch (err) {
        setError(`Failed to delete video: ${err.message}`);
      }
    }
  };
  
  // Get status display with appropriate icon
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'completed':
        return <span className={getStatusBadgeClass(status)}>Completed ✓</span>;
      case 'processing':
        return <span className={getStatusBadgeClass(status)}>Processing ⟳</span>;
      case 'pending':
        return <span className={getStatusBadgeClass(status)}>Pending ⌛</span>;
      case 'failed':
        return <span className={getStatusBadgeClass(status)}>Failed ✗</span>;
      default:
        return <span className={getStatusBadgeClass(status)}>{status}</span>;
    }
  };
  
  // Get video preview component based on video status and available thumbnails
  const getVideoPreview = (video) => {
    console.log(`VideoList: Preview for video ${video.video_id}:`, {
      status: video.status,
      thumbnail: video.thumbnail_url || 'NONE',
      video_url: video.proxied_video_url || 'NONE',
      enriched: video._enriched || false
    });
    
    if (video.status === 'completed') {
      // Use VideoPlayer component for completed videos
      return (
        <VideoPlayer
          videoUrl={video.proxied_video_url || null}
          thumbnailUrl={video.thumbnail_url || '/placeholder-thumbnail.svg'}
          title={video.title}
          onPlay={() => setPlayingVideo(video.video_id)}
          onPause={() => setPlayingVideo(null)}
          onError={(err) => console.error('Video playback error:', err)}
          // Pass the raw video object for debugging
          rawVideo={video}
        />
      );
    }
    
    // For other statuses (processing, pending, etc.)
    return (
      <div className="video-status-preview">
        {video.status === 'processing' ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" fill="#dbeafe"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        ) : video.status === 'pending' ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" fill="#f3e8ff"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12" y2="16"></line>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" fill="#f3e8ff"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12" y2="16"></line>
          </svg>
        )}
        <div className="status-text">{video.status}</div>
      </div>
    );
  };
  
  // Get appropriate action buttons based on video status
  const getActionButtons = (video) => {
    if (video.status === 'completed') {
      return (
        <div className="video-actions">
          {video.proxied_video_url && (
            <button 
              className="video-action-button play-button"
              onClick={() => toggleVideoPlayback(video.video_id)}
            >
              {playingVideo === video.video_id ? 'Pause' : 'Play'}
            </button>
          )}
          {video.proxied_video_url && (
            <a 
              className="video-action-button download-button"
              href={video.proxied_video_url}
              download={`video-${video.video_id}.mp4`}
              onClick={(e) => {
                // If the proxied URL doesn't support download, try the original
                if (!video.proxied_video_url.includes('download=true') && video.download_url) {
                  e.preventDefault();
                  const a = document.createElement('a');
                  a.href = video.download_url;
                  a.download = `video-${video.video_id}.mp4`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }
              }}
            >
              Download
            </a>
          )}
          <button 
            className="video-action-button delete-button"
            onClick={() => handleDeleteVideo(video.video_id)}
            disabled={true}
            title="Delete functionality disabled for testing"
          >
            Delete
          </button>
        </div>
      );
    } else {
      return (
        <div className="video-actions">
          <button 
            className="video-action-button refresh-button"
            onClick={() => fetchVideos()}
          >
            Refresh Status
          </button>
          <button 
            className="video-action-button delete-button"
            onClick={() => handleDeleteVideo(video.video_id)}
            disabled={true}
            title="Delete functionality disabled for testing"
          >
            Delete
          </button>
        </div>
      );
    }
  };
  
  // Generate a color based on video ID for the card background
  const getCardColor = (videoId) => {
    const colors = [
      '#fef3c7', // amber-100
      '#dbeafe', // blue-100
      '#e0e7ff', // indigo-100
      '#f3e8ff', // purple-100
      '#fcecf4', // pink-100
      '#dcfce7', // green-100
      '#f1f5f9', // slate-100
    ];
    
    // Use the last character of the video ID to select a color
    const lastChar = videoId.charCodeAt(videoId.length - 1) || 0;
    return colors[lastChar % colors.length];
  };
  
  if (loading && !loadingMore) {
    return (
      <div className="video-list-container">
        <h2>Your Videos</h2>
        <div className="loading-indicator">Loading videos...</div>
      </div>
    );
  }
  
  return (
    <div className="video-list-container">
      <h2>Your Videos</h2>
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      {videos.length === 0 ? (
        <div className="no-videos-message">
          <p>You don't have any videos yet.</p>
          <p>Create a new video using the Script tab!</p>
        </div>
      ) : (
        <>
          {/* Add enhanced debugging information at the top */}
          {/* {process.env.NODE_ENV !== 'production' && (
            <div className="debug-info" style={{ margin: '10px 0', padding: '10px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px' }}>
              <details>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Debug Info (Click to expand)</summary>
                <div style={{ marginTop: '10px', fontSize: '12px', fontFamily: 'monospace' }}>
                  {videos.length > 0 ? (
                    <>
                      <h4 style={{ marginBottom: '8px' }}>Video Data Being Used For Rendering:</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <strong>Title:</strong> {videos[0].title} 
                          <span style={{ color: '#666', marginLeft: '4px' }}>
                            (Using: {videos[0].title === videos[0].video_title ? 'video_title' : 'title'} field)
                          </span>
                        </div>
                        
                        <div>
                          <strong>Video ID:</strong> {videos[0].video_id}
                        </div>
                        
                        <div>
                          <strong>Enriched:</strong> 
                          <span style={{ 
                            color: videos[0]._enriched ? '#065f46' : '#b91c1c',
                            fontWeight: 'bold'
                          }}>
                            {videos[0]._enriched ? 'YES' : 'NO'}
                          </span>
                        </div>
                        
                        <div>
                          <strong>Thumbnail URL:</strong> 
                          <span style={{ 
                            color: videos[0]._hasValidThumbnail ? '#065f46' : '#b91c1c',
                            fontWeight: videos[0]._hasValidThumbnail ? 'normal' : 'bold'
                          }}>
                            {videos[0]._hasValidThumbnail ? (videos[0].thumbnail_url || '').substring(0, 50) + '...' : 'MISSING'}
                          </span>
                        </div>
                        
                        <div>
                          <strong>Video URL:</strong> 
                          <span style={{ 
                            color: videos[0]._hasValidVideoUrl ? '#065f46' : '#b91c1c',
                            fontWeight: videos[0]._hasValidVideoUrl ? 'normal' : 'bold'
                          }}>
                            {videos[0]._hasValidVideoUrl ? (videos[0].proxied_video_url || '').substring(0, 50) + '...' : 'MISSING'}
                          </span>
                        </div>
                        
                        <div>
                          <strong>Status:</strong> {videos[0].status}
                        </div>
                      </div>
                      
                      <h4 style={{ margin: '16px 0 8px 0' }}>Raw Data:</h4>
                      <pre style={{ overflow: 'auto', maxHeight: '200px', background: '#2d2d2d', color: '#f8f8f2', padding: '8px', borderRadius: '4px' }}>
                        {JSON.stringify(videos[0], null, 2)}
                      </pre>
                    </>
                  ) : (
                    <p>No videos available to debug</p>
                  )}
                </div>
              </details>
            </div>
          )} */}
          
          <div className="video-list">
            {videos.map(video => {
              // Log the first video render
              if (video === videos[0]) {
                console.log('VideoList: Rendering first video:', {
                  'title': video.title,
                  'video_id': video.video_id,
                  'thumbnail_url': video.thumbnail_url || 'NONE',
                  'proxied_video_url': video.proxied_video_url || 'NONE',
                  'status': video.status,
                  '_enriched': video._enriched || false
                });
              }
              
              return (
                <div 
                  className="video-item" 
                  key={video.video_id}
                  style={{ 
                    background: video._hasValidThumbnail ? 'white' : `linear-gradient(to bottom right, white, ${getCardColor(video.video_id)})` 
                  }}
                >
                  <div className="video-preview">
                    {getVideoPreview(video)}
                  </div>
                  
                  <div className="video-details">
                    <div className="video-title">
                      {video.title}
                      {process.env.NODE_ENV !== 'production' && video._enriched && (
                        <small style={{ display: 'block', fontSize: '8px', color: '#065f46', backgroundColor: '#d1fae5', padding: '2px 4px', borderRadius: '2px', marginTop: '4px', width: 'fit-content' }}>
                          Enriched
                        </small>
                      )}
                    </div>
                    
                    <div className="video-status">
                      {getStatusDisplay(video.status)}
                    </div>
                    
                    <div className="video-meta">
                      <div className="video-created">
                        Created: {formatDate(video.created_at)}
                      </div>
                      
                      {getActionButtons(video)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {nextPageToken && (
            <div className="load-more-container">
              <button 
                className="load-more-button"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Load More Videos'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoList; 