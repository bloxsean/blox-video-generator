import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

interface TemplateInput {
  id: string;
  name: string;
  description?: string;
  type: string;
}

interface TemplateDetails {
  id: string;
  name: string;
  description: string;
  inputs: TemplateInput[];
}

interface TemplateFormProps {
  templateId: string;
  onVideoGenerated: (videoId: string) => void;
}

function TemplateForm({ templateId, onVideoGenerated }: TemplateFormProps) {
  const [template, setTemplate] = useState<TemplateDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formInputs, setFormInputs] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchTemplateDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/templates/${templateId}`);
        setTemplate(response.data.data);
        
        // Initialize form inputs based on template requirements
        const initialInputs: Record<string, string> = {};
        response.data.data.inputs.forEach((input: TemplateInput) => {
          initialInputs[input.id] = '';
        });
        setFormInputs(initialInputs);
        
        setError(null);
      } catch (err) {
        setError('Failed to load template details. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      fetchTemplateDetails();
    }
  }, [templateId]);

  const handleInputChange = (inputId: string, value: string) => {
    setFormInputs(prev => ({
      ...prev,
      [inputId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setGenerating(true);
      const response = await axios.post(`${API_BASE_URL}/generate-video`, {
        templateId,
        inputs: formInputs
      });
      
      onVideoGenerated(response.data.data.video_id);
    } catch (err) {
      setError('Failed to generate video. Please try again.');
      console.error(err);
      setGenerating(false);
    }
  };

  if (loading) {
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

  if (!template) {
    return (
      <div className="text-center py-10 text-gray-500">
        No template selected
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-medium text-gray-900">{template.name}</h2>
      <p className="mt-2 text-gray-600">{template.description}</p>
      
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {template.inputs.map(input => (
          <div key={input.id} className="space-y-1">
            <label 
              htmlFor={input.id} 
              className="block text-sm font-medium text-gray-700"
            >
              {input.name}
            </label>
            <textarea
              id={input.id}
              value={formInputs[input.id] || ''}
              onChange={(e) => handleInputChange(input.id, e.target.value)}
              placeholder={input.description}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
          </div>
        ))}
        
        <div className="pt-4">
          <button 
            type="submit" 
            disabled={generating}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {generating ? 'Generating...' : 'Generate Video'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TemplateForm; 