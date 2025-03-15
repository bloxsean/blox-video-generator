import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AvatarBrowser.css';
import WorkflowStepper from './WorkflowStepper';
import { useNavigation } from '../contexts/NavigationContext';

// Configure axios defaults
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  avatarsEndpoint: import.meta.env.VITE_AVATARS_ENDPOINT || '/api/avatars',
  timeout: 30000,
};

// Local storage keys
const STORAGE_KEYS = {
  AVATARS: 'cached_video_avatars',
  TIMESTAMP: 'avatars_cache_timestamp',
  CACHE_DURATION: 1000 * 60 * 30, // 30 minutes in milliseconds
};

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
});

// Helper function to format avatar types for display
const formatAvatarType = (type) => {
  // Handle undefined or null values
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
      // Convert snake_case to Title Case
      return type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  }
};

const AvatarBrowser = () => {
  // Use navigation context for state and navigation
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
  const [debugInfo, setDebugInfo] = useState({});
  const [filters, setFilters] = useState({
    category: '',
    style: '',
    gender: ''
  });

  // Helper function to save avatars to local storage
  const saveAvatarsToLocalStorage = (avatarsData) => {
    try {
      localStorage.setItem(STORAGE_KEYS.AVATARS, JSON.stringify(avatarsData));
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
      console.log('AvatarBrowser: Saved avatars to local storage');
    } catch (err) {
      console.warn('AvatarBrowser: Failed to save avatars to local storage', err);
    }
  };

  // Helper function to get avatars from local storage
  const getAvatarsFromLocalStorage = () => {
    try {
      const cachedAvatars = localStorage.getItem(STORAGE_KEYS.AVATARS);
      const timestamp = localStorage.getItem(STORAGE_KEYS.TIMESTAMP);
      
      if (!cachedAvatars || !timestamp) {
        return null;
      }
      
      // Check if cache is still valid (not expired)
      const now = Date.now();
      const cacheTime = parseInt(timestamp, 10);
      
      if (now - cacheTime > STORAGE_KEYS.CACHE_DURATION) {
        console.log('AvatarBrowser: Cache expired, fetching fresh data');
        return null;
      }
      
      return JSON.parse(cachedAvatars);
    } catch (err) {
      console.warn('AvatarBrowser: Failed to retrieve avatars from local storage', err);
      return null;
    }
  };

  // Extract fetchAvatars function so it can be reused
  const fetchAvatars = async (skipCache = false) => {
    // Try to get data from local storage first, unless skipCache is true
    if (!skipCache) {
      const cachedAvatars = getAvatarsFromLocalStorage();
      if (cachedAvatars && cachedAvatars.length > 0) {
        console.log(`AvatarBrowser: Using ${cachedAvatars.length} cached avatars from local storage`);
        setAvatars(cachedAvatars);
        setLoading(false);
        return;
      }
    }
    
    try {
      setLoading(true);
      console.log('AvatarBrowser: Fetching avatars from server...', {
        baseURL: API_CONFIG.baseURL,
        endpoint: API_CONFIG.avatarsEndpoint
      });
      
      const response = await api.get(API_CONFIG.avatarsEndpoint);
      console.log('AvatarBrowser: Response received:', response);
      
      // Extract avatars and talking photos
      const responseData = response.data;
      let extractedAvatars = [];
      
      // Handle triple-nested data structure
      if (responseData?.data?.data?.data?.data?.data?.avatars && Array.isArray(responseData.data.data.data.data.data.avatars)) {
        extractedAvatars = responseData.data.data.data.data.data.avatars;
        console.log(`AvatarBrowser: Successfully loaded ${extractedAvatars.length} avatars from triple-nested structure`);
      }
      // Handle double-nested data structure
      else if (responseData?.data?.data?.data?.avatars && Array.isArray(responseData.data.data.data.avatars)) {
        extractedAvatars = responseData.data.data.data.avatars;
        console.log(`AvatarBrowser: Successfully loaded ${extractedAvatars.length} avatars from double-nested structure`);
      }
      // Handle single-nested data structure
      else if (responseData?.data?.data?.avatars && Array.isArray(responseData.data.data.avatars)) {
        extractedAvatars = responseData.data.data.avatars;
        console.log(`AvatarBrowser: Successfully loaded ${extractedAvatars.length} avatars from single-nested structure`);
      }
      
      // If no avatars found using standard paths, try recursively finding them
      if (extractedAvatars.length === 0) {
        const findArrayInNestedObject = (obj, arrayName, path = []) => {
          if (!obj || typeof obj !== 'object') return null;
          
          if (Array.isArray(obj[arrayName])) {
            return { path: [...path, arrayName], data: obj[arrayName] };
          }
          
          for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object') {
              const result = findArrayInNestedObject(value, arrayName, [...path, key]);
              if (result) return result;
            }
          }
          return null;
        };
        
        const avatarsResult = findArrayInNestedObject(responseData, 'avatars');
        if (avatarsResult) {
          extractedAvatars = avatarsResult.data;
          console.log(`AvatarBrowser: Found avatars at path: ${avatarsResult.path.join('.')}, count: ${extractedAvatars.length}`);
        }
      }
      
      // Filter avatars to only include those with preview_video_url
      const videoAvatars = extractedAvatars.filter(avatar => avatar.preview_video_url);
      
      // Save to state and local storage
      setAvatars(videoAvatars);
      saveAvatarsToLocalStorage(videoAvatars);
      
      setDebugInfo({
        responseReceived: true,
        responseStatus: response.status,
        totalAvatarCount: extractedAvatars.length,
        videoAvatarCount: videoAvatars.length,
        dataPath: responseData?.data?.data?.data?.data?.avatars ? 'data.data.data.data.avatars' : 
                 responseData?.data?.data?.data?.avatars ? 'data.data.data.avatars' : 
                 responseData?.data?.data?.avatars ? 'data.data.avatars' : 
                 responseData?.data?.avatars ? 'data.avatars' : 'unknown',
        apiConfig: {
          baseURL: API_CONFIG.baseURL,
          endpoint: API_CONFIG.avatarsEndpoint
        }
      });
      
      setLoading(false);
    } catch (err) {
      console.error('AvatarBrowser: Error fetching avatars:', err);
      let errorMessage = 'Failed to fetch avatars';
      
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = `API endpoint not found. Please check if ${API_CONFIG.baseURL}${API_CONFIG.avatarsEndpoint} is correct.`;
        } else {
          errorMessage = `Server error: ${err.response.status} - ${err.message}`;
        }
      } else if (err.request) {
        if (err.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. The server is taking too long to respond. Please try again later.';
        } else {
          errorMessage = 'No response received from server. Please check if the server is running.';
        }
      }
      
      // Try to use cached data if available when there's an error
      const cachedAvatars = getAvatarsFromLocalStorage();
      if (cachedAvatars && cachedAvatars.length > 0) {
        console.log(`AvatarBrowser: Using ${cachedAvatars.length} cached avatars due to fetch error`);
        setAvatars(cachedAvatars);
        setError(`${errorMessage} (Using cached data)`);
      } else {
        setError(errorMessage);
      }
      
      setDebugInfo(prev => ({
        ...prev,
        error: errorMessage,
        errorCode: err.code,
        errorStack: err.stack,
        errorResponse: err.response?.data,
        requestConfig: {
          baseURL: API_CONFIG.baseURL,
          endpoint: API_CONFIG.avatarsEndpoint,
          timeout: API_CONFIG.timeout,
          fullUrl: `${API_CONFIG.baseURL}${API_CONFIG.avatarsEndpoint}`
        }
      }));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvatars();
    
    // Add event listener for storage changes (for multi-tab support)
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
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Handle avatar selection
  const handleAvatarSelect = (avatar) => {
    console.log('AvatarBrowser: Avatar selected:', avatar?.name);
    selectAvatar(avatar);
  };

  // Update filters
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: '',
      style: '',
      gender: ''
    });
  };

  // Apply filters to avatars
  const filteredAvatars = avatars.filter(avatar => {
    const categoryMatch = !filters.category || avatar.category === filters.category;
    const styleMatch = !filters.style || avatar.style === filters.style;
    const genderMatch = !filters.gender || avatar.gender === filters.gender;
    
    return categoryMatch && styleMatch && genderMatch;
  });

  // Handle stepper navigation
  const handleNext = () => {
    console.log('AvatarBrowser: Next button clicked, navigating to next step');
    goToNextStep();
  };
  
  const handleBack = () => {
    console.log('AvatarBrowser: Back button clicked, navigating to previous step');
    goToPreviousStep();
  };
  
  const handleStepClick = (tabName) => {
    console.log(`AvatarBrowser: Step clicked, navigating to ${tabName}`);
    navigateToTab(tabName);
  };

  // Check if an avatar is selected
  const isSelected = (avatar) => {
    if (!selectedAvatar) return false;
    return avatar.id === selectedAvatar.id;
  };

  const playPreview = (previewUrl, avatarId) => {
    // Stop any currently playing video
    if (videoPlaying) {
      videoPlaying.pause();
      videoPlaying.currentTime = 0;
      videoPlaying.classList.remove('active');
    }
    
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
    videoElement.src = previewUrl;
    videoElement.controls = true;
    videoElement.autoplay = true;
    videoElement.style.maxWidth = '80%';
    videoElement.style.maxHeight = '80vh';
    videoElement.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
    videoElement.style.borderRadius = '8px';
    videoElement.style.backgroundColor = '#000';
    
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
    
    videoElement.addEventListener('error', () => {
      loadingIndicator.textContent = 'Error loading video';
    });
    
    // Add elements to modal
    modalContainer.appendChild(videoElement);
    modalContainer.appendChild(closeButton);
    
    // Add modal to body
    document.body.appendChild(modalContainer);
    
    setVideoPlaying(videoElement);
  };

  // Add debug output for the steps array
  useEffect(() => {
    console.log("AvatarBrowser: Steps array:", JSON.stringify(steps, null, 2));
    console.log("AvatarBrowser: Current activeStep:", activeStep);
    console.log("AvatarBrowser: Next step tabName:", activeStep < steps.length - 1 ? steps[activeStep + 1].tabName : "none");
  }, [activeStep, steps]);

  const renderContent = () => {
    if (loading) {
      return <div className="loading-message">Loading video avatars...</div>;
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
                fetchAvatars(true); // Skip cache
              }}
            >
              Force Refresh
            </button>
          </div>
        </div>
      );
    }

    // Filter avatars by search term
    const filteredAvatars = avatars.filter(avatar => {
      if (!searchTerm) return true;
      
      // Use avatar_name or name, whichever is available
      const avatarName = (avatar.avatar_name || avatar.name || '').toLowerCase();
      return avatarName.includes(searchTerm.toLowerCase());
    });

    if (filteredAvatars.length === 0) {
      return (
        <div className="no-results">
          No video avatars found. Try a different search term or check your connection.
        </div>
      );
    }

    return (
      <div className="avatar-grid">
        {filteredAvatars.map((avatar, index) => (
          <div 
            key={avatar.avatar_id || avatar.id || `avatar-${index}`} 
            className={`avatar-card ${isSelected(avatar) ? 'selected' : ''}`}
            onClick={() => handleAvatarSelect(avatar)}
          >
            <div className="avatar-image">
              {avatar.preview_image_url ? (
                <img 
                  src={avatar.preview_image_url} 
                  alt={avatar.name} 
                  loading="lazy" 
                />
              ) : (
                <div className="no-image">No preview available</div>
              )}
              
              {avatar.is_premium && (
                <span className="premium-badge">Premium</span>
              )}
              
              {avatar.preview_video_url && (
                <button 
                  className="play-preview-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering avatar selection
                    playPreview(avatar.preview_video_url, avatar.id);
                  }}
                >
                  <span>▶</span>
                </button>
              )}
            </div>
            
            <div className="avatar-details">
              <h3>{avatar.avatar_name}</h3>
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
                e.stopPropagation(); // Avoid duplicate selection
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
        
        <div className="avatar-search-row">
          <div className="avatar-search">
            <input
              type="text"
              placeholder="Search video avatars..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            className="refresh-button"
            onClick={() => {
              setLoading(true);
              fetchAvatars(true); // Skip cache
            }}
            title="Refresh avatars from server"
          >
            Refresh
          </button>
        </div>
        
        {selectedAvatar && (
          <div className="current-selection">
            <span>Currently Selected: </span>
            <strong>{selectedAvatar.avatar_name || selectedAvatar.name}</strong>
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
        )}
      </div>
      
      <div className="avatar-browser-controls">
        <div className="avatar-filters">
          <div className="filter-group">
            <label>Category:</label>
            <select 
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="business">Business</option>
              <option value="education">Education</option>
              <option value="tech">Technology</option>
              <option value="healthcare">Healthcare</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Style:</label>
            <select 
              value={filters.style}
              onChange={(e) => handleFilterChange('style', e.target.value)}
            >
              <option value="">All Styles</option>
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Gender:</label>
            <select 
              value={filters.gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
            >
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          
          <button 
            className="clear-filters-btn"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
        
        {selectedAvatar && (
          <div className="selected-avatar-info">
            <span>Selected: </span>
            <strong>{selectedAvatar.name}</strong>
            <button 
              className="clear-selection-btn"
              onClick={() => handleAvatarSelect(null)}
            >
              Clear
            </button>
          </div>
        )}
      </div>
      
      <div className="avatar-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default AvatarBrowser; 