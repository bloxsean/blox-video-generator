import React, { createContext, useContext, useState, useCallback } from 'react';

// Create the context with a default value
const NavigationContext = createContext({
  // Default values
  activeTab: 'home',
  workflowState: {
    selectedVoice: null,
    selectedAvatar: null,
    scriptContent: '',
    activeStep: 0,
    completedSteps: {}
  },
  steps: [],
  navigateToTab: () => console.warn('NavigateToTab called outside provider'),
  goToNextStep: () => console.warn('GoToNextStep called outside provider'),
  goToPreviousStep: () => console.warn('GoToPreviousStep called outside provider'),
  updateWorkflowState: () => console.warn('UpdateWorkflowState called outside provider'),
  completeStep: () => console.warn('CompleteStep called outside provider'),
  selectVoice: () => console.warn('SelectVoice called outside provider'),
  selectAvatar: () => console.warn('SelectAvatar called outside provider'),
  updateScript: () => console.warn('UpdateScript called outside provider')
});

// Define the workflow steps for the entire application
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

/**
 * Provider component for the navigation context
 */
export const NavigationProvider = ({ children }) => {
  // Debug initialization
  console.log('NavigationProvider initializing...');
  
  // State for the active tab
  const [activeTab, setActiveTab] = useState('home');
  
  // State for the workflow data
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

  // Navigation function (wrapped in useCallback for stable reference)
  const navigateToTab = useCallback((tabName) => {
    console.log(`NavigationContext: Navigating to ${tabName}`);
    
    // Validate tab name
    if (!tabName || typeof tabName !== 'string') {
      console.error('NavigationContext: Invalid tab name:', tabName);
      return;
    }
    
    // Update the active tab
    setActiveTab(tabName);
    
    // Find the step index for this tab
    const stepIndex = WORKFLOW_STEPS.findIndex(step => step.tabName === tabName);
    if (stepIndex >= 0) {
      setWorkflowState(prev => ({
        ...prev,
        activeStep: stepIndex
      }));
    }
  }, []);

  // Function to update workflow state
  const updateWorkflowState = useCallback((updates) => {
    setWorkflowState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Function to mark a step as completed
  const completeStep = useCallback((stepId, data = {}) => {
    console.log(`NavigationContext: Completing step ${stepId}`, data);
    
    setWorkflowState(prev => {
      // Merge any data provided
      const newState = {
        ...prev,
        ...data,
        completedSteps: {
          ...prev.completedSteps,
          [stepId]: true
        }
      };
      
      return newState;
    });
  }, []);

  // Function to handle next step in the workflow
  const goToNextStep = useCallback(() => {
    const currentStep = workflowState.activeStep;
    const nextStep = currentStep + 1;
    
    if (nextStep < WORKFLOW_STEPS.length) {
      const nextTabName = WORKFLOW_STEPS[nextStep].tabName;
      navigateToTab(nextTabName);
    }
  }, [workflowState.activeStep, navigateToTab]);

  // Function to handle previous step in the workflow
  const goToPreviousStep = useCallback(() => {
    const currentStep = workflowState.activeStep;
    const prevStep = currentStep - 1;
    
    if (prevStep >= 0) {
      const prevTabName = WORKFLOW_STEPS[prevStep].tabName;
      navigateToTab(prevTabName);
    }
  }, [workflowState.activeStep, navigateToTab]);

  // Get the current steps with completion status
  const getStepsWithStatus = useCallback(() => {
    return WORKFLOW_STEPS.map(step => ({
      ...step,
      completed: workflowState.completedSteps[step.id] || false
    }));
  }, [workflowState.completedSteps]);

  // Helper function for selecting a voice
  const selectVoice = useCallback((voice) => {
    completeStep('voices', { selectedVoice: voice });
  }, [completeStep]);
  
  // Helper function for selecting an avatar
  const selectAvatar = useCallback((avatar) => {
    completeStep('avatars', { selectedAvatar: avatar });
  }, [completeStep]);
  
  // Helper function for updating the script
  const updateScript = useCallback((content) => {
    const isCompleted = content && content.trim().length > 10; // Minimum script length
    if (isCompleted) {
      completeStep('script', { scriptContent: content });
    } else {
      updateWorkflowState({ scriptContent: content });
    }
  }, [completeStep, updateWorkflowState]);

  // Provide all values and functions to components
  const contextValue = {
    // Current state
    activeTab,
    workflowState,
    steps: getStepsWithStatus(),
    
    // Navigation functions
    navigateToTab,
    goToNextStep,
    goToPreviousStep,
    
    // State update functions
    updateWorkflowState,
    completeStep,
    
    // Voice-specific handlers
    selectVoice,
    
    // Avatar-specific handlers
    selectAvatar,
    
    // Script-specific handlers
    updateScript
  };

  console.log('NavigationProvider rendering with context:', {
    activeTab, 
    stepsCount: getStepsWithStatus().length
  });

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

/**
 * Custom hook to use the navigation context
 */
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  
  if (!context) {
    console.error('useNavigation called outside of NavigationProvider!');
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  
  return context;
};

// Export the context directly in case someone needs direct access
export default NavigationContext; 