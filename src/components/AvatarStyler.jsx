import React, { useState, useEffect } from 'react';
import './AvatarStyler.css';

const AvatarStyler = ({ avatar, onChange, initialSettings = {} }) => {
  const [settings, setSettings] = useState({
    scale: 1.0,
    offset: { x: 0, y: 0 },
    avatar_style: 'normal',
    matting: false,
    circle_background_color: '#ffffff',
    ...initialSettings
  });

  useEffect(() => {
    // When avatar changes, maintain current settings but update preview
    onChange(settings);
  }, [avatar]);

  const handleStyleChange = (e) => {
    const newStyle = e.target.value;
    const newSettings = { ...settings, avatar_style: newStyle };
    setSettings(newSettings);
    onChange(newSettings);
  };

  const handleScaleChange = (e) => {
    const scale = parseFloat(e.target.value);
    const newSettings = { ...settings, scale };
    setSettings(newSettings);
    onChange(newSettings);
  };

  const handleOffsetChange = (axis, value) => {
    const offset = { ...settings.offset, [axis]: parseFloat(value) };
    const newSettings = { ...settings, offset };
    setSettings(newSettings);
    onChange(newSettings);
  };

  const handleMattingChange = (e) => {
    const matting = e.target.checked;
    const newSettings = { ...settings, matting };
    setSettings(newSettings);
    onChange(newSettings);
  };

  const handleCircleBackgroundChange = (e) => {
    const circle_background_color = e.target.value;
    const newSettings = { ...settings, circle_background_color };
    setSettings(newSettings);
    onChange(newSettings);
  };

  return (
    <div className="avatar-styler">
      <h3>Avatar Styling</h3>

      <div className="style-preview">
        {avatar && avatar.preview_image_url ? (
          <div 
            className={`avatar-preview-container ${settings.avatar_style}`}
            style={{
              transform: `scale(${settings.scale})`,
              marginLeft: `${settings.offset.x * 10}px`,
              marginTop: `${settings.offset.y * 10}px`,
              backgroundColor: settings.avatar_style === 'circle' ? settings.circle_background_color : 'transparent'
            }}
          >
            <img 
              src={avatar.preview_image_url} 
              alt={avatar.avatar_name || avatar.name || 'Avatar'} 
              className="avatar-preview-image"
            />
          </div>
        ) : (
          <div className="no-avatar-selected">
            No avatar selected
          </div>
        )}
      </div>

      <div className="style-controls">
        <div className="control-group">
          <label htmlFor="avatar-style">Style:</label>
          <select 
            id="avatar-style" 
            value={settings.avatar_style}
            onChange={handleStyleChange}
          >
            <option value="normal">Normal</option>
            <option value="closeUp">Close Up</option>
            <option value="circle">Circle</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="avatar-scale">
            Scale: {settings.scale.toFixed(1)}
          </label>
          <input 
            type="range" 
            id="avatar-scale"
            min="0.5" 
            max="2.0" 
            step="0.1"
            value={settings.scale}
            onChange={handleScaleChange}
          />
        </div>

        <div className="control-group">
          <label htmlFor="offset-x">
            Horizontal Offset: {settings.offset.x.toFixed(1)}
          </label>
          <input 
            type="range" 
            id="offset-x"
            min="-2" 
            max="2" 
            step="0.1"
            value={settings.offset.x}
            onChange={(e) => handleOffsetChange('x', e.target.value)}
          />
        </div>

        <div className="control-group">
          <label htmlFor="offset-y">
            Vertical Offset: {settings.offset.y.toFixed(1)}
          </label>
          <input 
            type="range" 
            id="offset-y"
            min="-2" 
            max="2" 
            step="0.1"
            value={settings.offset.y}
            onChange={(e) => handleOffsetChange('y', e.target.value)}
          />
        </div>

        <div className="control-group checkbox">
          <label htmlFor="matting">
            <input 
              type="checkbox" 
              id="matting"
              checked={settings.matting}
              onChange={handleMattingChange}
            />
            Enable matting
          </label>
          <div className="help-text">
            Matting removes the background from the avatar
          </div>
        </div>

        {settings.avatar_style === 'circle' && (
          <div className="control-group">
            <label htmlFor="circle-bg-color">Circle Background Color:</label>
            <div className="color-picker-wrapper">
              <input 
                type="color" 
                id="circle-bg-color"
                value={settings.circle_background_color} 
                onChange={handleCircleBackgroundChange}
              />
              <input 
                type="text" 
                value={settings.circle_background_color}
                onChange={handleCircleBackgroundChange}
                placeholder="#RRGGBB"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarStyler; 