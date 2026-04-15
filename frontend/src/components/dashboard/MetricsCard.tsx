import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  variant?: 'blue' | 'purple' | 'green' | 'orange' | 'default';
  gradient?: boolean;
}

const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
  variant = 'default',
  gradient = false,
}) => {
  const getGradient = () => {
    switch (variant) {
      case 'blue': return 'linear-gradient(135deg, #4b58ad 0%, #35408e 100%)';
      case 'purple': return 'linear-gradient(135deg, #5c64a1 0%, #2d377c 100%)';
      case 'green': return 'linear-gradient(135deg, #f4c733 0%, #d19e00 100%)';
      case 'orange': return 'linear-gradient(135deg, #ffdc61 0%, #f1b500 100%)';
      default: return 'linear-gradient(135deg, #4b58ad 0%, #35408e 100%)';
    }
  };

  if (gradient) {
    return (
      <div
        className="rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group hover:shadow-lg"
        style={{
          background: getGradient(),
          boxShadow: '0 16px 30px -16px rgba(37, 99, 235, 0.35)',
        }}
      >
        {/* Decorative Circles */}
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full transition-transform group-hover:scale-110" />
        <div className="absolute right-12 bottom-0 w-16 h-16 bg-white opacity-5 rounded-full" />
        
        <div className="flex items-start justify-between relative z-10">
          <div>
            <p
              className="font-medium mb-1 opacity-90"
              style={{ color: '#ffffff', fontSize: '14px' }}
            >
              {title}
            </p>
            <p className="text-4xl font-bold tracking-tight" style={{ color: '#ffffff' }}>
              {value}
            </p>
          </div>
          <div
            className="p-3.5 rounded-xl bg-white/20 backdrop-blur-sm shadow-inner"
            style={{ color: '#ffffff' }}
          >
            <Icon size={22} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl p-6 transition-all duration-300 dashboard-card hover:shadow-md relative overflow-hidden group"
    >
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p
            className="font-medium mb-1"
            style={{ color: 'var(--text-muted)', fontSize: '14px', letterSpacing: '-0.01em' }}
          >
            {title}
          </p>
          <p className="text-4xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {value}
          </p>
        </div>
        <div
          className={`${iconBgColor} ${iconColor} p-3.5 rounded-2xl shadow-sm`}
          style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)' }}
        >
          <Icon size={22} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;
