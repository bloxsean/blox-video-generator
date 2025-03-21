import React, { useState, useEffect, useRef } from 'react';
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
  const [audioElement, setAudioElement] = useState(new Audio());
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [dataArray, setDataArray] = useState(null);
  const [animationFrame, setAnimationFrame] = useState(null);
  const [sourceNode, setSourceNode] = useState(null);

  // Add a ref for the voice list container
  const voiceListRef = useRef(null);

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
      audioElement.removeEventListener('timeupdate', updateProgress);
      
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, []);

  // Initialize Web Audio API when component mounts
  useEffect(() => {
    // Create audio context
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const analyserNode = context.createAnalyser();
    analyserNode.fftSize = 256;
    
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArr = new Uint8Array(bufferLength);
    
    setAudioContext(context);
    setAnalyser(analyserNode);
    setDataArray(dataArr);
    
    return () => {
      // Clean up
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      if (context && context.state !== 'closed') {
        context.close();
      }
    };
  }, []);

  // Function to handle voice selection
  const handleVoiceSelect = (voice) => {
    console.log('VoiceBrowser: Voice selected:', voice?.name || voice?.voice_name);
    selectVoice(voice);
    
    // Use a more reliable smooth scrolling approach
    setTimeout(() => {
      const voiceContent = document.querySelector('.voice-content');
      if (voiceContent) {
        // Use scrollTo with smooth behavior instead of direct scrollTop assignment
        voiceContent.scrollTo({ 
          top: 0, 
          behavior: 'smooth' 
        });
        
        // Add a class that ensures smooth scrolling is enabled
        if (!voiceContent.classList.contains('smooth-scroll')) {
          voiceContent.classList.add('smooth-scroll');
        }
      }
    }, 200); // Slightly longer timeout to ensure everything is ready
  };

  // Check if a voice is the currently selected one
  const isSelected = (voice) => {
    if (!selectedVoice) return false;
    
    const voiceId = voice.voice_id || voice.id;
    const selectedId = selectedVoice.voice_id || selectedVoice.id;
    
    return voiceId === selectedId;
  };

  // Simple, robust audio implementation that works reliably
  const playVoiceSample = (voice) => {
    if (!voice.preview_url) {
      console.warn('No preview URL available for voice:', voice.name);
      return;
    }

    // If we're already playing this voice, pause it
    if (playingVoice === voice.voice_id) {
      audioElement.pause();
      setPlayingVoice(null);
      setAudioProgress(0);
      return;
    }
    
    // If we're playing a different voice, stop that one first
    if (playingVoice) {
      audioElement.pause();
      setAudioProgress(0);
    }
    
    // Create a new audio element each time to avoid issues
    const newAudioElement = new Audio();
    
    // Set up event listeners
    newAudioElement.addEventListener('timeupdate', updateProgress);
    newAudioElement.addEventListener('ended', () => {
      setPlayingVoice(null);
      setAudioProgress(0);
    });
    
    // Set the source after adding event listeners
    newAudioElement.src = voice.preview_url;
    
    // Store the element and update state
    setAudioElement(newAudioElement);
    setPlayingVoice(voice.voice_id);
    
    // Play the audio
    newAudioElement.play().catch(err => {
      console.error('Error playing audio:', err);
      setPlayingVoice(null);
    });
  };

  // Function to update progress
  const updateProgress = (event) => {
    const audio = event.target;
    if (audio && audio.duration) {
      const progress = (audio.currentTime / audio.duration) * 100;
      setAudioProgress(progress);
    }
  };

  // Function to stop voice sample
  const stopVoiceSample = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      audioElement.removeEventListener('timeupdate', updateProgress);
    }
    setPlayingVoice(null);
    setAudioProgress(0);
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

  // Add this function to draw the waveform
  const drawWaveform = (canvasRef) => {
    if (!analyser || !dataArray || !canvasRef || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear the canvas
    canvasCtx.clearRect(0, 0, width, height);
    
    // Draw the waveform
    analyser.getByteFrequencyData(dataArray);
    
    canvasCtx.fillStyle = '#111827';
    canvasCtx.fillRect(0, 0, width, height);
    
    const barWidth = (width / dataArray.length) * 2.5;
    let x = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * height;
      
      canvasCtx.fillStyle = `rgb(56, 189, 248)`;
      canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
      
      x += barWidth + 1;
    }
    
    const frame = requestAnimationFrame(() => drawWaveform(canvasRef));
    setAnimationFrame(frame);
  };

  // First, create a component for the animated "fake" waveform
  const AnimatedWaveform = () => {
    // Generate random heights for the bars, but fewer of them for the horizontal layout
    const bars = Array.from({ length: 10 }, () => Math.random() * 100);
    
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        width: '90%',
        height: '30px',
        padding: '0 5px'
      }}>
        {bars.map((height, index) => (
          <div 
            key={index}
            style={{
              width: '3px',
              height: `${25 * Math.max(0.2, height / 100)}px`,
              backgroundColor: '#38bdf8',
              borderRadius: '1px',
              animation: `waveform-animation ${0.7 + Math.random() * 0.6}s ease-in-out infinite alternate`,
              animationDelay: `${index * 0.08}s`
            }}
          />
        ))}
      </div>
    );
  };

  // Updated waveform animation styles
  const waveformStyles = `
    @keyframes waveform-animation {
      0% {
        height: 15%;
      }
      100% {
        height: 85%;
      }
    }
  `;

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
            {/* <button 
              className="force-refresh-button"
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchVoices(true);
              }}
            >
              Force Refresh
            </button> */}
          </div>
        </div>
      );
    }

    const filteredVoices = voices.filter(voice => {
      if (!searchTerm) return true;
      
      const voiceName = (voice.voice_name || voice.name || '').toLowerCase();
      const voiceGender = (voice.gender || '').toLowerCase();
      return voiceName.includes(searchTerm.toLowerCase()) || voiceGender.includes(searchTerm.toLowerCase());
    });

    if (filteredVoices.length === 0) {
      return (
        <div className="no-results">
          No voices found. Try a different search term or check your connection.
        </div>
      );
    }

    return (
      <div className="voice-list" ref={voiceListRef} style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        {filteredVoices.map((voice, index) => (
          <div 
            key={voice.voice_id || voice.id || `voice-${index}`} 
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: '#111827',
              border: isSelected(voice) ? '1px solid #38bdf8' : '1px solid #1f2937',
              transition: 'all 0.2s ease',
              width: '100%'
            }}
            onClick={() => handleVoiceSelect(voice)}
          >
            <div style={{ flex: 1, marginRight: '20px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#e5e7eb' }}>
                {voice.voice_name || voice.name}
              </h3>
              {console.log(voice)}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                {voice.language && (
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                    <span style={{ fontWeight: 500, color: '#d1d5db' }}>Language:</span> {voice.language}
                  </div>
                )}
                
                {voice.gender && (
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                    <span style={{ fontWeight: 500, color: '#d1d5db' }}>Gender:</span> {voice.gender}
                  </div>
                )}                
                
                <div>
                  {voice.premium ? (
                    <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, backgroundColor: '#7e22ce', color: 'white' }}>
                      Premium
                    </span>
                  ) : (
                    <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, backgroundColor: '#16a34a', color: 'white' }}>
                      Free
                    </span>
                  )}
                </div>
                
                {voice.tags && voice.tags.length > 0 && (
                  <div>
                    {voice.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        style={{ 
                          display: 'inline-block', 
                          marginRight: '6px', 
                          marginBottom: '6px', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          backgroundColor: '#1f2937', 
                          color: '#9ca3af', 
                          fontSize: '12px' 
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {voice.preview_url && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  width: '240px' // Increased width to accommodate side-by-side layout
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100%',
                    height: '40px',
                  }}>
                    {/* Waveform visualization to the left - only visible when voice is playing */}
                    {playingVoice === voice.voice_id ? (
                      <div 
                        style={{ 
                          width: '100px', 
                          height: '40px',
                          backgroundColor: '#1f2937',
                          borderRadius: '6px 0 0 6px', // Rounded on left side only
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <style>{waveformStyles}</style>
                        <AnimatedWaveform />
                      </div>
                    ) : (
                      <div 
                        style={{ 
                          width: '100px', 
                          height: '40px',
                          // backgroundColor: '#1f2937',
                          borderRadius: '6px 0 0 6px', // Rounded on left side only
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#4b5563',
                          fontSize: '12px',
                          fontWeight: 500
                        }}
                      >
                        
                      </div>
                    )}
                    
                    {/* Play/Stop button to the right */}
                    <button 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 16px',
                        width: '140px',
                        height: '40px',
                        borderRadius: '0 6px 6px 0', // Rounded on right side only
                        fontSize: '14px',
                        fontWeight: 500,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: playingVoice === voice.voice_id ? '#dc2626' : '#1e40af',
                        color: 'white'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        playVoiceSample(voice);
                      }}
                    >
                      {playingVoice === voice.voice_id ? (
                        <>
                          <FiPause style={{ marginRight: '6px' }} />
                          <span>Stop Preview</span>
                        </>
                      ) : (
                        <>
                          <FiPlay style={{ marginRight: '6px' }} />
                          <span>Play Preview</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Progress bar below the control strip */}
                  {playingVoice === voice.voice_id && (
                    <div 
                      style={{ 
                        width: '100%', 
                        height: '4px', 
                        backgroundColor: '#1f2937',
                        overflow: 'hidden',
                        marginTop: '2px',
                        borderRadius: '0 0 6px 6px'
                      }}
                    >
                      <div 
                        style={{
                          height: '100%',
                          width: `${audioProgress}%`,
                          backgroundColor: '#38bdf8',
                          transition: 'width 0.1s linear'
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
              
              <button 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 16px',
                  minWidth: '120px',
                  height: '40px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: isSelected(voice) ? '#10b981' : '#2563eb',
                  color: 'white'
                }}
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
          
          {/* <button 
            className="refresh-button"
            onClick={() => {
              setLoading(true);
              fetchVoices(true);
            }}
            title="Refresh voices from server"
          >
            Refresh
          </button> */}
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
      
      <div className="voice-content" style={{ 
        overflowY: 'auto',
        height: 'calc(100vh - 200px)',
        maxHeight: '600px',
        scrollBehavior: 'smooth'
      }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default VoiceBrowser;