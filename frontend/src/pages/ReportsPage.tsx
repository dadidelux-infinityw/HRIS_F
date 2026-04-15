import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Plus,
  ClipboardList,
  Users,
  Calendar,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { apiService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

interface RecentReport {
  title: string;
  type: 'CSV';
  date: string;
  filename: string;
  blob?: string;
}

const REPORT_TYPES = [
  {
    id: 'applicant-list',
    label: 'Applicant List',
    description: 'All applicants with contact info and status',
    icon: ClipboardList,
    iconColor: '#60a5fa',
    iconBg: 'rgba(96, 165, 250, 0.14)',
  },
  {
    id: 'shortlisted',
    label: 'Shortlisted Candidates',
    description: 'Candidates currently In-Process or Accepted',
    icon: Users,
    iconColor: '#34d399',
    iconBg: 'rgba(52, 211, 153, 0.14)',
  },
  {
    id: 'interview-results',
    label: 'Interview Results',
    description: 'All scheduled and completed interviews',
    icon: Calendar,
    iconColor: '#a78bfa',
    iconBg: 'rgba(167, 139, 250, 0.14)',
  },
  {
    id: 'hiring-summary',
    label: 'Hiring Summary',
    description: 'Aggregate hiring statistics',
    icon: BarChart3,
    iconColor: '#fbbf24',
    iconBg: 'rgba(251, 191, 36, 0.14)',
  },
] as const;

type ReportId = (typeof REPORT_TYPES)[number]['id'];

const STORAGE_KEY = 'hris_recent_reports';
const loadRecentReports = (): RecentReport[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveRecentReports = (reports: RecentReport[]) => {
  const toSave = reports.slice(0, 10).map(({ blob: _unused, ...rest }) => rest);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
};

const downloadCsv = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const fmt = (value: any) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const buildCsv = (headers: string[], rows: string[][]): string =>
  [headers, ...rows].map((row) => row.map(fmt).join(',')).join('\n');

const ReportsPage: React.FC = () => {
  const { darkMode } = useTheme();
  const [selectedType, setSelectedType] = useState<ReportId>('applicant-list');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [recentReports, setRecentReports] = useState<RecentReport[]>(loadRecentReports);

  useEffect(() => {
    saveRecentReports(recentReports);
  }, [recentReports]);

  const generateReport = async () => {
    setGenerating(true);
    setError('');

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const fileDate = now.toISOString().slice(0, 10);

    try {
      let csv = '';
      let title = '';
      let filename = '';

      if (selectedType === 'applicant-list') {
        title = 'Applicant List';
        filename = `applicant_list_${fileDate}.csv`;
        const apps = await apiService.getAllApplications();
        csv = buildCsv(
          ['Full Name', 'Email', 'Job Title', 'Department', 'Location', 'Status', 'Recruitment Stage', 'Applied Date'],
          apps.map((application) => [
            application.user?.full_name || '',
            application.user?.email || '',
            application.job_posting?.job_title || '',
            application.job_posting?.department || '',
            application.job_posting?.location || '',
            application.status,
            application.recruitment_stage || '',
            application.applied_date,
          ])
        );
      } else if (selectedType === 'shortlisted') {
        title = 'Shortlisted Candidates';
        filename = `shortlisted_${fileDate}.csv`;
        const apps = await apiService.getAllApplications();
        const filtered = apps.filter(
          (application) => application.status === 'In-Process' || application.status === 'Accepted'
        );
        csv = buildCsv(
          ['Full Name', 'Email', 'Job Title', 'Department', 'Status', 'Recruitment Stage', 'Applied Date'],
          filtered.map((application) => [
            application.user?.full_name || '',
            application.user?.email || '',
            application.job_posting?.job_title || '',
            application.job_posting?.department || '',
            application.status,
            application.recruitment_stage || '',
            application.applied_date,
          ])
        );
      } else if (selectedType === 'interview-results') {
        title = 'Interview Results';
        filename = `interview_results_${fileDate}.csv`;
        const interviews = await apiService.getAllInterviews();
        csv = buildCsv(
          ['Interview Date', 'Time', 'Type', 'Status', 'Location', 'Interviewer', 'Notes'],
          interviews.map((interview) => [
            interview.interview_date,
            interview.interview_time,
            interview.interview_type,
            interview.status,
            interview.location,
            interview.interviewer_name || '',
            interview.notes || '',
          ])
        );
      } else if (selectedType === 'hiring-summary') {
        title = 'Hiring Summary';
        filename = `hiring_summary_${fileDate}.csv`;
        const [apps, analytics] = await Promise.all([
          apiService.getAllApplications(),
          apiService.getAnalytics(),
        ]);
        const pending = apps.filter((application) => application.status === 'Pending').length;
        const inProcess = apps.filter((application) => application.status === 'In-Process').length;
        const accepted = apps.filter((application) => application.status === 'Accepted').length;
        const rejected = apps.filter((application) => application.status === 'Rejected').length;
        const withdrawn = apps.filter((application) => application.status === 'Withdrawn').length;

        csv = buildCsv(
          ['Metric', 'Value'],
          [
            ['Total Applicants', String(apps.length)],
            ['Pending', String(pending)],
            ['In-Process', String(inProcess)],
            ['Accepted / Hired', String(accepted)],
            ['Rejected', String(rejected)],
            ['Withdrawn', String(withdrawn)],
            ['Offer Rate (%)', String(analytics.offer_rate)],
            ['Avg. Time to Hire (days)', String(analytics.avg_time_to_hire)],
            ['For Interview', String(analytics.for_interview)],
            ['Positions Filled', String(analytics.positions_filled)],
            ['Report Generated', now.toISOString()],
          ]
        );
      }

      downloadCsv(csv, filename);

      const report: RecentReport = { title, type: 'CSV', date: dateStr, filename };
      setRecentReports((prev) => [report, ...prev.slice(0, 9)]);
    } catch (err: any) {
      setError(err.message || 'Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  };

  const regenerateReport = (report: RecentReport) => {
    const match = REPORT_TYPES.find((type) => type.label === report.title);
    if (!match) return;
    setSelectedType(match.id);
    setTimeout(generateReport, 50);
  };

  const panelStyle = {
    backgroundColor: darkMode ? 'rgba(24, 34, 51, 0.92)' : 'rgba(255, 255, 255, 0.86)',
    border: darkMode ? '1px solid rgba(71, 85, 105, 0.38)' : '1px solid rgba(255, 255, 255, 0.7)',
    boxShadow: darkMode ? '0 16px 40px rgba(2, 6, 23, 0.22)' : '0 18px 40px rgba(148, 163, 184, 0.14)',
  } as const;

  return (
    <div className="dashboard-page min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <span
              className="h-11 w-11 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                color: '#818cf8',
                border: '1px solid rgba(129, 140, 248, 0.16)',
              }}
            >
              <FileText size={22} />
            </span>
            Reports
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Generate and download recruitment reports
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 rounded-[28px] p-6" style={panelStyle}>
            <h2 className="text-sm font-semibold mb-5 uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
              Generate Report
            </h2>

            <div className="space-y-3 mb-6">
              {REPORT_TYPES.map((reportType) => {
                const Icon = reportType.icon;
                const isSelected = selectedType === reportType.id;

                return (
                  <button
                    key={reportType.id}
                    onClick={() => setSelectedType(reportType.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-[22px] text-left transition-all"
                    style={{
                      border: isSelected
                        ? darkMode
                          ? '1px solid rgba(251, 191, 36, 0.24)'
                          : '1px solid rgba(245, 158, 11, 0.24)'
                        : darkMode
                          ? '1px solid rgba(71, 85, 105, 0.3)'
                          : '1px solid rgba(203, 213, 225, 0.72)',
                      background: isSelected
                        ? darkMode
                          ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.16) 0%, rgba(245, 158, 11, 0.22) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 247, 237, 0.96) 0%, rgba(255, 237, 213, 0.94) 100%)'
                        : darkMode
                          ? 'rgba(30, 41, 59, 0.54)'
                          : 'rgba(248, 250, 252, 0.96)',
                      boxShadow: isSelected
                        ? darkMode
                          ? '0 14px 32px rgba(245, 158, 11, 0.12)'
                          : '0 14px 28px rgba(245, 158, 11, 0.08)'
                        : 'none',
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isSelected
                          ? darkMode
                            ? 'rgba(255,255,255,0.86)'
                            : 'rgba(255,255,255,0.95)'
                          : reportType.iconBg,
                        color: isSelected ? '#d97706' : reportType.iconColor,
                        border: darkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.85)',
                      }}
                    >
                      <Icon size={20} />
                    </div>

                    <div className="min-w-0">
                      <p
                        className="text-lg font-semibold"
                        style={{ color: isSelected ? (darkMode ? '#fde68a' : '#9a6700') : 'var(--text-primary)' }}
                      >
                        {reportType.label}
                      </p>
                      <p className="text-sm" style={{ color: isSelected ? (darkMode ? 'rgba(255, 248, 220, 0.82)' : '#b45309') : 'var(--text-muted)' }}>
                        {reportType.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <div
                className="text-sm mb-4 rounded-2xl px-4 py-3"
              style={{
                color: darkMode ? '#fca5a5' : '#b42318',
                backgroundColor: darkMode ? 'rgba(127, 29, 29, 0.2)' : '#fef3f2',
                border: darkMode ? '1px solid rgba(248, 113, 113, 0.18)' : '1px solid #fecdca',
              }}
            >
                {error}
              </div>
            )}

            <button
              onClick={generateReport}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-4 rounded-[22px] transition-colors disabled:opacity-50"
              style={{
                background: darkMode
                  ? 'linear-gradient(135deg, #4f5bd5 0%, #4048a5 100%)'
                  : 'linear-gradient(135deg, #4f5bd5 0%, #5b67db 100%)',
                color: '#ffffff',
              }}
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>

          <div className="lg:col-span-3 rounded-[28px] p-6" style={panelStyle}>
            <h2 className="text-sm font-semibold mb-5 uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
              Recent Reports
            </h2>

            {recentReports.length === 0 ? (
              <div
                className="rounded-[24px] min-h-[420px] flex flex-col items-center justify-center text-center"
                style={{
                  background: darkMode ? 'rgba(18, 26, 42, 0.44)' : 'rgba(248, 250, 252, 0.88)',
                  border: darkMode ? '1px dashed rgba(71, 85, 105, 0.32)' : '1px dashed rgba(203, 213, 225, 0.9)',
                }}
              >
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                  style={{
                    backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.1)',
                    color: darkMode ? '#94a3b8' : '#818cf8',
                  }}
                >
                  <FileText size={36} />
                </div>
                <p className="text-xl font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  No reports generated yet.
                </p>
                <p className="text-sm mt-2 max-w-sm" style={{ color: 'var(--text-muted)' }}>
                  Pick a report type on the left and generate your first downloadable export.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReports.map((report, index) => (
                  <div
                    key={`${report.filename}-${index}`}
                    className="rounded-[22px] px-5 py-4 flex items-center gap-4"
                    style={{
                      background: darkMode ? 'rgba(30, 41, 59, 0.54)' : 'rgba(248, 250, 252, 0.96)',
                      border: darkMode ? '1px solid rgba(71, 85, 105, 0.24)' : '1px solid rgba(226, 232, 240, 0.9)',
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(96, 165, 250, 0.14)', color: '#60a5fa' }}
                    >
                      <FileText size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {report.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full font-semibold"
                          style={{
                            color: darkMode ? '#86efac' : '#027a48',
                            backgroundColor: darkMode ? 'rgba(20, 83, 45, 0.22)' : '#ecfdf3',
                            border: darkMode ? '1px solid rgba(34, 197, 94, 0.18)' : '1px solid #abefc6',
                          }}
                        >
                          {report.type}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>{report.date}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => regenerateReport(report)}
                      className="h-11 w-11 rounded-2xl flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: darkMode ? 'rgba(79, 91, 213, 0.16)' : 'rgba(79, 91, 213, 0.08)',
                        color: darkMode ? '#a5b4fc' : '#4f5bd5',
                        border: darkMode ? '1px solid rgba(129, 140, 248, 0.18)' : '1px solid rgba(99, 102, 241, 0.14)',
                      }}
                      title="Re-download"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
