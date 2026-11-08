import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Target, TrendingUp, ShieldCheck, Award } from 'lucide-react';
import type { Skill, SkillGap, SkillLevel } from '@/types';
import { skillsApi } from '@/services/api';
import { DashboardLayout, PageHeader } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, ProgressBar } from '@/components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';

const levelOrder: Record<SkillLevel, number> = {
  débutant: 1,
  intermédiaire: 2,
  avancé: 3,
  expert: 4,
};

const levelTone: Record<SkillLevel, 'success' | 'brand' | 'accent' | 'warning'> = {
  débutant: 'warning',
  intermédiaire: 'brand',
  avancé: 'accent',
  expert: 'success',
};

export function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [gaps, setGaps] = useState<SkillGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, g] = await Promise.all([skillsApi.list(), skillsApi.gaps()]);
      setSkills(s);
      setGaps(g);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les compétences.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(skills.map((s) => s.category));
    return ['all', ...Array.from(set)];
  }, [skills]);

  const filteredSkills = useMemo(
    () => (activeCategory === 'all' ? skills : skills.filter((s) => s.category === activeCategory)),
    [skills, activeCategory],
  );

  const stats = useMemo(() => {
    const verified = skills.filter((s) => s.verified).length;
    const avg = skills.length ? Math.round(skills.reduce((a, s) => a + s.score, 0) / skills.length) : 0;
    return { total: skills.length, verified, avg };
  }, [skills]);

  if (loading) return <DashboardLayout><LoadingState label="Chargement de votre profil de compétences…" /></DashboardLayout>;
  if (error) return <DashboardLayout><ErrorState message={error} onRetry={load} /></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader
        title="Profil de compétences"
        subtitle="Vos compétences détectées et l'analyse de vos écarts."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card hover>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><Sparkles className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.total}</p>
              <p className="text-xs text-slate-500">Compétences</p>
            </div>
          </div>
        </Card>
        <Card hover>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success-50 text-success-600 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.verified}</p>
              <p className="text-xs text-slate-500">Vérifiées</p>
            </div>
          </div>
        </Card>
        <Card hover>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{stats.avg}%</p>
              <p className="text-xs text-slate-500">Score moyen</p>
            </div>
          </div>
        </Card>
        <Card hover>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-50 text-warning-600 flex items-center justify-center"><Target className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{gaps.length}</p>
              <p className="text-xs text-slate-500">Écarts à combler</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Skills list */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-navy-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-600" /> Compétences détectées
              </h3>
              <span className="text-xs text-slate-400">{filteredSkills.length} affichées</span>
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-2 mb-5">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                    activeCategory === c
                      ? 'bg-navy-900 text-white border-navy-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {c === 'all' ? 'Toutes' : c}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredSkills.map((s) => (
                <div key={s.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-navy-800 flex items-center gap-2">
                        {s.name}
                        {s.verified && <ShieldCheck className="w-3.5 h-3.5 text-success-500" />}
                      </span>
                      <span className="text-xs text-slate-500">{s.category}</span>
                    </div>
                    <ProgressBar
                      value={s.score}
                      tone={s.score >= 70 ? 'success' : s.score >= 50 ? 'brand' : 'warning'}
                    />
                  </div>
                  <div className="w-28 text-right shrink-0">
                    <Badge tone={levelTone[s.level]} size="sm">{s.level}</Badge>
                    <p className="text-xs text-slate-400 mt-1">{s.score}/100</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Skill gap analysis */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-warning-50 to-brand-50 border-warning-200/60">
            <CardHeader
              title="Analyse des écarts"
              subtitle="Compétences à renforcer"
              icon={<Target className="w-5 h-5 text-warning-600" />}
            />
            {gaps.length === 0 ? (
              <EmptyState title="Aucun écart détecté" description="Votre profil couvre toutes les compétences requises." />
            ) : (
              <div className="space-y-5">
                {gaps.map((g) => {
                  const meets = levelOrder[g.currentLevel] >= levelOrder[g.requiredLevel];
                  return (
                    <div key={g.skill.id} className="rounded-xl bg-white/70 p-3.5 border border-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-navy-800">{g.skill.name}</span>
                        <Badge tone="warning" size="sm">+{g.gap} pts</Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">Actuel</p>
                          <ProgressBar value={g.skill.score} tone="warning" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">Requis</p>
                          <ProgressBar value={g.skill.score + g.gap} tone="brand" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">
                        {g.currentLevel} → <span className="font-medium text-navy-700">{g.requiredLevel}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Recommandations" icon={<Award className="w-5 h-5" />} />
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 shrink-0" />
                Suivez le parcours « AWS Cloud Practitioner » pour combler votre écart cloud.
              </li>
              <li className="flex items-start gap-2.5 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 shrink-0" />
                Pratiquez Docker avec un projet conteneurisé à déployer.
              </li>
              <li className="flex items-start gap-2.5 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 shrink-0" />
                Approfondissez Node.js via un mini-projet API REST.
              </li>
              <li className="flex items-start gap-2.5 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 shrink-0" />
                Renforcez vos tests avec Jest et Pytest sur vos projets existants.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
