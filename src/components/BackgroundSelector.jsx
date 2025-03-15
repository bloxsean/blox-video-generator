import React, { useState } from 'react';
import './BackgroundSelector.css';

const BackgroundSelector = ({ onChange, initialValue = { type: 'color', value: '#f6f6fc' } }) => {
  const [background, setBackground] = useState(initialValue);
  
  const handleTypeChange = (type) => {
    let newBackground;
    
    switch(type) {
      case 'color':
        newBackground = { type, value: background.type === 'color' ? background.value : '#f6f6fc' };
        break;
      case 'image':
        newBackground = { type, url: background.type === 'image' ? background.url : '', fit: 'cover' };
        break;
      case 'video':
        newBackground = { type, url: background.type === 'video' ? background.url : '', fit: 'cover', play_style: 'fit_to_scene' };
        break;
      default:
        newBackground = { type: 'color', value: '#f6f6fc' };
    }
    
    setBackground(newBackground);
    onChange(newBackground);
  };
  
  const handleColorChange = (e) => {
    const value = e.target.value;
    setBackground({ ...background, value });
    onChange({ ...background, value });
  };
  
  const handleUrlChange = (e) => {
    const url = e.target.value;
    setBackground({ ...background, url });
    onChange({ ...background, url });
  };
  
  const handleFitChange = (e) => {
    const fit = e.target.value;
    setBackground({ ...background, fit });
    onChange({ ...background, fit });
  };
  
  const handlePlayStyleChange = (e) => {
    const play_style = e.target.value;
    setBackground({ ...background, play_style });
    onChange({ ...background, play_style });
  };
  
  return (
    <div className="background-selector">
      <h3>Background</h3>
      
      <div className="background-type-tabs">
        <button 
          className={`tab-button ${background.type === 'color' ? 'active' : ''}`}
          onClick={() => handleTypeChange('color')}
        >
          Color
        </button>
        <button 
          className={`tab-button ${background.type === 'image' ? 'active' : ''}`}
          onClick={() => handleTypeChange('image')}
        >
          Image
        </button>
        <button 
          className={`tab-button ${background.type === 'video' ? 'active' : ''}`}
          onClick={() => handleTypeChange('video')}
        >
          Video
        </button>
      </div>
      
      <div className="background-options">
        {background.type === 'color' && (
          <div className="color-option">
            <label htmlFor="background-color">Background Color:</label>
            <div className="color-picker-wrapper">
              <input 
                type="color" 
                id="background-color"
                value={background.value} 
                onChange={handleColorChange}
              />
              <input 
                type="text" 
                value={background.value}
                onChange={handleColorChange}
                placeholder="#RRGGBB"
              />
            </div>
            <div className="color-preview" style={{ backgroundColor: background.value }}></div>
          </div>
        )}
        
        {background.type === 'image' && (
          <div className="url-option">
            <label htmlFor="image-url">Image URL:</label>
            <input 
              type="text" 
              id="image-url"
              value={background.url || ''} 
              onChange={handleUrlChange}
              placeholder="https://example.com/image.jpg"
            />
            
            <label htmlFor="image-fit">Fit:</label>
            <select 
              id="image-fit"
              value={background.fit || 'cover'} 
              onChange={handleFitChange}
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="crop">Crop</option>
              <option value="none">None</option>
            </select>
            
            {background.url && (
              <div className="url-preview">
                <img src={background.url} alt="Background preview" />
              </div>
            )}
          </div>
        )}
        
        {background.type === 'video' && (
          <div className="url-option">
            <label htmlFor="video-url">Video URL:</label>
            <input 
              type="text" 
              id="video-url"
              value={background.url || ''} 
              onChange={handleUrlChange}
              placeholder="https://example.com/video.mp4"
            />
            
            <label htmlFor="video-fit">Fit:</label>
            <select 
              id="video-fit"
              value={background.fit || 'cover'} 
              onChange={handleFitChange}
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="crop">Crop</option>
              <option value="none">None</option>
            </select>
            
            <label htmlFor="play-style">Play Style:</label>
            <select 
              id="play-style"
              value={background.play_style || 'fit_to_scene'} 
              onChange={handlePlayStyleChange}
            >
              <option value="fit_to_scene">Fit to Scene</option>
              <option value="freeze">Freeze</option>
              <option value="loop">Loop</option>
              <option value="once">Play Once</option>
            </select>
            
            {background.url && (
              <div className="url-preview">
                <video src={background.url} controls />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BackgroundSelector; 