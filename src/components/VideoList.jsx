import React, { useState, useEffect } from 'react';
import { getEnrichedVideoList, deleteVideo } from '../services/videoDataService';
import { uploadVideoToField59 } from '../services/field59UploadService';  
import './VideoList.css';
import VideoPlayer from './VideoPlayer';
import axios from 'axios';
import { MdMoreVert } from "react-icons/md";
import { FaEllipsisV } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import { MdDownloadForOffline } from "react-icons/md";
import AvatarCard from './cards/avatarCard';
import { Grid } from '@mui/material';

const VideoList = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({});
  
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
      //console.log(`VideoList: Fetching videos with token: ${token || 'NONE'}`);
      
      const response = await getEnrichedVideoList(token);
      
      //console.log('VideoList: Received enriched videos response:', {
      //  videosCount: response.videos.length,
      //  hasToken: !!response.token
      //});
      
      if (response && response.videos) {
        const videosData = response.videos;
        //console.log(`VideoList: Processing ${videosData.length} enriched videos`);
        
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
    // console.log(`VideoList: Preview for video ${video.video_id}:`, {
    //   status: video.status,
    //   thumbnail: video.thumbnail_url || 'NONE',
    //   video_url: video.proxied_video_url || 'NONE',
    //   enriched: video._enriched || false
    // });
    
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
  

  const handleField59Upload = async (video) => {
 
    console.log('handleField59Upload:', video);

    try {
      // Create the video with URL
     // const fileName = url.split('/').pop()?.split('?')[0] || '';
     // const title = fileName.replace(/\.[^/.]+$/, ''); // Remove file extension
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <video>
        <title><![CDATA[${video.title}]]></title>
        <url><![CDATA[${video.proxied_video_url}]]></url>
      </video>`;

      console.log('Creating video with URL:', video.proxied_video_url);
      console.log('XML payload:', xml);

      // Send video metadata as URL-encoded form data
      const params = new URLSearchParams();
      params.append('xml', xml);

      const createResponse = await axios.post('/v2/video/create', params, {
        headers: {
          'Authorization': `Basic ${btoa(import.meta.env.VITE_FIELD59_USERNAME+ ':' + import.meta.env.VITE_FIELD59_PASSWORD)}`,
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
      //onUploadComplete?.(key);
      //setUrl(''); // Clear the input
    } catch (err) {
      console.error('Video creation failed:', err);
     // const errorMessage = err.response?.data?.message || err.message;
      //setError(errorMessage);
     // onError?.(errorMessage);
    } finally {
      //setCreating(false);
      console.log('handleField59Upload finally');
    }

  };

  // const handleField59Upload = async (video) => {
  //   setUploadStatus(prev => ({
  //     ...prev,
  //     [video.video_id]: { status: 'uploading', message: 'Uploading to Field59...' }
  //   }));
  //   console.log('handleField59Upload:', video);

  //   // Create the XML payload
  //   // const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
  //   // <video>
  //   //   <title><![CDATA[${video.title}]]></title>
  //   //   <url><![CDATA[${encodeURIComponent(video.proxied_video_url)}]]></url>
  //   // </video>`;

  //   try {

  //     const response = await axios.post('/api/field59/upload', {
  //       url: video.proxied_video_url,
  //       title: video.title
  //     }, {
  //       headers: {
  //         'Content-Type': 'application/json'
  //       }
  //     });
      
  //     if (!response.data?.key) {
  //       throw new Error('Failed to get video ID from response');
  //     }

  //     // Send as plain text instead of URLSearchParams
  //     // const response = await axios.post('/api/field59/upload', xmlPayload, {
  //     //   headers: {
  //     //     'Content-Type': 'text/xml',  // Changed content type to XML
  //     //     'Accept': 'application/xml'
  //     //   }
  //     // });
      
  //     // Parse the XML response
  //     // const parser = new DOMParser();
  //     // const xmlDoc = parser.parseFromString(response.data, "text/xml");
      
  //     // // Check for both id and key elements
  //     // const key = xmlDoc.querySelector("id")?.textContent || 
  //     //             xmlDoc.querySelector("key")?.textContent;
      
  //     // if (!key) {
  //     //   throw new Error('Failed to get video ID from XML response');
  //     // }
      
  //     // setUploadStatus(prev => ({
  //     //   ...prev,
  //     //   [video.video_id]: { 
  //     //     status: 'success', 
  //     //     message: `Successfully uploaded to Field59 with ID: ${key}`,
  //     //     videoKey: key
  //     //   }
  //     // }));
  //   } catch (error) {
  //     console.error('Field59 upload failed:', error);
  //     // Enhanced error reporting
  //     const errorMessage = error.response?.data 
  //       ? `Server error: ${error.response.data}` 
  //       : error.message || 'Unknown error';
      
  //     setUploadStatus(prev => ({
  //       ...prev,
  //       [video.video_id]: { 
  //         status: 'error', 
  //         message: `Upload failed: ${errorMessage}`
  //       }
  //     }));
  //   }
  // };
  
  const handleTestProxy = async (video) => {
    console.log('Testing proxy function with video:', video);
    
    try {
      const response = await axios.post('http://localhost:300/api/videos', video, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Proxy test response:', response.data);
      
      // Show success message in the upload status
      setUploadStatus(prev => ({
        ...prev,
        [video.video_id]: { 
          status: 'success', 
          message: `Proxy test successful: ${response.data.message}`
        }
      }));
    } catch (error) {
      console.error('Proxy test failed:', error);
      
      setUploadStatus(prev => ({
        ...prev,
        [video.video_id]: { 
          status: 'error', 
          message: `Proxy test failed: ${error.message}`
        }
      }));
    }
  };
  
  const getActionButtons = (video) => {
    if (video.status === 'completed') {
      return (
        <div className="video-actions">
          <div className="menu-dropdown">
            {/* <button className="menu-button">
              <MdDownloadForOffline size={22} />
            </button> */}
           
              {video.proxied_video_url && (
                <a 
                  className="menu-itemx"
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
                  <MdDownloadForOffline size={22} />
                </a>
              )}
           
          </div>
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
      
      {/* <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 4 }}>
      {videos.map((video, index) => (
        <Grid item key={index} xs={12} sm={6} md={2.4}>
          <AvatarCard video={video} />
        </Grid>
      ))}
    </Grid> */}

{/* <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
      {videos.map((video, index) => (
        <Grid
          item
          key={index}
          xs={12}        // 1 card per row on extra-small screens
          sm={6}        // 2 cards per row on small screens
          md={4}        // 3 cards per row on medium screens
          lg={2.4}      // 5 cards per row on large screens (flexible sizing)
          sx={{
            display: 'flex',
            minWidth: 250,     // Minimum card size
            flexGrow: 1,       // Cards expand to fill space
          }}
        >
          <AvatarCard video={video} />
        </Grid>
      ))}
    </Grid> */}




{/*       
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 4 }}>
        <Grid item size={6}>
          <AvatarCard video={videos[0]} />
        </Grid>
        <Grid item size={6}>
          <AvatarCard video={videos[1]} />
        </Grid>
        <Grid item size={6}>
          <AvatarCard video={videos[2]} />
        </Grid>
        <Grid item size={6}>
          <AvatarCard video={videos[3]} />
        </Grid>
        <Grid item size={6}>
          <AvatarCard video={videos[4]} />
        </Grid>
        <Grid item size={6}>
          <AvatarCard video={videos[5]} />
        </Grid>
      </Grid>
       */}

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
                <AvatarCard video={video} key={videoKey} />
                // <div 
                //   key={videoKey}
                //   className="video-item" 
                //   style={{ 
                //     background: video._hasValidThumbnail ? '#162033' : `#162033` 
                //   }}
                // >
                //   <div className="video-preview">
                //     {getVideoPreview(video)}
                //   </div>
                  
                //   <div className="video-details">
                //     <div className="video-title">
                //       {video.title}
                //       {process.env.NODE_ENV !== 'production' && video._enriched && (
                //         <small style={{ display: 'block', fontSize: '8px', color: '#065f46', backgroundColor: '#d1fae5', padding: '2px 4px', borderRadius: '2px', marginTop: '4px', width: 'fit-content' }}>
                //           Enriched
                //         </small>
                //       )}
                //     </div>
                    
                //     <div className="video-status">
                //       {getStatusDisplay(video.status)}
                //     </div>
                    
                //     <div className="video-meta">
                //       <div className="video-created-row">
                //         <div className="video-created">
                //           Created: {formatDate(video.created_at)}
                //         </div>
                //         {getActionButtons(video)}
                //       </div>
                //     </div>
                //   </div>
                // </div>
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
      
      {Object.entries(uploadStatus).map(([videoId, status]) => (
        status.message && (
          <div 
            key={`status-${videoId}`}
            className={`upload-status-message ${status.status}`}
          >
            {status.message}
            <button 
              onClick={() => setUploadStatus(prev => ({
                ...prev, 
                [videoId]: { ...prev[videoId], message: null }
              }))}
            >
              ×
            </button>
          </div>
        )
      ))}
    </div>
  );
};

export default VideoList;
