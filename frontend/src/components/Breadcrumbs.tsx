import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  'job-postings': 'Job Postings',
  applications: 'Applications',
  interviews: 'Interviews',
  matching: 'Candidate Matching',
  jobs: 'Browse Jobs',
  'my-applications': 'My Applications',
  'my-interviews': 'My Interviews',
  analytics: 'Analytics',
  reports: 'Reports',
  profile: 'Profile',
  resume: 'Resume',
  settings: 'Settings',
  help: 'Help Center',
};

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0) return null;

  const crumbs: { label: string; path: string }[] = [
    { label: 'Home', path: '/dashboard' },
  ];

  let builtPath = '';
  for (const segment of pathSegments) {
    builtPath += `/${segment}`;
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    crumbs.push({ label, path: builtPath });
  }

  return (
    <nav
      className="flex items-center gap-1.5 px-6 md:px-8 py-4 text-sm"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        color: 'var(--text-muted)',
      }}
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <React.Fragment key={crumb.path}>
            {index > 0 && (
              <ChevronRight size={13} strokeWidth={1.8} style={{ color: '#c0c7d1', flexShrink: 0 }} />
            )}
            {isLast ? (
              <span className="font-semibold tracking-[-0.01em]" style={{ color: 'var(--text-primary)' }}>
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="flex items-center gap-1 rounded-lg px-2 py-1 transition-colors duration-150"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {index === 0 && <Home size={14} strokeWidth={1.8} />}
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
