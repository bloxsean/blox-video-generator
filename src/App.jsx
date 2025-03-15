// THIS IS APP.JSX - If you see this comment in your app, then App.jsx is being used
import React, { useEffect, useState } from 'react';
import Home from './components/Home';
import './App.css';
import VoiceBrowser from './components/VoiceBrowser';
import AvatarBrowser from './components/AvatarBrowser';
import ScriptEditor from './components/ScriptEditor';
import VideoList from './components/VideoList';
import TestNavigation from './components/TestNavigation';
import { useNavigation } from './contexts/NavigationContext';

// Simple VoiceDebug component
const VoiceDebug = () => (
  <div className="debug-panel">
    <h3>Debug Information</h3>
    <p>API URL: {import.meta.env.VITE_API_URL || 'http://localhost:3001'}</p>
    <p>Voices Endpoint: {import.meta.env.VITE_VOICES_ENDPOINT || '/api/voices'}</p>
  </div>
);

// Loading component to display while context is initializing
const LoadingApp = () => (
  <div className="app-container" style={{ padding: '30px', textAlign: 'center' }}>
    <h1>Loading Application...</h1>
    <p>Initializing navigation system</p>
  </div>
);

// Main application component
function App() {
  console.log('App component rendering');
  // Use state to track if the context is ready
  const [isContextReady, setIsContextReady] = useState(false);
  
  // Safely access the navigation context
  let navigationContext;
  try {
    navigationContext = useNavigation();
    
    // If we get here, the context is available
    if (!isContextReady) {
      setIsContextReady(true);
    }
  } catch (error) {
    console.error('App: Error with NavigationContext:', error);
    
    // Fallback UI for when context is not available
    return (
      <div className="app-container" style={{ padding: '30px' }}>
        <h1>Navigation Error</h1>
        <div style={{ color: 'red', marginBottom: '20px' }}>
          <h3>Error: {error.message}</h3>
          <p>The application could not access the NavigationContext.</p>
        </div>
        
        <h2>Debugging Information:</h2>
        <pre style={{ 
          background: '#f1f1f1', 
          padding: '15px', 
          borderRadius: '5px',
          overflow: 'auto'
        }}>
          {JSON.stringify({
            error: error.message,
            stack: error.stack,
            time: new Date().toISOString()
          }, null, 2)}
        </pre>
        
        <div style={{ marginTop: '30px' }}>
          <TestNavigation />
        </div>
      </div>
    );
  }
  
  // Wait until context is fully ready before rendering the full app
  if (!isContextReady) {
    return <LoadingApp />;
  }
  
  // Destructure the context now that we know it's available
  const { activeTab, navigateToTab, workflowState } = navigationContext;
  const { selectedVoice } = workflowState;
  const [showDebug, setShowDebug] = React.useState(true);
  
  // Debug logging on mount
  useEffect(() => {
    console.log('App successfully connected to NavigationContext');
    console.log('Initial activeTab:', activeTab);
    console.log('Initial workflowState:', workflowState);
  }, [activeTab, workflowState]);

  return (
    <div className="app-container">
      <header>
        <h1>Voice & Avatar Video Generator</h1>
        
        {/* Include test component at the top for debugging */}
        <TestNavigation />
        
        <nav className="tab-navigation">
          <button 
            id="nav-tab-home"
            className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => navigateToTab('home')}
          >
            Home
          </button>
          <button 
            id="nav-tab-voices"
            className={`nav-tab ${activeTab === 'voices' ? 'active' : ''}`}
            onClick={() => navigateToTab('voices')}
          >
            Voices
          </button>
          <button 
            id="nav-tab-avatars"
            className={`nav-tab ${activeTab === 'avatars' ? 'active' : ''}`}
            onClick={() => navigateToTab('avatars')}
          >
            Avatars
          </button>
          <button 
            id="nav-tab-script"
            className={`nav-tab ${activeTab === 'script' ? 'active' : ''}`}
            onClick={() => navigateToTab('script')}
          >
            Script
          </button>
          <button 
            id="nav-tab-videos"
            className={`nav-tab ${activeTab === 'videos' ? 'active' : ''}`}
            onClick={() => navigateToTab('videos')}
          >
            Videos
          </button>
        </nav>
      </header>

      <main>
        {/* Render components based on active tab */}
        {activeTab === 'home' && <Home />}
        
        {activeTab === 'voices' && (
          <div className="voice-section">
            <div className="debug-toggle">
              <button 
                className="debug-button"
                onClick={() => setShowDebug(!showDebug)}
              >
                {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
              </button>
            </div>
            
            {showDebug && <VoiceDebug />}
            
            <VoiceBrowser />
            
            {selectedVoice && (
              <div className="selected-voice">
                <h3>Selected Voice: {selectedVoice.name}</h3>
                <p>Language: {selectedVoice.language}, Gender: {selectedVoice.gender}</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'avatars' && (
          <div className="avatar-section">
            <AvatarBrowser />
          </div>
        )}
        
        {activeTab === 'script' && (
          <div className="script-section">
            <ScriptEditor />
          </div>
        )}
        
        {activeTab === 'videos' && (
          <VideoList />
        )}
      </main>
    </div>
  );
}

export default App; 