import React from 'react';
import * as Icons from 'lucide-react';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CategoryCardProps {
  name: string;
  count: number;
  icon: string;
  showExplore?: boolean;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ name, count, icon, showExplore = false }) => {
  const getIconComponent = (iconName: string): LucideIcon => {
    const iconKey = iconName
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    const IconComponent = (Icons as any)[iconKey];
    return IconComponent || Icons.Briefcase;
  };

  const Icon = getIconComponent(icon);

  const getSurfaceStyle = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('engine')) return { backgroundColor: 'rgba(99, 102, 241, 0.14)', color: '#4f46e5' };
    if (lowerName.includes('analyt')) return { backgroundColor: 'rgba(59, 130, 246, 0.14)', color: '#2563eb' };
    if (lowerName.includes('market')) return { backgroundColor: 'rgba(6, 182, 212, 0.14)', color: '#0891b2' };
    if (lowerName.includes('design')) return { backgroundColor: 'rgba(168, 85, 247, 0.14)', color: '#9333ea' };
    if (lowerName.includes('school') || lowerName.includes('arch')) return { backgroundColor: 'rgba(14, 165, 233, 0.14)', color: '#0284c7' };
    return { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' };
  };

  const iconSurface = getSurfaceStyle(name);

  return (
    <div
      className="rounded-3xl p-5 transition-all duration-300 flex items-center justify-between dashboard-card hover:shadow-md group"
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 shadow-sm"
          style={iconSurface}
        >
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div>
          <h3
            className="font-bold truncate max-w-[180px] leading-tight"
            style={{ color: 'var(--text-primary)', fontSize: '15px' }}
          >
            {name}
          </h3>
          <p className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {count} {count === 1 ? 'position' : 'positions'}
          </p>
        </div>
      </div>
      {showExplore && (
        <Link
          to="/jobs"
          className="dashboard-soft-button px-4 py-2 rounded-xl text-[12px] font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2 flex-shrink-0 group/btn"
        >
          Explore
          <ArrowRight size={14} strokeWidth={1.9} className="transition-transform group-hover/btn:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
};

export default CategoryCard;
