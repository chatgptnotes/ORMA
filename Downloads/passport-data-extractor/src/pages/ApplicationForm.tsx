import React from 'react';
import { useNavigate } from 'react-router-dom';
import ExtractorApp from '../components/ExtractorApp';
import { ArrowLeft } from 'lucide-react';

const ApplicationForm: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <span className="text-xl font-semibold">New Application</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <ExtractorApp />
      </div>
    </div>
  );
};

export default ApplicationForm;