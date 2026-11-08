import type {
  Application,
  AuthResult,
  CVAnalysisResult,
  DashboardAnalytics,
  Job,
  Skill,
  SkillGap,
  User,
} from '@/types';
import {
  mockAnalytics,
  mockApplications,
  mockCVAnalyses,
  mockJobs,
  mockSkillGaps,
  mockSkills,
  mockUser,
} from '@/data/mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function delay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function mockError(rate = 0): never {
  if (Math.random() < rate) {
    throw new ApiError('Une erreur est survenue (mock).', 500);
  }
  throw new ApiError('Not reachable', 0);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const data = await res.json();
      message = data.detail || data.message || message;
    } catch {
      /* keep default */
    }
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as T;
}

/* ---------- Auth ---------- */
export const authApi = {
  async login(email: string, password: string): Promise<AuthResult> {
    if (USE_MOCK) {
      if (!email || !password) throw new ApiError('Email et mot de passe requis.', 400);
      return delay({ user: mockUser, token: 'mock-jwt-token' });
    }
    return http<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  async register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<AuthResult> {
    if (USE_MOCK) {
      if (!input.email || !input.password || !input.firstName || !input.lastName) {
        throw new ApiError('Tous les champs sont requis.', 400);
      }
      const user: User = { ...mockUser, ...input, role: 'student', createdAt: new Date().toISOString() };
      return delay({ user, token: 'mock-jwt-token' });
    }
    return http<AuthResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  async me(): Promise<User> {
    if (USE_MOCK) return delay(mockUser, 200);
    return http<User>('/auth/me');
  },
  async updateProfile(patch: Partial<User>): Promise<User> {
    if (USE_MOCK) return delay({ ...mockUser, ...patch }, 400);
    return http<User>('/auth/me', { method: 'PATCH', body: JSON.stringify(patch) });
  },
};

/* ---------- Jobs ---------- */
export const jobsApi = {
  async list(filters?: {
    search?: string;
    type?: string;
    remote?: boolean;
    minMatch?: number;
  }): Promise<Job[]> {
    if (USE_MOCK) {
      let list = [...mockJobs];
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (j) =>
            j.title.toLowerCase().includes(q) ||
            j.company.toLowerCase().includes(q) ||
            j.location.toLowerCase().includes(q),
        );
      }
      if (filters?.type && filters.type !== 'all') {
        list = list.filter((j) => j.type === filters.type);
      }
      if (filters?.remote) list = list.filter((j) => j.remote);
      if (filters?.minMatch) list = list.filter((j) => j.matchScore >= (filters.minMatch as number));
      return delay(list);
    }
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.remote) params.set('remote', 'true');
    if (filters?.minMatch) params.set('min_match', String(filters.minMatch));
    return http<Job[]>(`/jobs?${params}`);
  },
  async get(id: string): Promise<Job> {
    if (USE_MOCK) {
      const job = mockJobs.find((j) => j.id === id);
      if (!job) throw new ApiError('Offre introuvable.', 404);
      return delay(job, 300);
    }
    return http<Job>(`/jobs/${id}`);
  },
  async recommended(): Promise<Job[]> {
    if (USE_MOCK) return delay([...mockJobs].sort((a, b) => b.matchScore - a.matchScore).slice(0, 4));
    return http<Job[]>('/jobs/recommended');
  },
};

/* ---------- Skills ---------- */
export const skillsApi = {
  async list(): Promise<Skill[]> {
    if (USE_MOCK) return delay(mockSkills, 400);
    return http<Skill[]>('/skills');
  },
  async gaps(): Promise<SkillGap[]> {
    if (USE_MOCK) return delay(mockSkillGaps, 400);
    return http<SkillGap[]>('/skills/gaps');
  },
};

/* ---------- Applications ---------- */
export const applicationsApi = {
  async list(): Promise<Application[]> {
    if (USE_MOCK) return delay(mockApplications, 400);
    return http<Application[]>('/applications');
  },
  async apply(jobId: string, coverLetter?: string): Promise<Application> {
    if (USE_MOCK) {
      const job = mockJobs.find((j) => j.id === jobId);
      if (!job) throw new ApiError('Offre introuvable.', 404);
      const now = new Date().toISOString();
      const app: Application = {
        id: `a-${Date.now()}`,
        jobId,
        job,
        status: 'soumise',
        appliedAt: now,
        updatedAt: now,
        coverLetter,
        history: [{ status: 'soumise', date: now }],
      };
      return delay(app, 600);
    }
    return http<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId, cover_letter: coverLetter }),
    });
  },
  async update(id: string, patch: Partial<Application>): Promise<Application> {
    if (USE_MOCK) {
      const found = mockApplications.find((a) => a.id === id);
      if (!found) throw new ApiError('Candidature introuvable.', 404);
      return delay({ ...found, ...patch }, 400);
    }
    return http<Application>(`/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },
  async remove(id: string): Promise<void> {
    if (USE_MOCK) return delay(undefined, 300);
    return http<void>(`/applications/${id}`, { method: 'DELETE' });
  },
};

/* ---------- CV Analysis ---------- */
export const cvApi = {
  async list(): Promise<CVAnalysisResult[]> {
    if (USE_MOCK) return delay(mockCVAnalyses, 400);
    return http<CVAnalysisResult[]>('/cv/analyses');
  },
  async upload(file: File): Promise<CVAnalysisResult> {
    if (USE_MOCK) {
      if (file.type !== 'application/pdf') throw new ApiError('Le fichier doit être au format PDF.', 400);
      const result: CVAnalysisResult = {
        id: `cv-${Date.now()}`,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        status: 'en cours',
        parsedSkills: [],
        suggestedRoles: [],
        matchScore: 0,
        feedback: [],
        warnings: [],
      };
      return delay(result, 800);
    }
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE_URL}/cv/analyze`, { method: 'POST', body: form });
    if (!res.ok) throw new ApiError('Échec du téléversement.', res.status);
    return (await res.json()) as CVAnalysisResult;
  },
};

/* ---------- Dashboard ---------- */
export const dashboardApi = {
  async analytics(): Promise<DashboardAnalytics> {
    if (USE_MOCK) return delay(mockAnalytics, 400);
    return http<DashboardAnalytics>('/dashboard/analytics');
  },
};

// Re-export for convenience so a single import covers the API surface.
export { mockError };
