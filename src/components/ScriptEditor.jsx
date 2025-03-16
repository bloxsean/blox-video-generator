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
  
  const [localScript, setLocalScript] = useState(scriptContent || '');
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
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
          <div className="tips-column">
          <div className="create-info-container">
            <div className="info-container">
            
              <div className="info-row">
              <div className="avatar-cell avatar-cell">
                <span className="info-label">Voice:</span>
                </div>
                <div className="avatar-cell avatar-cell">
                  <span className="info-value">{selectedVoice?.name}</span>
                </div>
              </div> 

              {/* <div className="info-row">
                  <div className="avatar-cell">
                    <span className="info-label">Est. Duration:</span>
                  </div>
                  <div className="avatar-cell">
                    <span className="info-value">{estimatedDuration.toFixed(1)} min</span>
                  </div>
              </div> */}



              <div className="info-row">
                {/* Column 1 */}
             
                  <span className="info-label">Word Count:</span>
                  <span className={wordCount < 10 ? 'warning-value' : 'info-value'}>{wordCount}</span>
                  {wordCount < 10 && <span className="min-requirement">(Min: 10)</span>}
             
              </div>
              
              <div className="info-row">
                  <div className="avatar-cell">
                    <span className="info-label">Est. Duration:</span>
                  </div>
                  <div className="avatar-cell">
                    <span className="info-value">{estimatedDuration.toFixed(1)} min</span>
                  </div>
              </div>

              {/* Row 2 */}
              <div className="info-row">
                {/* Column 1 */}
               
                  <div className="info-cell avatar-cell">
                    <Avatar
                      src={selectedAvatar.preview_image_url}
                      alt={selectedAvatar.avatar_name}
                      sx={{ width: 70, height: 70 }}
                    >
                      {!selectedAvatar.preview_image_url && selectedAvatar.avatar_name?.charAt(0)}
                    </Avatar>
                    <div className="avatar-label">
                      <span className="info-label">Avatar:</span>
                      <span className="info-value">
                        {selectedAvatar?.avatar_name || 'No avatar selected'}
                      </span>
                    </div>
                  </div>
                
                {/* Column 2 */}
               
              </div>
            </div>
          </div>
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
            </div>
            <div className="script-column">
              <div className="script-textarea-container">
                <label htmlFor="script-textarea" className="textarea-label"><h2>Enter your script:</h2></label>
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
                    navigateToTab('videos');
                  }}
                  disabled={!isScriptValid || isSaving}
                >
                  Continue to Video Generation
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