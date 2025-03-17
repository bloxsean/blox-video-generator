import React from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import WorkflowStepper from './WorkflowStepper';
import { Box, Typography, Avatar, Paper, Divider, Button } from '@mui/material';
import './VideoCreationSummary.css';

const VideoCreationSummary = () => {
  const { workflowState, steps, navigateToTab, goToNextStep, goToPreviousStep } = useNavigation();
  const { selectedVoice, selectedAvatar, scriptContent, activeStep } = workflowState;
  
  // Helper function to count words and estimate duration
  const getScriptStats = () => {
    if (!scriptContent) {
      return { wordCount: 0, duration: 0 };
    }
    
    const wordCount = scriptContent.trim().split(/\s+/).filter(Boolean).length;
    const duration = (wordCount / 150).toFixed(1); // Estimate based on ~150 words per minute
    
    return { wordCount, duration };
  };
  
  const { wordCount, duration } = getScriptStats();
  
  const handleContinueToVideos = () => {
    navigateToTab('videos');
  };

  const handleBack = () => {
    navigateToTab('script');
  };
  
  const handleStepClick = (tabName) => {
    navigateToTab(tabName);
  };
  
  return (
    <div className="video-creation-summary">
      <div className="summary-header">
        <WorkflowStepper
          steps={steps}
          activeStep={activeStep}
          onNext={handleContinueToVideos}
          onBack={handleBack}
          onStepClick={handleStepClick}
          currentPage="summary"
          isProcessing={false}
        />
      </div>
      
      <div className="summary-container">
        <Typography variant="h4" className="summary-title">
          Video Creation Summary
        </Typography>
        
        <Paper elevation={3} className="summary-section">
          <Typography variant="h6" className="section-title">Voice Selection</Typography>
          <Divider className="section-divider" />
          <Box className="section-content">
            <Typography><strong>Voice:</strong> {selectedVoice?.name || 'Not selected'}</Typography>
          </Box>
        </Paper>
        
        <Paper elevation={3} className="summary-section">
          <Typography variant="h6" className="section-title">Avatar Selection</Typography>
          <Divider className="section-divider" />
          <Box className="section-content avatar-content">
            {selectedAvatar ? (
              <>
                <Avatar
                  src={selectedAvatar.preview_image_url}
                  alt={selectedAvatar.avatar_name}
                  sx={{ width: 80, height: 80 }}
                >
                  {!selectedAvatar.preview_image_url && selectedAvatar.avatar_name?.charAt(0)}
                </Avatar>
                <Box className="avatar-details">
                  <Typography><strong>Name:</strong> {selectedAvatar.avatar_name || 
                    (selectedAvatar.avatar_id ? selectedAvatar.avatar_id.replace(/_/g, ' ') : 'Unknown')}</Typography>
                  <Typography><strong>Type:</strong> {selectedAvatar.type || 'Standard'}</Typography>
                </Box>
              </>
            ) : (
              <Typography>No avatar selected</Typography>
            )}
          </Box>
        </Paper>
        
        <Paper elevation={3} className="summary-section">
          <Typography variant="h6" className="section-title">Script</Typography>
          <Divider className="section-divider" />
          <Box className="section-content">
            <Box className="script-box">
              {scriptContent ? (
                <Typography>{scriptContent}</Typography>
              ) : (
                <Typography className="not-selected">No script created</Typography>
              )}
            </Box>
            <Box className="script-stats">
              <Typography><strong>Word Count:</strong> {wordCount}</Typography>
              <Typography><strong>Estimated Duration:</strong> {duration} min</Typography>
            </Box>
          </Box>
        </Paper>
        
        <div className="summary-actions">
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleContinueToVideos}
            className="continue-button"
          >
            Continue to Video Generation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoCreationSummary; 