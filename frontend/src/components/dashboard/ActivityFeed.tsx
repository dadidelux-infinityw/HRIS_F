import React from 'react';
import { 
  FileText, 
  Calendar, 
  CheckCircle2, 
  Clock,
} from 'lucide-react';
import { ActivityItem } from '../../services/api';

interface ActivityFeedProps {
  items: ActivityItem[];
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'application_submitted': return { icon: FileText, bg: 'bg-blue-50', text: 'text-blue-600' };
    case 'interview_scheduled': return { icon: Calendar, bg: 'bg-orange-50', text: 'text-orange-600' };
    case 'application_status': return { icon: CheckCircle2, bg: 'bg-green-50', text: 'text-green-600' };
    default: return { icon: Clock, bg: 'bg-slate-50', text: 'text-slate-600' };
  }
};

const formatTimeAgo = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ items }) => {
  const getIconSurface = (type: string) => {
    switch (type) {
      case 'application_submitted':
        return { backgroundColor: 'rgba(59, 130, 246, 0.14)', color: '#2563eb' };
      case 'interview_scheduled':
        return { backgroundColor: 'rgba(249, 115, 22, 0.14)', color: '#ea580c' };
      case 'application_status':
        return { backgroundColor: 'rgba(34, 197, 94, 0.14)', color: '#16a34a' };
      default:
        return { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' };
    }
  };

  return (
    <div className="rounded-3xl p-6 dashboard-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Activity Feed
        </h3>
      </div>

      {items.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-10 text-center"
          style={{ color: 'var(--text-muted)' }}
        >
          <Clock size={32} className="opacity-20 mb-3" />
          <p className="text-sm font-medium">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item, index) => {
            const { icon: Icon } = getActivityIcon(item.type);
            const iconSurface = getIconSurface(item.type);
            return (
              <div key={`${item.timestamp}-${item.job_title}-${index}`} className="flex gap-4 relative group">
                {/* Connector Line */}
                {index !== items.length - 1 && (
                  <div
                    className="absolute left-6 top-10 bottom-[-24px] w-[2px] transition-colors"
                    style={{ backgroundColor: 'var(--border)' }}
                  />
                )}

                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 z-10 shadow-sm transition-transform group-hover:scale-105"
                  style={iconSurface}
                >
                  <Icon size={20} strokeWidth={2.5} />
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[14px] font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                      {item.job_title}
                    </p>
                    <span className="text-[12px] font-semibold whitespace-nowrap ml-2" style={{ color: 'var(--text-muted)' }}>
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-[13px] font-medium truncate" style={{ color: 'var(--text-muted)' }}>
                    {item.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
