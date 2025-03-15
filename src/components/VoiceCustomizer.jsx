import React, { useState, useEffect } from 'react';
import './VoiceCustomizer.css';

const VoiceCustomizer = ({ voice, onChange, initialSettings = {} }) => {
  const [settings, setSettings] = useState({
    speed: 1.0,
    pitch: 0,
    emotion: '',
    locale: '',
    ...initialSettings
  });

  // Supported emotions in HeyGen API
  const supportedEmotions = [
    { value: '', label: 'Default (No emotion)' },
    { value: 'Excited', label: 'Excited' },
    { value: 'Friendly', label: 'Friendly' },
    { value: 'Serious', label: 'Serious' },
    { value: 'Soothing', label: 'Soothing' },
    { value: 'Broadcaster', label: 'Broadcaster' }
  ];

  // Common locales for multilingual voices
  const commonLocales = [
    { value: '', label: 'Default' },
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'en-AU', label: 'English (Australia)' },
    { value: 'en-IN', label: 'English (India)' },
    { value: 'pt-BR', label: 'Portuguese (Brazil)' },
    { value: 'pt-PT', label: 'Portuguese (Portugal)' },
    { value: 'es-ES', label: 'Spanish (Spain)' },
    { value: 'es-MX', label: 'Spanish (Mexico)' },
    { value: 'fr-FR', label: 'French' },
    { value: 'de-DE', label: 'German' },
  ];

  useEffect(() => {
    // When voice changes, maintain current settings
    onChange(settings);
  }, [voice]);

  const handleSpeedChange = (e) => {
    const speed = parseFloat(e.target.value);
    const newSettings = { ...settings, speed };
    setSettings(newSettings);
    onChange(newSettings);
  };

  const handlePitchChange = (e) => {
    const pitch = parseInt(e.target.value, 10);
    const newSettings = { ...settings, pitch };
    setSettings(newSettings);
    onChange(newSettings);
  };

  const handleEmotionChange = (e) => {
    const emotion = e.target.value;
    const newSettings = { ...settings, emotion: emotion || '' };
    setSettings(newSettings);
    onChange(newSettings);
  };

  const handleLocaleChange = (e) => {
    const locale = e.target.value;
    const newSettings = { ...settings, locale: locale || '' };
    setSettings(newSettings);
    onChange(newSettings);
  };

  return (
    <div className="voice-customizer">
      <h3>Voice Settings</h3>

      <div className="voice-preview">
        {voice ? (
          <div className="voice-info">
            <div className="voice-name">
              {voice.voice_name || voice.name}
              {settings.emotion && (
                <span className="voice-emotion-tag">{settings.emotion}</span>
              )}
            </div>
            
            {voice.language && (
              <div className="voice-language">
                Language: {voice.language}
                {settings.locale && ` (${settings.locale})`}
              </div>
            )}
            
            {voice.gender && (
              <div className="voice-gender">
                Gender: {voice.gender}
              </div>
            )}
          </div>
        ) : (
          <div className="no-voice-selected">
            No voice selected
          </div>
        )}
      </div>

      <div className="voice-controls">
        <div className="control-group">
          <label htmlFor="voice-speed">
            Speed: {settings.speed.toFixed(1)}x
          </label>
          <input 
            type="range" 
            id="voice-speed"
            min="0.5" 
            max="1.5" 
            step="0.1"
            value={settings.speed}
            onChange={handleSpeedChange}
          />
          <div className="range-labels">
            <span>Slower</span>
            <span>Faster</span>
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="voice-pitch">
            Pitch: {settings.pitch > 0 ? `+${settings.pitch}` : settings.pitch}
          </label>
          <input 
            type="range" 
            id="voice-pitch"
            min="-50" 
            max="50" 
            step="1"
            value={settings.pitch}
            onChange={handlePitchChange}
          />
          <div className="range-labels">
            <span>Lower</span>
            <span>Higher</span>
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="voice-emotion">Emotion:</label>
          <select 
            id="voice-emotion" 
            value={settings.emotion}
            onChange={handleEmotionChange}
          >
            {supportedEmotions.map(emotion => (
              <option key={emotion.value} value={emotion.value}>
                {emotion.label}
              </option>
            ))}
          </select>
          <div className="help-text">
            Not all voices support emotions. If unsupported, default will be used.
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="voice-locale">Accent/Locale:</label>
          <select 
            id="voice-locale" 
            value={settings.locale}
            onChange={handleLocaleChange}
          >
            {commonLocales.map(locale => (
              <option key={locale.value} value={locale.value}>
                {locale.label}
              </option>
            ))}
          </select>
          <div className="help-text">
            For multilingual voices, specify accent or regional variation.
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceCustomizer; 