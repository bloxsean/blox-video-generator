import React from 'react';
import './App.css';
import Home from './components/Home';
import VoiceBrowser from './components/VoiceBrowser';
import AvatarBrowser from './components/AvatarBrowser';
import ScriptEditor from './components/ScriptEditor';
import VideoList from './components/VideoList';
import VideoCreationSummary from './components/VideoCreationSummary';
import { useNavigation } from './contexts/NavigationContext';
import { FiVideo, FiMic, FiUser, FiEdit, FiHome } from 'react-icons/fi';

function App() {
  const { activeTab, navigateToTab } = useNavigation();

  const handleNavigation = (tabName: string) => {
    console.log('Navigating to:', tabName);
    navigateToTab(tabName);
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: <FiHome /> },
    { id: 'voices', label: 'Voices', icon: <FiMic /> },
    { id: 'avatars', label: 'Avatars', icon: <FiUser /> },
    { id: 'script', label: 'Script', icon: <FiEdit /> },
    { id: 'videos', label: 'Videos', icon: <FiVideo /> },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-container">
            <div 
              className="logo" 
              onClick={() => handleNavigation('home')}
              style={{ cursor: 'pointer' }}
            >
              <img src="/blox-logo.png" alt="Logo" className="logo-image" />
              {/* <svg viewBox="0 0 24 24">
                <defs>
                  <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
                <path d="M13 2.5V6h1.5v2h-7V6H9V2.5L12 1l1 1.5zM12 7.5c.69 0 1.25.56 1.25 1.25S12.69 10 12 10s-1.25-.56-1.25-1.25S11.31 7.5 12 7.5zM11 11h2v9h-2v-9z" />
              </svg> */}
            
            </div>
          </div>

          <nav className="nav-menu">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleNavigation(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main-content">
        {activeTab === 'home' && <Home />}
        {activeTab === 'voices' && <VoiceBrowser />}
        {activeTab === 'avatars' && <AvatarBrowser />}
        {activeTab === 'script' && <ScriptEditor />}
        {activeTab === 'summary' && <VideoCreationSummary />}
        {activeTab === 'videos' && <VideoList />}
      </main>
    </div>
  );
}

export default App;