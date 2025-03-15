import React, { useState } from 'react';
import { 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  Typography, 
  Paper,
  Container
} from '@mui/material';

const steps = [
  'Select Template',
  'Choose Avatar',
  'Configure Voice',
  'Generate Video'
];

function StepperDemo() {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          HeyGen Video Generator
        </Typography>
        
        <Box sx={{ width: '100%', my: 4 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        
        <Box sx={{ mt: 4, mb: 2 }}>
          {activeStep === steps.length ? (
            <>
              <Typography variant="h6" gutterBottom>
                All steps completed - your video is ready!
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button 
                  variant="contained" 
                  onClick={handleReset}
                  sx={{ minWidth: 200 }}
                >
                  Create Another Video
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                Step {activeStep + 1}: {steps[activeStep]}
              </Typography>
              <Typography color="text.secondary" paragraph>
                This is a demo of the Material UI Stepper component. 
                In a real application, this area would contain the form fields 
                or options for the current step.
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  variant="outlined"
                  disabled={activeStep === 0}
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleNext}
                >
                  {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default StepperDemo; 