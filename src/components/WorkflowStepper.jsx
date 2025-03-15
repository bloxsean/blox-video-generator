import React, { useEffect } from 'react';
import { Box, Stepper, Step, StepLabel, Button, Typography } from '@mui/material';
import './WorkflowStepper.css';
import { useNavigation } from '../contexts/NavigationContext';

/**
 * WorkflowStepper - A reusable stepper component for multi-step workflows
 * 
 * @param {Object} props
 * @param {Array} props.steps - Array of step objects with label, description, completed, and tabName properties
 * @param {number} props.activeStep - Current active step index
 * @param {function} props.onNext - Function to call when Next button is clicked
 * @param {function} props.onBack - Function to call when Back button is clicked
 * @param {function} props.onComplete - Function to call when the final step's action button is clicked
 * @param {string} props.currentPage - Current page/tab name to highlight the corresponding step
 * @param {boolean} props.isProcessing - Whether an action is currently being processed
 * @param {function} props.onStepClick - Optional function to call when a step is clicked (for navigation)
 */
const WorkflowStepper = ({ 
  onComplete,
  currentPage,
  isProcessing = false,
  // Legacy props for backwards compatibility
  onNext: legacyOnNext,
  onBack: legacyOnBack,
  onStepClick: legacyOnStepClick,
  // The following props are now provided by context
  steps: providedSteps,
  activeStep: providedActiveStep
}) => {
  // Use the navigation context for state and navigation functions
  const {
    steps: contextSteps,
    workflowState,
    navigateToTab,
    goToNextStep,
    goToPreviousStep
  } = useNavigation();
  
  // Use provided steps/activeStep if available, otherwise use from context
  const steps = providedSteps || contextSteps;
  const activeStep = providedActiveStep !== undefined ? providedActiveStep : workflowState.activeStep;

  // Log component info on mount
  useEffect(() => {
    console.log("WorkflowStepper mounted with context:", {
      activeStep,
      currentPage,
      stepsCount: steps.length,
      stepsFromContext: !!contextSteps,
      activeStepFromContext: workflowState.activeStep
    });
  }, []);

  // Calculate overall progress as a percentage
  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = Math.round((completedSteps / steps.length) * 100);

  // Determine if the next button should be disabled based on the current step's completion
  const isNextDisabled = () => {
    if (activeStep >= steps.length - 1) return true;
    return !steps[activeStep]?.completed;
  };

  // Determine if the complete button should be disabled
  const isCompleteDisabled = () => {
    // Check if all required steps are completed
    const requiredStepsCompleted = steps
      .filter(step => step.required !== false)
      .every(step => step.completed);
    
    return !requiredStepsCompleted || isProcessing;
  };

  // Get guidance message based on current step and completion status
  const getGuidanceMessage = () => {
    const step = steps[activeStep];
    if (!step) return '';

    if (step.completed) {
      return `${step.label} completed! ${activeStep < steps.length - 1 ? 'Click Next to continue' : 'Review and complete'}`;
    } else {
      return step.guidanceMessage || `Complete this step to continue`;
    }
  };

  // Handle the next button click - use context if available
  const handleNextClick = () => {
    console.log('WorkflowStepper: Next button clicked');
    
    // Use the context navigation if available
    goToNextStep();
    
    // Call legacy callback for backward compatibility
    if (typeof legacyOnNext === 'function') {
      console.log('WorkflowStepper: Calling legacy onNext callback');
      legacyOnNext();
    }
  };

  // Handle the back button click - use context if available
  const handleBackClick = () => {
    console.log('WorkflowStepper: Back button clicked');
    
    // Use the context navigation if available
    goToPreviousStep();
    
    // Call legacy callback for backward compatibility
    if (typeof legacyOnBack === 'function') {
      console.log('WorkflowStepper: Calling legacy onBack callback');
      legacyOnBack();
    }
  };

  // Handle step click - use context if available
  const handleStepClick = (tabName) => {
    console.log(`WorkflowStepper: Step clicked for tab ${tabName}`);
    
    // Use the context navigation if available
    navigateToTab(tabName);
    
    // Call legacy callback for backward compatibility
    if (typeof legacyOnStepClick === 'function') {
      console.log('WorkflowStepper: Calling legacy onStepClick callback');
      legacyOnStepClick(tabName);
    }
  };

  return (
    <div className="workflow-stepper">
      {/* Progress bar */}
      <Box sx={{ 
        height: '8px', 
        width: '100%', 
        backgroundColor: '#e0e0e0', 
        borderRadius: '4px',
        mb: 2
      }}>
        <Box sx={{ 
          height: '100%', 
          width: `${progressPercentage}%`, 
          backgroundColor: '#4caf50', 
          borderRadius: '4px',
          transition: 'width 0.3s ease'
        }} />
      </Box>
      
      {/* Progress percentage */}
      <Typography sx={{ mb: 2, fontWeight: 'bold' }}>
        {progressPercentage}% Complete
      </Typography>
      
      {/* Stepper component */}
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((step, index) => (
          <Step 
            key={step.label} 
            completed={step.completed}
            onClick={() => {
              if (step.tabName) {
                handleStepClick(step.tabName);
              }
            }}
            sx={{ cursor: step.tabName ? 'pointer' : 'default' }}
          >
            <StepLabel>
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {/* Step description */}
      <Box sx={{ mt: 2, mb: 1 }}>
        <Typography variant="subtitle1" color="text.secondary">
          {steps[activeStep]?.description}
        </Typography>
      </Box>
      
      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button
          variant="outlined"
          disabled={activeStep === 0}
          onClick={handleBackClick}
        >
          Back
        </Button>
        
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            color="primary"
            onClick={onComplete}
            disabled={isCompleteDisabled()}
          >
            {isProcessing ? 'Processing...' : 'Complete'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNextClick}
            disabled={isNextDisabled()}
          >
            Next
          </Button>
        )}
      </Box>
      
      {/* Guidance message */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <div className="guidance-message">{getGuidanceMessage()}</div>
      </Box>
    </div>
  );
};

export default WorkflowStepper; 