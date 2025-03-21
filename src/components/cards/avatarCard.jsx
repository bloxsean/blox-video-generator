import * as React from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import VideoPlayer from '../VideoPlayer';
import { Chip } from '@mui/material';
import { FaTrash } from 'react-icons/fa';
import { Download, DownloadDoneOutlined } from '@mui/icons-material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export default function AvatarCard({ video }) {
  return (
    <Card sx={{ maxWidth: 345 }}>     
         <div className="video-preview">
            {getVideoPreview(video)}
        </div>  
       
      <CardContent sx={{ paddingLeft: 2, paddingRight: 2, paddingTop: 0, paddingBottom: 3, }}>   
       <span className="duration-chip">{formatDuration(video.duration)}</span>
        {/* <Typography gutterBottom variant="h5" component="div"> */}
        <Typography
            gutterBottom
            variant="h6"
            component="div"
            sx={{
                whiteSpace: 'nowrap',      // Prevent text from wrapping
                overflow: 'hidden',        // Hide overflow
                textOverflow: 'ellipsis',  // Add "..." for overflowed text
                maxWidth: '100%',          // Ensure it fits within the card
            }}
            >
          {video.title}
                      
        </Typography>
        {/* <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Info
        </Typography> */}
         {formatDate(video.created_at)}
                
        {/* { console.log(video)} */}
       
      </CardContent>
      <CardActions sx={{ paddingLeft: 2, paddingRight: 2, paddingTop: 0, paddingBottom: 3, }}>
     

            {video.proxied_video_url && (
        <a 
            href={video.proxied_video_url}
            download={`video-${video.video_id}.mp4`}
            onClick={(e) => {
            if (!video.proxied_video_url.includes('download=true') && video.download_url) {
                e.preventDefault();
                window.location.href = video.download_url;
                // Or use the document.createElement approach you have
            }
            }}
        >
            <Chip
            icon={<Download/>} 
            label="Download"
            variant="outlined"
            clickable
            />
        </a>
        )}


      </CardActions>
    </Card>


  );
}

// const formatDuration = (seconds) => {
//     const minutes = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
//   };
  const formatDuration = (seconds) => {
    const roundedSeconds = Math.round(seconds);
    const minutes = Math.floor(roundedSeconds / 60);
    const secs = roundedSeconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

const getVideoPreview = (video) => {
    // console.log(`VideoList: Preview for video ${video.video_id}:`, {
    //   status: video.status,
    //   thumbnail: video.thumbnail_url || 'NONE',
    //   video_url: video.proxied_video_url || 'NONE',
    //   enriched: video._enriched || false
    // });
    
    if (video.status === 'completed') {
      return (
        <VideoPlayer
          key={`player-${video.video_id}`}
          videoUrl={video.proxied_video_url || null}
          thumbnailUrl={video.thumbnail_url || '/placeholder-thumbnail.svg'}
          title={video.title}
          onError={(err) => console.error('Video playback error:', err)}
          rawVideo={video}
        />
      );
    }
    
    return (
      <div className="video-status-previewX">
        {video.status === 'processing' ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" fill="#dbeafe"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        ) : video.status === 'pending' ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" fill="#f3e8ff"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12" y2="16"></line>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" fill="#f3e8ff"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12" y2="16"></line>
          </svg>
        )}
        <div className="status-text">{video.status}</div>
      </div>
    );
  };
  

  const formatDate = (dateString) => {
    const date = typeof dateString === 'number' 
      ? new Date(dateString * 1000)
      : new Date(dateString);
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };  