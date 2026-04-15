import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import JobPostingsPage from './pages/JobPostingsPage';
import ProfilePage from './pages/ProfilePage';
import ApplicationsPage from './pages/ApplicationsPage';
import InterviewsPage from './pages/InterviewsPage';
import BrowseJobsPage from './pages/BrowseJobsPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import MyInterviewsPage from './pages/MyInterviewsPage';
import CandidateMatchingPage from './pages/CandidateMatchingPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ReportsPage from './pages/ReportsPage';

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            {/* HR/Admin Routes */}
            <Route path="job-postings" element={<JobPostingsPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="interviews" element={<InterviewsPage />} />
            <Route path="matching" element={<CandidateMatchingPage />} />
            {/* Candidate Routes */}
            <Route path="jobs" element={<BrowseJobsPage />} />
            <Route path="my-applications" element={<MyApplicationsPage />} />
            <Route path="my-interviews" element={<MyInterviewsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="resume" element={<ProfilePage />} />
            <Route path="settings" element={<ProfilePage />} />
            <Route path="help" element={<ProfilePage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
