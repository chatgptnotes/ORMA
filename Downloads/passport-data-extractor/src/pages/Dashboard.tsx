import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/DevAuthContext';
import { FileText, Users, TrendingUp, Settings, LogOut, Plus, Clock, CheckCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const stats = [
    { name: 'Total Applications', value: '24', icon: FileText, color: 'bg-blue-500' },
    { name: 'Pending Review', value: '8', icon: Clock, color: 'bg-yellow-500' },
    { name: 'Approved', value: '16', icon: CheckCircle, color: 'bg-green-500' },
    { name: 'Processing Time', value: '2.3 hrs', icon: TrendingUp, color: 'bg-purple-500' },
  ];

  const recentApplications = [
    { id: 1, name: 'John Doe', passportNo: 'K2345678', status: 'approved', date: '2024-01-10' },
    { id: 2, name: 'Jane Smith', passportNo: 'L3456789', status: 'pending', date: '2024-01-09' },
    { id: 3, name: 'Robert Johnson', passportNo: 'M4567890', status: 'approved', date: '2024-01-08' },
    { id: 4, name: 'Maria Garcia', passportNo: 'N5678901', status: 'pending', date: '2024-01-07' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-semibold">PassportAI Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.user_metadata?.full_name || user?.email}</span>
              <button
                onClick={handleSignOut}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow-xl rounded-lg">
            <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <h1 className="text-3xl font-bold">Welcome back, {user?.user_metadata?.full_name || 'User'}!</h1>
              <p className="mt-2">Role: {user?.user_metadata?.role || 'user'}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/apply"
                className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Application
              </Link>
              <button className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <FileText className="h-5 w-5 mr-2" />
                View All Applications
              </button>
              <button className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                        <dd className="text-2xl font-semibold text-gray-900">{stat.value}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Applications</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {recentApplications.map((application) => (
                <li key={application.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-indigo-600 truncate">{application.name}</p>
                        <p className="ml-4 text-sm text-gray-500">Passport: {application.passportNo}</p>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          application.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {application.status}
                        </p>
                        <p className="ml-4 text-sm text-gray-500">{application.date}</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
