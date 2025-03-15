import React, { useState } from 'react';
import './VideoDimensionSelector.css';

const VideoDimensionSelector = ({ onChange, initialDimension = { width: 1920, height: 1080 } }) => {
  const [dimension, setDimension] = useState(initialDimension);
  const [customDimensions, setCustomDimensions] = useState(false);
  
  // Common video dimensions presets
  const presets = [
    { name: 'Full HD (16:9)', width: 1920, height: 1080 },
    { name: 'HD (16:9)', width: 1280, height: 720 },
    { name: 'Square (1:1)', width: 1080, height: 1080 },
    { name: 'Vertical (9:16)', width: 1080, height: 1920 },
    { name: 'Instagram Story', width: 1080, height: 1920 },
    { name: 'YouTube', width: 1920, height: 1080 },
    { name: 'TikTok', width: 1080, height: 1920 },
  ];
  
  const handlePresetChange = (e) => {
    const selected = e.target.value;
    
    if (selected === 'custom') {
      setCustomDimensions(true);
    } else {
      const [width, height] = selected.split('x').map(Number);
      const newDimension = { width, height };
      setDimension(newDimension);
      setCustomDimensions(false);
      onChange(newDimension);
    }
  };
  
  const handleWidthChange = (e) => {
    const width = parseInt(e.target.value, 10) || 0;
    const newDimension = { ...dimension, width };
    setDimension(newDimension);
    onChange(newDimension);
  };
  
  const handleHeightChange = (e) => {
    const height = parseInt(e.target.value, 10) || 0;
    const newDimension = { ...dimension, height };
    setDimension(newDimension);
    onChange(newDimension);
  };
  
  // Determine which preset is currently active
  const getCurrentPresetValue = () => {
    if (customDimensions) return 'custom';
    
    const matchingPreset = presets.find(preset => 
      preset.width === dimension.width && preset.height === dimension.height
    );
    
    return matchingPreset 
      ? `${matchingPreset.width}x${matchingPreset.height}` 
      : 'custom';
  };
  
  return (
    <div className="video-dimension-selector">
      <h3>Video Dimensions</h3>
      
      <div className="dimension-controls">
        <div className="control-group">
          <label htmlFor="dimension-preset">Preset:</label>
          <select 
            id="dimension-preset" 
            value={getCurrentPresetValue()}
            onChange={handlePresetChange}
          >
            {presets.map(preset => (
              <option 
                key={`${preset.width}x${preset.height}`} 
                value={`${preset.width}x${preset.height}`}
              >
                {preset.name} ({preset.width}x{preset.height})
              </option>
            ))}
            <option value="custom">Custom Dimensions</option>
          </select>
        </div>
        
        {(customDimensions || getCurrentPresetValue() === 'custom') && (
          <div className="custom-dimension-inputs">
            <div className="control-group">
              <label htmlFor="width">Width (px):</label>
              <input 
                type="number" 
                id="width"
                min="320" 
                max="3840"
                value={dimension.width} 
                onChange={handleWidthChange}
              />
            </div>
            
            <div className="control-group">
              <label htmlFor="height">Height (px):</label>
              <input 
                type="number" 
                id="height"
                min="320" 
                max="2160"
                value={dimension.height} 
                onChange={handleHeightChange}
              />
            </div>
          </div>
        )}
        
        <div className="dimension-preview">
          <div 
            className="preview-box"
            style={{
              width: `${Math.min(dimension.width / 20, 200)}px`,
              height: `${Math.min(dimension.height / 20, 200)}px`,
              maxWidth: '200px',
              maxHeight: '200px'
            }}
          >
            <span>{dimension.width} × {dimension.height}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDimensionSelector; 