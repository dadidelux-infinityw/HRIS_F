import React, { useEffect, useState, useCallback } from 'react';
import { Clock, TrendingUp, BarChart3, Percent, Users, AlertTriangle, Info, Trophy, Filter } from 'lucide-react';
import {
  apiService,
  AnalyticsData,
  MonthlyCount,
  SkillDemand,
  JobPosting,
  TopCandidatesResponse,
  InsightFlagsResponse,
  ExperienceDistributionResponse,
  EducationDistributionResponse,
  HiringFunnelResponse,
} from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const DONUT_COLORS = ['#60a5fa', '#8b5cf6', '#f59e0b', '#34d399', '#f87171', '#64748b'];
const FUNNEL_COLORS = ['#60a5fa', '#818cf8', '#a78bfa', '#c084fc', '#e879f9'];
const EXP_COLORS = ['#34d399', '#60a5fa', '#f59e0b', '#f87171', '#64748b'];
const EDU_COLORS = ['#60a5fa', '#34d399', '#f59e0b', '#f87171', '#8b5cf6', '#64748b'];

/* ─── Existing Line Chart (unchanged) ─── */
const LineChart: React.FC<{ data: MonthlyCount[]; darkMode: boolean }> = ({ data, darkMode }) => {
  const line = darkMode ? '#60a5fa' : '#4f7cff';
  const lineFillTop = darkMode ? 'rgba(96, 165, 250, 0.28)' : 'rgba(79, 124, 255, 0.18)';
  const lineFillBottom = darkMode ? 'rgba(96, 165, 250, 0.02)' : 'rgba(79, 124, 255, 0.01)';
  const grid = darkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.24)';
  const axis = darkMode ? '#94a3b8' : '#64748b';
  const pointLabel = darkMode ? '#dbe4f0' : '#334155';

  const W = 640;
  const H = 250;
  const PAD = { top: 18, right: 20, bottom: 36, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...data.map((d) => d.count), 1);

  const points = data.map((d, i) => ({
    x: PAD.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: PAD.top + chartH - (d.count / maxVal) * chartH,
    count: d.count,
    month: d.month,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath = [
    `M ${points[0].x} ${PAD.top + chartH}`,
    ...points.map((p) => `L ${p.x} ${p.y}`),
    `L ${points[points.length - 1].x} ${PAD.top + chartH}`,
    'Z',
  ].join(' ');

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: PAD.top + chartH - pct * chartH,
    label: Math.round(pct * maxVal),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <defs>
        <linearGradient id="analyticsLineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineFillTop} />
          <stop offset="100%" stopColor={lineFillBottom} />
        </linearGradient>
      </defs>

      {gridLines.map((gl, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={gl.y} x2={PAD.left + chartW} y2={gl.y} stroke={grid} strokeWidth="1" strokeDasharray="6 6" />
          <text x={PAD.left - 6} y={gl.y + 4} textAnchor="end" fontSize="10" fill={axis}>
            {gl.label}
          </text>
        </g>
      ))}

      <path d={areaPath} fill="url(#analyticsLineFill)" />

      <polyline
        points={polyline}
        fill="none"
        stroke={line}
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill={line} />
          <circle cx={p.x} cy={p.y} r="9" fill={darkMode ? 'rgba(96, 165, 250, 0.12)' : 'rgba(79, 124, 255, 0.1)'} />
          {p.count > 0 && (
            <text x={p.x} y={p.y - 14} textAnchor="middle" fontSize="10" fill={pointLabel}>
              {p.count}
            </text>
          )}
          <text x={p.x} y={H - 8} textAnchor="middle" fontSize="11" fill={axis}>
            {p.month}
          </text>
        </g>
      ))}
    </svg>
  );
};

/* ─── Existing Donut Chart (unchanged) ─── */
const DonutChart: React.FC<{ data: SkillDemand[]; darkMode: boolean }> = ({ data, darkMode }) => {
  const SIZE = 168;
  const R = 56;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm" style={{ color: 'var(--text-muted)' }}>
        No skills data yet
      </div>
    );
  }

  let startAngle = -Math.PI / 2;
  const slices = data.map((item, i) => {
    const angle = (item.count / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = CX + R * Math.cos(startAngle);
    const y1 = CY + R * Math.sin(startAngle);
    const x2 = CX + R * Math.cos(endAngle);
    const y2 = CY + R * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const slice = { path, color: DONUT_COLORS[i % DONUT_COLORS.length], ...item };
    startAngle = endAngle;
    return slice;
  });

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-40 h-40 flex-shrink-0">
      {slices.map((slice, i) => (
        <path key={i} d={slice.path} fill={slice.color} />
      ))}
      <circle cx={CX} cy={CY} r={34} fill={darkMode ? '#111827' : '#ffffff'} />
      <text x={CX} y={CY + 2} textAnchor="middle" fontSize="18" fontWeight="700" fill={darkMode ? '#f8fafc' : '#0f172a'}>
        {data.length}
      </text>
      <text x={CX} y={CY + 18} textAnchor="middle" fontSize="9" fill={darkMode ? '#94a3b8' : '#64748b'}>
        skills
      </text>
    </svg>
  );
};

/* ─── NEW: Experience Bar Chart ─── */
const ExperienceBarChart: React.FC<{
  data: { level: string; count: number }[];
  darkMode: boolean;
}> = ({ data, darkMode }) => {
  const W = 480;
  const H = 220;
  const PAD = { top: 20, right: 20, bottom: 50, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const barW = Math.min(chartW / data.length * 0.6, 60);
  const gap = chartW / data.length;
  const axis = darkMode ? '#94a3b8' : '#64748b';
  const label = darkMode ? '#dbe4f0' : '#334155';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
        const y = PAD.top + chartH - pct * chartH;
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y} stroke={darkMode ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.2)'} strokeWidth="1" strokeDasharray="4 4" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill={axis}>{Math.round(pct * maxVal)}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = PAD.left + gap * i + gap / 2 - barW / 2;
        const barH = (d.count / maxVal) * chartH;
        const y = PAD.top + chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={6} fill={EXP_COLORS[i % EXP_COLORS.length]} opacity={0.85} />
            {d.count > 0 && (
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill={label}>
                {d.count}
              </text>
            )}
            <text x={x + barW / 2} y={PAD.top + chartH + 16} textAnchor="middle" fontSize="9" fill={axis}>
              {d.level.split(' (')[0]}
            </text>
            <text x={x + barW / 2} y={PAD.top + chartH + 28} textAnchor="middle" fontSize="8" fill={axis}>
              {d.level.includes('(') ? d.level.match(/\([^)]+\)/)?.[0] ?? '' : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ─── NEW: Education Donut Chart ─── */
const EducationDonutChart: React.FC<{
  data: { level: string; count: number }[];
  darkMode: boolean;
}> = ({ data, darkMode }) => {
  const SIZE = 180;
  const R = 60;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-44 text-sm" style={{ color: 'var(--text-muted)' }}>
        No education data yet
      </div>
    );
  }

  let startAngle = -Math.PI / 2;
  const slices = data.map((item, i) => {
    const angle = (item.count / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = CX + R * Math.cos(startAngle);
    const y1 = CY + R * Math.sin(startAngle);
    const x2 = CX + R * Math.cos(endAngle);
    const y2 = CY + R * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const slice = { path, color: EDU_COLORS[i % EDU_COLORS.length], ...item };
    startAngle = endAngle;
    return slice;
  });

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-44 h-44 flex-shrink-0">
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} />
      ))}
      <circle cx={CX} cy={CY} r={36} fill={darkMode ? '#111827' : '#ffffff'} />
      <text x={CX} y={CY + 2} textAnchor="middle" fontSize="18" fontWeight="700" fill={darkMode ? '#f8fafc' : '#0f172a'}>
        {total}
      </text>
      <text x={CX} y={CY + 16} textAnchor="middle" fontSize="8" fill={darkMode ? '#94a3b8' : '#64748b'}>
        candidates
      </text>
    </svg>
  );
};

/* ─── NEW: Hiring Funnel Chart ─── */
const HiringFunnelChart: React.FC<{
  data: { stage: string; count: number }[];
  conversion: Record<string, number>;
  darkMode: boolean;
}> = ({ data, conversion, darkMode }) => {
  const W = 520;
  const H = 300;
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const stageH = 44;
  const gap = 8;
  const startY = 20;
  const label = darkMode ? '#dbe4f0' : '#334155';
  const sublabel = darkMode ? '#94a3b8' : '#64748b';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {data.map((d, i) => {
        const y = startY + i * (stageH + gap);
        const widthPct = d.count / maxCount;
        const maxWidth = W - 160;
        const w = Math.max(widthPct * maxWidth, 40);
        const x = 80 + (maxWidth - w) / 2;

        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={stageH} rx={8} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} opacity={0.82} />
            <text x={x - 8} y={y + stageH / 2 + 4} textAnchor="end" fontSize="11" fontWeight="600" fill={label}>
              {d.stage}
            </text>
            <text x={x + w / 2} y={y + stageH / 2 + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#ffffff">
              {d.count}
            </text>
            {i > 0 && (
              <text x={W - 10} y={y + stageH / 2 + 4} textAnchor="end" fontSize="10" fill={sublabel}>
                {conversion[`${data[i - 1].stage.toLowerCase()}_to_${d.stage.toLowerCase()}`] ?? '—'}%
              </text>
            )}
          </g>
        );
      })}
      <text x={W - 10} y={startY - 4} textAnchor="end" fontSize="9" fill={sublabel} fontStyle="italic">
        conversion
      </text>
    </svg>
  );
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

const AnalyticsPage: React.FC = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const isHrOrAdmin = user?.role === 'admin' || user?.role === 'hr';

  // Existing analytics state
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(CURRENT_YEAR);

  // New insights state
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [topCandidates, setTopCandidates] = useState<TopCandidatesResponse | null>(null);
  const [insightFlags, setInsightFlags] = useState<InsightFlagsResponse | null>(null);
  const [experienceDist, setExperienceDist] = useState<ExperienceDistributionResponse | null>(null);
  const [educationDist, setEducationDist] = useState<EducationDistributionResponse | null>(null);
  const [hiringFunnel, setHiringFunnel] = useState<HiringFunnelResponse | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Fetch existing analytics
  useEffect(() => {
    setLoading(true);
    apiService
      .getAnalytics(year)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year]);

  // Fetch HR insights (only for admin/hr)
  const fetchInsights = useCallback(async () => {
    if (!isHrOrAdmin) return;
    setInsightsLoading(true);
    try {
      const [flagsResp, expResp, eduResp, funnelResp] = await Promise.allSettled([
        apiService.getInsightFlags(),
        apiService.getExperienceDistribution(),
        apiService.getEducationDistribution(),
        apiService.getHiringFunnel(),
      ]);
      if (flagsResp.status === 'fulfilled') setInsightFlags(flagsResp.value);
      if (expResp.status === 'fulfilled') setExperienceDist(expResp.value);
      if (eduResp.status === 'fulfilled') setEducationDist(eduResp.value);
      if (funnelResp.status === 'fulfilled') setHiringFunnel(funnelResp.value);
    } catch (err) {
      console.error('Failed to load HR insights', err);
    } finally {
      setInsightsLoading(false);
    }
  }, [isHrOrAdmin]);

  // Fetch active jobs for the dropdown
  useEffect(() => {
    if (!isHrOrAdmin) return;
    apiService
      .getAllJobPostings()
      .then((allJobs) => {
        const active = allJobs.filter((j) => j.status === 'Active');
        setJobs(active);
        if (active.length > 0 && !selectedJobId) {
          setSelectedJobId(active[0].id);
        }
      })
      .catch(console.error);
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHrOrAdmin]);

  // Fetch top candidates when job selection changes
  useEffect(() => {
    if (!isHrOrAdmin || !selectedJobId) return;
    apiService
      .getTopCandidates(selectedJobId, 5)
      .then(setTopCandidates)
      .catch((err) => {
        console.error('Failed to load top candidates', err);
        setTopCandidates(null);
      });
  }, [isHrOrAdmin, selectedJobId]);

  const cardStyle = {
    backgroundColor: darkMode ? 'rgba(24, 34, 51, 0.92)' : 'rgba(255, 255, 255, 0.88)',
    border: darkMode ? '1px solid rgba(71, 85, 105, 0.38)' : '1px solid rgba(255, 255, 255, 0.72)',
    boxShadow: darkMode ? '0 16px 40px rgba(2, 6, 23, 0.22)' : '0 18px 40px rgba(148, 163, 184, 0.14)',
  } as const;

  const severityStyles: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
    warning: {
      bg: darkMode ? 'rgba(251, 191, 36, 0.08)' : 'rgba(251, 191, 36, 0.06)',
      border: darkMode ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 191, 36, 0.25)',
      icon: <AlertTriangle size={18} className="text-amber-500" />,
    },
    info: {
      bg: darkMode ? 'rgba(96, 165, 250, 0.08)' : 'rgba(96, 165, 250, 0.06)',
      border: darkMode ? 'rgba(96, 165, 250, 0.3)' : 'rgba(96, 165, 250, 0.25)',
      icon: <Info size={18} className="text-blue-400" />,
    },
    success: {
      bg: darkMode ? 'rgba(52, 211, 153, 0.08)' : 'rgba(52, 211, 153, 0.06)',
      border: darkMode ? 'rgba(52, 211, 153, 0.3)' : 'rgba(52, 211, 153, 0.25)',
      icon: <TrendingUp size={18} className="text-emerald-400" />,
    },
  };

  return (
    <div className="dashboard-page min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <span
                className="h-11 w-11 rounded-2xl flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  color: '#818cf8',
                  border: '1px solid rgba(129, 140, 248, 0.16)',
                }}
              >
                <BarChart3 size={22} />
              </span>
              Analytics
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              Recruitment performance insights
            </p>
          </div>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="themed-select rounded-2xl px-4 py-3 text-sm font-semibold"
          >
            {YEARS.map((itemYear) => (
              <option key={itemYear} value={itemYear}>
                {itemYear}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: darkMode ? '#60a5fa' : '#4f7cff' }} />
          </div>
        ) : !data ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            Failed to load analytics.
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── Existing: Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              <StatCard darkMode={darkMode} cardStyle={cardStyle} icon={<TrendingUp size={20} />} iconBg="rgba(96, 165, 250, 0.14)" iconColor="#60a5fa" label="Total Applicants" value={data.total_applicants} suffix="" />
              <StatCard darkMode={darkMode} cardStyle={cardStyle} icon={<BarChart3 size={20} />} iconBg="rgba(250, 204, 21, 0.14)" iconColor="#facc15" label="For Interview" value={data.for_interview} suffix="" />
              <StatCard darkMode={darkMode} cardStyle={cardStyle} icon={<TrendingUp size={20} />} iconBg="rgba(52, 211, 153, 0.14)" iconColor="#34d399" label="Positions Filled" value={data.positions_filled} suffix="" />
              <StatCard darkMode={darkMode} cardStyle={cardStyle} icon={<Percent size={20} />} iconBg="rgba(251, 191, 36, 0.14)" iconColor="#fbbf24" label="Offer Rate" value={data.offer_rate} suffix="%" />
            </div>

            {/* ── Existing: Line Chart + Skills Donut ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 rounded-[28px] p-6" style={cardStyle}>
                <div className="mb-5">
                  <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Applicants per Month - {year}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    Monthly application volume across the selected year.
                  </p>
                </div>
                <LineChart data={data.applicants_per_month} darkMode={darkMode} />
              </div>

              <div className="rounded-[28px] p-6" style={cardStyle}>
                <div className="mb-5">
                  <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Skills Demand
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    Most requested skills across open hiring activity.
                  </p>
                </div>

                <div className="flex flex-col gap-5">
                  <div className="flex justify-center">
                    <DonutChart data={data.skills_demand} darkMode={darkMode} />
                  </div>
                  <div className="space-y-3">
                    {data.skills_demand.map((skill, i) => (
                      <div
                        key={skill.skill}
                        className="flex items-center gap-3 rounded-2xl px-3 py-2"
                        style={{
                          backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.76)' : 'rgba(248, 250, 252, 0.96)',
                          border: darkMode ? '1px solid rgba(71, 85, 105, 0.2)' : '1px solid rgba(226, 232, 240, 0.9)',
                        }}
                      >
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                        <span className="truncate" style={{ color: darkMode ? '#dbe4f0' : '#334155' }}>
                          {skill.skill}
                        </span>
                        <span className="ml-auto font-semibold" style={{ color: 'var(--text-muted)' }}>
                          {skill.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Existing: Bottom Metric Cards ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BottomMetricCard darkMode={darkMode} cardStyle={cardStyle} icon={<Clock size={24} />} iconBg="rgba(45, 212, 191, 0.16)" iconColor="#2dd4bf" label="Avg. Time to Hire" value={`${data.avg_time_to_hire}`} suffix="days" helper="Average time from application to accepted offer." />
              <BottomMetricCard darkMode={darkMode} cardStyle={cardStyle} icon={<Percent size={24} />} iconBg="rgba(251, 191, 36, 0.16)" iconColor="#fbbf24" label="Offer Rate" value={`${data.offer_rate}`} suffix="%" helper={`${data.accepted_applicants} accepted / ${data.total_applicants} total`} />
            </div>

            {/* ══════════════════════════════════════════════════════════════
                 HR INSIGHTS SECTION (admin/HR only)
                 ══════════════════════════════════════════════════════════════ */}
            {isHrOrAdmin && (
              <>
                <div className="flex items-center gap-3 pt-4 pb-2">
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: 'rgba(129, 140, 248, 0.12)',
                      color: '#818cf8',
                      border: '1px solid rgba(129, 140, 248, 0.16)',
                    }}
                  >
                    <Trophy size={18} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      Intelligent Insights
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      NLP & matching-driven analytics for smarter hiring decisions
                    </p>
                  </div>
                </div>

                {insightsLoading && (
                  <div className="flex items-center gap-2 py-4" style={{ color: 'var(--text-muted)' }}>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: darkMode ? '#60a5fa' : '#4f7cff' }} />
                    <span className="text-sm">Loading insights…</span>
                  </div>
                )}

                {/* ── Insight Flags ── */}
                {insightFlags && insightFlags.flags.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {insightFlags.flags.map((flag, idx) => {
                      const style = severityStyles[flag.severity] ?? severityStyles.info;
                      return (
                        <div
                          key={idx}
                          className="rounded-2xl p-4 flex items-start gap-3"
                          style={{
                            backgroundColor: style.bg,
                            border: `1px solid ${style.border}`,
                          }}
                        >
                          <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {flag.message}
                            </p>
                            {flag.missing_items && flag.missing_items.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {flag.missing_items.map((item) => (
                                  <span
                                    key={item}
                                    className="text-xs px-2 py-0.5 rounded-full"
                                    style={{
                                      backgroundColor: darkMode ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.1)',
                                      color: darkMode ? '#fbbf24' : '#b45309',
                                    }}
                                  >
                                    {item}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Top Candidates + Hiring Funnel (side by side) ── */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Top Candidates Panel */}
                  <div className="rounded-[28px] p-6" style={cardStyle}>
                    <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                      <div>
                        <h3 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                          <Users size={20} className="text-indigo-400" />
                          Top Candidates
                        </h3>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                          Best matches for the selected position
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                        <select
                          value={selectedJobId}
                          onChange={(e) => setSelectedJobId(e.target.value)}
                          className="themed-select rounded-xl px-3 py-2 text-xs font-medium"
                        >
                          {jobs.length === 0 && (
                            <option value="">No active jobs</option>
                          )}
                          {jobs.map((j) => (
                            <option key={j.id} value={j.id}>
                              {j.job_title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {!topCandidates || topCandidates.top_candidates.length === 0 ? (
                      <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                        {selectedJobId ? 'No scored candidates yet for this position.' : 'Select a job posting to view top candidates.'}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {topCandidates.top_candidates.map((c, idx) => (
                          <div
                            key={c.user_id}
                            className="rounded-2xl p-4 flex items-center gap-4"
                            style={{
                              backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.76)' : 'rgba(248, 250, 252, 0.96)',
                              border: darkMode ? '1px solid rgba(71, 85, 105, 0.2)' : '1px solid rgba(226, 232, 240, 0.9)',
                            }}
                          >
                            {/* Rank badge */}
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
                              style={{
                                backgroundColor:
                                  idx === 0
                                    ? 'rgba(250, 204, 21, 0.18)'
                                    : idx === 1
                                    ? 'rgba(148, 163, 184, 0.18)'
                                    : idx === 2
                                    ? 'rgba(217, 119, 6, 0.18)'
                                    : 'rgba(99, 102, 241, 0.12)',
                                color:
                                  idx === 0
                                    ? '#facc15'
                                    : idx === 1
                                    ? '#94a3b8'
                                    : idx === 2
                                    ? '#d97706'
                                    : '#818cf8',
                              }}
                            >
                              {idx + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                {c.full_name}
                              </p>
                              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                {c.email}
                              </p>
                              {c.skills_matched.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {c.skills_matched.slice(0, 4).map((s) => (
                                    <span
                                      key={s}
                                      className="text-[10px] px-1.5 py-0.5 rounded-md"
                                      style={{
                                        backgroundColor: darkMode ? 'rgba(96, 165, 250, 0.12)' : 'rgba(96, 165, 250, 0.08)',
                                        color: darkMode ? '#60a5fa' : '#3b82f6',
                                      }}
                                    >
                                      {s}
                                    </span>
                                  ))}
                                  {c.skills_matched.length > 4 && (
                                    <span className="text-[10px] px-1.5 py-0.5" style={{ color: 'var(--text-muted)' }}>
                                      +{c.skills_matched.length - 4} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Score */}
                            <div className="text-right flex-shrink-0">
                              <p className="text-2xl font-bold" style={{ color: c.match_score >= 80 ? '#34d399' : c.match_score >= 60 ? '#fbbf24' : '#f87171' }}>
                                {c.match_score.toFixed(0)}%
                              </p>
                              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                match
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hiring Funnel */}
                  <div className="rounded-[28px] p-6" style={cardStyle}>
                    <div className="mb-5">
                      <h3 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <BarChart3 size={20} className="text-purple-400" />
                        Hiring Funnel
                      </h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                        Candidate progression through hiring stages
                      </p>
                    </div>
                    {hiringFunnel ? (
                      <HiringFunnelChart
                        data={hiringFunnel.funnel}
                        conversion={hiringFunnel.conversion_rates}
                        darkMode={darkMode}
                      />
                    ) : (
                      <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                        No funnel data available.
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Experience + Education Charts (side by side) ── */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Experience Distribution */}
                  <div className="rounded-[28px] p-6" style={cardStyle}>
                    <div className="mb-5">
                      <h3 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <TrendingUp size={20} className="text-emerald-400" />
                        Experience Level Distribution
                      </h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                        Applicant breakdown by years of experience
                      </p>
                    </div>
                    {experienceDist && experienceDist.total_candidates > 0 ? (
                      <>
                        <ExperienceBarChart data={experienceDist.distribution} darkMode={darkMode} />
                        <div className="flex flex-wrap gap-3 mt-4">
                          {experienceDist.distribution.map((d, i) => (
                            <div key={d.level} className="flex items-center gap-2 text-xs">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EXP_COLORS[i % EXP_COLORS.length] }} />
                              <span style={{ color: darkMode ? '#dbe4f0' : '#334155' }}>{d.level}</span>
                              <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>({d.count})</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                        No experience data available. Upload resumes with parsed work history to see distribution.
                      </div>
                    )}
                  </div>

                  {/* Education Distribution */}
                  <div className="rounded-[28px] p-6" style={cardStyle}>
                    <div className="mb-5">
                      <h3 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Percent size={20} className="text-blue-400" />
                        Education Distribution
                      </h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                        Highest education level across candidates
                      </p>
                    </div>
                    {educationDist && educationDist.total_candidates > 0 ? (
                      <div className="flex flex-col items-center gap-4">
                        <EducationDonutChart data={educationDist.distribution} darkMode={darkMode} />
                        <div className="w-full space-y-2">
                          {educationDist.distribution.map((d, i) => (
                            <div
                              key={d.level}
                              className="flex items-center gap-3 rounded-xl px-3 py-2"
                              style={{
                                backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.76)' : 'rgba(248, 250, 252, 0.96)',
                                border: darkMode ? '1px solid rgba(71, 85, 105, 0.2)' : '1px solid rgba(226, 232, 240, 0.9)',
                              }}
                            >
                              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: EDU_COLORS[i % EDU_COLORS.length] }} />
                              <span className="text-sm" style={{ color: darkMode ? '#dbe4f0' : '#334155' }}>{d.level}</span>
                              <span className="ml-auto font-semibold text-sm" style={{ color: 'var(--text-muted)' }}>
                                {d.count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                        No education data available. Upload resumes with parsed education info to see distribution.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Existing Sub-components (unchanged) ─── */

const StatCard: React.FC<{
  darkMode: boolean;
  cardStyle: React.CSSProperties;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: number;
  suffix: string;
}> = ({ darkMode, cardStyle, icon, iconBg, iconColor, label, value, suffix }) => (
  <div className="rounded-[24px] p-5 flex items-center gap-4" style={cardStyle}>
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
      style={{
        backgroundColor: iconBg,
        color: iconColor,
        border: darkMode ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(255,255,255,0.9)',
      }}
    >
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-4xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
        {value}
        {suffix}
      </p>
    </div>
  </div>
);

const BottomMetricCard: React.FC<{
  darkMode: boolean;
  cardStyle: React.CSSProperties;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  suffix: string;
  helper: string;
}> = ({ darkMode, cardStyle, icon, iconBg, iconColor, label, value, suffix, helper }) => (
  <div className="rounded-[28px] p-6 flex items-center gap-5" style={cardStyle}>
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
      style={{
        backgroundColor: iconBg,
        color: iconColor,
        border: darkMode ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(255,255,255,0.9)',
      }}
    >
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-4xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
        {value}
        <span className="text-xl font-medium ml-2" style={{ color: 'var(--text-muted)' }}>
          {suffix}
        </span>
      </p>
      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
        {helper}
      </p>
    </div>
  </div>
);

export default AnalyticsPage;
