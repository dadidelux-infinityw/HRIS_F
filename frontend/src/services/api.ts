const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface JobPosting {
  id: string;
  job_title: string;
  title?: string; // Alias for candidate pages
  department: string;
  location: string;
  status: string;
  employment_type?: string;
  salary_range?: string;
  date_posted: string;
  application_deadline: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateJobPostingData {
  job_title: string;
  department: string;
  location: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  application_deadline: string;
}

export interface UpdateJobPostingData {
  job_title?: string;
  department?: string;
  location?: string;
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  application_deadline?: string;
  status?: 'Active' | 'Inactive' | 'Closed';
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  profile_picture?: string;
  is_active: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface DashboardStats {
  total_users: number;
  total_job_postings: number;
  active_job_postings: number;
  total_interviews: number;
  user: {
    full_name: string;
    email: string;
    role: string;
  };
}

export interface JobCategory {
  name: string;
  count: number;
  icon: string;
}

export interface MonthlyCount {
  month: string;
  count: number;
}

export interface SkillDemand {
  skill: string;
  count: number;
}

export interface AnalyticsData {
  year: number;
  applicants_per_month: MonthlyCount[];
  skills_demand: SkillDemand[];
  avg_time_to_hire: number;
  offer_rate: number;
  total_applicants: number;
  for_interview: number;
  positions_filled: number;
  accepted_applicants: number;
}

export interface Profile {
  id: string;
  user_id: string;
  bio?: string;
  skills: string[];
  resume_skills: string[];
  phone?: string;
  address?: string;
  documents: DocumentInfo[];
  created_at: string;
  updated_at: string;
}

export interface DocumentInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  uploaded_at: string;
}

export interface ProfileUpdate {
  bio?: string;
  skills?: string[];
  phone?: string;
  address?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface UserMeUpdate {
  full_name?: string;
}

export type RecruitmentStage =
  | 'Initial Screening'
  | 'Teaching Demo'
  | 'Interview'
  | 'Final Selection'
  | 'Job Offer'
  | 'Onboarding';

export const RECRUITMENT_STAGES: RecruitmentStage[] = [
  'Initial Screening',
  'Teaching Demo',
  'Interview',
  'Final Selection',
  'Job Offer',
  'Onboarding',
];

export interface RecruitmentPhaseCandidate {
  id: string;
  name: string;
  job_title: string;
}

export interface RecruitmentPhase {
  phase_name: RecruitmentStage;
  count: number;
  candidates: RecruitmentPhaseCandidate[];
}

export interface Application {
  id: string;
  user_id: string;
  job_posting_id: string;
  status: 'Pending' | 'In-Process' | 'Accepted' | 'Rejected' | 'Withdrawn';
  recruitment_stage?: RecruitmentStage | null;
  applied_date: string;
  cover_letter?: string;
  documents: any[];
  timeline: TimelineEvent[];
  created_at: string;
  updated_at: string;
  job_posting?: {
    id: string;
    job_title: string;
    department: string;
    location: string;
    status: string;
  };
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface TimelineEvent {
  status: string;
  timestamp: string;
  note?: string;
}

export interface ApplicationCreate {
  job_posting_id: string;
  cover_letter?: string;
}

export interface ApplicationUpdate {
  status?: string;
  recruitment_stage?: RecruitmentStage | null;
  cover_letter?: string;
  note?: string;
}

export interface Interview {
  id: string;
  application_id: string;
  interview_date: string;
  interview_time: string;
  location: string;
  interview_type: 'Phone' | 'Video' | 'In-Person' | 'Panel';
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  notes?: string;
  interviewer_name?: string;
  created_at: string;
  updated_at: string;
  application?: {
    id: string;
    user_id: string;
    job_posting_id: string;
    status: string;
  };
}

export interface InterviewCreate {
  application_id: string;
  interview_date: string;
  interview_time: string;
  location: string;
  interview_type: string;
  notes?: string;
  interviewer_name?: string;
}

export interface InterviewUpdate {
  interview_date?: string;
  interview_time?: string;
  location?: string;
  interview_type?: string;
  status?: string;
  notes?: string;
  interviewer_name?: string;
}

// Candidate Dashboard types
export interface CandidateMetrics {
  applied_jobs: number;
  for_interview: number;
  under_review: number;
  rejected: number;
  accepted: number;
}

export interface TopRecommendation {
  job_id: string;
  job_title: string;
  department: string;
  match_score: number;
}

export interface ApplicationProgress {
  current_step: number;
  steps: string[];
}

export interface UpcomingInterviewData {
  id: string;
  job_title: string;
  interview_date: string;
  interview_time: string;
  location: string;
  interview_type: string;
}

export interface RecommendedJob {
  id: string;
  job_title: string;
  department: string;
  location: string;
  date_posted: string;
}

export interface ActivityItem {
  type: 'application_status' | 'interview_scheduled' | 'application_submitted';
  message: string;
  timestamp: string;
  job_title: string;
}

export interface CandidateDashboardData {
  metrics: CandidateMetrics;
  application_progress: ApplicationProgress;
  upcoming_interview: UpcomingInterviewData | null;
  recommended_jobs: RecommendedJob[];
  top_recommendation: TopRecommendation | null;
  activity_feed: ActivityItem[];
  user: { full_name: string; email: string; role: string };
}

export interface CandidateMatchScore {
  total_score: number;   // 0-100
  semantic_score: number; // 0-1
  keyword_score: number;  // 0-1
}

export interface RankedCandidate {
  user_id: string;
  full_name: string;
  email: string;
  skills: string[];
  has_resume: boolean;
  scores: CandidateMatchScore;
}

export interface JobMatchingResponse {
  job_id: string;
  job_title: string;
  requirements: string[];
  total_candidates: number;
  ranked_candidates: RankedCandidate[];
  computed_at: string;
}

export interface PrecomputeResponse {
  job_id: string;
  candidates_processed: number;
  embeddings_cached: number;
  message: string;
}

export interface CacheDeleteResponse {
  job_id: string;
  entries_deleted: number;
  message: string;
}

// HR Insights types
export interface TopCandidate {
  user_id: string;
  full_name: string;
  email: string;
  match_score: number;
  semantic_score: number;
  keyword_score: number;
  skills_matched: string[];
  total_skills: number;
}

export interface TopCandidatesResponse {
  job_id: string;
  job_title: string;
  requirements: string[];
  total_candidates_scored: number;
  top_candidates: TopCandidate[];
}

export interface InsightFlag {
  type: string;
  severity: 'warning' | 'info' | 'success';
  message: string;
  candidate_name?: string;
  job_title?: string;
  match_score?: number;
  missing_items?: string[];
  count?: number;
}

export interface InsightFlagsResponse {
  flags: InsightFlag[];
  total_flags: number;
}

export interface ExperienceBucket {
  level: string;
  count: number;
}

export interface ExperienceDistributionResponse {
  distribution: ExperienceBucket[];
  total_candidates: number;
  details: { user_id: string; full_name: string; years_experience: number; bucket: string }[];
}

export interface EducationBucket {
  level: string;
  count: number;
}

export interface EducationDistributionResponse {
  distribution: EducationBucket[];
  total_candidates: number;
  details: { user_id: string; full_name: string; education_level: string }[];
}

export interface FunnelStep {
  stage: string;
  count: number;
}

export interface HiringFunnelResponse {
  funnel: FunnelStep[];
  conversion_rates: Record<string, number>;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(error.detail || 'An error occurred');
    }
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  // Authentication methods
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    return this.handleResponse(response);
  }

  async register(email: string, password: string, full_name: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, full_name }),
    });
    return this.handleResponse(response);
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${this.baseUrl}/auth/me`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async logout(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/logout`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Dashboard methods
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${this.baseUrl}/dashboard/stats`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getJobCategories(): Promise<JobCategory[]> {
    const response = await fetch(`${this.baseUrl}/dashboard/categories`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getCandidateDashboard(): Promise<CandidateDashboardData> {
    const response = await fetch(`${this.baseUrl}/dashboard/candidate-summary`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Profile methods
  async getMyProfile(): Promise<Profile> {
    const response = await fetch(`${this.baseUrl}/profile/me`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateMyProfile(data: ProfileUpdate): Promise<Profile> {
    const response = await fetch(`${this.baseUrl}/profile/me`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async updateCurrentUser(data: UserMeUpdate): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users/me`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('file', file);
    const { 'Content-Type': _omit, ...headers } = this.getAuthHeaders() as Record<string, string>;
    const response = await fetch(`${this.baseUrl}/users/me/avatar`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return this.handleResponse(response);
  }

  getAvatarUrl(userId: string): string {
    return `${this.baseUrl}/users/${userId}/avatar`;
  }

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/profile/password`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async deleteDocument(documentId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/profile/documents/${documentId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Applications methods
  async getAllApplications(statusFilter?: string): Promise<Application[]> {
    const url = statusFilter
      ? `${this.baseUrl}/applications/?status_filter=${statusFilter}`
      : `${this.baseUrl}/applications/`;
    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getApplication(id: string): Promise<Application> {
    const response = await fetch(`${this.baseUrl}/applications/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async createApplication(data: ApplicationCreate): Promise<Application> {
    const response = await fetch(`${this.baseUrl}/applications/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async updateApplication(id: string, data: ApplicationUpdate): Promise<Application> {
    const response = await fetch(`${this.baseUrl}/applications/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async withdrawApplication(id: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/applications/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Interviews methods
  async getAllInterviews(filterType?: string): Promise<Interview[]> {
    const url = filterType
      ? `${this.baseUrl}/interviews/?filter_type=${filterType}`
      : `${this.baseUrl}/interviews/`;
    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getInterview(id: string): Promise<Interview> {
    const response = await fetch(`${this.baseUrl}/interviews/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async createInterview(data: InterviewCreate): Promise<Interview> {
    const response = await fetch(`${this.baseUrl}/interviews/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async updateInterview(id: string, data: InterviewUpdate): Promise<Interview> {
    const response = await fetch(`${this.baseUrl}/interviews/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async cancelInterview(id: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/interviews/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Job Postings methods
  async getAllJobPostings(): Promise<JobPosting[]> {
    const response = await fetch(`${this.baseUrl}/job-postings/`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getJobPosting(id: string): Promise<JobPosting> {
    const response = await fetch(`${this.baseUrl}/job-postings/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async createJobPosting(data: CreateJobPostingData): Promise<JobPosting> {
    const response = await fetch(`${this.baseUrl}/job-postings/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async updateJobPosting(id: string, data: UpdateJobPostingData): Promise<JobPosting> {
    const response = await fetch(`${this.baseUrl}/job-postings/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async deleteJobPosting(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/job-postings/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Candidate-specific methods
  async getJobPostings(): Promise<JobPosting[]> {
    // Get all job postings (candidates see only active ones)
    const response = await fetch(`${this.baseUrl}/job-postings/`, {
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse(response);
    // Map job_title to title for consistency
    return data.map((job: any) => ({
      ...job,
      title: job.title || job.job_title,
    }));
  }

  async applyToJob(jobId: string, coverLetter?: string): Promise<Application> {
    const response = await fetch(`${this.baseUrl}/applications/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        job_posting_id: jobId,
        cover_letter: coverLetter,
      }),
    });
    return this.handleResponse(response);
  }

  async getMyApplications(): Promise<any[]> {
    // Get applications for current user only
    const response = await fetch(`${this.baseUrl}/applications/my`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getMyInterviews(): Promise<any[]> {
    // Get interviews for current user only
    const response = await fetch(`${this.baseUrl}/interviews/my`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Resume methods
  async getResume(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/profile/resume`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async uploadResume(file: File): Promise<any> {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/profile/resume`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return this.handleResponse(response);
  }

  async downloadResume(): Promise<void> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/profile/resume/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download resume');
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'resume.pdf';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match) {
        filename = match[1];
      }
    }

    // Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async deleteResume(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/profile/resume`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Candidate matching methods
  async getMatchingCandidates(jobId: string, minScore = 0): Promise<JobMatchingResponse> {
    const response = await fetch(
      `${this.baseUrl}/matching/candidates/${jobId}?min_score=${minScore}`,
      { headers: this.getAuthHeaders() }
    );
    return this.handleResponse(response);
  }

  async precomputeEmbeddings(jobId: string): Promise<PrecomputeResponse> {
    const response = await fetch(`${this.baseUrl}/matching/precompute/${jobId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getAnalytics(year?: number): Promise<AnalyticsData> {
    const url = year
      ? `${this.baseUrl}/dashboard/analytics?year=${year}`
      : `${this.baseUrl}/dashboard/analytics`;
    const response = await fetch(url, { headers: this.getAuthHeaders() });
    return this.handleResponse(response);
  }

  async getRecruitmentPhases(): Promise<RecruitmentPhase[]> {
    const response = await fetch(`${this.baseUrl}/dashboard/recruitment-phases`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getApplicationsForScheduling(): Promise<{ id: string; candidate_name: string; job_title: string }[]> {
    const apps = await this.getAllApplications();
    return apps
      .filter(a => a.status !== 'Rejected' && a.status !== 'Withdrawn')
      .map(a => ({
        id: a.id,
        candidate_name: a.user?.full_name || 'Unknown',
        job_title: a.job_posting?.job_title || 'Unknown',
      }));
  }

  async clearEmbeddingCache(jobId: string): Promise<CacheDeleteResponse> {
    const response = await fetch(`${this.baseUrl}/matching/cache/${jobId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // HR Insights methods (admin/HR only)
  async getTopCandidates(jobId: string, limit = 3): Promise<TopCandidatesResponse> {
    const response = await fetch(
      `${this.baseUrl}/dashboard/insights/top-candidates?job_id=${jobId}&limit=${limit}`,
      { headers: this.getAuthHeaders() }
    );
    return this.handleResponse(response);
  }

  async getInsightFlags(): Promise<InsightFlagsResponse> {
    const response = await fetch(`${this.baseUrl}/dashboard/insights/flags`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getExperienceDistribution(): Promise<ExperienceDistributionResponse> {
    const response = await fetch(`${this.baseUrl}/dashboard/insights/experience-distribution`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getEducationDistribution(): Promise<EducationDistributionResponse> {
    const response = await fetch(`${this.baseUrl}/dashboard/insights/education-distribution`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getHiringFunnel(): Promise<HiringFunnelResponse> {
    const response = await fetch(`${this.baseUrl}/dashboard/insights/hiring-funnel`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // User management methods (HR/Admin)
  async getAllUsers(): Promise<User[]> {
    const response = await fetch(`${this.baseUrl}/users/`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async deleteUser(userId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/users/${userId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }
}

export const apiService = new ApiService();
