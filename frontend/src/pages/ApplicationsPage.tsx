import React, { useState, useEffect } from 'react';
import { Filter, FileText, Eye, Trash2 } from 'lucide-react';
import { apiService, Application } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ApplicationCard from '../components/applications/ApplicationCard';
import ApplicationDetailsModal from '../components/applications/ApplicationDetailsModal';

const statusBadgeStyle = (status: string): React.CSSProperties => {
  switch (status) {
    case 'Pending':     return { backgroundColor: 'var(--status-pending-bg)', color: 'var(--status-pending-text)', border: '1px solid var(--status-pending-text)' };
    case 'In-Process':  return { backgroundColor: 'var(--status-inprocess-bg)', color: 'var(--status-inprocess-text)', border: '1px solid var(--status-inprocess-text)' };
    case 'Accepted':    return { backgroundColor: 'var(--status-accepted-bg)', color: 'var(--status-accepted-text)', border: '1px solid var(--status-accepted-text)' };
    case 'Rejected':    return { backgroundColor: 'var(--status-rejected-bg)', color: 'var(--status-rejected-text)', border: '1px solid var(--status-rejected-text)' };
    case 'Withdrawn':   return { backgroundColor: 'var(--status-withdrawn-bg)', color: 'var(--status-withdrawn-text)', border: '1px solid var(--status-withdrawn-text)' };
    default:            return { backgroundColor: 'var(--status-withdrawn-bg)', color: 'var(--status-withdrawn-text)' };
  }
};

const ApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const isHrOrAdmin = user?.role === 'hr' || user?.role === 'admin';

  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statuses = ['All', 'Pending', 'In-Process', 'Accepted', 'Rejected', 'Withdrawn'];

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, statusFilter]);

  const fetchApplications = async (showLoading = true): Promise<Application[]> => {
    try {
      if (showLoading) setLoading(true);
      const data = await apiService.getAllApplications();
      setApplications(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
      return [];
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const filterApplications = () => {
    if (statusFilter === 'All') {
      setFilteredApplications(applications);
    } else {
      setFilteredApplications(
        applications.filter((app) => app.status === statusFilter)
      );
    }
  };

  const handleWithdraw = async (id: string) => {
    try {
      await apiService.withdrawApplication(id);
      await fetchApplications();
      setSelectedApplication(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw application');
    }
  };

  const handleStatusUpdate = async (id: string, _newStatus: string) => {
    const updated = await fetchApplications(false);
    const refreshed = updated.find((app) => app.id === id);
    if (refreshed) setSelectedApplication(refreshed);
  };

  const handleDeleteCandidate = async (userId: string, candidateName: string) => {
    if (!confirm(`Are you sure you want to delete candidate "${candidateName}"? This will remove their account, profile, resume, and all applications. This action cannot be undone.`)) return;
    try {
      await apiService.deleteUser(userId);
      await fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete candidate');
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  if (loading) {
    return (
      <div className="flex-1">
        <div
          className="border-b px-8 py-6"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {isHrOrAdmin ? 'Applications' : 'My Applications'}
          </h1>
        </div>
        <div className="p-8 flex items-center justify-center">
          <div style={{ color: 'var(--text-muted)' }}>Loading applications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div
        className="border-b px-8 py-6"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {isHrOrAdmin ? 'Applications' : 'My Applications'}
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
          {isHrOrAdmin
            ? 'Review and manage all candidate applications'
            : 'Track your job applications and their status'}
        </p>
      </div>

      {/* Content */}
      <div className="p-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Filter */}
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <Filter size={20} />
            <span className="font-medium">Filter by status:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  statusFilter === status ? 'bg-blue-600 text-white' : ''
                }`}
                style={statusFilter !== status ? {
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                } : {}}
              >
                {status}
                {status === 'All'
                  ? ` (${applications.length})`
                  : ` (${applications.filter((app) => app.status === status).length})`}
              </button>
            ))}
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <div
            className="rounded-lg p-12 text-center border"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <FileText className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {statusFilter === 'All' ? 'No Applications Yet' : `No ${statusFilter} Applications`}
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>
              {statusFilter === 'All'
                ? isHrOrAdmin
                  ? 'No applications have been submitted yet'
                  : 'Start by applying to job postings from the Job Postings page'
                : `No applications with status "${statusFilter}"`}
            </p>
          </div>
        ) : isHrOrAdmin ? (
          /* HR/Admin Table View */
          <div
            className="rounded-lg overflow-hidden border"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b text-left"
                  style={{ backgroundColor: 'var(--table-header-bg)', borderColor: 'var(--border)' }}
                >
                  <th className="px-4 py-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Applicant</th>
                  <th className="px-4 py-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Job Title</th>
                  <th className="px-4 py-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Department</th>
                  <th className="px-4 py-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Applied</th>
                  <th className="px-4 py-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Status</th>
                  <th className="px-4 py-3 font-semibold" style={{ color: 'var(--text-secondary)' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((application) => (
                  <tr
                    key={application.id}
                    className="border-b transition-colors"
                    style={{ borderColor: 'var(--border-light)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--table-row-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {application.user?.full_name || '—'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{application.user?.email}</p>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                      {application.job_posting?.job_title || '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                      {application.job_posting?.department || '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(application.applied_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={statusBadgeStyle(application.status)}
                      >
                        {application.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedApplication(application)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        {application.user?.id && application.user.id !== user?.id && (
                          <button
                            onClick={() => handleDeleteCandidate(application.user!.id, application.user!.full_name || 'Unknown')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium"
                            title="Delete candidate"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Candidate Card View */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredApplications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onView={setSelectedApplication}
              />
            ))}
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {selectedApplication && (
        <ApplicationDetailsModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onWithdraw={handleWithdraw}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
};

export default ApplicationsPage;
