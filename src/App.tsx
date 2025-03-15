import React, { useState, useEffect } from 'react';
import './App.css';
import Home from './components/Home';
import VoiceBrowser from './components/VoiceBrowser';
import AvatarBrowser from './components/AvatarBrowser';
import ScriptEditor from './components/ScriptEditor';
import WorkflowPanel from './components/WorkflowPanel';
import VideoList from './components/VideoList';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  
  // State for selected items
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [scriptContent, setScriptContent] = useState('');
  
  // State for workflow panel
  const [showWorkflow, setShowWorkflow] = useState(true);
  
  // Handle voice selection
  const handleVoiceSelect = (voice) => {
    setSelectedVoice(voice);
    console.log('Selected voice:', voice);
  };
  
  // Handle avatar selection
  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
    console.log('Selected avatar:', avatar);
  };
  
  // Handle script changes
  const handleScriptChange = (script) => {
    setScriptContent(script);
  };
  
  // Determine workflow progress
  const hasVoice = selectedVoice !== null;
  const hasAvatar = selectedAvatar !== null;
  const hasScript = scriptContent.trim().length > 0;
  
  // Function to handle tab changes
  const changeTab = (tabName) => {
    setActiveTab(tabName);
  };
  
  // Toggle workflow panel visibility
  const toggleWorkflow = () => {
    setShowWorkflow(!showWorkflow);
  };
  
  // Effect to guide new users to the workflow
  useEffect(() => {
    // If no selections made and on home screen, show workflow panel
    if (!hasVoice && !hasAvatar && !hasScript && activeTab === 'home') {
      setShowWorkflow(true);
    }
  }, [activeTab, hasVoice, hasAvatar, hasScript]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">AI Video Generator</div>
        <nav className="tabs">
          <button 
            className={activeTab === 'home' ? 'active' : ''} 
            onClick={() => changeTab('home')}
          >
            Home
          </button>
          <button 
            className={activeTab === 'voices' ? 'active' : ''} 
            onClick={() => changeTab('voices')}
          >
            Voices
            {hasVoice && <span className="selection-indicator">✓</span>}
          </button>
          <button 
            className={activeTab === 'avatars' ? 'active' : ''} 
            onClick={() => changeTab('avatars')}
          >
            Avatars
            {hasAvatar && <span className="selection-indicator">✓</span>}
          </button>
          <button 
            className={activeTab === 'script' ? 'active' : ''} 
            onClick={() => changeTab('script')}
          >
            Script
            {hasScript && <span className="selection-indicator">✓</span>}
          </button>
          <button 
            className={activeTab === 'videos' ? 'active' : ''} 
            onClick={() => changeTab('videos')}
          >
            Videos
          </button>
        </nav>
        <div className="actions">
          <button 
            className="workflow-toggle"
            onClick={toggleWorkflow}
            title={showWorkflow ? 'Hide workflow panel' : 'Show workflow panel'}
          >
            {showWorkflow ? 'Hide Guide' : 'Show Guide'}
          </button>
        </div>
      </header>

      <main className="app-content">
        {activeTab === 'home' && <Home onGetStarted={() => changeTab('voices')} />}
        
        {activeTab === 'voices' && (
          <VoiceBrowser 
            onVoiceSelect={handleVoiceSelect}
            selectedVoice={selectedVoice}
          />
        )}
        
        {activeTab === 'avatars' && (
          <AvatarBrowser 
            onAvatarSelect={handleAvatarSelect}
            selectedAvatar={selectedAvatar}
          />
        )}
        
        {activeTab === 'script' && (
          <ScriptEditor
            selectedVoice={selectedVoice}
            selectedAvatar={selectedAvatar}
            scriptContent={scriptContent}
            onScriptChange={handleScriptChange}
          />
        )}
        
        {activeTab === 'videos' && (
          <VideoList />
        )}
      </main>
      
      <WorkflowPanel
        hasVoice={hasVoice}
        hasAvatar={hasAvatar}
        hasScript={hasScript}
        activeTab={activeTab}
        onTabChange={changeTab}
        onClose={() => setShowWorkflow(false)}
        visible={showWorkflow && activeTab !== 'home'}
      />
    </div>
  );
}

export default App;
