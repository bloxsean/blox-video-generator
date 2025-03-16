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
  
  const formatDate = (dateString) => {
    const date = typeof dateString === 'number' 
      ? new Date(dateString * 1000)
      : new Date(dateString);
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
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
  
  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([videoId, videoElement]) => {
      if (videoId !== playingVideo && videoElement) {
        videoElement.pause();
      }
    });
  }, [playingVideo]);
  
  const toggleVideoPlayback = (videoId) => {
    const videoElement = videoRefs.current[videoId];
    
    if (!videoElement) return;
    
    if (playingVideo === videoId) {
      videoElement.pause();
      setPlayingVideo(null);
    } else {
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
  
  const fetchVideos = async (token = null) => {
    try {
      if (token) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      console.log(`VideoList: Fetching videos with token: ${token || 'NONE'}`);
      
      const response = await getEnrichedVideoList(token);
      
      console.log('VideoList: Received enriched videos response:', {
        videosCount: response.videos.length,
        hasToken: !!response.token
      });
      
      if (response && response.videos) {
        const videosData = response.videos;
        console.log(`VideoList: Processing ${videosData.length} enriched videos`);
        
        const displayVideos = videosData.map(video => ({
          ...video,
          video_id: video.video_id,
          title: video.video_title || video.title || `Video ${video.video_id.substring(0, 8)}`,
          status: video.status || 'unknown',
          created_at: video.created_at || video.creation_time || new Date().toISOString(),
          _hasValidThumbnail: !!video.thumbnail_url,
          _hasValidVideoUrl: !!video.proxied_video_url,
        }));
        
        if (token) {
          setVideos(prevVideos => [...prevVideos, ...displayVideos]);
        } else {
          setVideos(displayVideos);
        }
        
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
  
  const handleLoadMore = () => {
    if (nextPageToken) {
      fetchVideos(nextPageToken);
    }
  };
  
  const handleDeleteVideo = async (videoId) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await deleteVideo(videoId);
        setVideos(prevVideos => prevVideos.filter(video => video.video_id !== videoId));
      } catch (err) {
        setError(`Failed to delete video: ${err.message}`);
      }
    }
  };
  
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
  
  const getVideoPreview = (video) => {
    console.log(`VideoList: Preview for video ${video.video_id}:`, {
      status: video.status,
      thumbnail: video.thumbnail_url || 'NONE',
      video_url: video.proxied_video_url || 'NONE',
      enriched: video._enriched || false
    });
    
    if (video.status === 'completed') {
      return (
        <VideoPlayer
          key={`player-${video.video_id}`}
          videoUrl={video.proxied_video_url || null}
          thumbnailUrl={video.thumbnail_url || '/placeholder-thumbnail.svg'}
          title={video.title}
          onPlay={() => setPlayingVideo(video.video_id)}
          onPause={() => setPlayingVideo(null)}
          onError={(err) => console.error('Video playback error:', err)}
          rawVideo={video}
        />
      );
    }
    
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
  
  const getCardColor = (videoId) => {
    const colors = [
      '#fef3c7',
      '#dbeafe',
      '#e0e7ff',
      '#f3e8ff',
      '#fcecf4',
      '#dcfce7',
      '#f1f5f9',
    ];
    
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
          <div className="video-list">
            {videos.map((video) => {
              const videoKey = video.video_id || `video-${Math.random().toString(36).substr(2, 9)}`;
              
              return (
                <div 
                  key={videoKey}
                  className="video-item" 
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