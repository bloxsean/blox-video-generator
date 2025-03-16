import React, { createContext, useContext, useState, useCallback } from 'react';

// Create the context
const NavigationContext = createContext(null);

// Define all available tabs
const AVAILABLE_TABS = ['home', 'voices', 'avatars', 'script', 'videos'];

// Define the workflow steps
const WORKFLOW_STEPS = [
  {
    id: 'voices',
    label: 'Select Voice',
    description: 'Choose a voice for your video from our library.',
    tabName: 'voices',
    guidanceMessage: 'Select a voice to continue'
  },
  {
    id: 'avatars',
    label: 'Choose Avatar',
    description: 'Pick an avatar that will speak your script.',
    tabName: 'avatars',
    guidanceMessage: 'Choose an avatar to continue'
  },
  {
    id: 'script',
    label: 'Write Script',
    description: 'Enter the text you want your avatar to speak.',
    tabName: 'script',
    guidanceMessage: 'Write your script to continue'
  },
  {
    id: 'videos',
    label: 'Generate Video',
    description: 'Review settings and generate your video.',
    tabName: 'videos',
    guidanceMessage: 'Review your selections and click Generate Video'
  }
];

export const NavigationProvider = ({ children }) => {
  // State for active tab and workflow
  const [activeTab, setActiveTab] = useState('home');
  const [workflowState, setWorkflowState] = useState({
    selectedVoice: null,
    selectedAvatar: null,
    scriptContent: '',
    activeStep: 0,
    completedSteps: {
      voices: false,
      avatars: false,
      script: false,
      videos: false
    }
  });

  // Navigation function
  const navigateToTab = useCallback((tabName) => {
    // Validate tab name
    if (!AVAILABLE_TABS.includes(tabName)) {
      console.error(`Invalid tab name: ${tabName}`);
      return;
    }

    console.log(`NavigationContext: Navigating to ${tabName}`);
    setActiveTab(tabName);

    // Update active step if it's a workflow step
    const stepIndex = WORKFLOW_STEPS.findIndex(step => step.tabName === tabName);
    if (stepIndex >= 0) {
      setWorkflowState(prev => ({
        ...prev,
        activeStep: stepIndex
      }));
    }
  }, []);

  // Workflow state management
  const updateWorkflowState = useCallback((updates) => {
    setWorkflowState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Step completion
  const completeStep = useCallback((stepId, data = {}) => {
    console.log(`NavigationContext: Completing step ${stepId}`, data);
    
    setWorkflowState(prev => ({
      ...prev,
      ...data,
      completedSteps: {
        ...prev.completedSteps,
        [stepId]: true
      }
    }));
  }, []);

  // Navigation helpers
  const goToNextStep = useCallback(() => {
    const currentIndex = WORKFLOW_STEPS.findIndex(step => step.tabName === activeTab);
    if (currentIndex >= 0 && currentIndex < WORKFLOW_STEPS.length - 1) {
      // Check if current step is completed before allowing navigation
      const currentStep = WORKFLOW_STEPS[currentIndex];
      if (workflowState.completedSteps[currentStep.id]) {
        const nextStep = WORKFLOW_STEPS[currentIndex + 1];
        navigateToTab(nextStep.tabName);
      } else {
        console.log(`Cannot proceed: ${currentStep.id} step is not completed`);
      }
    }
  }, [activeTab, workflowState.completedSteps, navigateToTab]);

  const goToPreviousStep = useCallback(() => {
    const currentIndex = WORKFLOW_STEPS.findIndex(step => step.tabName === activeTab);
    if (currentIndex > 0) {
      const prevStep = WORKFLOW_STEPS[currentIndex - 1];
      navigateToTab(prevStep.tabName);
    }
  }, [activeTab, navigateToTab]);

  // Get steps with current status
  const getStepsWithStatus = useCallback(() => {
    return WORKFLOW_STEPS.map(step => ({
      ...step,
      completed: workflowState.completedSteps[step.id] || false
    }));
  }, [workflowState.completedSteps]);

  // Selection handlers
  const selectVoice = useCallback((voice) => {
    if (voice) {
      completeStep('voices', { selectedVoice: voice });
      // No automatic navigation after selection
    } else {
      updateWorkflowState({ 
        selectedVoice: null,
        completedSteps: {
          ...workflowState.completedSteps,
          voices: false
        }
      });
    }
  }, [completeStep, updateWorkflowState, workflowState.completedSteps]);

  const selectAvatar = useCallback((avatar) => {
    if (avatar) {
      completeStep('avatars', { selectedAvatar: avatar });
      // No automatic navigation after selection
    } else {
      updateWorkflowState({ 
        selectedAvatar: null,
        completedSteps: {
          ...workflowState.completedSteps,
          avatars: false
        }
      });
    }
  }, [completeStep, updateWorkflowState, workflowState.completedSteps]);

  const updateScript = useCallback((content) => {
    const isCompleted = content && content.trim().length > 10;
    updateWorkflowState({ scriptContent: content });
    
    if (isCompleted) {
      completeStep('script');
      // No automatic navigation after completion
    }
  }, [completeStep, updateWorkflowState]);

  // Context value
  const contextValue = {
    activeTab,
    workflowState,
    steps: getStepsWithStatus(),
    navigateToTab,
    goToNextStep,
    goToPreviousStep,
    updateWorkflowState,
    completeStep,
    selectVoice,
    selectAvatar,
    updateScript
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

// Custom hook for using navigation
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  
  return context;
};

export default NavigationContext;