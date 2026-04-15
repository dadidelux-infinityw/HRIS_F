import React from 'react';
import { Calendar, Clock, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { UpcomingInterviewData } from '../../services/api';

interface UpcomingInterviewCardProps {
  interview: UpcomingInterviewData;
}

const UpcomingInterviewCard: React.FC<UpcomingInterviewCardProps> = ({
  interview,
}) => {
  const formatDateTime = (date: string, time: string) => {
    try {
      const d = new Date(date);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const day = d.getDate();
      return `${dayName}, ${month} ${day} at ${time}`;
    } catch {
      return `${date}, ${time}`;
    }
  };

  return (
    <div
      className="rounded-3xl p-5 flex items-center justify-between flex-wrap gap-4 group hover:shadow-md transition-all duration-300"
      style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.12)', boxShadow: 'none' }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 shadow-sm"
          style={{ backgroundColor: 'rgba(168, 85, 247, 0.14)', color: '#9333ea' }}
        >
          <Calendar size={20} strokeWidth={2.5} />
        </div>
        <div>
          <h3
            className="font-bold leading-tight"
            style={{ fontSize: '15px', color: 'var(--text-primary)' }}
          >
            Upcoming Interview
          </h3>
          <p
            className="font-bold text-sm mt-0.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            {interview.job_title}
          </p>
          <div className="flex items-center gap-4 mt-2 flex-wrap text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <Clock size={12} strokeWidth={2.5} />
              {formatDateTime(interview.interview_date, interview.interview_time)}
            </span>
            {interview.location && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <MapPin size={12} strokeWidth={2.5} />
                {interview.location}
              </span>
            )}
            {interview.interview_type === 'Phone' && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <Phone size={12} strokeWidth={2.5} />
                Phone Interview
              </span>
            )}
          </div>
        </div>
      </div>
      <Link
        to="/my-interviews"
        className="dashboard-soft-button px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-sm hover:shadow-md whitespace-nowrap"
      >
        View Details
      </Link>
    </div>
  );
};

export default UpcomingInterviewCard;
