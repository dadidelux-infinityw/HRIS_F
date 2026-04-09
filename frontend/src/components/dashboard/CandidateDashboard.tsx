import React, { useEffect, useState } from 'react';
import { Briefcase, Calendar, Search, XCircle } from 'lucide-react';
import MetricsCard from './MetricsCard';
import CategoryCard from './CategoryCard';
import ApplicationProgressStepper from './ApplicationProgressStepper';
import UpcomingInterviewCard from './UpcomingInterviewCard';
import RecommendedJobsList from './RecommendedJobsList';
import ActivityFeed from './ActivityFeed';
import { apiService, CandidateDashboardData, JobCategory } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const CandidateDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<CandidateDashboardData | null>(null);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [data, cats] = await Promise.all([
          apiService.getCandidateDashboard(),
          apiService.getJobCategories(),
        ]);
        setDashboardData(data);
        setCategories(cats);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="border-b px-8 py-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        </div>
        <div className="flex items-center justify-center p-8">
          <p className="text-lg" style={{ color: 'var(--text-muted)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="border-b px-8 py-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        </div>
        <div className="p-8">
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { metrics, application_progress, upcoming_interview, recommended_jobs, activity_feed } = dashboardData;

  return (
    <div className="flex-1 min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="border-b px-8 py-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {getGreeting()}, {user?.full_name || 'Candidate'}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Here's an overview of your job search progress</p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Applied Jobs"
            value={metrics.applied_jobs}
            icon={Briefcase}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <MetricsCard
            title="For Interview"
            value={metrics.for_interview}
            icon={Calendar}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          <MetricsCard
            title="Under Review"
            value={metrics.under_review}
            icon={Search}
            iconColor="text-teal-600"
            iconBgColor="bg-teal-100"
          />
          <MetricsCard
            title="Rejected"
            value={metrics.rejected}
            icon={XCircle}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
          />
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Application Progress</h2>
          <ApplicationProgressStepper
            currentStep={application_progress.current_step}
            steps={application_progress.steps}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <UpcomingInterviewCard interview={upcoming_interview} />
          <RecommendedJobsList jobs={recommended_jobs} />
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Job Categories</h2>
          {categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <CategoryCard key={category.name} name={category.name} count={category.count} icon={category.icon} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No job categories yet</h3>
              <p>Browse jobs to see available categories</p>
            </div>
          )}
        </div>

        <div className="mt-8">
          <ActivityFeed items={activity_feed} />
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;
