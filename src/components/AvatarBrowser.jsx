import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AvatarBrowser.css';
import WorkflowStepper from './WorkflowStepper';
import { useNavigation } from '../contexts/NavigationContext';
import { LinearProgress } from '@mui/material';

const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  avatarsEndpoint: import.meta.env.VITE_AVATARS_ENDPOINT || '/api/avatars',
  timeout: 60000,
  retries: 2,
};

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
});

const STORAGE_KEYS = {
  AVATARS: 'cached_video_avatars',
  TIMESTAMP: 'voices_cache_timestamp',
  CACHE_DURATION: 1000 * 60 * 30,
};

const formatAvatarType = (type) => {
  if (!type) {
    return 'Unknown Type';
  }
  
  switch (type) {
    case 'photo_realistic':
      return 'Photo Realistic';
    case 'animated':
      return 'Animated';
    case 'talking_photo':
      return 'Talking Photo';
    case 'video':
      return 'Video Avatar';
    default:
      return type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  }
};

const formatAvatarName = (avatarId) => {
  if (!avatarId) return 'Unknown Avatar';
  
  // Remove any timestamp or suffix after the last underscore
  const nameParts = avatarId.split('_');
  
  // If it's a format like "Abigail_expressive_2024112501"
  if (nameParts.length > 1) {
    // Check if the last part is numeric/timestamp
    const lastPart = nameParts[nameParts.length - 1];
    if (/^\d+$/.test(lastPart)) {
      // Remove the timestamp part
      nameParts.pop();
    }
    
    // Join the remaining parts and replace underscores with spaces
    return nameParts.join(' ').replace(/_/g, ' ');
  }
  
  // If simple ID, just return it with underscores replaced by spaces
  return avatarId.replace(/_/g, ' ');
};

const AvatarBrowser = () => {
  const {
    workflowState,
    steps,
    selectAvatar,
    goToNextStep,
    goToPreviousStep,
    navigateToTab
  } = useNavigation();
  
  const { selectedAvatar, activeStep } = workflowState;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avatars, setAvatars] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [videoPlaying, setVideoPlaying] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    style: '',
    gender: ''
  });

  const saveAvatarsToLocalStorage = (avatarsData) => {
    try {
      localStorage.setItem(STORAGE_KEYS.AVATARS, JSON.stringify(avatarsData));
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
    } catch (err) {
      console.warn('Failed to save avatars to local storage', err);
    }
  };

  const getAvatarsFromLocalStorage = () => {
    try {
      const cachedAvatars = localStorage.getItem(STORAGE_KEYS.AVATARS);
      const timestamp = localStorage.getItem(STORAGE_KEYS.TIMESTAMP);
      
      if (!cachedAvatars || !timestamp) return null;
      
      const now = Date.now();
      const cacheTime = parseInt(timestamp, 10);
      
      if (now - cacheTime > STORAGE_KEYS.CACHE_DURATION) return null;
      
      return JSON.parse(cachedAvatars);
    } catch (err) {
      console.warn('Failed to retrieve avatars from local storage', err);
      return null;
    }
  };

  const fetchAvatars = async (skipCache = false) => {
    if (!skipCache) {
      const cachedAvatars = getAvatarsFromLocalStorage();
      if (cachedAvatars && cachedAvatars.length > 0) {
        setAvatars(cachedAvatars);
        setLoading(false);
        return;
      }
    }
    
    try {
      setLoading(true);
      const response = await api.get(API_CONFIG.avatarsEndpoint);
      
      if (response.data?.data?.avatars) {
        const avatarsData = response.data.data.avatars;
        setAvatars(avatarsData);
        saveAvatarsToLocalStorage(avatarsData);
        setError(null);
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (err) {
      console.error('Error fetching avatars:', err);
      let errorMessage = 'Failed to fetch avatars';
      
      if (err.response) {
        errorMessage = err.response.status === 404 
          ? `API endpoint not found. Please check if ${API_CONFIG.baseURL}${API_CONFIG.avatarsEndpoint} is correct.`
          : `Server error: ${err.response.status} - ${err.message}`;
      } else if (err.request) {
        errorMessage = err.code === 'ECONNABORTED'
          ? 'Request timed out. The server is taking too long to respond.'
          : 'No response received from server. Please check if the server is running.';
      }
      
      const cachedAvatars = getAvatarsFromLocalStorage();
      if (cachedAvatars && cachedAvatars.length > 0) {
        setAvatars(cachedAvatars);
        setError(`${errorMessage} (Using cached data)`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvatars();
    
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEYS.AVATARS) {
        try {
          const newAvatars = JSON.parse(e.newValue);
          if (newAvatars && Array.isArray(newAvatars)) {
            setAvatars(newAvatars);
          }
        } catch (err) {
          console.warn('Error parsing avatars from storage event', err);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleAvatarSelect = (avatar) => {
    // Ensure avatar_name is included if it exists in the original data
    const completeAvatar = {
      ...avatar,
      avatar_name: avatar.avatar_name || formatAvatarName(avatar.avatar_id)
    };
    
    selectAvatar(completeAvatar);
  };

  const isSelected = (avatar) => {
    if (!selectedAvatar) return false;
    return avatar.avatar_id === selectedAvatar.avatar_id;
  };

  const playVideo = (previewUrl, avatarId) => {
    if (videoPlaying) {
      videoPlaying.pause();
      videoPlaying.currentTime = 0;
    }
    
    const existingBackdrop = document.querySelector('.video-backdrop');
    if (existingBackdrop) {
      document.body.removeChild(existingBackdrop);
    }
    
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
    
    const videoElement = document.createElement('video');
    videoElement.src = previewUrl;
    videoElement.controls = true;
    videoElement.autoplay = true;
    videoElement.style.maxWidth = '80%';
    videoElement.style.maxHeight = '80vh';
    videoElement.style.borderRadius = '8px';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '20px';
    closeButton.style.right = '20px';
    closeButton.style.backgroundColor = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '50%';
    closeButton.style.width = '40px';
    closeButton.style.height = '40px';
    closeButton.style.fontSize = '24px';
    closeButton.style.cursor = 'pointer';
    
    const closeModal = () => {
      videoElement.pause();
      document.body.removeChild(modalContainer);
    };
    
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) closeModal();
    });
    
    closeButton.addEventListener('click', closeModal);
    
    modalContainer.appendChild(videoElement);
    modalContainer.appendChild(closeButton);
    document.body.appendChild(modalContainer);
    
    setVideoPlaying(videoElement);
  };

  const handleNext = () => {
    goToNextStep();
  };
  
  const handleBack = () => {
    goToPreviousStep();
  };
  
  const handleStepClick = (tabName) => {
    navigateToTab(tabName);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-message">
          <div>Loading avatars...</div>
          <LinearProgress 
            sx={{ 
              width: '100%', 
              maxWidth: '300px', 
              marginTop: '1rem',
              backgroundColor: 'rgba(56, 189, 248, 0.2)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#38bdf8'
              }
            }} 
          />
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-message">
          <div className="error-text">Error: {error}</div>
          <div className="error-actions">
            <button 
              className="retry-button"
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchAvatars();
              }}
            >
              Retry
            </button>
            <button 
              className="force-refresh-button"
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchAvatars(true);
              }}
            >
              Force Refresh
            </button>
          </div>
        </div>
      );
    }

    const filteredAvatars = avatars.filter(avatar => {
      if (!searchTerm) return true;
      return avatar.avatar_name?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (filteredAvatars.length === 0) {
      return (
        <div className="no-results">
          No avatars found. Try a different search term or check your connection.
        </div>
      );
    }

    return (
      <div className="avatar-grid">
        {filteredAvatars.map((avatar, index) => (
          <div 
            key={avatar.avatar_id || `avatar-${index}`}
            className={`avatar-card ${isSelected(avatar) ? 'selected' : ''}`}
            onClick={() => handleAvatarSelect(avatar)}
          >
            <div className="avatar-image">
              {avatar.preview_image_url ? (
                <img 
                  src={avatar.preview_image_url} 
                  alt={avatar.avatar_name} 
                  loading="lazy" 
                />
              ) : (
                <div className="no-image">No preview available</div>
              )}
              
              {avatar.premium && (
                <span className="premium-badge">Premium</span>
              )}
              
              {avatar.preview_video_url && (
                <button 
                  className="play-preview-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    playVideo(avatar.preview_video_url, avatar.avatar_id);
                  }}
                >
                  <span>▶</span>
                </button>
              )}
            </div>
            
            <div className="avatar-details">
              <h3>{avatar.avatar_name || formatAvatarName(avatar.avatar_id)}</h3>
              {avatar.type && (
                <div className="avatar-type">{formatAvatarType(avatar.type)}</div>
              )}
              <div className="avatar-status">
                {avatar.premium ? (
                  <span className="status-badge premium">Premium</span>
                ) : (
                  <span className="status-badge free">Free</span>
                )}
              </div>
              {avatar.tags && avatar.tags.length > 0 && (
                <div className="avatar-tags">
                  {avatar.tags.map((tag, index) => (
                    <span key={index} className="tag-badge">{tag}</span>
                  ))}
                </div>
              )}
            </div>
            
            <button 
              className={`select-avatar-btn ${isSelected(avatar) ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleAvatarSelect(avatar);
              }}
            >
              {isSelected(avatar) ? 'Selected' : 'Select Avatar'}
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="avatar-browser">
      <div className="avatar-browser-header">
        <WorkflowStepper
          steps={steps}
          activeStep={activeStep}
          onNext={handleNext}
          onBack={handleBack}
          onStepClick={handleStepClick}
          currentPage="avatars"
          isProcessing={false}
        />
        
        <div className="avatar-filters">
          <div className="avatar-search">
            <input
              type="text"
              placeholder="Search avatars..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-actions">
            <button 
              className="refresh-button"
              onClick={() => {
                setLoading(true);
                fetchAvatars(true);
              }}
              title="Refresh avatars from server"
            >
              Refresh
            </button>
          </div>
        </div>
        
        {/* {selectedAvatar && (
          <div className="current-selection">
            <span>Currently Selected: </span>
            <strong>{selectedAvatar.avatar_name}</strong>
            <button 
              className="clear-selection"
              onClick={(e) => {
                e.stopPropagation();
                handleAvatarSelect(null);
              }}
            >
              Clear
            </button>
          </div>
        )} */}
      </div>
      
      <div className="avatar-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default AvatarBrowser;