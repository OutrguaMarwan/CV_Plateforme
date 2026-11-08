import { useEffect, useState } from 'react';
import {
  Send,
  CalendarClock,
  Trophy,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Target,
  Zap,
} from 'lucide-react';
import type { DashboardAnalytics, Job, SkillGap } from '@/types';
import { dashboardApi, jobsApi, skillsApi } from '@/services/api';
import { DashboardLayout, PageHeader } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, ProgressBar, ScoreRing } from '@/components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';
import { JobCard } from '@/components/jobs/JobCard';
import { Link } from '@/router';

function StatCard({
  label,
  value,
  icon,
  tone,
  delta,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone: 'brand' | 'success' | 'warning' | 'accent';
  delta?: string;
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    accent: 'bg-accent-50 text-accent-600',
  };
  return (
    <Card padding="md" hover>
      <div className="flex items-center justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tones[tone]}`}>
          {icon}
        </div>
        {delta && <Badge tone="success" size="sm">{delta}</Badge>}
      </div>
      <p className="text-3xl font-bold text-navy-900 mt-4">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </Card>
  );
}

function ActivityChart({ data }: { data: DashboardAnalytics['weeklyActivity'] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end justify-between gap-2 h-40 pt-2">
      {data.map((d) => (
        <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full flex-1 flex items-end">
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-brand-500 to-brand-400 hover:from-brand-600 transition-all duration-300 group relative"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? '8px' : '2px' }}
            >
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-navy-900 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-200">
                {d.value}
              </span>
            </div>
          </div>
          <span className="text-xs text-slate-400">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [gaps, setGaps] = useState<SkillGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, j, g] = await Promise.all([
        dashboardApi.analytics(),
        jobsApi.recommended(),
        skillsApi.gaps(),
      ]);
      setAnalytics(a);
      setJobs(j);
      setGaps(g);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger le tableau de bord.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <DashboardLayout><LoadingState label="Chargement de votre tableau de bord…" /></DashboardLayout>;
  if (error || !analytics) return <DashboardLayout><ErrorState message={error || 'Erreur'} onRetry={load} /></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader
        title="Bonjour, Yasmine 👋"
        subtitle="Voici un aperçu de votre recherche d'emploi aujourd'hui."
        action={
          <Link to="/jobs">
            <Button rightIcon={<ArrowRight className="w-4 h-4" />}>Explorer les offres</Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Candidatures" value={analytics.applicationsCount} icon={<Send className="w-5 h-5" />} tone="brand" delta="+3" />
        <StatCard label="Entretiens" value={analytics.interviewsCount} icon={<CalendarClock className="w-5 h-5" />} tone="success" />
        <StatCard label="Score moyen" value={`${analytics.averageMatchScore}%`} icon={<TrendingUp className="w-5 h-5" />} tone="accent" delta="+4%" />
        <StatCard label="Profil rempli" value={`${analytics.profileCompletion}%`} icon={<Trophy className="w-5 h-5" />} tone="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recommended jobs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-navy-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-600" /> Offres recommandées
            </h2>
            <Link to="/jobs" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Tout voir
            </Link>
          </div>
          {jobs.length === 0 ? (
            <Card><EmptyState title="Aucune recommandation" description="Complétez votre profil pour recevoir des recommandations." /></Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {jobs.map((j) => <JobCard key={j.id} job={j} />)}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Activité hebdomadaire" subtitle="Candidatures envoyées" icon={<TrendingUp className="w-5 h-5" />} />
            <ActivityChart data={analytics.weeklyActivity} />
          </Card>

          <Card>
            <CardHeader
              title="Compétences à améliorer"
              subtitle="Basé sur vos écarts"
              icon={<Target className="w-5 h-5" />}
              action={<Link to="/skills" className="text-sm font-medium text-brand-600 hover:text-brand-700">Détails</Link>}
            />
            <div className="space-y-4">
              {gaps.slice(0, 4).map((g) => (
                <div key={g.skill.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-navy-800">{g.skill.name}</span>
                    <span className="text-xs text-slate-500">+{g.gap} pts</span>
                  </div>
                  <ProgressBar value={g.skill.score} tone="warning" />
                  <p className="text-xs text-slate-400 mt-1">
                    Niveau requis : {g.requiredLevel} · Actuel : {g.currentLevel}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Profile completion banner */}
      <Card className="mt-6 bg-gradient-to-r from-brand-50 to-accent-50 border-brand-100">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <ScoreRing score={analytics.profileCompletion} size={64} />
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold text-navy-900">Complétez votre profil à 100%</h3>
            <p className="text-sm text-slate-600 mt-1">
              Un profil complet augmente vos chances de matching de jusqu'à 40%.
              Ajoutez votre CV et vos certifications.
            </p>
          </div>
          <Link to="/cv">
            <Button leftIcon={<Zap className="w-4 h-4" />}>Analyser mon CV</Button>
          </Link>
        </div>
      </Card>
    </DashboardLayout>
  );
}
