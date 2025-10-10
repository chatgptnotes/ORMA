import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Globe, FileText, ArrowRight } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 mr-1 sm:mr-2" />
              <span className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900">
                <span className="hidden sm:inline">ORMA Kshemanidhi Portal</span>
                <span className="sm:hidden">ORMA</span>
              </span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
              <Link to="/apply" className="bg-green-600 text-white hover:bg-green-700 px-2 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-2 rounded-md text-xs sm:text-sm font-medium flex items-center whitespace-nowrap">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Application Form</span>
                <span className="sm:hidden">Apply</span>
              </Link>
              <Link to="/login" className="bg-indigo-600 text-white hover:bg-indigo-700 px-2 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-2 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap">
                <span className="hidden sm:inline">Admin Login</span>
                <span className="sm:hidden">Login</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden min-h-[calc(100vh-4rem)]">
        {/* Purple gradient background - hidden on mobile/tablet/iPad, visible on large desktop */}
        <div className="absolute inset-0 xl:left-1/2 bg-gradient-to-br from-indigo-400 to-purple-600 hidden xl:flex items-center justify-center">
          <Shield className="h-48 w-48 text-white opacity-20" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto h-full min-h-[calc(100vh-4rem)]">
          <div className="h-full flex xl:flex-row">
            {/* Left Content Area */}
            <div className="flex-1 xl:max-w-2xl bg-gradient-to-br from-blue-50 to-indigo-100 min-h-[calc(100vh-4rem)] flex items-center">
              <main className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="text-center xl:text-left">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight font-extrabold text-gray-900">
                    <span className="block">Streamline ORMA</span>
                    <span className="block text-indigo-600">Kshemanidhi Applications</span>
                  </h1>
                  <p className="mt-3 text-sm sm:text-base md:text-lg lg:text-xl text-gray-500 sm:mt-5 max-w-xl mx-auto xl:mx-0">
                    AI-powered passport data extraction for the Overseas Malayali Association. Process welfare fund applications 10x faster with 99.9% accuracy.
                  </p>
                  <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center xl:justify-start">
                    <Link to="/apply" className="w-full sm:w-auto flex items-center justify-center px-6 py-3 sm:px-8 sm:py-3 md:px-10 md:py-4 border border-transparent text-sm sm:text-base md:text-lg font-medium rounded-md text-white bg-green-600 hover:bg-green-700 shadow">
                      Open Application Form
                      <FileText className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Link>
                    <Link to="/dashboard" className="w-full sm:w-auto flex items-center justify-center px-6 py-3 sm:px-8 sm:py-3 md:px-10 md:py-4 border border-transparent text-sm sm:text-base md:text-lg font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
                      View Dashboard
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Link>
                  </div>
                </div>
              </main>
            </div>

            {/* Right Area - Empty on mobile/tablet/iPad, purple gradient shows through on large desktop */}
            <div className="hidden xl:block flex-1"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;