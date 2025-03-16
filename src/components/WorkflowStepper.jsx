import React from 'react';
import './WorkflowStepper.css';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';

const WorkflowStepper = ({ 
  steps,
  activeStep,
  onNext,
  onBack,
  onStepClick,
  currentPage,
  isProcessing = false
}) => {
  // Calculate progress percentage
  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = Math.round((completedSteps / steps.length) * 100);

  // Determine if next button should be disabled
  const isNextDisabled = () => {
    if (activeStep >= steps.length - 1) return true;
    return !steps[activeStep]?.completed;
  };

  // Get guidance message
  const getGuidanceMessage = () => {
    const step = steps[activeStep];
    if (!step) return '';

    if (step.completed) {
      return `${step.label} completed! ${activeStep < steps.length - 1 ? 'Click Next to continue' : 'Review and complete'}`;
    } else {
      return step.guidanceMessage || 'Complete this step to continue';
    }
  };

  return (
    <div className="workflow-stepper">
      {/* Progress bar */}
      <div className="progress-bar">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="progress-text">{progressPercentage}% Complete</div>

      {/* Steps */}
      <div className="stepper">
        {steps.map((step, index) => (
          <div 
            key={step.label}
            className={`step ${step.completed ? 'completed' : ''} ${index === activeStep ? 'active' : ''}`}
            onClick={() => step.tabName && onStepClick(step.tabName)}
            style={{ cursor: step.tabName ? 'pointer' : 'default' }}
          >
            <div className="step-number">
              {step.completed ? '✓' : index + 1}
            </div>
            <div className="step-label">{step.label}</div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="stepper-navigation">
        <button
          className="nav-button back-button"
          onClick={onBack}
          disabled={activeStep === 0}
        >
          <FiArrowLeft />
          Back
        </button>

        <button
          className="nav-button next-button"
          onClick={onNext}
          disabled={isNextDisabled() || isProcessing}
        >
          Next
          <FiArrowRight />
        </button>
      </div>

      {/* Guidance message */}
      <div className="guidance-message">
        {getGuidanceMessage()}
      </div>
    </div>
  );
};

export default WorkflowStepper;