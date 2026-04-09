import React from 'react';
import { Check } from 'lucide-react';

interface ApplicationProgressStepperProps {
  currentStep: number;
  steps: string[];
}

const ApplicationProgressStepper: React.FC<ApplicationProgressStepperProps> = ({ currentStep, steps }) => {
  return (
    <div
      className="rounded-lg border p-6"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-start justify-between overflow-x-auto">
        {steps.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isFuture = index > currentStep;

          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center min-w-[80px] flex-shrink-0">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: isCurrent ? 40 : 32,
                    height: isCurrent ? 40 : 32,
                    backgroundColor: isCompleted
                      ? 'var(--color-primary, #3b82f6)'
                      : isCurrent
                        ? 'transparent'
                        : 'transparent',
                    border: isCurrent
                      ? '3px solid var(--color-primary, #3b82f6)'
                      : isFuture
                        ? '2px solid var(--text-muted, #9ca3af)'
                        : 'none',
                    color: isCompleted ? '#ffffff' : 'var(--text-muted, #9ca3af)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isCompleted && (
                    <Check
                      size={isCurrent ? 20 : 16}
                      strokeWidth={3}
                      style={{ color: '#ffffff' }}
                    />
                  )}
                  {isCurrent && !isCompleted && (
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary, #3b82f6)',
                      }}
                    />
                  )}
                  {isFuture && (
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: 'var(--text-muted, #9ca3af)',
                      }}
                    />
                  )}
                </div>
                <span
                  className="mt-2 text-center text-xs font-medium leading-tight"
                  style={{
                    color: isCompleted || isCurrent
                      ? 'var(--text-primary)'
                      : 'var(--text-muted)',
                  }}
                >
                  {label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className="flex-1 self-center mt-[-20px] h-[2px] min-w-[24px]"
                  style={{
                    backgroundColor: index < currentStep
                      ? 'var(--color-primary, #3b82f6)'
                      : 'var(--text-muted, #9ca3af)',
                    transition: 'background-color 0.3s ease',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ApplicationProgressStepper;
