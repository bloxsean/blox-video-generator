import React, { useState, useRef, useEffect } from 'react';
import './VideoPlayback.css'; // We'll create this CSS file next

/**
 * VideoPlayback component provides a reusable video player with advanced controls
 * and fallback mechanisms for the video list.
 */
const VideoPlayback = ({ 
  videoUrl, 
  thumbnailUrl, 
  title,
  autoplay = false,
  loop = true,
  controls = false,
  muted = true,
  onPlay = () => {},
  onPause = () => {},
  onError = () => {},
  rawVideo = null
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef(null);
  
  // Initialize video based on autoplay prop
  useEffect(() => {
    if (videoRef.current) {
      if (autoplay) {
        playVideo();
      }
    }
  }, [autoplay, videoUrl]);
  
  // Clean up video on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, []);
  
  // Log received props for debugging - more detailed
  useEffect(() => {
    console.log('VideoPlayback detailed props:', {
      videoUrl: {
        value: videoUrl || 'NULL/UNDEFINED',
        type: videoUrl ? typeof videoUrl : 'N/A',
        isEmpty: videoUrl === '',
        isNull: videoUrl === null,
        isUndefined: videoUrl === undefined
      },
      thumbnailUrl: {
        value: thumbnailUrl || 'NULL/UNDEFINED',
        type: thumbnailUrl ? typeof thumbnailUrl : 'N/A',
        isEmpty: thumbnailUrl === '',
        isNull: thumbnailUrl === null,
        isUndefined: thumbnailUrl === undefined
      },
      title: title,
      rawVideoProvided: !!rawVideo
    });
    
    // Check if we have direct access to the HeyGen API response
    if (rawVideo) {
      console.log('Raw HeyGen API response:', {
        'video_id': rawVideo.video_id,
        'status': rawVideo.status,
        'thumbnail_url': rawVideo.thumbnail_url,
        'proxied_video_url': rawVideo.proxied_video_url,
        // Add any other fields you expect from HeyGen
      });
    }
  }, [videoUrl, thumbnailUrl, title, rawVideo]);
  
  const playVideo = () => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          onPlay();
        })
        .catch(error => {
          console.error('Error playing video:', error);
          setIsPlaying(false);
          onError(error);
        });
    }
  };
  
  const pauseVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      onPause();
    }
  };
  
  const togglePlayback = () => {
    if (isPlaying) {
      pauseVideo();
    } else {
      playVideo();
    }
  };
  
  const handleVideoLoaded = () => {
    setIsLoaded(true);
    if (autoplay) {
      playVideo();
    }
  };
  
  const handleError = (error) => {
    console.error('Video error:', error);
    setHasError(true);
    setIsLoaded(false);
    onError(error);
  };
  
  // Display a placeholder if there's an error or no video URL
  if (!videoUrl || hasError) {
    console.log('VideoPlayback fallback mode:', {
      reason: !videoUrl ? 'No video URL provided' : 'Error loading video',
      thumbnailUrl: thumbnailUrl || 'NO THUMBNAIL'
    });
    
    return (
      <div className="video-placeholder">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={title || "Video thumbnail"} 
            className="video-thumbnail" 
            onError={() => console.error('Failed to load thumbnail image')}
          />
        ) : (
          <div className="video-fallback">
            <div className="video-fallback-icon">📹</div>
            <div className="video-fallback-text">
              {hasError ? "Error loading video" : "No video available"}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div 
      className="video-component"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {!isLoaded && (
        <div className="video-loading">
          <div className="loading-spinner"></div>
        </div>
      )}
      
      <video
        ref={videoRef}
        className={`video-element ${isLoaded ? 'loaded' : 'loading'}`}
        src={videoUrl}
        poster={thumbnailUrl}
        preload="metadata"
        playsInline
        loop={loop}
        muted={muted}
        controls={controls}
        onLoadedData={handleVideoLoaded}
        onError={handleError}
        onClick={togglePlayback}
      />
      
      {!controls && (
        <div className={`video-custom-controls ${showControls || isPlaying ? 'visible' : ''}`}>
          <button 
            className="video-control-button"
            onClick={togglePlayback}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 4H6V20H10V4Z" fill="white"/>
                <path d="M18 4H14V20H18V4Z" fill="white"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5V19L19 12L8 5Z" fill="white"/>
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoPlayback; 