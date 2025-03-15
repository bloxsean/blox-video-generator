import React from 'react';
import './WorkflowPanel.css';

const WorkflowPanel = ({ 
  hasVoice, 
  hasAvatar, 
  hasScript, 
  activeTab, 
  onTabChange, 
  onClose,
  visible 
}) => {
  if (!visible) return null;
  
  const steps = [
    { 
      id: 'voice', 
      label: 'Select a Voice', 
      completed: hasVoice, 
      tabName: 'voices',
      description: 'Choose a voice for your video from our library.'
    },
    { 
      id: 'avatar', 
      label: 'Choose an Avatar', 
      completed: hasAvatar, 
      tabName: 'avatars',
      description: 'Pick an avatar that will speak your script.'
    },
    { 
      id: 'script', 
      label: 'Write Your Script', 
      completed: hasScript, 
      tabName: 'script',
      description: 'Enter the text you want your avatar to speak.'
    }
  ];

  // Calculate overall progress as a percentage
  const completedSteps = [hasVoice, hasAvatar, hasScript].filter(Boolean).length;
  const progressPercentage = Math.round((completedSteps / steps.length) * 100);

  return (
    <div className="workflow-panel">
      <div className="workflow-header">
        <h3>Video Creation Progress</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="progress-bar-container">
        <div 
          className="progress-bar" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      <div className="progress-percentage">
        {progressPercentage}% Complete
      </div>
      
      <div className="workflow-steps">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`workflow-step ${step.completed ? 'completed' : 'incomplete'} ${activeTab === step.tabName ? 'active' : ''}`}
            onClick={() => onTabChange(step.tabName)}
          >
            <div className="step-number">
              {step.completed ? '✓' : index + 1}
            </div>
            <div className="step-content">
              <div className="step-label">{step.label}</div>
              <div className="step-description">{step.description}</div>
            </div>
            <div className="step-action">
              {activeTab === step.tabName ? (
                'Current'
              ) : (
                <button className="goto-step">
                  {step.completed ? 'Edit' : 'Go to Step'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="workflow-footer">
        {completedSteps === steps.length ? (
          <button 
            className="generate-video-button"
            onClick={() => onTabChange('script')}
          >
            Generate Video
          </button>
        ) : (
          <div className="next-step-tip">
            {activeTab === 'voices' && !hasVoice && 'Select a voice to continue'}
            {activeTab === 'voices' && hasVoice && 'Voice selected! Now pick an avatar'}
            {activeTab === 'avatars' && !hasAvatar && 'Choose an avatar to continue'}
            {activeTab === 'avatars' && hasAvatar && 'Avatar selected! Now write your script'}
            {activeTab === 'script' && !hasScript && 'Write your script to complete all steps'}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowPanel; 