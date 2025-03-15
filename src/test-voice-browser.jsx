import React from 'react';
import { createRoot } from 'react-dom/client';
import VoiceBrowser from './components/VoiceBrowser';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// Create a mock for axios
const mock = new MockAdapter(axios);

// Mock data that matches the expected API response format
const mockVoiceData = {
  "error": null,
  "data": {
    "voices": [
      {
        "voice_id": "4af1c417143243c38d52e09df9d8d7b1",
        "language": "English",
        "gender": "male",
        "name": "Empathetic Eli",
        "preview_audio": "https://resource.heygen.ai/text_to_speech/R2kqRdR7HXQsBQwpdYqivM.mp3",
        "support_pause": true,
        "emotion_support": false,
        "support_interactive_avatar": false
      },
      {
        "voice_id": "1985984feded457b9d013b4f6551ac94",
        "language": "English",
        "gender": "Male",
        "name": "Tarquin",
        "preview_audio": "https://static.heygen.ai/voice_preview/5R5EWwcXSiGMWub5LEB5VV.wav",
        "support_pause": false,
        "emotion_support": true,
        "support_interactive_avatar": true
      }
    ]
  }
};

// Setup the mock response
mock.onGet('/api/voices').reply(200, mockVoiceData);

// Test component that wraps VoiceBrowser
const TestVoiceBrowser = () => {
  const handleSelectVoice = (voice) => {
    console.log('Selected voice:', voice);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Voice Browser Component Test</h1>
      <p>This is a test of the VoiceBrowser component with mock data.</p>
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
        <VoiceBrowser onSelectVoice={handleSelectVoice} />
      </div>
      <div style={{ marginTop: '20px' }}>
        <h2>Test Information</h2>
        <p>The component above is using mock data that matches the expected API response format:</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify(mockVoiceData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

// Render the test component
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<TestVoiceBrowser />);

// Log test information
console.log('=== VoiceBrowser Component Test ===');
console.log('Mock data provided to component:', mockVoiceData);
console.log('Expected behavior:');
console.log('1. Component should display 2 voice cards');
console.log('2. Each card should show name, language, gender, and feature tags');
console.log('3. Play Sample button should be present on each card');
console.log('4. Clicking a card should log the selected voice to console'); 