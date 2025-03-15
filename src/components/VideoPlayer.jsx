import React from 'react';
import './VideoPlayer.css';

/**
 * VideoPlayer component that uses the same approach as AvatarBrowser
 * to ensure consistent audio playback across the application.
 */
const VideoPlayer = ({ videoUrl, thumbnailUrl, title }) => {
  // Play video in a modal with audio enabled
  const playVideo = (videoUrl) => {
    if (!videoUrl) {
      console.error('VideoPlayer: No video URL provided');
      return;
    }
    
    console.log('VideoPlayer: Playing video from URL:', videoUrl);
    
    // Remove any existing modal
    const existingBackdrop = document.querySelector('.video-backdrop');
    if (existingBackdrop) {
      document.body.removeChild(existingBackdrop);
    }
    
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'video-backdrop';
    modalContainer.style.position = 'fixed';
    modalContainer.style.top = '0';
    modalContainer.style.left = '0';
    modalContainer.style.width = '100%';
    modalContainer.style.height = '100%';
    modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    modalContainer.style.zIndex = '999';
    modalContainer.style.display = 'flex';
    modalContainer.style.justifyContent = 'center';
    modalContainer.style.alignItems = 'center';
    
    // Create video element
    const videoElement = document.createElement('video');
    videoElement.src = videoUrl;
    videoElement.controls = true;
    videoElement.autoplay = true;
    videoElement.style.maxWidth = '80%';
    videoElement.style.maxHeight = '80vh';
    videoElement.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
    videoElement.style.borderRadius = '8px';
    videoElement.style.backgroundColor = '#000';
    
    // Add title if provided
    // if (title) {
    //   const titleDiv = document.createElement('div');
    //   titleDiv.textContent = title;
    //   titleDiv.style.position = 'absolute';
    //   titleDiv.style.top = '20px';
    //   titleDiv.style.left = '50%';
    //   titleDiv.style.transform = 'translateX(-50%)';
    //   titleDiv.style.color = 'white';
    //   titleDiv.style.padding = '10px 20px';
    //   titleDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    //   titleDiv.style.borderRadius = '4px';
    //   titleDiv.style.fontSize = '16px';
    //   modalContainer.appendChild(titleDiv);
    // }
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '20px';
    closeButton.style.right = '20px';
    closeButton.style.backgroundColor = 'white';
    closeButton.style.color = 'black';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '50%';
    closeButton.style.width = '40px';
    closeButton.style.height = '40px';
    closeButton.style.fontSize = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.display = 'flex';
    closeButton.style.justifyContent = 'center';
    closeButton.style.alignItems = 'center';
    closeButton.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    closeButton.style.transition = 'transform 0.2s';
    
    // Hover effect
    closeButton.onmouseover = () => {
      closeButton.style.transform = 'scale(1.1)';
    };
    closeButton.onmouseout = () => {
      closeButton.style.transform = 'scale(1)';
    };
    
    // Add loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.textContent = 'Loading...';
    loadingIndicator.style.color = 'white';
    loadingIndicator.style.position = 'absolute';
    loadingIndicator.style.top = '50%';
    loadingIndicator.style.left = '50%';
    loadingIndicator.style.transform = 'translate(-50%, -50%)';
    loadingIndicator.style.padding = '10px 20px';
    loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    loadingIndicator.style.borderRadius = '4px';
    
    // Function to close the modal
    const closeModal = () => {
      videoElement.pause();
      document.body.removeChild(modalContainer);
      document.removeEventListener('keydown', handleEscape);
    };
    
    // Close on backdrop click (but not on video click)
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) {
        closeModal();
      }
    });
    
    // Close on button click
    closeButton.addEventListener('click', closeModal);
    
    // Close when escape key is pressed
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    // Handle video loading events
    videoElement.addEventListener('loadstart', () => {
      modalContainer.appendChild(loadingIndicator);
    });
    
    videoElement.addEventListener('canplay', () => {
      if (modalContainer.contains(loadingIndicator)) {
        modalContainer.removeChild(loadingIndicator);
      }
    });
    
    videoElement.addEventListener('error', (e) => {
      console.error('VideoPlayer: Error loading video:', e);
      loadingIndicator.textContent = 'Error loading video';
    });
    
    // Add debugging for audio
    videoElement.addEventListener('volumechange', () => {
      console.log('VideoPlayer: Volume changed to', videoElement.volume, 'Muted:', videoElement.muted);
    });
    
    // Add elements to modal
    modalContainer.appendChild(videoElement);
    modalContainer.appendChild(closeButton);
    
    // Add modal to body
    document.body.appendChild(modalContainer);
    
    // Return the video element for possible later use
    return videoElement;
  };

  return (
    <div className="video-player-container">
      {/* Thumbnail with play button overlay */}
      <div 
        className="video-thumbnail" 
        onClick={() => playVideo(videoUrl)}
        style={{
          backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : 'none',
          backgroundColor: thumbnailUrl ? 'transparent' : '#000',
          cursor: 'pointer',
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%', // 16:9 aspect ratio
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {!thumbnailUrl && title && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            color: 'white',
            textAlign: 'center',
            padding: '10px',
            width: '80%'
          }}>
            {title}
          </div>
        )}
        
        {/* Play button overlay */}
        <div 
          className="play-button"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s, background-color 0.2s'
          }}
        >
          <div 
            style={{
              width: '0',
              height: '0',
              borderTop: '15px solid transparent',
              borderBottom: '15px solid transparent',
              borderLeft: '20px solid white',
              marginLeft: '5px' // Offset slightly to center the triangle visually
            }}
          />
        </div>
      </div>
      
      {/* Optional title below thumbnail */}
      {/* {title && (
        <div className="video-title" style={{ marginTop: '8px', fontWeight: 'bold' }}>
          {title}
        </div>
      )} */}
    </div>
  );
};

export default VideoPlayer; 