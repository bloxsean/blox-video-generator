import React, { useState, useEffect } from 'react';
import axios from 'axios';

const VoiceDebug = () => {
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setLoading(true);
        console.log('Fetching voices from server...');
        const response = await axios.get('/api/voices');
        console.log('Response received:', response);
        setApiResponse(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching voices:', err);
        setError(err.message || 'Failed to fetch voices');
        setLoading(false);
      }
    };

    fetchVoices();
  }, []);

  if (loading) return <div className="debug-loading">Loading data from API...</div>;
  if (error) return <div className="debug-error">Error: {error}</div>;

  // Check response structure
  const hasError = apiResponse?.error !== null;
  const hasData = apiResponse?.data && typeof apiResponse.data === 'object';
  const hasVoices = hasData && Array.isArray(apiResponse.data.voices);
  const voiceCount = hasVoices ? apiResponse.data.voices.length : 0;

  return (
    <div className="voice-debug">
      <h2>Voice API Debug Information</h2>
      
      <div className="debug-controls">
        <button onClick={() => setShowRaw(!showRaw)}>
          {showRaw ? 'Show Summary' : 'Show Raw Response'}
        </button>
      </div>

      <div className="debug-info">
        <h3>Response Structure Check</h3>
        <ul>
          <li>Response received: <span className="status-ok">✓</span></li>
          <li>
            Error field is null: 
            {hasError ? 
              <span className="status-error">✗ (Error: {JSON.stringify(apiResponse.error)})</span> : 
              <span className="status-ok">✓</span>
            }
          </li>
          <li>
            Has data object: 
            {hasData ? 
              <span className="status-ok">✓</span> : 
              <span className="status-error">✗</span>
            }
          </li>
          <li>
            Has voices array: 
            {hasVoices ? 
              <span className="status-ok">✓ ({voiceCount} voices)</span> : 
              <span className="status-error">✗</span>
            }
          </li>
        </ul>
      </div>

      {hasVoices && voiceCount > 0 && (
        <div className="sample-voice">
          <h3>Sample Voice Object</h3>
          <pre>{JSON.stringify(apiResponse.data.voices[0], null, 2)}</pre>
        </div>
      )}

      {showRaw && (
        <div className="raw-response">
          <h3>Raw API Response</h3>
          <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
        </div>
      )}

      <style jsx>{`
        .voice-debug {
          padding: 20px;
          background-color: #f5f5f5;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .debug-controls {
          margin-bottom: 15px;
        }
        .debug-controls button {
          padding: 8px 16px;
          background-color: #4a90e2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .debug-info {
          background-color: white;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 15px;
        }
        .status-ok {
          color: green;
          font-weight: bold;
        }
        .status-error {
          color: red;
          font-weight: bold;
        }
        .sample-voice, .raw-response {
          background-color: white;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 15px;
          overflow: auto;
        }
        pre {
          background-color: #f0f0f0;
          padding: 10px;
          border-radius: 4px;
          overflow: auto;
        }
        .debug-loading, .debug-error {
          padding: 20px;
          text-align: center;
          background-color: #f5f5f5;
          border-radius: 8px;
        }
        .debug-error {
          color: red;
        }
      `}</style>
    </div>
  );
};

export default VoiceDebug; 