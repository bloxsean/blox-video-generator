import React, { createContext, useContext, useState, useCallback } from 'react';

// Create an internal context
const FallbackNavContext = createContext({
  activeTab: 'home',
  navigateToTab: () => {},
  workflowState: {
    selectedVoice: null,
    selectedAvatar: null,
    scriptContent: '',
    activeStep: 0,
    completedSteps: {}
  }
});

/**
 * A self-contained minimal Navigation Provider as a fallback
 */
export const NavigationWrapper = ({ children }) => {
  console.log('NavigationWrapper: Initializing fallback navigation system');
  
  const [activeTab, setActiveTab] = useState('home');
  const [workflowState, setWorkflowState] = useState({
    selectedVoice: null,
    selectedAvatar: null,
    scriptContent: '',
    activeStep: 0,
    completedSteps: {}
  });
  
  const navigateToTab = useCallback((tabName) => {
    console.log(`NavigationWrapper: Navigate to ${tabName}`);
    setActiveTab(tabName);
  }, []);
  
  const contextValue = {
    activeTab,
    navigateToTab,
    workflowState,
    steps: [],
    goToNextStep: () => console.log('goToNextStep - minimal implementation'),
    goToPreviousStep: () => console.log('goToPreviousStep - minimal implementation'),
    updateWorkflowState: (data) => setWorkflowState(prev => ({ ...prev, ...data })),
    completeStep: () => console.log('completeStep - minimal implementation'),
    selectVoice: (voice) => setWorkflowState(prev => ({ ...prev, selectedVoice: voice })),
    selectAvatar: (avatar) => setWorkflowState(prev => ({ ...prev, selectedAvatar: avatar })),
    updateScript: (script) => setWorkflowState(prev => ({ ...prev, scriptContent: script }))
  };
  
  return (
    <FallbackNavContext.Provider value={contextValue}>
      {children}
    </FallbackNavContext.Provider>
  );
};

// Export a hook to access this context
export const useFallbackNavigation = () => {
  return useContext(FallbackNavContext);
};

export default NavigationWrapper; 