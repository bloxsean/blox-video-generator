import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail_url?: string;
}

interface TemplateBrowserProps {
  onSelectTemplate: (templateId: string) => void;
}

interface ErrorResponse {
  error: string;
  details?: string;
  timestamp?: string;
}

function TemplateBrowser({ onSelectTemplate }: TemplateBrowserProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);
        setErrorDetails(null);

        console.log('Fetching templates...');
        const response = await axios.get(`${API_BASE_URL}/templates`);
        console.log('API Response:', response.data);
        
        // Handle the specific response format we're getting
        if (response.data && response.data.error === null) {
          // Check if data.data is an array
          if (response.data.data && Array.isArray(response.data.data)) {
            setTemplates(response.data.data);
          } 
          // Check if data.data.templates is an array (possible nested structure)
          else if (response.data.data && Array.isArray(response.data.data.templates)) {
            setTemplates(response.data.data.templates);
          }
          // If data.data is an object with template properties
          else if (response.data.data && typeof response.data.data === 'object') {
            console.log('Data object structure:', response.data.data);
            // Let's try to extract templates from the data object
            // This is a fallback approach
            const extractedTemplates = [];
            
            // Log the full structure to help debug
            console.log('Full response data structure:', JSON.stringify(response.data, null, 2));
            
            setError('Template data structure not recognized');
            setErrorDetails('Please check the console for the full response structure and update the component accordingly.');
          } else {
            throw new Error('Invalid response format from API - data structure not recognized');
          }
        } else if (Array.isArray(response.data)) {
          setTemplates(response.data);
        } else {
          throw new Error('Invalid response format from API');
        }
        
      } catch (err) {
        console.error('Error fetching templates:', err);
        
        if (axios.isAxiosError(err) && err.response?.data) {
          const errorData = err.response.data as ErrorResponse;
          setError(errorData.error || 'Failed to load templates');
          setErrorDetails(errorData.details || err.message);
        } else {
          setError('Failed to load templates');
          setErrorDetails(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-lg font-medium text-red-800">{error}</h3>
        {errorDetails && (
          <p className="mt-2 text-sm text-red-700">{errorDetails}</p>
        )}
        <div className="mt-4 flex flex-col space-y-2">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => {
              // This will help us see the structure in the console
              fetch(`${API_BASE_URL}/templates`)
                .then(res => res.json())
                .then(data => {
                  console.log('Raw API response:', data);
                  alert('Check browser console for API response details');
                })
                .catch(err => console.error('Error fetching raw data:', err));
            }}
            className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
          >
            Debug API Response
          </button>
        </div>
      </div>
    );
  }

  if (!Array.isArray(templates)) {
    console.error('Templates is not an array:', templates);
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h3 className="text-lg font-medium text-yellow-800">Invalid Data Format</h3>
        <p className="mt-2 text-sm text-yellow-700">The server returned an unexpected data format.</p>
        <pre className="mt-4 p-2 bg-yellow-100 rounded overflow-auto text-xs">
          {JSON.stringify(templates, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.length > 0 ? (
        templates.map(template => (
          <div 
            key={template.id} 
            className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 cursor-pointer"
            onClick={() => onSelectTemplate(template.id)}
          >
            {template.thumbnail_url ? (
              <img 
                src={template.thumbnail_url} 
                alt={template.name} 
                className="w-full h-48 object-cover" 
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">No preview available</span>
              </div>
            )}
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
              <p className="mt-1 text-sm text-gray-600">{template.description}</p>
            </div>
          </div>
        ))
      ) : (
        <div className="col-span-full text-center py-10 text-gray-500">
          No templates found. Please check back later.
        </div>
      )}
    </div>
  );
}

export default TemplateBrowser; 