import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './VoiceBrowser.css';
import WorkflowStepper from './WorkflowStepper';
import { useNavigation } from '../contexts/NavigationContext';

// Configure axios defaults
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  voicesEndpoint: import.meta.env.VITE_VOICES_ENDPOINT || '/api/voices',
  timeout: 30000,
};

// Local storage keys
const STORAGE_KEYS = {
  VOICES: 'cached_voices',
  TIMESTAMP: 'voices_cache_timestamp',
  CACHE_DURATION: 1000 * 60 * 30, // 30 minutes in milliseconds
};

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
});

const VoiceBrowser = () => {
  // Use the navigation context instead of props
  const { 
    workflowState, 
    steps, 
    selectVoice, 
    goToNextStep, 
    goToPreviousStep,
    navigateToTab
  } = useNavigation();
  
  const { selectedVoice, activeStep } = workflowState;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voices, setVoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [audioPlaying, setAudioPlaying] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  // Helper function to save voices to local storage
  const saveVoicesToLocalStorage = (voicesData) => {
    try {
      localStorage.setItem(STORAGE_KEYS.VOICES, JSON.stringify(voicesData));
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
      console.log('VoiceBrowser: Saved voices to local storage');
    } catch (err) {
      console.warn('VoiceBrowser: Failed to save voices to local storage', err);
    }
  };

  // Helper function to get voices from local storage
  const getVoicesFromLocalStorage = () => {
    try {
      const cachedVoices = localStorage.getItem(STORAGE_KEYS.VOICES);
      const timestamp = localStorage.getItem(STORAGE_KEYS.TIMESTAMP);
      
      if (!cachedVoices || !timestamp) {
        return null;
      }
      
      // Check if cache is still valid (not expired)
      const now = Date.now();
      const cacheTime = parseInt(timestamp, 10);
      
      if (now - cacheTime > STORAGE_KEYS.CACHE_DURATION) {
        console.log('VoiceBrowser: Cache expired, fetching fresh data');
        return null;
      }
      
      return JSON.parse(cachedVoices);
    } catch (err) {
      console.warn('VoiceBrowser: Failed to retrieve voices from local storage', err);
      return null;
    }
  };

  // Extract fetchVoices function so it can be reused
  const fetchVoices = async (skipCache = false) => {
    // Try to get data from local storage first, unless skipCache is true
    if (!skipCache) {
      const cachedVoices = getVoicesFromLocalStorage();
      if (cachedVoices && cachedVoices.length > 0) {
        console.log(`VoiceBrowser: Using ${cachedVoices.length} cached voices from local storage`);
        setVoices(cachedVoices);
        setLoading(false);
        return;
      }
    }
    
    try {
      setLoading(true);
      console.log('VoiceBrowser: Fetching voices from server...', {
        baseURL: API_CONFIG.baseURL,
        endpoint: API_CONFIG.voicesEndpoint
      });
      
      const response = await api.get(API_CONFIG.voicesEndpoint);
      console.log('VoiceBrowser: Response received:', response);
      
      // Extract voices
      const responseData = response.data;
      let extractedVoices = [];
      
      // Handle triple-nested data structure
      if (responseData?.data?.data?.data?.data?.voices && Array.isArray(responseData.data.data.data.data.voices)) {
        extractedVoices = responseData.data.data.data.data.voices;
        console.log(`VoiceBrowser: Successfully loaded ${extractedVoices.length} voices from triple-nested structure`);
      }
      // Handle double-nested data structure
      else if (responseData?.data?.data?.data?.voices && Array.isArray(responseData.data.data.data.voices)) {
        extractedVoices = responseData.data.data.data.voices;
        console.log(`VoiceBrowser: Successfully loaded ${extractedVoices.length} voices from double-nested structure`);
      }
      // Handle single-nested data structure
      else if (responseData?.data?.data?.voices && Array.isArray(responseData.data.data.voices)) {
        extractedVoices = responseData.data.data.voices;
        console.log(`VoiceBrowser: Successfully loaded ${extractedVoices.length} voices from single-nested structure`);
      }
      
      // If no voices found using standard paths, try recursively finding them
      if (extractedVoices.length === 0) {
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
        
        const voicesResult = findArrayInNestedObject(responseData, 'voices');
        if (voicesResult) {
          extractedVoices = voicesResult.data;
          console.log(`VoiceBrowser: Found voices at path: ${voicesResult.path.join('.')}, count: ${extractedVoices.length}`);
        }
      }
      
      // Save to state and local storage
      setVoices(extractedVoices);
      saveVoicesToLocalStorage(extractedVoices);
      
      setDebugInfo({
        responseReceived: true,
        responseStatus: response.status,
        totalVoiceCount: extractedVoices.length,
        dataPath: responseData?.data?.data?.data?.data?.voices ? 'data.data.data.data.voices' : 
                 responseData?.data?.data?.data?.voices ? 'data.data.data.voices' : 
                 responseData?.data?.data?.voices ? 'data.data.voices' : 
                 responseData?.data?.voices ? 'data.voices' : 'unknown',
        apiConfig: {
          baseURL: API_CONFIG.baseURL,
          endpoint: API_CONFIG.voicesEndpoint
        }
      });
      
      setLoading(false);
    } catch (err) {
      console.error('VoiceBrowser: Error fetching voices:', err);
      let errorMessage = 'Failed to fetch voices';
      
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = `API endpoint not found. Please check if ${API_CONFIG.baseURL}${API_CONFIG.voicesEndpoint} is correct.`;
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
      const cachedVoices = getVoicesFromLocalStorage();
      if (cachedVoices && cachedVoices.length > 0) {
        console.log(`VoiceBrowser: Using ${cachedVoices.length} cached voices due to fetch error`);
        setVoices(cachedVoices);
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
          endpoint: API_CONFIG.voicesEndpoint,
          timeout: API_CONFIG.timeout,
          fullUrl: `${API_CONFIG.baseURL}${API_CONFIG.voicesEndpoint}`
        }
      }));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoices();
    
    // Add event listener for storage changes (for multi-tab support)
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEYS.VOICES) {
        try {
          const newVoices = JSON.parse(e.newValue);
          if (newVoices && Array.isArray(newVoices)) {
            setVoices(newVoices);
          }
        } catch (err) {
          console.warn('Error parsing voices from storage event', err);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Function to handle voice selection - now uses context
  const handleVoiceSelect = (voice) => {
    console.log('VoiceBrowser: Voice selected:', voice?.name || voice?.voice_name);
    selectVoice(voice);
  };

  // Check if a voice is the currently selected one
  const isSelected = (voice) => {
    if (!selectedVoice) return false;
    
    // Check both id and voice_id for compatibility
    const voiceId = voice.voice_id || voice.id;
    const selectedId = selectedVoice.voice_id || selectedVoice.id;
    
    return voiceId === selectedId;
  };

  const playAudio = (audioUrl, voiceId) => {
    // Stop any currently playing audio
    if (audioPlaying) {
      audioPlaying.pause();
      audioPlaying.currentTime = 0;
    }
    
    // Remove any existing modal
    const existingBackdrop = document.querySelector('.audio-backdrop');
    if (existingBackdrop) {
      document.body.removeChild(existingBackdrop);
    }
    
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'audio-backdrop';
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
    
    // Create audio player container
    const audioPlayerContainer = document.createElement('div');
    audioPlayerContainer.style.backgroundColor = 'white';
    audioPlayerContainer.style.borderRadius = '12px';
    audioPlayerContainer.style.padding = '2rem';
    audioPlayerContainer.style.maxWidth = '500px';
    audioPlayerContainer.style.width = '90%';
    audioPlayerContainer.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
    
    // Create audio element
    const audioElement = document.createElement('audio');
    audioElement.src = audioUrl;
    audioElement.controls = true;
    audioElement.autoplay = true;
    audioElement.style.width = '100%';
    audioElement.style.marginTop = '1rem';
    
    // Create title for the audio player
    const audioTitle = document.createElement('h3');
    audioTitle.textContent = 'Voice Sample';
    audioTitle.style.margin = '0 0 1rem 0';
    audioTitle.style.fontSize = '1.25rem';
    audioTitle.style.fontWeight = '600';
    audioTitle.style.color = '#1f2937';
    
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
    loadingIndicator.textContent = 'Loading audio...';
    loadingIndicator.style.color = '#6b7280';
    loadingIndicator.style.textAlign = 'center';
    loadingIndicator.style.padding = '1rem';
    
    // Function to close the modal
    const closeModal = () => {
      audioElement.pause();
      document.body.removeChild(modalContainer);
      document.removeEventListener('keydown', handleEscape);
    };
    
    // Close on backdrop click (but not on audio player click)
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
    
    // Handle audio loading events
    audioElement.addEventListener('loadstart', () => {
      audioPlayerContainer.appendChild(loadingIndicator);
    });
    
    audioElement.addEventListener('canplay', () => {
      if (audioPlayerContainer.contains(loadingIndicator)) {
        audioPlayerContainer.removeChild(loadingIndicator);
      }
    });
    
    audioElement.addEventListener('error', () => {
      if (audioPlayerContainer.contains(loadingIndicator)) {
        loadingIndicator.textContent = 'Error loading audio';
      } else {
        const errorMessage = document.createElement('div');
        errorMessage.textContent = 'Error loading audio';
        errorMessage.style.color = '#ef4444';
        errorMessage.style.textAlign = 'center';
        errorMessage.style.padding = '1rem';
        audioPlayerContainer.appendChild(errorMessage);
      }
    });
    
    // Add elements to containers
    audioPlayerContainer.appendChild(audioTitle);
    audioPlayerContainer.appendChild(audioElement);
    
    modalContainer.appendChild(audioPlayerContainer);
    modalContainer.appendChild(closeButton);
    
    // Add modal to body
    document.body.appendChild(modalContainer);
    
    setAudioPlaying(audioElement);
  };

  // Handle stepper navigation - now uses context
  const handleNext = () => {
    console.log('VoiceBrowser: Next button clicked, navigating to next step');
    goToNextStep();
  };
  
  const handleBack = () => {
    console.log('VoiceBrowser: Back button clicked, navigating to previous step');
    goToPreviousStep();
  };
  
  // Step click handler - now uses context
  const handleStepClick = (tabName) => {
    console.log(`VoiceBrowser: Step clicked, navigating to ${tabName}`);
    navigateToTab(tabName);
  };

  const renderContent = () => {
    if (loading) {
      return <div className="loading-message">Loading voices...</div>;
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
                fetchVoices();
              }}
            >
              Retry
            </button>
            <button 
              className="force-refresh-button"
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchVoices(true); // Skip cache
              }}
            >
              Force Refresh
            </button>
          </div>
        </div>
      );
    }

    // Filter voices by search term
    const filteredVoices = voices.filter(voice => {
      if (!searchTerm) return true;
      
      // Use voice_name or name, whichever is available
      const voiceName = (voice.voice_name || voice.name || '').toLowerCase();
      return voiceName.includes(searchTerm.toLowerCase());
    });

    if (filteredVoices.length === 0) {
      return (
        <div className="no-results">
          No voices found. Try a different search term or check your connection.
        </div>
      );
    }

    return (
      <div className="voice-grid">
        {filteredVoices.map((voice, index) => (
          <div 
            key={voice.voice_id || voice.id || `voice-${index}`} 
            className={`voice-card ${isSelected(voice) ? 'selected' : ''}`}
            onClick={() => handleVoiceSelect(voice)}
          >
            <div className="voice-info">
              <h3>{voice.voice_name || voice.name}</h3>
              
              <div className="voice-details">
                {voice.language && (
                  <div className="voice-language">Language: {voice.language}</div>
                )}
                
                {voice.gender && (
                  <div className="voice-gender">Gender: {voice.gender}</div>
                )}
                
                <div className="voice-status">
                  {voice.premium ? (
                    <span className="status-badge premium">Premium</span>
                  ) : (
                    <span className="status-badge free">Free</span>
                  )}
                </div>
                
                {voice.tags && voice.tags.length > 0 && (
                  <div className="voice-tags">
                    {voice.tags.map((tag, index) => (
                      <span key={index} className="tag-badge">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="voice-actions">
              {voice.preview_url && (
                <button 
                  className="play-sample-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering voice selection
                    playAudio(voice.preview_url, voice.id);
                  }}
                >
                  Play Sample
                </button>
              )}
              
              <button 
                className={`select-voice-btn ${isSelected(voice) ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation(); // Avoid duplicate selection
                  handleVoiceSelect(voice);
                }}
              >
                {isSelected(voice) ? 'Selected' : 'Select Voice'}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="voice-browser">
      <div className="voice-browser-header">
        <WorkflowStepper
          steps={steps}
          activeStep={activeStep}
          onNext={handleNext}
          onBack={handleBack}
          onStepClick={handleStepClick}
          currentPage="voices"
          isProcessing={false}
        />
        
        <div className="voice-search-row">
          <div className="voice-search">
            <input
              type="text"
              placeholder="Search voices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            className="refresh-button"
            onClick={() => {
              setLoading(true);
              fetchVoices(true); // Skip cache
            }}
            title="Refresh voices from server"
          >
            Refresh
          </button>
        </div>
        
        {selectedVoice && (
          <div className="current-selection">
            <span>Currently Selected: </span>
            <strong>{selectedVoice.voice_name || selectedVoice.name}</strong>
            <button 
              className="clear-selection"
              onClick={(e) => {
                e.stopPropagation();
                handleVoiceSelect(null);
              }}
            >
              Clear
            </button>
          </div>
        )}
      </div>
      
      <div className="voice-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default VoiceBrowser; 