import React, { useRef, useState } from 'react';
import { FileText, Upload, Download, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { apiService } from '../../services/api';

interface ResumeData {
  id: string;
  filename: string;
  file_size: number;
  parsing_status: 'pending' | 'completed' | 'failed';
  uploaded_at: string;
}

interface ResumeTabProps {
  onProfileChanged?: () => Promise<void>;
}

const ResumeTab: React.FC<ResumeTabProps> = ({ onProfileChanged }) => {
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    loadResume();
  }, []);

  const loadResume = async () => {
    try {
      setLoading(true);
      const data = await apiService.getResume();
      setResume(data);
    } catch {
      setResume(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await apiService.uploadResume(file);
      setResume(result);
      setSuccess(result.message || 'Resume uploaded successfully!');
      // Refresh profile so skills list stays in sync
      if (onProfileChanged) await onProfileChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload resume');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async () => {
    try {
      await apiService.downloadResume();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download resume');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your resume?')) return;
    try {
      const result = await apiService.deleteResume();
      setResume(null);
      setSuccess(result.message || 'Resume deleted successfully');
      // Refresh profile so resume-sourced skills are removed from display
      if (onProfileChanged) await onProfileChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resume');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Resume / CV</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Upload your resume as a PDF. Skills will be extracted automatically using AI.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <Loader2 size={16} className="animate-spin" />
          Loading...
        </div>
      ) : resume ? (
        <div className="space-y-4">
          <div
            className="flex items-center justify-between p-4 rounded-2xl border"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl app-icon-chip-active">
                <FileText size={22} strokeWidth={1.9} />
              </div>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{resume.filename}</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {formatFileSize(resume.file_size)} · Uploaded {new Date(resume.uploaded_at).toLocaleDateString()}
                </p>
                <p className="text-xs mt-1">
                  {resume.parsing_status === 'completed' && (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle size={12} /> Parsed successfully
                    </span>
                  )}
                  {resume.parsing_status === 'pending' && (
                    <span className="text-yellow-600">Parsing...</span>
                  )}
                  {resume.parsing_status === 'failed' && (
                    <span className="text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} /> Parsing failed
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
                title="Download"
              >
                <Download size={18} />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-sm font-medium disabled:opacity-50"
            style={{ color: 'var(--accent)' }}
          >
            {uploading ? 'Uploading...' : 'Replace with new resume'}
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Uploading and parsing resume...</p>
              </div>
            ) : (
              <>
                <Upload size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Click to upload your resume</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>PDF files only, max 10MB</p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  Skills will be extracted automatically using AI
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeTab;
