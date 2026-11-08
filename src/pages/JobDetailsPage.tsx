import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Wifi,
  Briefcase,
  Clock,
  Calendar,
  CheckCircle2,
  Sparkles,
  Send,
  FileText,
} from 'lucide-react';
import type { Application, Job, Skill } from '@/types';
import { jobsApi, applicationsApi, skillsApi } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, ProgressBar, ScoreRing } from '@/components/ui/Badge';
import { CompanyLogo } from '@/components/ui/Avatar';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { Link, navigate, useRouter } from '@/router';

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  return `Il y a ${days} jours`;
}

const levelOrder = { débutant: 1, intermédiaire: 2, avancé: 3, expert: 4 } as const;

export function JobDetailsPage() {
  const route = useRouter();
  const id = route.path.split('/')[2];
  const [job, setJob] = useState<Job | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [j, s] = await Promise.all([jobsApi.get(id), skillsApi.list()]);
      setJob(j);
      setSkills(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Offre introuvable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    try {
      await applicationsApi.apply(id, coverLetter);
      setApplied(true);
      setApplyOpen(false);
      setTimeout(() => navigate('/applications'), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <DashboardLayout><LoadingState label="Chargement de l'offre…" /></DashboardLayout>;
  if (error || !job) return <DashboardLayout><ErrorState message={error || 'Offre introuvable.'} onRetry={load} /></DashboardLayout>;

  const skillMap = new Map(skills.map((s) => [s.name.toLowerCase(), s]));

  return (
    <DashboardLayout>
      <Link to="/jobs" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-navy-900 mb-5">
        <ArrowLeft className="w-4 h-4" /> Retour aux offres
      </Link>

      {applied && (
        <div className="mb-5 rounded-xl bg-success-50 border border-success-200 text-success-700 px-4 py-3 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5" /> Candidature envoyée ! Redirection vers vos candidatures…
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <Card>
            <div className="flex items-start gap-4">
              <CompanyLogo name={job.company} color={job.logoColor} size={56} />
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-navy-900 leading-tight">{job.title}</h1>
                <p className="text-slate-500 mt-1 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> {job.company}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge tone="brand" size="sm"><Briefcase className="w-3 h-3" /> {job.type}</Badge>
                  <Badge tone="neutral" size="sm"><MapPin className="w-3 h-3" /> {job.location}</Badge>
                  {job.remote && <Badge tone="success" size="sm"><Wifi className="w-3 h-3" /> Télétravail</Badge>}
                  {job.salary && <Badge tone="navy" size="sm">{job.salary}</Badge>}
                  {job.duration && <Badge tone="neutral" size="sm">{job.duration}</Badge>}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Publié {timeAgo(job.postedAt)}</span>
              {job.deadline && (
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Clôture : {new Date(job.deadline).toLocaleDateString('fr-FR')}</span>
              )}
            </div>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader title="Description du poste" icon={<FileText className="w-5 h-5" />} />
            <p className="text-slate-600 leading-relaxed">{job.description}</p>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader title="Profil recherché" subtitle="Conditions et attentes" icon={<CheckCircle2 className="w-5 h-5" />} />
            <ul className="space-y-2.5">
              {job.requirements.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-slate-600">
                  <CheckCircle2 className="w-4.5 h-4.5 text-success-500 shrink-0 mt-0.5" />
                  <span className="text-sm">{r}</span>
                </li>
              ))}
            </ul>
            {job.niceToHave.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <p className="text-sm font-medium text-navy-800 mb-2">Atouts supplémentaires</p>
                <div className="flex flex-wrap gap-2">
                  {job.niceToHave.map((n) => <Badge key={n} tone="accent" size="sm">{n}</Badge>)}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar: match analysis */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-navy-900 to-navy-800 text-white border-navy-700">
            <div className="flex items-center gap-4">
              <ScoreRing score={job.matchScore} size={72} />
              <div>
                <p className="text-navy-200 text-sm">Score de correspondance</p>
                <p className="text-2xl font-bold text-white">{job.matchScore}%</p>
                <p className="text-xs text-navy-300 mt-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Estimation IA (démo)
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full mt-5"
              leftIcon={<Send className="w-4 h-4" />}
              onClick={() => setApplyOpen(true)}
              disabled={applied}
            >
              {applied ? 'Candidature envoyée' : 'Postuler maintenant'}
            </Button>
          </Card>

          {/* Skill match breakdown */}
          <Card>
            <CardHeader title="Analyse des compétences" subtitle="Votre niveau vs requis" icon={<Sparkles className="w-5 h-5" />} />
            <div className="space-y-4">
              {job.requiredSkills.map((rs) => {
                const mine = skillMap.get(rs.name.toLowerCase());
                const myLevel = mine?.level ?? 'débutant';
                const myScore = mine?.score ?? 0;
                const meets = levelOrder[myLevel as keyof typeof levelOrder] >= levelOrder[rs.level];
                return (
                  <div key={rs.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-navy-800 flex items-center gap-1.5">
                        {rs.name}
                        {meets && <CheckCircle2 className="w-3.5 h-3.5 text-success-500" />}
                      </span>
                      <span className="text-xs text-slate-500">
                        {myLevel} / {rs.level}
                      </span>
                    </div>
                    <ProgressBar value={myScore} tone={meets ? 'success' : 'warning'} />
                    <p className="text-xs text-slate-400 mt-1">Poids dans le poste : {rs.weight}%</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        title={`Postuler — ${job.title}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setApplyOpen(false)}>Annuler</Button>
            <Button onClick={handleApply} loading={applying} leftIcon={<Send className="w-4 h-4" />}>
              Envoyer ma candidature
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 text-sm text-brand-800">
            Votre CV et votre profil seront automatiquement joints à cette candidature.
          </div>
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Lettre de motivation (optionnel)</span>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={6}
              placeholder="Expliquez pourquoi vous êtes le candidat idéal…"
              className="w-full mt-1.5 px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all resize-none"
            />
          </label>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
