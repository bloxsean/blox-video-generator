import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

interface VideoStatusData {
  status: 'processing' | 'completed' | 'failed';
  video_url?: string;
  thumbnail_url?: string;
  error?: string;
}

interface VideoStatusProps {
  videoId: string;
}

function VideoStatus({ videoId }: VideoStatusProps) {
  const [videoStatus, setVideoStatus] = useState<VideoStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollInterval] = useState(5000); // 5 seconds

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const checkVideoStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/videos/${videoId}`);
        setVideoStatus(response.data);
        
        // If video is completed or failed, stop polling
        if (response.data.status === 'completed' || response.data.status === 'failed') {
          clearInterval(intervalId);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to check video status. Please try again.');
        console.error(err);
        clearInterval(intervalId);
      } finally {
        setLoading(false);
      }
    };
    
    // Initial check
    checkVideoStatus();
    
    // Set up polling
    intervalId = setInterval(checkVideoStatus, pollInterval);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [videoId, pollInterval]);

  if (loading && !videoStatus) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
        {error}
      </div>
    );
  }

  if (!videoStatus) {
    return (
      <div className="text-center py-10 text-gray-500">
        No video information available
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-medium text-gray-900">Video Generation Status</h2>
      
      <div className="mt-4">
        <div className="flex items-center">
          <span className="mr-2 font-medium text-gray-700">Status:</span>
          
          {videoStatus.status === 'processing' && (
            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
              Processing
            </span>
          )}
          
          {videoStatus.status === 'completed' && (
            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
              Completed
            </span>
          )}
          
          {videoStatus.status === 'failed' && (
            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
              Failed
            </span>
          )}
        </div>
      </div>
      
      {videoStatus.status === 'processing' && (
        <div className="mt-6">
          <p className="text-gray-600 mb-4">Your video is being generated. This may take a few minutes...</p>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div className="h-full bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}
      
      {videoStatus.status === 'completed' && videoStatus.video_url && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your video is ready!</h3>
          
          <div className="aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden">
            <video 
              controls
              src={videoStatus.video_url}
              poster={videoStatus.thumbnail_url}
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="mt-4">
            <a 
              href={videoStatus.video_url}
              download
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Download Video
            </a>
          </div>
        </div>
      )}
      
      {videoStatus.status === 'failed' && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          <p>Video generation failed: {videoStatus.error || 'Unknown error'}</p>
        </div>
      )}
    </div>
  );
}

export default VideoStatus; 