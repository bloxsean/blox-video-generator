import React from 'react';
import ReactDOM from 'react-dom/client';
import StepperDemo from './components/StepperDemo';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme();

// Simple wrapper component
function StepperPage() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StepperDemo />
    </ThemeProvider>
  );
}

// Render directly to the DOM
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StepperPage />
  </React.StrictMode>
);

export default StepperPage; 