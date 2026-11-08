export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  location?: string;
  headline?: string;
  bio?: string;
  createdAt: string;
}

export type SkillLevel = 'débutant' | 'intermédiaire' | 'avancé' | 'expert';

export interface Skill {
  id: string;
  name: string;
  category: string;
  level: SkillLevel;
  score: number; // 0-100
  verified: boolean;
}

export interface SkillGap {
  skill: Skill;
  requiredLevel: SkillLevel;
  currentLevel: SkillLevel;
  gap: number; // points needed
}

export interface Job {
  id: string;
  title: string;
  company: string;
  logoColor: string;
  location: string;
  remote: boolean;
  type: 'stage' | 'emploi' | 'alternance' | 'freelance';
  duration?: string;
  salary?: string;
  description: string;
  requirements: string[];
  requiredSkills: { name: string; level: SkillLevel; weight: number }[];
  niceToHave: string[];
  postedAt: string;
  deadline?: string;
  matchScore: number; // 0-100
  url?: string;
}

export type ApplicationStatus =
  | 'brouillon'
  | 'soumise'
  | 'en revue'
  | 'entretien'
  | 'offre'
  | 'refusée';

export interface Application {
  id: string;
  jobId: string;
  job: Job;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  coverLetter?: string;
  notes?: string;
  history: { status: ApplicationStatus; date: string }[];
}

export interface CVAnalysisResult {
  id: string;
  fileName: string;
  uploadedAt: string;
  status: 'en cours' | 'terminé' | 'échec';
  parsedSkills: Skill[];
  suggestedRoles: string[];
  matchScore: number;
  feedback: string[];
  warnings: string[];
}

export interface DashboardAnalytics {
  applicationsCount: number;
  interviewsCount: number;
  offersCount: number;
  profileCompletion: number;
  averageMatchScore: number;
  weeklyActivity: { day: string; value: number }[];
  skillsDistribution: { category: string; count: number }[];
}

export interface AuthResult {
  user: User;
  token: string;
}
