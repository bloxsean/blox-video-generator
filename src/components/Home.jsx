import React from 'react';
import './Home.css';
import { useNavigation } from '../contexts/NavigationContext';

// Content component that uses navigation after it's available
const HomeContent = ({ navigateToTab }) => {
  return (
    <div className="home-container">
      <div className="welcome-section">
        <h2>Create AI-Generated Videos with Avatars and Custom Voices</h2>
        <p>
          Welcome to our AI Video Generator! This application allows you to create
          professional-looking videos featuring realistic AI avatars speaking with
          natural-sounding voices.
        </p>
        
        <div className="get-started-btn-container">
          <button 
            className="get-started-btn"
            onClick={() => navigateToTab('voices')}
          >
            Get Started
          </button>
        </div>
      </div>
      
      <div className="workflow-overview">
        <h3>How It Works</h3>
        <div className="workflow-steps">
          <div className="workflow-step">
            <div className="step-number">1</div>
            <h4>Select a Voice</h4>
            <p>Choose from our library of natural-sounding AI voices.</p>
            <button 
              className="step-action-btn"
              onClick={() => navigateToTab('voices')}
            >
              Choose Voice
            </button>
          </div>
          
          <div className="workflow-step">
            <div className="step-number">2</div>
            <h4>Pick an Avatar</h4>
            <p>Select a realistic avatar that will speak your script.</p>
            <button 
              className="step-action-btn"
              onClick={() => navigateToTab('avatars')}
            >
              Browse Avatars
            </button>
          </div>
          
          <div className="workflow-step">
            <div className="step-number">3</div>
            <h4>Write Your Script</h4>
            <p>Enter the text you want your avatar to speak in the video.</p>
            <button 
              className="step-action-btn"
              onClick={() => navigateToTab('script')}
            >
              Create Script
            </button>
          </div>
          
          <div className="workflow-step">
            <div className="step-number">4</div>
            <h4>Generate Your Video</h4>
            <p>Review your selections and generate the final video.</p>
            <button 
              className="step-action-btn"
              onClick={() => navigateToTab('videos')}
            >
              Generate Video
            </button>
          </div>
        </div>
      </div>
      
      <div className="features-section">
        <h3>Key Features</h3>
        <div className="features-grid">
          <div className="feature-card">
            <h4>Realistic AI Voices</h4>
            <p>Choose from a wide range of natural-sounding voices in multiple languages and accents.</p>
          </div>
          
          <div className="feature-card">
            <h4>Lifelike Avatars</h4>
            <p>Select from our library of realistic digital avatars with natural expressions and movements.</p>
          </div>
          
          <div className="feature-card">
            <h4>Custom Scripts</h4>
            <p>Write your own script or use our templates to create engaging content for your videos.</p>
          </div>
          
          <div className="feature-card">
            <h4>Fast Generation</h4>
            <p>Our advanced AI generates high-quality videos in minutes, not hours.</p>
          </div>
          
          <div className="feature-card">
            <h4>Multiple Use Cases</h4>
            <p>Perfect for marketing, training, education, customer support, and more.</p>
          </div>
          
          <div className="feature-card">
            <h4>Easy Sharing</h4>
            <p>Download your videos in standard formats or share directly to social platforms.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Error fallback component
const HomeError = ({ error }) => (
  <div className="home-container" style={{ padding: '20px' }}>
    <div style={{ 
      padding: '20px', 
      border: '2px solid red', 
      borderRadius: '5px', 
      marginBottom: '20px' 
    }}>
      <h2>Navigation Context Error in Home Component</h2>
      <p>Error: {error.message}</p>
      <p>This component could not access the NavigationContext.</p>
      <ul>
        <li>The NavigationProvider is correctly set up in main.jsx</li>
        <li>There may be a circular dependency causing this issue</li>
        <li>The context hook may be called before the provider is ready</li>
      </ul>
    </div>
  </div>
);

// Main Home component with safe context access
const Home = () => {
  console.log('Home component rendering');
  
  try {
    // Safely try to access the navigation context
    const navigation = useNavigation();
    console.log('Home: Successfully connected to NavigationContext');
    
    // Pass only what's needed to the content component
    return <HomeContent navigateToTab={navigation.navigateToTab} />;
  } catch (error) {
    console.error('Home: Error accessing NavigationContext:', error);
    return <HomeError error={error} />;
  }
};

export default Home; 