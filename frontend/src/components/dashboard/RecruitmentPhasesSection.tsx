import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  LucideIcon,
  Mail,
  Presentation,
  Rocket,
  User,
  Users,
} from 'lucide-react';
import { RecruitmentPhase, RecruitmentStage, RECRUITMENT_STAGES } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  phases: RecruitmentPhase[];
}

interface PhaseConfig {
  light: { bg: string; border: string; text: string };
  dark: { bg: string; border: string; text: string };
  badgeBg: string;
  dot: string;
  icon: LucideIcon;
}

const PHASE_COLORS: Record<string, PhaseConfig> = {
  'Initial Screening': {
    light: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
    dark:  { bg: '#1e3a5f', border: '#3b82f6', text: '#93c5fd' },
    badgeBg: '#3b82f6', dot: '#3b82f6',
    icon: ClipboardList,
  },
  'Teaching Demo': {
    light: { bg: '#faf5ff', border: '#e9d5ff', text: '#7c3aed' },
    dark:  { bg: '#2e1a47', border: '#8b5cf6', text: '#c4b5fd' },
    badgeBg: '#8b5cf6', dot: '#8b5cf6',
    icon: Presentation,
  },
  'Interview': {
    light: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e' },
    dark:  { bg: '#3d2a00', border: '#f59e0b', text: '#fcd34d' },
    badgeBg: '#f59e0b', dot: '#f59e0b',
    icon: Users,
  },
  'Final Selection': {
    light: { bg: '#fff7ed', border: '#fdba74', text: '#c2410c' },
    dark:  { bg: '#3d1a00', border: '#f97316', text: '#fdba74' },
    badgeBg: '#f97316', dot: '#f97316',
    icon: CheckCircle2,
  },
  'Job Offer': {
    light: { bg: '#f0fdf4', border: '#86efac', text: '#15803d' },
    dark:  { bg: '#14532d', border: '#22c55e', text: '#86efac' },
    badgeBg: '#22c55e', dot: '#22c55e',
    icon: Mail,
  },
  'Onboarding': {
    light: { bg: '#f0fdfa', border: '#5eead4', text: '#0f766e' },
    dark:  { bg: '#134e4a', border: '#14b8a6', text: '#5eead4' },
    badgeBg: '#14b8a6', dot: '#14b8a6',
    icon: Rocket,
  },
};

const RecruitmentPhasesSection: React.FC<Props> = ({ phases }) => {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const { darkMode } = useTheme();

  const phaseMap = new Map(phases.map(p => [p.phase_name, p]));

  const togglePhase = (phaseName: string) => {
    setExpandedPhase(prev => (prev === phaseName ? null : phaseName));
  };

  return (
    <div
      className="rounded-3xl p-6 dashboard-card"
    >
      <h2 className="text-xl font-bold mb-5" style={{ color: 'var(--text-primary)' }}>
        Recruitment Pipeline
      </h2>

      {/* Phase indicator cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {RECRUITMENT_STAGES.map(stageName => {
          const phase = phaseMap.get(stageName);
          const count = phase?.count ?? 0;
          const cfg = PHASE_COLORS[stageName];
          const palette = darkMode ? cfg.dark : cfg.light;
          const isExpanded = expandedPhase === stageName;
          const Icon = cfg.icon;

          return (
            <button
              key={stageName}
              onClick={() => togglePhase(stageName)}
              className="flex flex-col items-center p-4 rounded-xl text-center transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: palette.bg,
                border: isExpanded ? `2px solid ${cfg.dot}` : `1px solid ${palette.border}`,
                boxShadow: isExpanded ? `0 0 0 2px ${cfg.dot}30` : 'none',
                color: palette.text,
              }}
            >
              <Icon size={22} className="mb-1" style={{ color: palette.text }} />
              <span className="text-3xl font-bold" style={{ color: palette.text }}>{count}</span>
              <span className="text-xs font-medium mt-1 leading-tight">{stageName}</span>
              {isExpanded ? (
                <ChevronUp size={14} className="mt-2 opacity-60" />
              ) : (
                <ChevronDown size={14} className="mt-2 opacity-60" />
              )}
            </button>
          );
        })}
      </div>

      {/* Expanded candidate list */}
      {expandedPhase && (() => {
        const phase = phaseMap.get(expandedPhase as RecruitmentStage);
        const cfg = PHASE_COLORS[expandedPhase];
        const palette = darkMode ? cfg.dark : cfg.light;
        if (!phase) return null;
        return (
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: palette.bg, border: `1px solid ${palette.border}` }}
          >
            <h3 className="font-semibold text-sm mb-3" style={{ color: palette.text }}>
              {expandedPhase} — {phase.count} applicant{phase.count !== 1 ? 's' : ''}
            </h3>
            {phase.candidates.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No applicants in this stage.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {phase.candidates.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 shadow-sm"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: cfg.badgeBg }}
                    >
                      <User size={13} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{c.job_title}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default RecruitmentPhasesSection;
