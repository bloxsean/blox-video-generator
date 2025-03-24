import React, { useState, useRef, useEffect } from 'react';
import './ScriptEditor.css';
import BackgroundSelector from './BackgroundSelector';
import AvatarStyler from './AvatarStyler';
import VoiceCustomizer from './VoiceCustomizer';
import VideoDimensionSelector from './VideoDimensionSelector';
import WorkflowStepper from './WorkflowStepper';
import { generateVideo, checkVideoStatus, getVideoDetails } from '../services/videoGenerationService';
import { Box, Stepper, Step, StepLabel, Button, Typography, Avatar } from '@mui/material';
import { useNavigation } from '../contexts/NavigationContext';
import { MdPerson } from 'react-icons/md';
import { FaMicrophone, FaPlay, FaPause } from 'react-icons/fa';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';

// Get the API key from wherever it's working successfully in your application
// This could be from a context, local storage, or directly from environment variables
const API_KEY = import.meta.env.VITE_HEYGEN_API_KEY;

const ScriptEditor = () => {
  // Use the navigation context
  const {
    workflowState,
    steps,
    updateWorkflowState,
    updateScript,
    goToNextStep,
    goToPreviousStep,
    navigateToTab,
    completeStep
  } = useNavigation();

  const {
    selectedVoice,
    selectedAvatar,
    scriptContent,
    activeStep
  } = workflowState;

  const [localScript, setLocalScript] = useState(scriptContent || 'Welcome to BLOX AI, the revolutionary video creation tool that makes producing professional videos easier than ever.');
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [playingVoice, setPlayingVoice] = useState(false);
  const [audioElement, setAudioElement] = useState(new Audio());
  const [audioProgress, setAudioProgress] = useState(0);

  // Initialize local script from context
  useEffect(() => {
    if (scriptContent) {
      setLocalScript(scriptContent);
    }
  }, [scriptContent]);

  // Update word count and estimated duration when script changes
  useEffect(() => {
    if (!localScript) {
      setWordCount(0);
      setEstimatedDuration(0);
      return;
    }

    // Count words
    const words = localScript.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);

    // Estimate duration (average speaking rate: ~150 words per minute)
    const durationMinutes = words.length / 150;
    setEstimatedDuration(Math.max(0.1, durationMinutes));
  }, [localScript]);

  // Handle script changes
  const handleScriptChange = (e) => {
    const newScript = e.target.value;
    setLocalScript(newScript);
  };

  // Save script to global state
  const handleSaveScript = () => {
    setIsSaving(true);

    // Simulate API call or processing
    setTimeout(() => {
      // Update script in context
      updateScript(localScript);

      // Mark script step as completed if it meets requirements
      if (localScript.trim().length >= 10) {
        completeStep('script', { scriptContent: localScript });
      }

      setIsSaving(false);
    }, 500);
  };

  // Handle stepper navigation
  const handleNext = () => {
    console.log('ScriptEditor: Next button clicked, navigating to next step');
    // Save script before navigating
    handleSaveScript();
    // Navigate to next step
    goToNextStep();
  };

  const handleBack = () => {
    console.log('ScriptEditor: Back button clicked, navigating to previous step');
    // Save script before navigating back
    handleSaveScript();
    // Navigate to previous step
    goToPreviousStep();
  };

  const handleStepClick = (tabName) => {
    console.log(`ScriptEditor: Step clicked, navigating to ${tabName}`);
    // Save script before changing tabs
    handleSaveScript();
    // Navigate to selected tab
    navigateToTab(tabName);
  };

  // Check if prerequisites are met
  const hasPrerequisites = selectedVoice && selectedAvatar;

  // Script validation
  const isScriptValid = localScript && localScript.trim().length >= 10;

  useEffect(() => {
    console.log('Selected Avatar:', selectedAvatar);
  }, [selectedAvatar]);

  // Helper function to format avatar name from ID if needed
  const formatAvatarName = (avatarId) => {
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

  // Add this function to play voice samples
  const playVoiceSample = () => {
    if (!selectedVoice?.preview_url) {
      console.warn('No preview URL available for voice:', selectedVoice?.name);
      return;
    }

    // If we're already playing, pause it
    if (playingVoice) {
      audioElement.pause();
      setPlayingVoice(false);
      setAudioProgress(0);
      return;
    }
    
    // Create a new audio element to avoid issues
    const newAudioElement = new Audio(selectedVoice.preview_url);
    
    // Set up event listeners
    newAudioElement.addEventListener('timeupdate', updateProgress);
    newAudioElement.addEventListener('ended', () => {
      setPlayingVoice(false);
      setAudioProgress(0);
    });
    
    // Store the element and update state
    setAudioElement(newAudioElement);
    setPlayingVoice(true);
    
    // Play the audio
    newAudioElement.play().catch(err => {
      console.error('Error playing audio:', err);
      setPlayingVoice(false);
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

  // Add this component for the animated waveform
  const AnimatedWaveform = () => {
    // Generate random heights for the bars
    const bars = Array.from({ length: 5 }, () => Math.random() * 100);
    
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        width: '30px',
        height: '16px',
        padding: '0 2px'
      }}>
        {bars.map((height, index) => (
          <div 
            key={index}
            style={{
              width: '2px',
              height: `${12 * Math.max(0.2, height / 100)}px`,
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

  // Waveform animation styles
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

  return (
    <div className="script-editor">
      <div className="script-editor-header">
        <WorkflowStepper
          steps={steps}
          activeStep={activeStep}
          onNext={handleNext}
          onBack={handleBack}
          onStepClick={handleStepClick}
          currentPage="script"
          isProcessing={isSaving}
        />
      </div>

      {!hasPrerequisites ? (
        <div className="prerequisites-message">
          <div className="warning-icon">⚠️</div>
          <h3>Missing Prerequisites</h3>
          <p>
            Please select a voice and an avatar before writing your script.
            Go back to the previous steps to complete these selections.
          </p>
          <button
            className="go-to-voices-btn"
            onClick={() => navigateToTab('voices')}
          >
            Go to Voice Selection
          </button>
          <button
            className="go-to-avatars-btn"
            onClick={() => navigateToTab('avatars')}
          >
            Go to Avatar Selection
          </button>
        </div>
      ) : (
        <div className="script-editor-content">


          <div className="two-column-layout">
            {/* <div className="tips-column">

              <div className="script-tips-container">
                <h4 className="tips-header">Tips for a better script:</h4>
                <div className="tips-list">
                  <div className="tip-item">
                    <div className="tip-icon">📝</div>
                    <p>Keep sentences short and clear</p>
                  </div>
                  <div className="tip-item">
                    <div className="tip-icon">🔤</div>
                    <p>Avoid complex terminology unless necessary</p>
                  </div>
                  <div className="tip-item">
                    <div className="tip-icon">🗣️</div>
                    <p>Write as you would speak naturally</p>
                  </div>
                  <div className="tip-item">
                    <div className="tip-icon">⏸️</div>
                    <p>Add pauses with commas and periods</p>
                  </div>
                  <div className="tip-item">
                    <div className="tip-icon">🔊</div>
                    <p>Read your script aloud to test flow</p>
                  </div>
                </div>
              </div>
            </div> */}
            <div className="script-column">

              <div className="create-info-container">
                <div className="info-container">
                  <div className="info-row">
                    <div className="info-cell">
                      <div className="info-cell avatar-cell">
                        <Avatar
                          src={selectedAvatar.preview_image_url}
                          alt={selectedAvatar.avatar_name}
                          sx={{ width: 75, height: 75, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', }}
                        >
                          {!selectedAvatar.preview_image_url && selectedAvatar.avatar_name?.charAt(0)}
                        </Avatar>
                        <div className="avatar-label">
                          <div className="avatar-cell avatar-cell">
                            {/* <div> <MdPerson fontSize="28px"  /></div> */}
                            <span className="info-value">
                              {selectedAvatar?.avatar_name ||
                                (selectedAvatar?.avatar_id ? formatAvatarName(selectedAvatar.avatar_id) : 'No avatar selected')}
                            </span>
                          </div>
                          {/* </div> */}
                          {/* <div className="avatar-label"> */}
                          <div className="avatar-cell avatar-cell">
                            {/* <GraphicEqIcon /> */}
                            
                            {/* Voice player component */}
                     
                            <div style={{ display: 'flex', alignItems: 'center', marginLeft: '4px', marginRight: '8px' }}>
                              <style>{waveformStyles}</style>
                              {playingVoice ? (
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  backgroundColor: '#1f2937', 
                                  borderRadius: '4px',
                                  padding: '2px',
                                  background: '#0f172a',
                                }}>
                                  <AnimatedWaveform />
                                  <button 
                                    onClick={playVoiceSample}
                                    style={{
                                      background: '#0f172a',
                                      border: 'none',
                                      color: '#dc2626',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      padding: '7px',
                                      borderRadius: '4px'
                                    }}
                                  >
                                    <FaPause size={12} />
                                    
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={playVoiceSample}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#38bdf8',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '2px'
                                  }}
                                  disabled={!selectedVoice?.preview_url}
                                >
                                  <FaPlay size={12} />
                                </button>
                              )}
                            </div>
                            <span className="info-value"> {selectedVoice?.name}</span>
                            
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="info-row">
                      <div className="info-cell">
                        <span className="info-label">Est. Duration:</span><span className="info-value">{estimatedDuration.toFixed(1)} min</span>
                      </div>
                    </div>
                    <div className="info-row">
                      <div className="info-cell">

                        <div className="info-cell">
                          <span className="info-label">Word Count:</span>
                          <span className={wordCount < 10 ? 'warning-value' : 'info-value'}>{wordCount}</span>
                          {/* {wordCount < 10 && <span className="min-requirement">(Min: 10)</span>} */}

                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>


              <div className="script-textarea-container">
                {/* <label htmlFor="script-textarea" className="textarea-label"><h2>Enter your script:</h2></label> */}
                <textarea
                  id="script-textarea"
                  className="script-textarea"
                  value={localScript}
                  onChange={handleScriptChange}
                  placeholder="Write your script here. This is what your avatar will say in the video."
                  rows={10}
                />
              </div>

              <div className="script-actions">
                <button
                  className="save-script-btn"
                  onClick={handleSaveScript}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Script'}
                </button>

                <button
                  className="generate-video-btn"
                  onClick={() => {
                    handleSaveScript();
                    navigateToTab('summary');
                  }}
                  disabled={!isScriptValid || isSaving}
                >
                  Continue to Summary
                </button>
              </div>
            </div>


          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptEditor; 