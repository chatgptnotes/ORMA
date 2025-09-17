import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Shield, 
  Zap, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Globe,
  Clock,
  Database,
  Star
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  PassportAI
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 sm:pt-24 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 dark:text-white sm:text-5xl md:text-6xl">
              <span className="block">Extract Passport Data</span>
              <span className="block text-sky-600 dark:text-sky-400">with AI Precision</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-slate-500 dark:text-slate-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Powered by advanced AI, our platform instantly extracts and processes passport information with 99.9% accuracy. 
              Perfect for organizations handling high-volume document processing.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link
                  to="/register"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 md:py-4 md:text-lg md:px-10"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link
                  to="/demo"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-sky-600 bg-white dark:bg-slate-800 dark:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-700 md:py-4 md:text-lg md:px-10"
                >
                  Watch Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
              Powerful Features for Modern Organizations
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-500 dark:text-slate-400">
              Everything you need to streamline document processing and manage your organization efficiently.
            </p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-lg">
                <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
                  AI-Powered Extraction
                </h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  Advanced machine learning algorithms extract data from passports with incredible accuracy and speed.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-lg">
                <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
                  Enterprise Security
                </h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  Bank-grade encryption and compliance with international data protection standards.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-lg">
                <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
                  Multi-Tenant Architecture
                </h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  Perfect for organizations with multiple departments or client management needs.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-lg">
                <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
                  Lightning Fast
                </h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  Process thousands of documents in minutes, not hours. Built for high-volume operations.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-lg">
                <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
                  <Database className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
                  Comprehensive Analytics
                </h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  Detailed insights and reporting to help you understand your document processing workflows.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-lg">
                <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
                  <Globe className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
                  Global Compliance
                </h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  Support for passports from 195+ countries with automatic validation and verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
              Perfect for Organizations of All Sizes
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-500 dark:text-slate-400">
              From government agencies to private enterprises, our solution scales to meet your needs.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="bg-gradient-to-r from-sky-500 to-cyan-600 rounded-lg p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Overseas Malayali Association (ORMA)</h3>
              <p className="text-sky-100 mb-6">
                Streamline the Kshemanidhi welfare fund application process for Malayali expatriates worldwide. 
                Our platform helps process membership applications, verify identity documents, and manage 
                welfare benefits efficiently.
              </p>
              <div className="space-y-2">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>Automated membership verification</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>Secure document processing</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>Multi-language support</span>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Government Agencies
                </h4>
                <p className="text-slate-600 dark:text-slate-400">
                  Border control, immigration services, and citizen registration departments.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Financial Institutions
                </h4>
                <p className="text-slate-600 dark:text-slate-400">
                  Banks and financial services for customer onboarding and KYC compliance.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Travel & Hospitality
                </h4>
                <p className="text-slate-600 dark:text-slate-400">
                  Hotels, airlines, and travel agencies for quick check-in processes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-500 dark:text-slate-400">
              Choose the plan that works best for your organization. No hidden fees, cancel anytime.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Basic Plan */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8">
              <div className="text-center">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Basic</h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400">Perfect for small teams</p>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$29</span>
                  <span className="text-base font-medium text-slate-500 dark:text-slate-400">/month</span>
                </p>
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-slate-600 dark:text-slate-400">Up to 500 extractions/month</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-slate-600 dark:text-slate-400">5 team members</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-slate-600 dark:text-slate-400">Email support</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-slate-600 dark:text-slate-400">Basic analytics</span>
                </div>
              </div>
              <div className="mt-8">
                <Link
                  to="/register"
                  className="w-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 block text-center py-2 px-4 rounded-md font-medium"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8 ring-2 ring-sky-500">
              <div className="text-center">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Professional</h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400">Most popular choice</p>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$99</span>
                  <span className="text-base font-medium text-slate-500 dark:text-slate-400">/month</span>
                </p>
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-slate-600 dark:text-slate-400">Up to 5,000 extractions/month</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-slate-600 dark:text-slate-400">Unlimited team members</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-slate-600 dark:text-slate-400">Priority support</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-slate-600 dark:text-slate-400">Advanced analytics</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-slate-600 dark:text-slate-400">API access</span>
                </div>
              </div>
              <div className="mt-8">
                <Link
                  to="/register"
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white block text-center py-2 px-4 rounded-md font-medium"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8">
              <div className="text-center">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Enterprise</h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400">For large organizations</p>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">Custom</span>
                </p>
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-slate-600 dark:text-slate-400">Unlimited extractions</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-slate-600 dark:text-slate-400">Multi-tenant architecture</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-slate-600 dark:text-slate-400">24/7 phone support</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-slate-600 dark:text-slate-400">Custom integrations</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-slate-600 dark:text-slate-400">On-premise deployment</span>
                </div>
              </div>
              <div className="mt-8">
                <Link
                  to="/contact"
                  className="w-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 block text-center py-2 px-4 rounded-md font-medium"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-sky-600 dark:bg-sky-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to transform your document processing?
          </h2>
          <p className="mt-4 text-xl text-sky-100">
            Join thousands of organizations already using PassportAI to streamline their operations.
          </p>
          <div className="mt-8">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-sky-600 bg-white hover:bg-slate-50 md:py-4 md:text-lg md:px-10"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">PassportAI</h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-md">
                The most advanced AI-powered passport data extraction platform. 
                Trusted by organizations worldwide for secure, accurate, and fast document processing.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                Product
              </h4>
              <div className="space-y-2">
                <Link to="/features" className="block text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  Features
                </Link>
                <Link to="/pricing" className="block text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  Pricing
                </Link>
                <Link to="/security" className="block text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  Security
                </Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                Support
              </h4>
              <div className="space-y-2">
                <Link to="/docs" className="block text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  Documentation
                </Link>
                <Link to="/contact" className="block text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  Contact
                </Link>
                <Link to="/support" className="block text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  Help Center
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
            <p className="text-center text-slate-500 dark:text-slate-400">
              © 2025 PassportAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};