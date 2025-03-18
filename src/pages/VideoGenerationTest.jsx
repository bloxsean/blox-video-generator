import React from 'react';
import VideoGeneration from '../components/VideoGeneration';

const mockData = {
  workflowState: {
    selectedVoice: {
      voice_id: "test_voice_id",
      name: "Test Voice"
    },
    selectedAvatar: {
      avatar_id: "test_avatar_id",
      avatar_name: "Test Avatar",
      preview_image_url: "https://via.placeholder.com/150"
    },
    scriptContent: "This is a test script for video generation. We're testing if the component works correctly without relying on NavigationContext.",
    activeStep: 4
  },
  steps: [
    { label: 'Voice', path: 'voices' },
    { label: 'Avatar', path: 'avatars' },
    { label: 'Script', path: 'script' },
    { label: 'Summary', path: 'summary' },
    { label: 'Generation', path: 'generation' },
    { label: 'Videos', path: 'videos' }
  ],
  navigateToTab: (tab) => console.log(`Navigate to ${tab} called`),
  goToNextStep: () => console.log('Go to next step called'),
  goToPreviousStep: () => console.log('Go to previous step called')
};

const VideoGenerationTest = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Video Generation Component Test</h1>
      <p>This page tests the VideoGeneration component in isolation with mock data.</p>
      
      <div style={{ 
        border: '1px solid #ccc', 
        borderRadius: '8px', 
        padding: '20px',
        marginTop: '20px' 
      }}>
        <VideoGeneration testMode={true} testData={mockData} />
      </div>
    </div>
  );
};

export default VideoGenerationTest; 