import React, { useState } from 'react';
import WorkflowStepper from './WorkflowStepper';

const VideoGenerationPage = ({ 
  selectedVoice, 
  selectedAvatar, 
  scriptContent, 
  onTabChange 
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Define the steps for the video generation workflow
  const steps = [
    {
      label: 'Select Voice',
      description: 'Choose a voice for your video from our library.',
      completed: !!selectedVoice,
      tabName: 'voices',
      guidanceMessage: 'Select a voice to continue'
    },
    {
      label: 'Choose Avatar',
      description: 'Pick an avatar that will speak your script.',
      completed: !!selectedAvatar,
      tabName: 'avatars',
      guidanceMessage: 'Choose an avatar to continue'
    },
    {
      label: 'Write Script',
      description: 'Enter the text you want your avatar to speak.',
      completed: !!scriptContent && scriptContent.length > 0,
      tabName: 'script',
      guidanceMessage: 'Write your script to continue'
    },
    {
      label: 'Generate Video',
      description: 'Review settings and generate your video.',
      completed: false,
      tabName: 'generation',
      guidanceMessage: 'Review your selections and click Generate Video'
    }
  ];
  
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  const handleComplete = () => {
    setIsGenerating(true);
    // Simulate video generation
    setTimeout(() => {
      setIsGenerating(false);
      alert('Video generation completed!');
    }, 3000);
  };
  
  const handleStepClick = (tabName) => {
    if (onTabChange) {
      onTabChange(tabName);
    }
  };
  
  return (
    <div className="video-generation-page">
      <h1>Generate Your Video</h1>
      
      {/* <WorkflowStepper 
        steps={steps}
        activeStep={activeStep}
        onNext={handleNext}
        onBack={handleBack}
        onComplete={handleComplete}
        currentPage="generate"
        isProcessing={isGenerating}
        onStepClick={handleStepClick}
      /> */}
      
      <div className="page-content">
        {activeStep === 0 && (
          <div className="step-content">
            <h2>Voice Selection</h2>
            <p>This is where voice selection UI would go.</p>
          </div>
        )}
        
        {activeStep === 1 && (
          <div className="step-content">
            <h2>Avatar Selection</h2>
            <p>This is where avatar selection UI would go.</p>
          </div>
        )}
        
        {activeStep === 2 && (
          <div className="step-content">
            <h2>Script Writing</h2>
            <p>This is where script writing UI would go.</p>
          </div>
        )}
        
        {activeStep === 3 && (
          <div className="step-content">
            <h2>Video Generation</h2>
            <p>This is where video generation UI would go.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoGenerationPage; 