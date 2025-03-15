import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { NavigationProvider } from './contexts/NavigationContext'
import NavigationWrapper from './wrappers/NavigationWrapper.jsx'

// Debug logging
console.log('main.jsx: Starting application initialization');
console.log('main.jsx: NavigationProvider available:', typeof NavigationProvider === 'function');

// Error handling for rendering
try {
  console.log('main.jsx: Setting up root with NavigationProvider');
  
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <NavigationProvider>
        {/* Debug element to confirm provider is working */}
        <div style={{ display: 'none' }} data-testid="navigation-provider-active">
          NavigationProvider is active
        </div>
        <App />
      </NavigationProvider>
    </React.StrictMode>,
  );
  
  console.log('main.jsx: Application rendering started successfully');
} catch (error) {
  console.error('CRITICAL ERROR in main.jsx:', error);
  
  // Fallback rendering with our minimal wrapper
  console.log('main.jsx: Attempting fallback render with NavigationWrapper');
  
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <NavigationWrapper>
        <div style={{ padding: '20px', backgroundColor: '#ffeeee', border: '2px solid red', margin: '20px' }}>
          <h2>Critical Error in Application Initialization</h2>
          <p>The main NavigationProvider could not be initialized.</p>
          <p>Error: {error.message}</p>
          <p>Using fallback navigation system instead.</p>
        </div>
        <App />
      </NavigationWrapper>
    </React.StrictMode>,
  );
} 