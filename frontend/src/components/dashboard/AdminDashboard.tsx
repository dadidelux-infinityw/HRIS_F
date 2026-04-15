import React, { useEffect, useState } from 'react';
import { Users, Briefcase, Calendar, TrendingUp, Activity, Sparkles, ShieldCheck } from 'lucide-react';
import CategoryCard from './CategoryCard';
import RecruitmentPhasesSection from './RecruitmentPhasesSection';
import { apiService, DashboardStats, JobCategory, RecruitmentPhase } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [recruitmentPhases, setRecruitmentPhases] = useState<RecruitmentPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isHrOrAdmin = user?.role === 'hr' || user?.role === 'admin';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const requests: Promise<any>[] = [
          apiService.getDashboardStats(),
          apiService.getJobCategories(),
        ];
        if (isHrOrAdmin) {
          requests.push(apiService.getRecruitmentPhases());
        }
        const [statsData, categoriesData, phasesData] = await Promise.all(requests);
        setStats(statsData);
        setCategories(categoriesData);
        if (phasesData) setRecruitmentPhases(phasesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isHrOrAdmin]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen themed-page">
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center">
            <div
              className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mb-4"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
            <p className="font-medium tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Initializing admin dashboard...
            </p>
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
          <p>
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen dashboard-page pb-12">
      <div className="px-8 py-8 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {getGreeting()}, {user?.full_name || stats?.user.full_name}!
            </h1>
            <p className="mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
              Stay on top of hiring activity, open roles, and team momentum from one place.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Recruitment Pipeline */}
              {isHrOrAdmin && (
                <RecruitmentPhasesSection phases={recruitmentPhases} />
              )}

              {/* Job Categories */}
              <div
                className="rounded-3xl p-8 dashboard-card"
              >
                <h2
                  className="text-xl font-bold mb-8"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Job Categories
                </h2>
                {categories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((category) => (
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
                  <div className="p-12 text-center rounded-2xl" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                    <Briefcase className="mx-auto mb-4 text-gray-400" size={48} />
                    <h3
                      className="text-lg font-semibold mb-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      No job postings yet
                    </h3>
                    <p style={{ color: 'var(--text-muted)' }}>
                      Start by creating your first job posting to see category statistics
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              <div className="rounded-3xl p-8 dashboard-card">
                <div className="flex items-center gap-3 mb-8">
                  <div className="app-icon-chip-active h-11 w-11 rounded-2xl flex items-center justify-center">
                    <Activity size={18} strokeWidth={1.9} />
                  </div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    System Overview
                  </h3>
                </div>
                <div className="space-y-4">
                  <div
                    className="flex items-center justify-between rounded-2xl px-4 py-4"
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' }}>
                        <Users size={18} strokeWidth={1.9} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          Registered Users
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Total accounts
                        </p>
                      </div>
                    </div>
                    <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {stats?.total_users || 0}
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between rounded-2xl px-4 py-4"
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' }}>
                        <Briefcase size={18} strokeWidth={1.9} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          Active Postings
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Open positions
                        </p>
                      </div>
                    </div>
                    <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {stats?.active_job_postings || 0}
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between rounded-2xl px-4 py-4"
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(249, 115, 22, 0.12)', color: '#ea580c' }}>
                        <Calendar size={18} strokeWidth={1.9} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          Interviews
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Total scheduled
                        </p>
                      </div>
                    </div>
                    <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {stats?.total_interviews || 0}
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between rounded-2xl px-4 py-4"
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(168, 85, 247, 0.12)', color: '#9333ea' }}>
                        <TrendingUp size={18} strokeWidth={1.9} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          Total Postings
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          All time
                        </p>
                      </div>
                    </div>
                    <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {stats?.total_job_postings || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl p-8 dashboard-card">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="h-11 w-11 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', color: '#4f46e5' }}
                  >
                    <Sparkles size={18} strokeWidth={1.9} />
                  </div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Hiring Snapshot
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl px-4 py-4" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      Open roles are actively moving
                    </p>
                    <p className="text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
                      {stats?.active_job_postings || 0} active postings are currently visible to candidates and ready for applications.
                    </p>
                  </div>

                  <div className="rounded-2xl px-4 py-4" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' }}
                      >
                        <ShieldCheck size={16} strokeWidth={2} />
                      </div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Team coverage
                      </p>
                    </div>
                    <p className="text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
                      {stats?.total_users || 0} registered users are collaborating across the hiring workflow today.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
