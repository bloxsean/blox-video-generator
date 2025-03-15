import React, { useState, useRef, useEffect } from 'react';
import './ScriptEditor.css';
import BackgroundSelector from './BackgroundSelector';
import AvatarStyler from './AvatarStyler';
import VoiceCustomizer from './VoiceCustomizer';
import VideoDimensionSelector from './VideoDimensionSelector';
import WorkflowStepper from './WorkflowStepper';
import { generateVideo, checkVideoStatus, getVideoDetails } from '../services/videoGenerationService';
import { Box, Stepper, Step, StepLabel, Button, Typography } from '@mui/material';
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
          <div className="script-info">
            <div className="voice-avatar-preview">
              <div className="selected-item">
                <label>Voice:</label>
                <span>{selectedVoice?.name}</span>
              </div>
              <div className="selected-item">
                <label>Avatar:</label>
                <span>{selectedAvatar?.name}</span>
              </div>
            </div>
            
            <div className="script-stats">
              <div className="stat-item">
                <label>Word Count:</label>
                <span className={wordCount < 10 ? 'warning' : ''}>{wordCount}</span>
                {wordCount < 10 && <span className="min-requirement">(Min: 10)</span>}
              </div>
              <div className="stat-item">
                <label>Est. Duration:</label>
                <span>{estimatedDuration.toFixed(1)} min</span>
              </div>
            </div>
          </div>
          
          <div className="script-textarea-container">
            <label htmlFor="script-textarea">Enter your script:</label>
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
          
          <div className="script-tips">
            <h4>Tips for a better script:</h4>
            <ul>
              <li>Keep sentences short and clear</li>
              <li>Avoid complex terminology unless necessary</li>
              <li>Write as you would speak naturally</li>
              <li>Add pauses with commas and periods</li>
              <li>Read your script aloud to test flow</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptEditor; 