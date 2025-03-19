import React, { useState, useEffect } from 'react';
import { getEnrichedVideoList, deleteVideo } from '../services/videoDataService';
import Field59Service from '../services/field59Service';
import Field59Video from '../models/Field59Video';
import './VideoList.css';
import VideoPlayer from './VideoPlayer';
import { FiDownload } from 'react-icons/fi';


const VideoList = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isCreatingF59Video, setIsCreatingF59Video] = useState(false);
  const [newF59VideoKey, setNewF59VideoKey] = useState(null);
  
  
  // Initialize Field59 service with credentials from environment variables
  const field59Service = new Field59Service(
    import.meta.env.VITE_FIELD59_USERNAME,
    import.meta.env.VITE_FIELD59_PASSWORD
  );
  
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
  
  // Add this new function to create a Field59 video
  const createField59Video = async (videoUrl, title, summary = '', tags = []) => {
    try {
      setIsCreatingF59Video(true);
      setError(null);
      
      // Create a Field59Video object
      const videoData = new Field59Video({
        url: videoUrl,
        title: title,
        summary: summary,
        tags: tags
      });
      
      // Send to Field59
      const videoKey = await field59Service.createVideo(videoData);
      
      setNewF59VideoKey(videoKey);
      console.log('Created new Field59 video with key:', videoKey);
      
      // Refresh the video list after creating
      fetchVideos();
      
      return videoKey;
    } catch (err) {
      console.error('Error creating Field59 video:', err);
      setError(`Failed to create Field59 video: ${err.message}`);
      throw err;
    } finally {
      setIsCreatingF59Video(false);
    }
  };
  
  const createBLOXVMSVideo = async (
    videoUrl = "",
    videoTitle = "",
    videoSummary = "",
    videoTags = ["bloxaigenerated"]
  ) => {
    try {
      const videoKey = await createField59Video(videoUrl, videoTitle, videoSummary, videoTags);
      
      alert(`Successfully created Field59 video with key: ${videoKey}`);
      return videoKey;
    } catch (err) {
      alert(`Failed to create video: ${err.message}`);
      throw err;
    }
  };


  // Example function to call when you want to create a video
  const handleCreateExampleVideo = async () => {
    try {
      const videoUrl = "https://example.com/sample-video.mp4";
      const videoTitle = "Sample Video from VideoList";
      const videoSummary = "This is a sample video created from the VideoList component";
      const videoTags = ["sample", "test", "field59"];
      
      const videoKey = await createField59Video(videoUrl, videoTitle, videoSummary, videoTags);
      
      alert(`Successfully created Field59 video with key: ${videoKey}`);
    } catch (err) {
      alert(`Failed to create video: ${err.message}`);
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
              <FiDownload className="icon download-icon" />Download
            </a>
          )}
          
          <button 
            className="video-action-button create-button"
            disabled={isCreatingF59Video || !video.proxied_video_url || !video.title}
            onClick={() => createBLOXVMSVideo(
              video.proxied_video_url || video.download_url, 
              video.title, 
              video.transcript || ""
            )}
            title={!video.proxied_video_url || !video.title ? 
              "Missing video URL or title required for BLOX VMS" : 
              "Create video in BLOX VMS"}
          >
            Create BLOX VMS Video
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

  // Add a control for creating Field59 videos
  const renderField59Controls = () => {
    return (
      <div className="field59-controls" style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f0f9ff', 
        borderRadius: '8px',
        border: '1px solid #bae6fd'
      }}>
        <h3 style={{ marginTop: 0 }}>Field59 Video Creation</h3>
        <button 
          className="create-video-button"
          onClick={handleCreateExampleVideo}
          disabled={isCreatingF59Video}
          style={{
            padding: '8px 16px',
            backgroundColor: isCreatingF59Video ? '#94a3b8' : '#0284c7',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isCreatingF59Video ? 'not-allowed' : 'pointer'
          }}
        >
          {isCreatingF59Video ? 'Creating...' : 'Create Sample Field59 Video'}
        </button>
        
        {newF59VideoKey && (
          <div className="success-message" style={{ 
            marginTop: '10px', 
            padding: '8px', 
            backgroundColor: '#dcfce7', 
            color: '#166534',
            borderRadius: '4px'
          }}>
            Created new video with key: {newF59VideoKey}
          </div>
        )}
      </div>
    );
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
      
      {/* Add the Field59 controls here */}
      {/* {renderField59Controls()} */}
      
      {videos.length === 0 ? (
        <div className="no-videos-message">
          <p>You don't have any videos yet.</p>
          <p>Create a new video using the Script tab!</p>
        </div>
      ) : (
        <>
          <div className="video-list" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            gap: '16px',
            width: '100%' 
          }}>
            {videos.map((video) => {
              const videoKey = video.video_id || `video-${Math.random().toString(36).substr(2, 9)}`;
              
              return (
                <div 
                  key={videoKey}
                  className="video-item" 
                  style={{ 
                    background: video._hasValidThumbnail ? '#162033' : '#162033' 
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
