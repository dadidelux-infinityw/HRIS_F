import React from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  ArrowRight,
  BarChart3,
  Headphones,
  Code,
  Building,
  Megaphone,
  Palette,
  LucideIcon,
  Calendar,
} from 'lucide-react';
import { RecommendedJob } from '../../services/api';

interface RecommendedJobsListProps {
  jobs: RecommendedJob[];
}

const deptIconMap: Record<string, LucideIcon> = {
  'Analytics': BarChart3,
  'Engineering': Code,
  'Administration': Headphones,
  'Design': Palette,
  'Marketing': Megaphone,
  'Architecture': Building,
  'Support': Headphones,
};

const deptColors: Record<string, string> = {
  'Analytics': 'bg-sky-50 text-sky-600',
  'Engineering': 'bg-indigo-50 text-indigo-600',
  'Administration': 'bg-blue-50 text-blue-600',
  'Design': 'bg-purple-50 text-purple-600',
  'Marketing': 'bg-pink-50 text-pink-600',
  'Architecture': 'bg-cyan-50 text-cyan-600',
};

const defaultColor = 'bg-blue-50 text-blue-600';

const getDeptIcon = (dept: string): LucideIcon => {
  for (const [key, icon] of Object.entries(deptIconMap)) {
    if (dept.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return Briefcase;
};

const getDeptColor = (dept: string): string => {
  for (const [key, color] of Object.entries(deptColors)) {
    if (dept.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return defaultColor;
};

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const RecommendedJobsList: React.FC<RecommendedJobsListProps> = ({ jobs }) => {
  const getDeptSurface = (dept: string) => {
    const colorClass = getDeptColor(dept);
    if (colorClass.includes('sky')) return { backgroundColor: 'rgba(14, 165, 233, 0.14)', color: '#0284c7' };
    if (colorClass.includes('indigo')) return { backgroundColor: 'rgba(99, 102, 241, 0.14)', color: '#4f46e5' };
    if (colorClass.includes('purple')) return { backgroundColor: 'rgba(168, 85, 247, 0.14)', color: '#9333ea' };
    if (colorClass.includes('pink')) return { backgroundColor: 'rgba(236, 72, 153, 0.14)', color: '#db2777' };
    if (colorClass.includes('cyan')) return { backgroundColor: 'rgba(6, 182, 212, 0.14)', color: '#0891b2' };
    return { backgroundColor: 'rgba(59, 130, 246, 0.14)', color: '#2563eb' };
  };

  return (
    <div className="rounded-3xl p-6 dashboard-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Recommended Jobs for You
        </h3>
        <Link
          to="/jobs"
          className="flex items-center gap-1 text-[13px] font-bold transition-colors"
          style={{ color: 'var(--accent)' }}
        >
          View All <ArrowRight size={14} strokeWidth={1.9} />
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-12"
          style={{ color: 'var(--text-muted)' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <Briefcase size={24} className="opacity-30" />
          </div>
          <p className="text-sm font-medium">No recommendations yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const DeptIcon = getDeptIcon(job.department);
            const iconSurface = getDeptSurface(job.department);
            return (
              <div
                key={job.id}
                className="group relative"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 shadow-sm"
                      style={iconSurface}
                    >
                      <DeptIcon size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className="font-bold truncate text-[15px] leading-tight mb-1"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {job.job_title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="opacity-70" />
                          {job.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="opacity-70" />
                          {formatDate(job.date_posted)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/jobs"
                    className="dashboard-soft-button px-4 py-2 rounded-xl text-[11px] font-bold transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                  >
                    Apply Now
                  </Link>
                </div>
                {/* Visual Separator */}
                <div className="mt-4 last:hidden" style={{ borderBottom: '1px solid var(--border)' }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecommendedJobsList;
