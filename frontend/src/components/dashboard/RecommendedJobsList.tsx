import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { RecommendedJob } from '../../services/api';

interface RecommendedJobsListProps {
  jobs: RecommendedJob[];
}

const RecommendedJobsList: React.FC<RecommendedJobsListProps> = ({ jobs }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      className="rounded-lg border p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3
          className="font-semibold"
          style={{ fontSize: '19px', color: 'var(--text-primary)' }}
        >
          Recommended Jobs for You
        </h3>
        <Link
          to="/jobs"
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          View All <ArrowRight size={14} />
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8" style={{ color: 'var(--text-muted)' }}>
          <Briefcase size={40} className="mb-3 opacity-50" />
          <p className="text-sm">No recommendations available</p>
        </div>
      ) : (
        <div>
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between border-b py-3 last:border-b-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="min-w-0 flex-1">
                <p
                  className="font-medium"
                  style={{ fontSize: '15px', color: 'var(--text-primary)' }}
                >
                  {job.job_title}
                </p>
                <div className="mt-1 flex items-center gap-3">
                  <span
                    className="flex items-center gap-1"
                    style={{ fontSize: '13px', color: 'var(--text-muted)' }}
                  >
                    <Briefcase size={12} />
                    {job.department}
                  </span>
                  <span
                    className="flex items-center gap-1"
                    style={{ fontSize: '13px', color: 'var(--text-muted)' }}
                  >
                    <MapPin size={12} />
                    {job.location}
                  </span>
                  <span
                    className="flex items-center gap-1"
                    style={{ fontSize: '13px', color: 'var(--text-muted)' }}
                  >
                    <Calendar size={12} />
                    {formatDate(job.date_posted)}
                  </span>
                </div>
              </div>
              <Link
                to="/jobs"
                className="ml-4 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                Apply Now
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendedJobsList;
