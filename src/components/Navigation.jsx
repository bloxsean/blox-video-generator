import React from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import './Navigation.css';
import { 
  Home as HomeIcon, 
  Mic as MicIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Assessment as SummaryIcon,
  Videocam as VideosIcon
} from '@mui/icons-material';

const Navigation = () => {
  const { activeTab, navigateToTab } = useNavigation();

  const navigationItems = [
    { id: 'home', label: 'Home', icon: <HomeIcon /> },
    { id: 'voices', label: 'Voices', icon: <MicIcon /> },
    { id: 'avatars', label: 'Avatars', icon: <PersonIcon /> },
    { id: 'script', label: 'Script', icon: <DescriptionIcon /> },
    { id: 'summary', label: 'Summary', icon: <SummaryIcon /> },
    { id: 'videos', label: 'Videos', icon: <VideosIcon /> }
  ];

  return (
    <nav className="navigation">
      <div className="navigation-container">
        {navigationItems.map((item) => (
          <div
            key={item.id}
            className={`navigation-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => navigateToTab(item.id)}
          >
            <div className="nav-icon">{item.icon}</div>
            <div className="nav-label">{item.label}</div>
          </div>
        ))}
      </div>
    </nav>
  );
};

export default Navigation; 