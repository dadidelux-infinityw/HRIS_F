import React, { useEffect, useState } from 'react';
import { Briefcase, Calendar, Search, CheckCircle, XCircle } from 'lucide-react';
import CategoryCard from './CategoryCard';
import ApplicationProgressStepper from './ApplicationProgressStepper';
import UpcomingInterviewCard from './UpcomingInterviewCard';
import RecommendedJobsList from './RecommendedJobsList';
import ActivityFeed from './ActivityFeed';
import MetricsCard from './MetricsCard';
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
      <div className="flex-1 min-h-screen themed-page">
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
            <p className="font-medium tracking-wide" style={{ color: 'var(--text-muted)' }}>Initializing dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 themed-page min-h-screen">
        <div className="rounded-2xl bg-red-50 border border-red-100 p-6 text-red-700 max-w-2xl mx-auto shadow-sm">
          <h3 className="font-bold text-lg mb-2">Error Loading Dashboard</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { metrics, application_progress, upcoming_interview, recommended_jobs, activity_feed } = dashboardData;

  const stats = [
    { title: 'Applied Jobs', value: metrics.applied_jobs, icon: Briefcase, variant: 'blue' as const, gradient: true },
    { title: 'For Interview', value: metrics.for_interview, icon: Calendar, iconColor: 'text-purple-600', iconBgColor: 'bg-purple-50' },
    { title: 'Under Review', value: metrics.under_review, icon: Search, iconColor: 'text-cyan-600', iconBgColor: 'bg-cyan-50' },
    { title: 'Approved', value: metrics.accepted, icon: CheckCircle, iconColor: 'text-emerald-600', iconBgColor: 'bg-emerald-50' },
    { title: 'Rejected', value: metrics.rejected, icon: XCircle, iconColor: 'text-orange-600', iconBgColor: 'bg-orange-50' },
  ];

  return (
    <div className="flex-1 min-h-screen dashboard-page pb-12">
      {/* Header Section */}
      <div className="px-8 py-8 md:px-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Candidate'}!
          </h1>
          <p className="mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
            Keep track of your applications and find your next dream job.
          </p>
        </div>
      </div>

      <div className="px-8 md:px-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Summary Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {stats.map((stat, i) => (
              <MetricsCard key={i} {...stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column (Wider) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Application Progress & Upcoming Interview */}
              <div className="rounded-3xl p-8 dashboard-card">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Application Progress</h2>
                </div>

                {application_progress.steps.length > 0 ? (
                  <div className="mb-10">
                    <ApplicationProgressStepper
                      currentStep={application_progress.current_step}
                      steps={application_progress.steps}
                    />
                  </div>
                ) : (
                  <div
                    className="mb-10 p-8 rounded-2xl text-center"
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
                  >
                    <p className="font-medium" style={{ color: 'var(--text-muted)' }}>No application progress to show</p>
                  </div>
                )}

                {/* Upcoming Interview Card */}
                {upcoming_interview && (
                  <div className="pt-8" style={{ borderTop: '1px solid var(--border)' }}>
                    <UpcomingInterviewCard interview={upcoming_interview} />
                  </div>
                )}
              </div>

              {/* Job Categories */}
              <div className="rounded-3xl p-8 dashboard-card">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Job Categories</h2>
                </div>
                {categories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.slice(0, 6).map((category) => (
                      <CategoryCard
                        key={category.name}
                        name={category.name}
                        count={category.count}
                        icon={category.icon}
                        showExplore
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className="p-12 text-center rounded-2xl"
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
                  >
                    <Briefcase className="h-10 w-10 mx-auto mb-4" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                    <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No categories found</h3>
                    <p style={{ color: 'var(--text-muted)' }}>New job postings will appear here soon.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (Sidebar) */}
            <div className="space-y-8">
              <RecommendedJobsList jobs={recommended_jobs} />
              <ActivityFeed items={activity_feed} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;
