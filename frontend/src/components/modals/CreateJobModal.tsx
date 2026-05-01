import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { CreateJobPostingData } from '../../types';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateJobPostingData) => void;
}

const steps = [
  'Basic Information',
  'Job Description',
  'Requirements & Responsibilities',
  'Application Details',
];

const inputClassName = 'themed-input w-full rounded-2xl px-4 py-3 text-sm';
const labelClassName = 'block text-sm font-semibold mb-2';

const CreateJobModal: React.FC<CreateJobModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CreateJobPostingData>({
    jobTitle: '',
    department: '',
    location: '',
    description: '',
    requirements: [''],
    responsibilities: [''],
    applicationDeadline: '',
  });

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (stepErrors[name]) {
      setStepErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleArrayChange = (
    field: 'requirements' | 'responsibilities',
    index: number,
    value: string
  ) => {
    setFormData((prev) => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (field: 'requirements' | 'responsibilities') => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeArrayItem = (
    field: 'requirements' | 'responsibilities',
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.jobTitle.trim()) errors.jobTitle = 'Job title is required.';
      if (!formData.department.trim()) errors.department = 'Department is required.';
      if (!formData.location.trim()) errors.location = 'Location is required.';
    } else if (currentStep === 2 && !formData.description.trim()) {
      errors.description = 'Job description is required.';
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const resetModal = () => {
    setCurrentStep(1);
    setStepErrors({});
    setFormData({
      jobTitle: '',
      department: '',
      location: '',
      description: '',
      requirements: [''],
      responsibilities: [''],
      applicationDeadline: '',
    });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedData = {
      ...formData,
      requirements: formData.requirements.filter((r) => r.trim() !== ''),
      responsibilities: formData.responsibilities.filter((r) => r.trim() !== ''),
    };
    onCreate(cleanedData);
    handleClose();
  };

  const cardStyle = {
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
  } as const;

  const renderError = (key: string) =>
    stepErrors[key] ? <p className="text-red-400 text-xs mt-2">{stepErrors[key]}</p> : null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content job-modal-shell" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 px-8 py-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-[28px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Create Job Posting
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Create a polished role listing with guided steps.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="job-modal-close h-11 w-11 rounded-2xl flex items-center justify-center transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <div className="px-8 pt-7">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = currentStep === stepNumber;
              const isComplete = currentStep > stepNumber;

              return (
                <div key={step} className="job-step-card rounded-3xl p-4">
                  <div className="flex items-center gap-3">
                    <div className={`job-step-badge ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}>
                      {isComplete ? <Check size={16} strokeWidth={2.6} /> : stepNumber}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.16em] font-semibold" style={{ color: 'var(--text-muted)' }}>
                        Step {stepNumber}
                      </p>
                      <p className="text-sm font-semibold leading-5 mt-1" style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {step}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="job-modal-form flex flex-col flex-1 min-h-0">
          <div className="job-modal-body flex-1 overflow-y-auto px-8 py-8">
            {currentStep === 1 && (
              <div className="space-y-5">
                <datalist id="jobTitleOptions">
                  <option value="Software Engineer" />
                  <option value="Senior Software Engineer" />
                  <option value="Frontend Developer" />
                  <option value="Backend Developer" />
                  <option value="Full Stack Developer" />
                  <option value="DevOps Engineer" />
                  <option value="Data Analyst" />
                  <option value="Data Scientist" />
                  <option value="Product Manager" />
                  <option value="Project Manager" />
                  <option value="UX Designer" />
                  <option value="UI Designer" />
                  <option value="Graphic Designer" />
                  <option value="Marketing Manager" />
                  <option value="Sales Representative" />
                  <option value="HR Specialist" />
                  <option value="Accountant" />
                  <option value="Financial Analyst" />
                  <option value="Operations Manager" />
                  <option value="Administrative Assistant" />
                  <option value="Customer Support Specialist" />
                  <option value="Business Analyst" />
                </datalist>
                <datalist id="departmentOptions">
                  <option value="Engineering" />
                  <option value="Product" />
                  <option value="Design" />
                  <option value="Analytics" />
                  <option value="Marketing" />
                  <option value="Sales" />
                  <option value="Human Resources" />
                  <option value="Finance" />
                  <option value="Operations" />
                  <option value="Administration" />
                  <option value="Customer Success" />
                  <option value="Legal" />
                  <option value="IT" />
                </datalist>
                <datalist id="locationOptions">
                  <option value="Remote" />
                  <option value="Quezon City, Philippines" />
                  <option value="Manila, Philippines" />
                  <option value="Makati, Philippines" />
                  <option value="Cebu City, Philippines" />
                  <option value="San Francisco, CA" />
                  <option value="New York, NY" />
                  <option value="Los Angeles, CA" />
                  <option value="Chicago, IL" />
                  <option value="Boston, MA" />
                  <option value="Seattle, WA" />
                  <option value="Austin, TX" />
                </datalist>

                <div>
                  <label className={labelClassName} style={{ color: 'var(--text-secondary)' }}>
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    list="jobTitleOptions"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    placeholder="Select or type a job title"
                    className={`${inputClassName} ${stepErrors.jobTitle ? 'border-red-500' : ''}`}
                  />
                  {renderError('jobTitle')}
                </div>

                <div>
                  <label className={labelClassName} style={{ color: 'var(--text-secondary)' }}>
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="department"
                    list="departmentOptions"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Select or type a department"
                    className={`${inputClassName} ${stepErrors.department ? 'border-red-500' : ''}`}
                  />
                  {renderError('department')}
                </div>

                <div>
                  <label className={labelClassName} style={{ color: 'var(--text-secondary)' }}>
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    list="locationOptions"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Select or type a location"
                    className={`${inputClassName} ${stepErrors.location ? 'border-red-500' : ''}`}
                  />
                  {renderError('location')}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <label className={labelClassName} style={{ color: 'var(--text-secondary)' }}>
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={8}
                  placeholder="Describe the role, team goals, and the impact this hire will make."
                  className={`${inputClassName} min-h-[240px] resize-none ${stepErrors.description ? 'border-red-500' : ''}`}
                />
                {renderError('description')}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="rounded-3xl p-5" style={cardStyle}>
                  <label className={labelClassName} style={{ color: 'var(--text-secondary)' }}>
                    Requirements & Qualifications
                  </label>
                  {formData.requirements.map((req, index) => (
                    <div key={`req-${index}`} className="flex gap-3 mb-3">
                      <input
                        type="text"
                        value={req}
                        onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                        placeholder={`Requirement ${index + 1}`}
                        className={`${inputClassName} flex-1`}
                      />
                      {formData.requirements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayItem('requirements', index)}
                          className="rounded-2xl px-4 py-3 text-sm font-medium transition-colors"
                          style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#f87171' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem('requirements')}
                    className="mt-2 text-sm font-semibold"
                    style={{ color: 'var(--accent)' }}
                  >
                    + Add Requirement
                  </button>
                </div>

                <div className="rounded-3xl p-5" style={cardStyle}>
                  <label className={labelClassName} style={{ color: 'var(--text-secondary)' }}>
                    Responsibilities
                  </label>
                  {formData.responsibilities.map((resp, index) => (
                    <div key={`resp-${index}`} className="flex gap-3 mb-3">
                      <input
                        type="text"
                        value={resp}
                        onChange={(e) => handleArrayChange('responsibilities', index, e.target.value)}
                        placeholder={`Responsibility ${index + 1}`}
                        className={`${inputClassName} flex-1`}
                      />
                      {formData.responsibilities.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayItem('responsibilities', index)}
                          className="rounded-2xl px-4 py-3 text-sm font-medium transition-colors"
                          style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#f87171' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem('responsibilities')}
                    className="mt-2 text-sm font-semibold"
                    style={{ color: 'var(--accent)' }}
                  >
                    + Add Responsibility
                  </button>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-5">
                <div>
                  <label className={labelClassName} style={{ color: 'var(--text-secondary)' }}>
                    Application Deadline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="applicationDeadline"
                    value={formData.applicationDeadline}
                    onChange={handleChange}
                    className={inputClassName}
                    required
                  />
                </div>

                <div className="rounded-3xl p-5" style={cardStyle}>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Job Title:</span> {formData.jobTitle || 'Not set'}
                    </p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Department:</span> {formData.department || 'Not set'}
                    </p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Location:</span> {formData.location || 'Not set'}
                    </p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Deadline:</span> {formData.applicationDeadline || 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="job-modal-footer flex-shrink-0 flex justify-between items-center px-8 py-6 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl transition-colors ${currentStep === 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
              style={{
                color: currentStep === 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                backgroundColor: currentStep === 1 ? 'transparent' : 'var(--bg-tertiary)',
                border: currentStep === 1 ? '1px solid transparent' : '1px solid var(--border)',
              }}
            >
              <ChevronLeft size={18} />
              Previous
            </button>

            <div className="flex gap-3">
              <button type="button" onClick={handleClose} className="btn-secondary rounded-2xl">
                Cancel
              </button>
              {currentStep < 4 ? (
                <button type="button" onClick={handleNext} className="btn-primary flex items-center gap-2 rounded-2xl">
                  Next
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button type="submit" className="btn-primary rounded-2xl">
                  Create Job Posting
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJobModal;
