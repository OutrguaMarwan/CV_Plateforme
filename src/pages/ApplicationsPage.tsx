import { useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  Send,
  Eye,
  CalendarClock,
  Trophy,
  XCircle,
  FileEdit,
  Clock,
  ChevronRight,
} from 'lucide-react';
import type { Application, ApplicationStatus } from '@/types';
import { applicationsApi } from '@/services/api';
import { DashboardLayout, PageHeader } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Badge, ScoreRing } from '@/components/ui/Badge';
import { CompanyLogo } from '@/components/ui/Avatar';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { Link } from '@/router';

const statusConfig: Record<
  ApplicationStatus,
  { label: string; tone: 'neutral' | 'brand' | 'accent' | 'success' | 'error' | 'warning'; icon: typeof Send; step: number }
> = {
  brouillon: { label: 'Brouillon', tone: 'neutral', icon: FileEdit, step: 0 },
  soumise: { label: 'Soumise', tone: 'brand', icon: Send, step: 1 },
  'en revue': { label: 'En revue', tone: 'accent', icon: Eye, step: 2 },
  entretien: { label: 'Entretien', tone: 'warning', icon: CalendarClock, step: 3 },
  offre: { label: 'Offre', tone: 'success', icon: Trophy, step: 4 },
  refusée: { label: 'Refusée', tone: 'error', icon: XCircle, step: -1 },
};

const filters: (ApplicationStatus | 'all')[] = [
  'all',
  'brouillon',
  'soumise',
  'en revue',
  'entretien',
  'offre',
  'refusée',
];

export function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ApplicationStatus | 'all'>('all');
  const [selected, setSelected] = useState<Application | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await applicationsApi.list();
      setApps(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les candidatures.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => (activeFilter === 'all' ? apps : apps.filter((a) => a.status === activeFilter)),
    [apps, activeFilter],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: apps.length };
    for (const a of apps) map[a.status] = (map[a.status] || 0) + 1;
    return map;
  }, [apps]);

  if (loading) return <DashboardLayout><LoadingState label="Chargement de vos candidatures…" /></DashboardLayout>;
  if (error) return <DashboardLayout><ErrorState message={error} onRetry={load} /></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader
        title="Mes candidatures"
        subtitle="Suivez le statut de vos candidatures en un coup d'œil."
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => {
          const cfg = f === 'all' ? null : statusConfig[f];
          const label = f === 'all' ? 'Toutes' : cfg!.label;
          const count = counts[f] || 0;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-xl border transition-all ${
                activeFilter === f
                  ? 'bg-navy-900 text-white border-navy-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {label}
              <span className={`text-xs rounded-full px-1.5 py-0.5 ${activeFilter === f ? 'bg-white/20' : 'bg-slate-100'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardList className="w-7 h-7" />}
            title="Aucune candidature"
            description="Vous n'avez pas encore postulé. Explorez les offres et commencez votre recherche !"
            action={
              <Link to="/jobs">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700">
                  Explorer les offres <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const cfg = statusConfig[app.status];
            const StatusIcon = cfg.icon;
            return (
              <Card key={app.id} hover padding="md" className="cursor-pointer" onClick={() => setSelected(app)}>
                <div className="flex items-center gap-4">
                  <CompanyLogo name={app.job.company} color={app.job.logoColor} size={48} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-navy-900 truncate">{app.job.title}</h3>
                    <p className="text-sm text-slate-500 truncate">{app.job.company} · {app.job.location}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge tone={cfg.tone} size="sm" dot>
                        <StatusIcon className="w-3 h-3" /> {cfg.label}
                      </Badge>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(app.appliedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col items-center gap-1">
                    <ScoreRing score={app.job.matchScore} size={48} />
                    <span className="text-[10px] text-slate-400">match</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? selected.job.title : ''}
        size="lg"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <CompanyLogo name={selected.job.company} color={selected.job.logoColor} size={56} />
              <div className="flex-1">
                <h3 className="font-semibold text-navy-900 text-lg">{selected.job.company}</h3>
                <p className="text-sm text-slate-500">{selected.job.location}</p>
              </div>
              <ScoreRing score={selected.job.matchScore} size={56} />
            </div>

            {/* Status timeline */}
            <div>
              <p className="text-sm font-medium text-navy-800 mb-3">Suivi de la candidature</p>
              <div className="relative pl-6">
                <div className="absolute left-2 top-1 bottom-1 w-px bg-slate-200" />
                <div className="space-y-4">
                  {selected.history.map((h, i) => {
                    const cfg = statusConfig[h.status];
                    const Icon = cfg.icon;
                    return (
                      <div key={i} className="relative">
                        <div className={`absolute -left-[18px] w-4 h-4 rounded-full ring-4 ring-white flex items-center justify-center ${
                          cfg.tone === 'error' ? 'bg-error-500' :
                          cfg.tone === 'success' ? 'bg-success-500' :
                          cfg.tone === 'warning' ? 'bg-warning-500' :
                          cfg.tone === 'accent' ? 'bg-accent-500' : 'bg-brand-500'
                        }`}>
                          <Icon className="w-2.5 h-2.5 text-white" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge tone={cfg.tone} size="sm">{cfg.label}</Badge>
                          <span className="text-xs text-slate-400">
                            {new Date(h.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {selected.coverLetter && (
              <div>
                <p className="text-sm font-medium text-navy-800 mb-2">Lettre de motivation</p>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-100 leading-relaxed">
                  {selected.coverLetter}
                </p>
              </div>
            )}

            {selected.notes && (
              <div>
                <p className="text-sm font-medium text-navy-800 mb-2">Notes</p>
                <p className="text-sm text-slate-600 bg-warning-50/50 rounded-xl p-4 border border-warning-100">
                  {selected.notes}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <Link to={`/jobs/${selected.jobId}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                Voir l'offre complète
              </Link>
              <span className="text-xs text-slate-400">
                Postulé le {new Date(selected.appliedAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
