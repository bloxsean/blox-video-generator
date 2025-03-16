import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './VoiceBrowser.css';
import WorkflowStepper from './WorkflowStepper';
import { useNavigation } from '../contexts/NavigationContext';
import { FiPlay, FiPause, FiX } from 'react-icons/fi';
import { LinearProgress } from '@mui/material';

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
  headers: {
    'Accept': 'application/json'
  }
});

const VoiceBrowser = () => {
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
  const [playingVoice, setPlayingVoice] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [currentVoiceInfo, setCurrentVoiceInfo] = useState(null);

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
      console.log('VoiceBrowser: Fetching voices from server...');
      
      const response = await api.get(API_CONFIG.voicesEndpoint);
      console.log('VoiceBrowser: Raw API response:', response.data);
      
      if (response.data?.data?.voices) {
        const voicesData = response.data.data.voices;
        setVoices(voicesData);
        saveVoicesToLocalStorage(voicesData);
        setError(null);
      } else {
        throw new Error('Invalid response format from API');
      }
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
          errorMessage = 'Request timed out. The server is taking too long to respond.';
        } else {
          errorMessage = 'No response received from server. Please check if the server is running.';
        }
      }
      
      const cachedVoices = getVoicesFromLocalStorage();
      if (cachedVoices && cachedVoices.length > 0) {
        setVoices(cachedVoices);
        setError(`${errorMessage} (Using cached data)`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoices();
    
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
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, []);

  // Function to handle voice selection
  const handleVoiceSelect = (voice) => {
    console.log('VoiceBrowser: Voice selected:', voice?.name || voice?.voice_name);
    selectVoice(voice);
  };

  // Check if a voice is the currently selected one
  const isSelected = (voice) => {
    if (!selectedVoice) return false;
    
    const voiceId = voice.voice_id || voice.id;
    const selectedId = selectedVoice.voice_id || selectedVoice.id;
    
    return voiceId === selectedId;
  };

  // Function to play voice sample
  const playVoiceSample = (voice) => {
    if (!voice.preview_url) {
      console.warn('No preview URL available for voice:', voice.name);
      return;
    }

    setCurrentVoiceInfo(voice);
    setShowAudioPlayer(true);

    // Create new audio element
    const audio = new Audio(voice.preview_url);
    
    audio.addEventListener('play', () => setPlayingVoice(voice.voice_id));
    audio.addEventListener('pause', () => setPlayingVoice(null));
    audio.addEventListener('ended', () => setPlayingVoice(null));
    
    // Store the audio element
    setAudioElement(audio);
    
    // Play the audio
    audio.play().catch(err => {
      console.error('Error playing audio:', err);
    });
  };

  // Function to stop voice sample
  const stopVoiceSample = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    setPlayingVoice(null);
    setShowAudioPlayer(false);
    setCurrentVoiceInfo(null);
  };

  // Handle stepper navigation
  const handleNext = () => {
    console.log('VoiceBrowser: Next button clicked');
    goToNextStep();
  };
  
  const handleBack = () => {
    console.log('VoiceBrowser: Back button clicked');
    goToPreviousStep();
  };
  
  const handleStepClick = (tabName) => {
    console.log(`VoiceBrowser: Step clicked, navigating to ${tabName}`);
    navigateToTab(tabName);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-message">
          <div>Loading voices...</div>
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
                fetchVoices(true);
              }}
            >
              Force Refresh
            </button>
          </div>
        </div>
      );
    }

    const filteredVoices = voices.filter(voice => {
      if (!searchTerm) return true;
      
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
                  className={`play-sample-btn ${playingVoice === voice.voice_id ? 'playing' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (playingVoice === voice.voice_id) {
                      stopVoiceSample();
                    } else {
                      playVoiceSample(voice);
                    }
                  }}
                >
                  {playingVoice === voice.voice_id ? (
                    <>
                      <FiPause />
                      Stop Preview
                    </>
                  ) : (
                    <>
                      <FiPlay />
                      Play Preview
                    </>
                  )}
                </button>
              )}
              
              <button 
                className={`select-voice-btn ${isSelected(voice) ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
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
              fetchVoices(true);
            }}
            title="Refresh voices from server"
          >
            Refresh
          </button>
        </div>
        
        {/* {selectedVoice && (
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
        )} */}
      </div>
      
      <div className="voice-content">
        {renderContent()}
      </div>

      {/* Audio Player Modal */}
      {showAudioPlayer && currentVoiceInfo && (
        <div className="audio-backdrop" onClick={stopVoiceSample}>
          <div className="audio-player" onClick={e => e.stopPropagation()}>
            <div className="audio-player-header">
              <div className="audio-player-title">
                {currentVoiceInfo.voice_name || currentVoiceInfo.name}
              </div>
              <button className="close-button" onClick={stopVoiceSample}>
                <FiX />
              </button>
            </div>
            <audio
              controls
              autoPlay
              src={currentVoiceInfo.preview_url}
              onEnded={stopVoiceSample}
              onError={() => {
                console.error('Error playing audio sample');
                stopVoiceSample();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceBrowser;