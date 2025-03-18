import React, { useState, useEffect } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import WorkflowStepper from './WorkflowStepper';
import { 
  generateVideo, 
  checkVideoStatus, 
  getVideoDetails 
} from '../services/videoGenerationService';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Button, 
  Alert, 
  LinearProgress 
} from '@mui/material';
import './VideoGeneration.css';

const VideoGeneration = ({ testMode = false, testData = null }) => {
  console.log('VideoGeneration component rendering attempt with testMode:', testMode);
  
  // Default test data for development
  const defaultTestData = {
    workflowState: {
      selectedVoice: { voice_id: 'test_voice_id', name: 'Test Voice' },
      selectedAvatar: { avatar_id: 'test_avatar_id', avatar_name: 'Test Avatar' },
      scriptContent: 'This is a test script for video generation.',
      activeStep: 4
    },
    steps: [
      { label: 'Voices', tabName: 'voices', completed: true },
      { label: 'Avatars', tabName: 'avatars', completed: true },
      { label: 'Script', tabName: 'script', completed: true },
      { label: 'Summary', tabName: 'summary', completed: true },
      { label: 'Generation', tabName: 'generation', completed: false }
    ],
    navigateToTab: (tab) => console.log(`Test navigation to ${tab}`),
    goToNextStep: () => console.log('Test go to next step'),
    goToPreviousStep: () => console.log('Test go to previous step')
  };
  
  // Use test data if provided, otherwise use context
  let contextData = { workflowState: {}, steps: [], navigateToTab: () => {}, goToNextStep: () => {}, goToPreviousStep: () => {} };
  
  try {
    if (!testMode) {
      // Use real navigation context when not in test mode
      const navContext = useNavigation();
      if (navContext) {
        contextData = navContext;
        console.log('Navigation context loaded:', contextData);
      } else {
        console.warn('Navigation context is null, falling back to defaults');
      }
    } else {
      console.log('Using test data instead of context');
      contextData = testData || defaultTestData;
    }
  } catch (error) {
    console.error('Error loading navigation context:', error);
  }
  
  // Now destructure with defaults
  const { 
    workflowState = {}, 
    steps = [], 
    navigateToTab = () => {}, 
    goToNextStep = () => {}, 
    goToPreviousStep = () => {} 
  } = contextData;
  
  // Add safety check for workflowState
  const safeWorkflowState = workflowState || {};
  
  const { 
    selectedVoice = null, 
    selectedAvatar = null, 
    scriptContent = '', 
    activeStep = 4 
  } = safeWorkflowState;
  
  // Log the critical data for debugging
  useEffect(() => {
    console.log('VideoGeneration component data:', {
      selectedVoice,
      selectedAvatar,
      scriptContent,
      activeStep,
      stepsAvailable: steps.length > 0
    });
  }, [selectedVoice, selectedAvatar, scriptContent, activeStep, steps]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [videoStatus, setVideoStatus] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Preparing to generate video...');
  const [progress, setProgress] = useState(0);
  
  // Mock API for test mode
  const mockGenerateVideo = async (data) => {
    console.log('Mock generate video called with:', data);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { 
      video_id: 'mock_video_' + Math.random().toString(36).substr(2, 9),
      message: 'Video generation started successfully'
    };
  };
  
  const mockCheckStatus = async (videoId) => {
    console.log('Mock check status for:', videoId);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { status: progress < 70 ? 'processing' : 'completed' };
  };
  
  const mockGetVideoDetails = async (videoId) => {
    console.log('Mock get video details for:', videoId);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      id: videoId,
      status: 'completed',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnail_url: 'https://via.placeholder.com/640x360'
    };
  };
  
  // Generate video on component mount
  useEffect(() => {
    if (!videoId && !loading) {
      console.log('Initial load - checking if we should generate video');
      console.log('Test mode is:', testMode);
      
      // Only auto-generate in test mode or if specifically configured to do so
      if (testMode) {
        handleGenerateVideo();
      }
      // In production mode, don't auto-generate
      // User will need to click a button to generate
    }
  }, []);
  
  // Poll for status updates if we have a videoId
  useEffect(() => {
    let statusInterval;
    
    if (videoId && !videoUrl && !error) {
      console.log('Setting up status polling for video ID:', videoId);
      setStatusMessage('Checking video status...');
      
      statusInterval = setInterval(async () => {
        try {
          console.log('Polling for status update...');
          
          // Use real or mock API based on test mode
          const statusData = testMode 
            ? await mockCheckStatus(videoId)
            : await checkVideoStatus(videoId);
          
          console.log('Status update received:', statusData);
          setVideoStatus(statusData.status);
          
          // Update status message and progress based on status
          switch(statusData.status) {
            case 'processing':
              setStatusMessage('Processing your video...');
              setProgress(prev => Math.min(prev + 10, 70));
              break;
            case 'completed':
              setStatusMessage('Video complete! Fetching details...');
              setProgress(80);
              clearInterval(statusInterval);
              
              // Get video details including URL
              console.log('Getting video details for completed video');
              const videoDetails = testMode
                ? await mockGetVideoDetails(videoId)
                : await getVideoDetails(videoId);
              
              console.log('Video details received:', videoDetails);
              setVideoUrl(videoDetails.video_url || videoDetails.proxied_video_url);
              setProgress(100);
              setStatusMessage('Video ready!');
              break;
            case 'failed':
              setError(`Video generation failed: ${statusData.error || 'Unknown error'}`);
              clearInterval(statusInterval);
              break;
            default:
              setStatusMessage(`Status: ${statusData.status}`);
          }
        } catch (err) {
          console.error('Error checking video status:', err);
          setError(`Error checking video status: ${err.message}`);
          clearInterval(statusInterval);
        }
      }, testMode ? 2000 : 5000); // Faster polling in test mode
    }
    
    return () => {
      if (statusInterval) {
        console.log('Clearing status interval');
        clearInterval(statusInterval);
      }
    };
  }, [videoId, videoUrl, error, testMode]);
  
  useEffect(() => {
    if (testMode) {
      console.log('Running in test mode - API calls will be mocked');
    }
  }, [testMode]);
  
  const handleGenerateVideo = async () => {
    try {
      console.log('%c 🎬 START VIDEO GENERATION CLICKED', 'background: #4CAF50; color: white; padding: 4px 8px; font-weight: bold;');
      
      // Check if we should skip
      if (loading) {
        console.log('Generation already in progress, skipping');
        return;
      }
      
      if (videoId) {
        console.log('Video ID already exists, skipping:', videoId);
        return;
      }
      
      // Set loading state
      setLoading(true);
      setError(null);
      setProgress(10);
      setStatusMessage('Preparing video generation request...');
      
      // Log workflow state
      console.log('Current workflow state:', {
        selectedAvatar,
        selectedVoice,
        scriptContent
      });
      
      // Validate data
      if (!selectedAvatar) {
        throw new Error('Missing avatar selection. Please complete all previous steps.');
      }
      
      if (!selectedVoice) {
        throw new Error('Missing voice selection. Please complete all previous steps.');
      }
      
      if (!scriptContent) {
        throw new Error('Missing script content. Please complete all previous steps.');
      }
      
      // Extract IDs
      const avatarId = selectedAvatar.avatar_id || selectedAvatar.id;
      if (!avatarId) {
        throw new Error(`Invalid avatar data: missing avatar_id (${JSON.stringify(selectedAvatar)})`);
      }
      
      const voiceId = selectedVoice.voice_id || selectedVoice.id;
      if (!voiceId) {
        throw new Error(`Invalid voice data: missing voice_id (${JSON.stringify(selectedVoice)})`);
      }
      
      console.log('Using avatarId:', avatarId);
      console.log('Using voiceId:', voiceId);
      
      // Build request data
      const videoData = {
        caption: false,
        dimension: {
          width: 1280,
          height: 720
        },
        title: `Generated Video - ${new Date().toLocaleString()}`,
        callback_id: "user_" + Math.floor(Math.random() * 100000),
        video_inputs: [
          {
            character: {
              type: "avatar",
              scale: 1,
              avatar_style: "normal",
              avatar_id: avatarId
            },
            voice: {
              voice_id: voiceId,
              type: "text",
              input_text: scriptContent
            }
          }
        ]
      };
      
      console.log('Submitting video generation with data:', videoData);
      
      // Send to API
      const response = await generateVideo(videoData);
      console.log('API response received:', response);
      
      // Handle response
      if (response && response.video_id) {
        setVideoId(response.video_id);
        setProgress(20);
        setStatusMessage('Video generation started! Processing...');
      } else if (response && response.data && response.data.video_id) {
        setVideoId(response.data.video_id);
        setProgress(20);
        setStatusMessage('Video generation started! Processing...');
      } else if (response && response.error) {
        throw new Error(response.error + (response.details ? ': ' + response.details : ''));
      } else {
        console.error('Unexpected response format:', response);
        throw new Error('Invalid response from server: missing video_id');
      }
    } catch (err) {
      console.error('Error generating video:', err);
      setError(`Failed to generate video: ${err.message}`);
      setStatusMessage('Video generation failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRetry = () => {
    console.log('Retrying video generation');
    setVideoId(null);
    setVideoUrl(null);
    setVideoStatus(null);
    setError(null);
    handleGenerateVideo();
  };
  
  const handleBack = () => {
    console.log('Navigating back');
    if (testMode) {
      alert('In test mode: Would navigate back to summary');
    } else {
      navigateToTab('summary');
    }
  };
  
  const handleViewAllVideos = () => {
    console.log('Navigating to videos');
    if (testMode) {
      alert('In test mode: Would navigate to videos tab');
    } else {
      navigateToTab('videos');
    }
  };
  
  const handleStepClick = (tabName) => {
    console.log('Step clicked:', tabName);
    if (testMode) {
      alert(`In test mode: Would navigate to ${tabName}`);
    } else {
      navigateToTab(tabName);
    }
  };
  
  
  // At the top level of your component
  try {
    // Add this useEffect to catch any errors during initialization
    useEffect(() => {
      console.log('Component mounted successfully');
      
      // Check if the button should be shown
      console.log('Button visibility conditions:', {
        videoId: !videoId,
        loading: !loading,
        testMode: !testMode
      });
      
      // This condition must be true for the button to show
      const buttonShouldBeVisible = !videoId && !loading && !testMode;
      console.log('Button should be visible:', buttonShouldBeVisible);
    }, [videoId, loading, testMode]);
  } catch (err) {
    console.error('Error in VideoGeneration component:', err);
  }
  
  return (
    <div className="video-generation">
      {testMode && (
        <div style={{ background: '#fff3cd', color: '#856404', padding: '10px', margin: '10px 0', borderRadius: '4px' }}>
          ⚠️ Running in TEST MODE with mock data. No real API calls will be made.
        </div>
      )}
      
      <h1>VIDEO GENERATION TEST</h1>
      <div className="generation-header">
        {!testMode ? (
          <WorkflowStepper
            steps={steps}
            activeStep={activeStep}
            onNext={handleViewAllVideos}
            onBack={handleBack}
            onStepClick={handleStepClick}
            currentPage="generation"
            isProcessing={loading || (videoStatus === 'processing')}
          />
        ) : (
          <div className="test-mode-header">
            <Typography variant="h6" color="primary">TEST MODE</Typography>
            <div className="test-stepper-buttons">
              <Button onClick={handleBack}>Back</Button>
              <Button onClick={handleViewAllVideos}>Next</Button>
            </div>
          </div>
        )}
      </div>
      
      <div className="generation-container">
        <Typography variant="h4" className="generation-title">
          Video Generation {testMode ? '(Test Mode)' : ''}
        </Typography>
        
        {error && (
          <Alert severity={error.includes('no video ID was returned') ? 'warning' : 'error'} className="error-alert">
            {error}
            {!error.includes('no video ID was returned') && (
              <Button onClick={handleRetry} color="inherit" size="small">
                Retry
              </Button>
            )}
            {error.includes('no video ID was returned') && (
              <Button onClick={handleViewAllVideos} color="inherit" size="small">
                View All Videos
              </Button>
            )}
          </Alert>
        )}
        
        <Box className="status-container">
          {!videoId && !loading && !testMode && (
            <Box className="start-generation">
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleGenerateVideo}
                size="large"
              >
                Start Video Generation
              </Button>
            </Box>
          )}
          
          {(loading || (videoId && !videoUrl)) && !error && (
            <>
              <Box className="progress-indicator">
                <CircularProgress size={60} />
              </Box>
              <Typography variant="h6" className="status-message">
                {statusMessage}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                className="progress-bar" 
              />
              <Box sx={{ mt: 2, textAlign: 'center', color: 'text.primary' }}>
                <Typography variant="body1" color="#000000" sx={{ mb: 2 }}>
                  You can safely navigate away from this page. Your video will continue to process and will be available in your videos list when complete.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleViewAllVideos}
                  sx={{ mt: 1 }}
                >
                  View All Videos
                </Button>
              </Box>
              {testMode && (
                <Typography variant="caption" style={{ marginTop: '10px' }}>
                  Using mock data in test mode - video ID: {videoId || 'not yet generated'}
                </Typography>
              )}
            </>
          )}
          
          {videoUrl && (
            <Box className="video-container">
              <Typography variant="h6" className="success-message">
                Your video is ready!
              </Typography>
              <video
                controls
                className="generated-video"
                src={videoUrl}
                poster={videoStatus?.thumbnail_url}
              />
              <Box className="video-actions">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleViewAllVideos}
                >
                  View All Videos
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleGenerateVideo}
                >
                  Create Another Video
                </Button>
              </Box>
              {testMode && (
                <Typography variant="caption" style={{ marginTop: '20px' }}>
                  Test mode: Using sample video. In production, this would be your generated video.
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </div>
    </div>
  );
};

export default VideoGeneration;
