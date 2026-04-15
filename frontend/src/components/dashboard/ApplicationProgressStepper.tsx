import React from 'react';
import {
  Check,
  Search,
  Award,
  Briefcase,
  UserPlus,
  Send,
  FileText,
  Presentation,
  UserCheck,
  Star,
  ShieldCheck,
  CircleDot,
  Flag,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ApplicationProgressStepperProps {
  currentStep: number;
  steps: string[];
}

const stepIconMap: Record<string, LucideIcon> = {
  'Submitted': Send,
  'Initial Screening': Search,
  'Screening': Search,
  'Teaching Demo': Presentation,
  'Interview': UserCheck,
  'Final Selection': Award,
  'Final Decision': Award,
  'Job Offer': Briefcase,
  'Onboarding': UserPlus,
  'Under Review': FileText,
  'Review': FileText,
  'Accepted': Check,
  'Rejected': ShieldCheck,
  'Shortlisted': Star,
};

const STEP_COLORS = ['#4f7cff', '#22c55e', '#f97316', '#eab308', '#8b5cf6', '#06b6d4'];

const ApplicationProgressStepper: React.FC<ApplicationProgressStepperProps> = ({ currentStep, steps }) => {
  const { darkMode } = useTheme();
  const getStepIcon = (label: string): LucideIcon => {
    return stepIconMap[label] || CircleDot;
  };

  // Ensure steps is not empty
  if (!steps || steps.length === 0) return null;

  const activeIndex = Math.min(currentStep, steps.length - 1);
  const progressPercent = steps.length > 1 ? (activeIndex / (steps.length - 1)) * 100 : 100;
  const gradientStops = steps
    .slice(0, Math.max(activeIndex + 1, 1))
    .map((_, index, arr) => {
      const position = arr.length === 1 ? 0 : (index / (arr.length - 1)) * 100;
      return `${STEP_COLORS[index % STEP_COLORS.length]} ${position}%`;
    })
    .join(', ');

  return (
    <div className="w-full pt-2 pb-4">
      <div
        className="relative mb-10 h-3 rounded-full overflow-visible"
        style={{
          backgroundColor: darkMode ? 'rgba(71, 85, 105, 0.28)' : 'rgba(203, 213, 225, 0.7)',
        }}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
          style={{
            width: `${progressPercent}%`,
            background: `linear-gradient(90deg, ${gradientStops})`,
            boxShadow: darkMode ? '0 8px 24px rgba(79, 124, 255, 0.18)' : '0 6px 18px rgba(79, 124, 255, 0.14)',
          }}
        />
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full p-1 shadow-sm"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <Flag size={10} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      <div className="flex justify-between relative px-2">
        {steps.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const Icon = getStepIcon(label);
          const stepColor = STEP_COLORS[index % STEP_COLORS.length];

          const completed = isCompleted;
          const current = isCurrent;

          return (
            <div key={index} className="flex flex-col items-center flex-1 max-w-[20%]">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-all duration-300 shadow-sm"
                style={
                  completed
                    ? {
                        backgroundColor: stepColor,
                        border: `1px solid ${stepColor}`,
                        color: '#ffffff',
                        boxShadow: darkMode ? `0 8px 18px ${stepColor}33` : `0 8px 16px ${stepColor}22`,
                      }
                    : current
                    ? {
                        backgroundColor: darkMode ? `${stepColor}22` : `${stepColor}14`,
                        border: `2px solid ${stepColor}`,
                        color: stepColor,
                      }
                    : {
                        backgroundColor: darkMode ? 'rgba(51, 65, 85, 0.42)' : '#e5e7eb',
                        border: `1px solid ${darkMode ? 'rgba(71, 85, 105, 0.35)' : '#d1d5db'}`,
                        color: darkMode ? '#94a3b8' : '#9ca3af',
                      }
                }
              >
                {completed ? <Check size={14} strokeWidth={3} /> : <Icon size={14} strokeWidth={2.5} />}
              </div>
              <span
                className="text-[12px] font-semibold text-center leading-tight transition-colors duration-300"
                style={{ color: completed || current ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApplicationProgressStepper;
