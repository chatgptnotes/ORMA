import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/DevAuthContext';
import { FileText, Users, TrendingUp, Settings, LogOut, Plus, Clock, CheckCircle, Eye } from 'lucide-react';
import { getAllPassportRecords } from '../services/supabaseService';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const result = await getAllPassportRecords();
      if (result.success && result.data) {
        setApplications(result.data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Calculate real statistics from fetched data
  const stats = [
    { name: 'Total Applications', value: applications.length.toString(), icon: FileText, color: 'bg-blue-500' },
    { name: 'This Week', value: applications.filter(app => {
      const date = new Date(app.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date > weekAgo;
    }).length.toString(), icon: Clock, color: 'bg-yellow-500' },
    { name: 'Processed', value: applications.filter(app => app.full_name).length.toString(), icon: CheckCircle, color: 'bg-green-500' },
    { name: 'Avg. Fields', value: applications.length > 0 ? Math.round(
      applications.reduce((acc, app) => {
        const fields = Object.keys(app).filter(key => app[key] && !['id', 'created_at', 'updated_at'].includes(key));
        return acc + fields.length;
      }, 0) / applications.length
    ).toString() : '0', icon: TrendingUp, color: 'bg-purple-500' },
  ];

  // Get recent applications (last 5)
  const recentApplications = applications.slice(0, 5).map(app => ({
    id: app.id,
    name: app.full_name || app.given_name || 'Unknown',
    passportNo: app.passport_number || 'N/A',
    status: app.passport_number ? 'processed' : 'pending',
    date: new Date(app.created_at).toLocaleDateString()
  }));

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
              <button
                onClick={() => navigate('/applications')}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FileText className="h-5 w-5 mr-2" />
                View All Applications
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
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
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Applications</h3>
              <button
                onClick={() => fetchApplications()}
                className="text-sm text-indigo-600 hover:text-indigo-900"
              >
                Refresh
              </button>
            </div>
            {loading ? (
              <div className="px-4 py-8 text-center text-gray-500">
                Loading applications...
              </div>
            ) : recentApplications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-gray-500 mb-4">No applications yet</p>
                <Link
                  to="/apply"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Application
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {recentApplications.map((application) => (
                  <li key={application.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <div
                      className="px-4 py-4 sm:px-6"
                      onClick={() => navigate(`/application/${application.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-indigo-600 truncate">{application.name}</p>
                          <p className="ml-4 text-sm text-gray-500">Passport: {application.passportNo}</p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex items-center">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            application.status === 'processed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {application.status}
                          </p>
                          <p className="ml-4 text-sm text-gray-500">{application.date}</p>
                          <Eye className="ml-2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
