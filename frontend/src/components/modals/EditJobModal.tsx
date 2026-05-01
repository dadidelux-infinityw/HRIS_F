import React, { useState, useEffect } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { JobPosting } from '../../types';

interface EditJobModalProps {
  job: JobPosting | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (job: JobPosting) => void;
}

const EditJobModal: React.FC<EditJobModalProps> = ({
  job,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<JobPosting | null>(null);

  useEffect(() => {
    if (job) {
      setFormData({
        ...job,
        requirements: job.requirements?.length ? job.requirements : [''],
        responsibilities: job.responsibilities?.length ? job.responsibilities : [''],
      });
    }
  }, [job]);

  if (!isOpen || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = {
      ...formData,
      requirements: formData.requirements.filter((r) => r.trim() !== ''),
      responsibilities: formData.responsibilities.filter((r) => r.trim() !== ''),
    };
    onSave(cleaned);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleArrayChange = (
    field: 'requirements' | 'responsibilities',
    index: number,
    value: string
  ) => {
    setFormData((prev) => {
      if (!prev) return null;
      const updated = [...prev[field]];
      updated[index] = value;
      return { ...prev, [field]: updated };
    });
  };

  const addArrayItem = (field: 'requirements' | 'responsibilities') => {
    setFormData((prev) =>
      prev ? { ...prev, [field]: [...prev[field], ''] } : null
    );
  };

  const removeArrayItem = (
    field: 'requirements' | 'responsibilities',
    index: number
  ) => {
    setFormData((prev) => {
      if (!prev) return null;
      return { ...prev, [field]: prev[field].filter((_, i) => i !== index) };
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content job-modal-shell" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Job Posting</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Datalist options (shared with Create modal) */}
        <datalist id="editJobTitleOptions">
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
        <datalist id="editDepartmentOptions">
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
        <datalist id="editLocationOptions">
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="job-modal-form flex flex-col flex-1 min-h-0">
          <div className="job-modal-body flex-1 overflow-y-auto p-6 space-y-4">
            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                name="jobTitle"
                list="editJobTitleOptions"
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="Select or type a job title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <input
                type="text"
                name="department"
                list="editDepartmentOptions"
                value={formData.department}
                onChange={handleChange}
                placeholder="Select or type a department"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                name="location"
                list="editLocationOptions"
                value={formData.location}
                onChange={handleChange}
                placeholder="Select or type a location"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements & Qualifications
              </label>
              {formData.requirements.map((req, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={req}
                    onChange={(e) =>
                      handleArrayChange('requirements', index, e.target.value)
                    }
                    placeholder={`Requirement ${index + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {formData.requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('requirements', index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Minus size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('requirements')}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Plus size={14} /> Add Requirement
              </button>
            </div>

            {/* Responsibilities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsibilities
              </label>
              {formData.responsibilities.map((resp, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={resp}
                    onChange={(e) =>
                      handleArrayChange('responsibilities', index, e.target.value)
                    }
                    placeholder={`Responsibility ${index + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {formData.responsibilities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('responsibilities', index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Minus size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('responsibilities')}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Plus size={14} /> Add Responsibility
              </button>
            </div>

            {/* Application Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Deadline
              </label>
              <input
                type="date"
                name="applicationDeadline"
                value={formData.applicationDeadline || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="job-modal-footer flex-shrink-0 flex justify-end gap-3 p-6 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditJobModal;
