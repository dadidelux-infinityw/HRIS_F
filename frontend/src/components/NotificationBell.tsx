import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { apiService, AppNotification } from '../services/api';

const POLL_INTERVAL_MS = 30000;
const DROPDOWN_LIMIT = 20;

// Backend timestamps are naive UTC (datetime.utcnow); treat them as UTC.
const parseTimestamp = (timestamp: string) => {
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(timestamp);
  return new Date(hasZone ? timestamp : `${timestamp}Z`);
};

const formatAbsolute = (date: Date) =>
  date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Manila',
  });

const formatRelative = (timestamp: string) => {
  const date = parseTimestamp(timestamp);
  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 60) return 'Just now';
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  });
};

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(async () => {
    try {
      const { count } = await apiService.getUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      // Silently ignore polling failures (e.g. expired session or offline)
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const items = await apiService.getNotifications(DROPDOWN_LIMIT);
      setNotifications(items);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll the unread count every 30s and whenever the window regains focus
  useEffect(() => {
    refreshCount();
    const intervalId = window.setInterval(refreshCount, POLL_INTERVAL_MS);
    window.addEventListener('focus', refreshCount);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshCount);
    };
  }, [refreshCount]);

  // Close the dropdown on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      loadNotifications();
      refreshCount();
    }
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.is_read) {
      setNotifications((items) =>
        items.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item))
      );
      setUnreadCount((count) => Math.max(0, count - 1));
      try {
        await apiService.markNotificationRead(notification.id);
      } catch {
        refreshCount();
      }
    }
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch {
      refreshCount();
    }
  };

  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className="sidebar-theme-toggle relative h-10 w-10 rounded-xl flex items-center justify-center transition-colors"
        title="Notifications"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Bell size={17} strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold leading-[18px] text-center">
            {badgeLabel}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full mt-2 w-80 max-h-[28rem] rounded-2xl border shadow-xl z-50 flex flex-col overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          role="menu"
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Notifications
            </p>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              Mark all as read
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading && notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                Loading...
              </p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                You're all caught up.
              </p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  role="menuitem"
                  onClick={() => handleNotificationClick(notification)}
                  className="w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors hover:bg-[var(--bg-hover)]"
                  style={{
                    borderColor: 'var(--border-light)',
                    backgroundColor: notification.is_read ? undefined : 'var(--bg-secondary)',
                  }}
                >
                  <div className="flex items-start gap-2">
                    {!notification.is_read && (
                      <span
                        className="mt-1.5 h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: 'var(--accent)' }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {notification.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {notification.message}
                      </p>
                      <p
                        className="text-[11px] mt-1"
                        style={{ color: 'var(--text-muted)' }}
                        title={formatAbsolute(parseTimestamp(notification.created_at))}
                      >
                        {formatRelative(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
