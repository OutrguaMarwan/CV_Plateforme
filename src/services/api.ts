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
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
).replace(/\/+$/, '');
const STORAGE_KEY = 'skillbridge_auth';

interface StoredAuthSession {
  token: string;
  refresh?: string;
  [key: string]: unknown;
}

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

function isStoredAuthSession(value: unknown): value is StoredAuthSession {
  return (
    typeof value === 'object' &&
    value !== null &&
    'token' in value &&
    typeof value.token === 'string' &&
    (!('refresh' in value) || typeof value.refresh === 'string')
  );
}

function readAuthSession(): StoredAuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;

  let session: unknown;
  try {
    session = JSON.parse(raw);
  } catch {
    throw new ApiError('Session locale invalide. Veuillez vous reconnecter.', 401);
  }

  if (!isStoredAuthSession(session)) {
    throw new ApiError('Session locale invalide. Veuillez vous reconnecter.', 401);
  }

  return session;
}

function getAccessToken(): string | null {
  return readAuthSession()?.token ?? null;
}

function getResponseMessage(data: unknown, fallback: string): string {
  if (typeof data !== 'object' || data === null) return fallback;

  if ('detail' in data && typeof data.detail === 'string') {
    return data.detail;
  }

  if ('message' in data && typeof data.message === 'string') {
    return data.message;
  }

  const messages = Object.values(data).flatMap((value) => {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }
    return [];
  });

  return messages.length > 0 ? messages.join(' ') : fallback;
}

async function responseError(response: Response): Promise<ApiError> {
  let message = `Erreur ${response.status}`;

  try {
    const data: unknown = await response.json();
    message = getResponseMessage(data, message);
  } catch {
    // Conserver le message basé sur le statut si la réponse n'est pas JSON.
  }

  return new ApiError(message, response.status);
}

function clearExpiredSession(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('skillbridge:session-expired'));
}

let refreshRequest: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshRequest) return refreshRequest;

  const session = readAuthSession();
  if (!session?.refresh) {
    clearExpiredSession();
    throw new ApiError('Session expirée. Veuillez vous reconnecter.', 401);
  }

  const currentRequest = (async () => {
    const response = await fetch(`${API_BASE_URL}/auth/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: session.refresh }),
    });

    if (!response.ok) {
      const error = await responseError(response);
      if (response.status === 400 || response.status === 401) {
        clearExpiredSession();
      }
      throw error;
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new ApiError('Réponse de renouvellement invalide.', 500);
    }

    if (
      typeof data !== 'object' ||
      data === null ||
      !('access' in data) ||
      typeof data.access !== 'string'
    ) {
      throw new ApiError('Réponse de renouvellement invalide.', 500);
    }

    const newRefresh =
      'refresh' in data && typeof data.refresh === 'string'
        ? data.refresh
        : session.refresh;

    const updatedSession: StoredAuthSession = {
      ...session,
      token: data.access,
      ...(newRefresh ? { refresh: newRefresh } : {}),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));
    window.dispatchEvent(
      new CustomEvent('skillbridge:tokens-refreshed', {
        detail: {
          token: updatedSession.token,
          refresh: updatedSession.refresh,
        },
      }),
    );

    return updatedSession.token;
  })();

  refreshRequest = currentRequest;

  try {
    return await currentRequest;
  } finally {
    if (refreshRequest === currentRequest) {
      refreshRequest = null;
    }
  }
}

async function fetchWithAuth(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  const isPublicAuthRoute =
    path === '/auth/login' || path === '/auth/register';

  const send = async (token: string | null): Promise<Response> => {
    const headers = new Headers(options?.headers);

    if (token && !isPublicAuthRoute) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  };

  const token = isPublicAuthRoute ? null : getAccessToken();
  let response = await send(token);

  if (response.status === 401 && token && !isPublicAuthRoute) {
    const refreshedToken = await refreshAccessToken();
    response = await send(refreshedToken);

    if (response.status === 401) {
      clearExpiredSession();
    }
  }

  return response;
}

async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);

  if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetchWithAuth(path, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw await responseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/* ---------- Auth ---------- */
export const authApi = {
  async login(email: string, password: string): Promise<AuthResult> {
    if (USE_MOCK) {
      if (!email || !password) {
        throw new ApiError('Email et mot de passe requis.', 400);
      }
      return delay({
        user: mockUser,
        token: 'mock-jwt-token',
        refresh: 'mock-refresh-token',
      });
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
  }): Promise<{ user: User; message: string }> {
    if (USE_MOCK) {
      if (!input.email || !input.password || !input.firstName || !input.lastName) {
        throw new ApiError('Tous les champs sont requis.', 400);
      }

      const user: User = {
        ...mockUser,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: 'student',
        createdAt: new Date().toISOString(),
      };

      return delay({
        user,
        message: 'Compte créé. Vous pouvez maintenant vous connecter.',
      });
    }

    return http<{ user: User; message: string }>('/auth/register', {
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
    return http<User>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
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
        const query = filters.search.toLowerCase();
        list = list.filter(
          (job) =>
            job.title.toLowerCase().includes(query) ||
            job.company.toLowerCase().includes(query) ||
            job.location.toLowerCase().includes(query),
        );
      }

      if (filters?.type && filters.type !== 'all') {
        list = list.filter((job) => job.type === filters.type);
      }

      if (filters?.remote) {
        list = list.filter((job) => job.remote);
      }

      if (filters?.minMatch) {
        list = list.filter((job) => job.matchScore >= filters.minMatch!);
      }

      return delay(list);
    }

    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.remote) params.set('remote', 'true');
    if (filters?.minMatch) {
      params.set('min_match', String(filters.minMatch));
    }

    return http<Job[]>(`/jobs?${params}`);
  },

  async get(id: string): Promise<Job> {
    if (USE_MOCK) {
      const job = mockJobs.find((item) => item.id === id);
      if (!job) throw new ApiError('Offre introuvable.', 404);
      return delay(job, 300);
    }

    return http<Job>(`/jobs/${id}`);
  },

  async recommended(): Promise<Job[]> {
    if (USE_MOCK) {
      return delay(
        [...mockJobs].sort((a, b) => b.matchScore - a.matchScore).slice(0, 4),
      );
    }
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
      const job = mockJobs.find((item) => item.id === jobId);
      if (!job) throw new ApiError('Offre introuvable.', 404);

      const now = new Date().toISOString();
      const application: Application = {
        id: `a-${Date.now()}`,
        jobId,
        job,
        status: 'soumise',
        appliedAt: now,
        updatedAt: now,
        coverLetter,
        history: [{ status: 'soumise', date: now }],
      };

      return delay(application, 600);
    }

    return http<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId, cover_letter: coverLetter }),
    });
  },

  async update(id: string, patch: Partial<Application>): Promise<Application> {
    if (USE_MOCK) {
      const found = mockApplications.find((application) => application.id === id);
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
      if (file.type !== 'application/pdf') {
        throw new ApiError('Le fichier doit être au format PDF.', 400);
      }

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

    const response = await fetchWithAuth('/cv/analyze', {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      throw await responseError(response);
    }

    return (await response.json()) as CVAnalysisResult;
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