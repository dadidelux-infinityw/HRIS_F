import React, { useEffect, useState } from 'react';
import {
  Award,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Loader2,
  Target,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  apiService,
  JobPosting,
  JobMatchingResponse,
  RankedCandidate,
} from '../services/api';
import MatchScoreBar from '../components/matching/MatchScoreBar';
import { useTheme } from '../contexts/ThemeContext';

const CandidateMatchingPage: React.FC = () => {
  const { darkMode } = useTheme();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [result, setResult] = useState<JobMatchingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<'precompute' | 'clear' | null>(null);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    apiService.getAllJobPostings().then(setJobs).catch(() => {});
  }, []);

  const activeJobs = jobs.filter((j) => j.status === 'Active');

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleExportCsv = () => {
    if (!result) return;

    const rows = [
      ['Rank', 'Full Name', 'Email', 'Skills', 'Has Resume', 'Total Score (%)', 'Similar Skills Set Score', 'Job Match Score'],
      ...result.ranked_candidates.map((c, i) => [
        i + 1,
        c.full_name,
        c.email,
        `"${c.skills.join('; ')}"`,
        c.has_resume ? 'Yes' : 'No',
        c.scores.total_score.toFixed(1),
        (c.scores.semantic_score * 100).toFixed(1),
        (c.scores.keyword_score * 100).toFixed(1),
      ]),
    ];

    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matching_${result.job_title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMatch = async () => {
    if (!selectedJobId) return;
    setLoading(true);
    setError('');
    setStatusMsg('');
    setResult(null);

    try {
      const data = await apiService.getMatchingCandidates(selectedJobId, minScore);
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Failed to match candidates.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrecompute = async () => {
    if (!selectedJobId) return;
    setActionLoading('precompute');
    setStatusMsg('');
    setError('');

    try {
      const data = await apiService.precomputeEmbeddings(selectedJobId);
      setStatusMsg(data.message);
    } catch (e: any) {
      setError(e.message || 'Failed to pre-warm cache.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearCache = async () => {
    if (!selectedJobId) return;
    setActionLoading('clear');
    setStatusMsg('');
    setError('');

    try {
      const data = await apiService.clearEmbeddingCache(selectedJobId);
      setStatusMsg(data.message);
    } catch (e: any) {
      setError(e.message || 'Failed to clear cache.');
    } finally {
      setActionLoading(null);
    }
  };

  const rankBadge = (index: number) => {
    const colors = ['#f59e0b', '#94a3b8', '#c08457'];
    const labels = ['#1', '#2', '#3'];

    if (index < 3) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            background: colors[index],
            color: '#fff',
            borderRadius: 9999,
            padding: '2px 10px',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <Award size={13} />
          {labels[index]}
        </span>
      );
    }

    return (
      <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
        #{index + 1}
      </span>
    );
  };

  const panelStyle = {
    backgroundColor: darkMode ? 'rgba(24, 34, 51, 0.92)' : 'rgba(255, 255, 255, 0.88)',
    border: darkMode ? '1px solid rgba(71, 85, 105, 0.38)' : '1px solid rgba(255, 255, 255, 0.72)',
    boxShadow: darkMode ? '0 16px 40px rgba(2, 6, 23, 0.22)' : '0 18px 40px rgba(148, 163, 184, 0.14)',
  } as const;

  return (
    <div className="themed-page">
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(251, 191, 36, 0.12)',
                color: '#fbbf24',
                border: '1px solid rgba(251, 191, 36, 0.16)',
              }}
            >
              <Target size={18} strokeWidth={1.9} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Candidate Matching
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Rank candidates using 70% Similar Skills Set (Gemini) and 30% Job Match.
          </p>
        </div>

        <div className="rounded-[26px] p-6 mb-6" style={panelStyle}>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                Job Posting
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => {
                  setSelectedJobId(e.target.value);
                  setResult(null);
                  setStatusMsg('');
                  setError('');
                }}
                className="themed-select w-full rounded-2xl px-4 py-3 text-sm"
              >
                <option value="">Select a job</option>
                {activeJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.job_title} ({j.department})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ width: 130 }}>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                Min Score (0-100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(Math.max(0, Math.min(100, Number(e.target.value))))}
                className="themed-input w-full rounded-2xl px-4 py-3 text-sm"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleMatch}
                disabled={!selectedJobId || loading}
                className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-2xl transition-colors disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: '#1f2937' }}
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Target size={15} />}
                Match Candidates
              </button>

              <button
                type="button"
                onClick={handlePrecompute}
                disabled={!selectedJobId || actionLoading !== null}
                className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-3 rounded-2xl transition-colors disabled:opacity-40"
                style={{
                  backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(248, 250, 252, 0.96)',
                  color: 'var(--text-secondary)',
                  border: darkMode ? '1px solid rgba(71, 85, 105, 0.4)' : '1px solid rgba(226, 232, 240, 0.9)',
                }}
              >
                {actionLoading === 'precompute' ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                Pre-warm Cache
              </button>

              <button
                type="button"
                onClick={handleClearCache}
                disabled={!selectedJobId || actionLoading !== null}
                className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-3 rounded-2xl transition-colors disabled:opacity-40"
                style={{
                  border: darkMode ? '1px solid rgba(248, 113, 113, 0.26)' : '1px solid rgba(240, 68, 56, 0.18)',
                  color: darkMode ? '#f87171' : '#d92d20',
                  backgroundColor: darkMode ? 'rgba(127, 29, 29, 0.08)' : '#fef3f2',
                }}
              >
                {actionLoading === 'clear' ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Clear Cache
              </button>
            </div>
          </div>

          {statusMsg && (
            <div
              className="mt-4 text-sm rounded-2xl px-4 py-3"
              style={{
                color: darkMode ? '#86efac' : '#027a48',
                backgroundColor: darkMode ? 'rgba(20, 83, 45, 0.22)' : '#ecfdf3',
                border: darkMode ? '1px solid rgba(34, 197, 94, 0.18)' : '1px solid #abefc6',
              }}
            >
              {statusMsg}
            </div>
          )}

          {error && (
            <div
              className="mt-4 text-sm rounded-2xl px-4 py-3"
              style={{
                color: darkMode ? '#fca5a5' : '#b42318',
                backgroundColor: darkMode ? 'rgba(127, 29, 29, 0.2)' : '#fef3f2',
                border: darkMode ? '1px solid rgba(248, 113, 113, 0.18)' : '1px solid #fecdca',
              }}
            >
              {error}
            </div>
          )}
        </div>

        {result && (
          <div>
            <div className="rounded-[26px] p-6 mb-4" style={panelStyle}>
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {result.job_title} - Requirements
                </h2>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-2xl transition-colors"
                  style={{
                    backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(248, 250, 252, 0.96)',
                    color: 'var(--text-secondary)',
                    border: darkMode ? '1px solid rgba(71, 85, 105, 0.38)' : '1px solid rgba(226, 232, 240, 0.9)',
                  }}
                >
                  <Download size={14} />
                  Export CSV
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {result.requirements.map((requirement) => (
                  <span
                    key={requirement}
                    className="text-xs font-medium px-3 py-1.5 rounded-full"
                    style={{
                      backgroundColor: darkMode ? 'rgba(251, 191, 36, 0.12)' : '#fffaeb',
                      color: darkMode ? '#fbbf24' : '#b54708',
                      border: darkMode ? '1px solid rgba(251, 191, 36, 0.16)' : '1px solid #fedf89',
                    }}
                  >
                    {requirement}
                  </span>
                ))}
              </div>

              <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
                {result.total_candidates} candidate(s) matched • computed {new Date(result.computed_at).toLocaleTimeString()}
              </p>
            </div>

            {result.ranked_candidates.length === 0 ? (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                No candidates meet the minimum score threshold.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {result.ranked_candidates.map((candidate: RankedCandidate, index: number) => {
                  const expanded = expandedIds.has(candidate.user_id);

                  return (
                    <div key={candidate.user_id} className="rounded-[24px] p-5" style={panelStyle}>
                      <div className="flex items-start gap-4">
                        <div className="mt-1 flex-shrink-0">{rankBadge(index)}</div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {candidate.full_name}
                            </span>
                            {candidate.has_resume && (
                              <span
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border"
                                style={{
                                  color: darkMode ? '#fbbf24' : '#b54708',
                                  backgroundColor: darkMode ? 'rgba(251, 191, 36, 0.12)' : '#fffaeb',
                                  borderColor: darkMode ? 'rgba(251, 191, 36, 0.16)' : '#fedf89',
                                }}
                              >
                                <FileText size={11} />
                                Resume
                              </span>
                            )}
                          </div>

                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            {candidate.email}
                          </p>

                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {(expanded ? candidate.skills : candidate.skills.slice(0, 6)).map((skill) => (
                              <span
                                key={skill}
                                className="text-xs px-2.5 py-1 rounded-full"
                                style={{
                                  backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.78)' : 'rgba(248, 250, 252, 0.96)',
                                  color: darkMode ? '#dbe4f0' : '#334155',
                                  border: darkMode ? '1px solid rgba(71, 85, 105, 0.24)' : '1px solid rgba(226, 232, 240, 0.9)',
                                }}
                              >
                                {skill}
                              </span>
                            ))}

                            {!expanded && candidate.skills.length > 6 && (
                              <button
                                type="button"
                                onClick={() => toggleExpand(candidate.user_id)}
                                className="text-xs hover:underline"
                                style={{ color: '#fbbf24' }}
                              >
                                +{candidate.skills.length - 6} more
                              </button>
                            )}

                            {expanded && candidate.skills.length > 6 && (
                              <button
                                type="button"
                                onClick={() => toggleExpand(candidate.user_id)}
                                className="text-xs hover:underline"
                                style={{ color: '#fbbf24' }}
                              >
                                Show less
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0 w-52 mt-1">
                          <MatchScoreBar
                            totalScore={candidate.scores.total_score}
                            semanticScore={candidate.scores.semantic_score}
                            keywordScore={candidate.scores.keyword_score}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleExpand(candidate.user_id)}
                          className="flex-shrink-0 mt-1"
                          style={{ color: 'var(--text-muted)' }}
                          aria-label="Toggle details"
                        >
                          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateMatchingPage;
