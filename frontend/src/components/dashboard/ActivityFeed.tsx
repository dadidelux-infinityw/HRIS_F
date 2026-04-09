import React from 'react';
import { FileText, Calendar, Send, Clock } from 'lucide-react';
import type { ActivityItem } from '../../services/api';

interface ActivityFeedProps {
  items: ActivityItem[];
}

function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 2) return 'Yesterday';
  if (diffDays <= 30) return `${diffDays} days ago`;

  return then.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const iconConfig: Record<
  ActivityItem['type'],
  { icon: React.ElementType; bgColor: string }
> = {
  application_status: { icon: FileText, bgColor: '#3b82f6' },
  interview_scheduled: { icon: Calendar, bgColor: '#8b5cf6' },
  application_submitted: { icon: Send, bgColor: '#22c55e' },
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ items }) => {
  return (
    <div
      className="rounded-xl border p-5"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border)',
      }}
    >
      <h3
        className="font-semibold mb-4"
        style={{ fontSize: '19px', color: 'var(--text-primary)' }}
      >
        Recent Activity
      </h3>

      {items.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-8"
          style={{ color: 'var(--text-muted)' }}
        >
          <Clock size={40} className="mb-3 opacity-50" />
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {items.map((item, index) => {
            const config = iconConfig[item.type];
            const Icon = config.icon;

            return (
              <React.Fragment key={index}>
                <div className="flex items-start gap-3 py-3">
                  <div
                    className="flex items-center justify-center flex-shrink-0 rounded-full"
                    style={{
                      backgroundColor: config.bgColor,
                      width: '32px',
                      height: '32px',
                    }}
                  >
                    <Icon size={16} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      style={{
                        fontSize: '15px',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {item.message}
                    </p>
                    <p
                      className="mt-0.5"
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {getRelativeTime(item.timestamp)}
                    </p>
                  </div>
                </div>
                {index < items.length - 1 && (
                  <div
                    style={{
                      height: '1px',
                      backgroundColor: 'var(--border)',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
