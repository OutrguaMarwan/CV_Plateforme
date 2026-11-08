import { useCallback, useEffect, useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Lightbulb,
  Loader2,
  X,
  TrendingUp,
} from 'lucide-react';
import type { CVAnalysisResult } from '@/types';
import { cvApi } from '@/services/api';
import { DashboardLayout, PageHeader } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, ScoreRing } from '@/components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';
import { CompanyLogo } from '@/components/ui/Avatar';

export function CVAnalysisPage() {
  const [analyses, setAnalyses] = useState<CVAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cvApi.list();
      setAnalyses(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les analyses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setUploadError(null);
    setUploading(true);
    try {
      const result = await cvApi.upload(file);
      // Simulate analysis completion for the mock
      setTimeout(() => {
        const completed: CVAnalysisResult = {
          ...result,
          status: 'terminé',
          parsedSkills: [
            { id: 'p1', name: 'JavaScript', category: 'Langages', level: 'avancé', score: 82, verified: true },
            { id: 'p2', name: 'React', category: 'Frontend', level: 'avancé', score: 78, verified: true },
            { id: 'p3', name: 'Python', category: 'Langages', level: 'avancé', score: 75, verified: true },
            { id: 'p4', name: 'TypeScript', category: 'Langages', level: 'intermédiaire', score: 68, verified: true },
            { id: 'p5', name: 'Node.js', category: 'Backend', level: 'intermédiaire', score: 64, verified: false },
            { id: 'p6', name: 'PostgreSQL', category: 'Base de données', level: 'intermédiaire', score: 60, verified: true },
          ],
          suggestedRoles: [
            'Développeur Full-Stack Junior',
            'Développeur Backend Python',
            'Développeur Frontend React',
          ],
          matchScore: 76,
          feedback: [
            "Compétences techniques bien structurées et lisibles.",
            "Ajoutez des métriques concrètes sur vos projets (ex: nombre d'utilisateurs, performance).",
            "Mettez en avant vos certifications (AWS, Docker) même débutantes.",
            "Pensez à ajouter un lien vers votre portfolio ou GitHub.",
          ],
          warnings: [
            'Aucune expérience certifiée détectée pour Docker et AWS.',
            'La section "Langues" est absente du CV.',
          ],
        };
        setAnalyses((prev) => [completed, ...prev]);
        setUploading(false);
      }, 2500);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Échec du téléversement.');
      setUploading(false);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const latest = analyses.find((a) => a.status === 'terminé');

  return (
    <DashboardLayout>
      <PageHeader
        title="Analyse de CV"
        subtitle="Téléversez votre CV en PDF pour une analyse automatique de vos compétences."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upload zone */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader title="Téléverser un CV" subtitle="Format PDF, 5 Mo max" icon={<UploadCloud className="w-5 h-5" />} />
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => !uploading && inputRef.current?.click()}
              className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-brand-400 bg-brand-50'
                  : 'border-slate-300 bg-slate-50 hover:border-brand-300 hover:bg-brand-50/40'
              }`}
            >
              <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={onSelect} />
              {uploading ? (
                <div className="flex flex-col items-center gap-3 text-brand-600">
                  <Loader2 className="w-10 h-10 animate-spin" />
                  <p className="text-sm font-medium">Analyse en cours…</p>
                  <p className="text-xs text-slate-400">Vos compétences sont extraites du document.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-600">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-medium text-navy-800">
                    Glissez votre PDF ici ou cliquez pour parcourir
                  </p>
                  <p className="text-xs text-slate-400">PDF uniquement · 5 Mo max</p>
                </div>
              )}
            </div>
            {uploadError && (
              <div className="mt-3 rounded-xl bg-error-50 border border-error-200 text-error-700 text-sm px-4 py-2.5 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {uploadError}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Historique" icon={<FileText className="w-5 h-5" />} />
            {analyses.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune analyse pour le moment.</p>
            ) : (
              <div className="space-y-2">
                {analyses.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-error-100 text-error-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy-800 truncate">{a.fileName}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(a.uploadedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    {a.status === 'terminé' ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-success-500" />
                    ) : a.status === 'en cours' ? (
                      <Loader2 className="w-4.5 h-4.5 text-brand-500 animate-spin" />
                    ) : (
                      <AlertTriangle className="w-4.5 h-4.5 text-error-500" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {loading ? (
            <Card><LoadingState label="Chargement des analyses…" /></Card>
          ) : error ? (
            <Card><ErrorState message={error} onRetry={load} /></Card>
          ) : !latest ? (
            <Card>
              <EmptyState
                icon={<FileText className="w-7 h-7" />}
                title="Aucune analyse disponible"
                description="Téléversez votre CV pour obtenir une analyse automatique de vos compétences, des rôles suggérés et des recommandations."
              />
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Score header */}
              <Card className="bg-gradient-to-br from-brand-50 to-accent-50 border-brand-100">
                <div className="flex items-center gap-5">
                  <ScoreRing score={latest.matchScore} size={80} />
                  <div>
                    <h3 className="font-semibold text-navy-900 text-lg">Score global du CV</h3>
                    <p className="text-sm text-slate-600 mt-1">{latest.fileName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge tone="success" size="sm"><CheckCircle2 className="w-3 h-3" /> Analyse terminée</Badge>
                      <span className="text-xs text-slate-400">
                        {new Date(latest.uploadedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Suggested roles */}
              <Card>
                <CardHeader title="Rôles suggérés" subtitle="Basés sur vos compétences détectées" icon={<Sparkles className="w-5 h-5" />} />
                <div className="grid sm:grid-cols-3 gap-3">
                  {latest.suggestedRoles.map((role) => (
                    <div key={role} className="rounded-xl border border-slate-200 p-4 hover:border-brand-300 hover:bg-brand-50/30 transition-all">
                      <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center mb-2">
                        <TrendingUp className="w-4.5 h-4.5" />
                      </div>
                      <p className="text-sm font-medium text-navy-800">{role}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Detected skills */}
              <Card>
                <CardHeader title="Compétences détectées" subtitle={`${latest.parsedSkills.length} compétences trouvées`} icon={<CheckCircle2 className="w-5 h-5" />} />
                <div className="flex flex-wrap gap-2">
                  {latest.parsedSkills.map((s) => (
                    <Badge key={s.id} tone={s.verified ? 'success' : 'neutral'} size="md" dot>
                      {s.name} · {s.level}
                    </Badge>
                  ))}
                </div>
              </Card>

              {/* Feedback */}
              <Card>
                <CardHeader title="Recommandations" subtitle="Améliorez votre CV" icon={<Lightbulb className="w-5 h-5" />} />
                <ul className="space-y-2.5">
                  {latest.feedback.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-slate-600">
                      <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Warnings */}
              {latest.warnings.length > 0 && (
                <Card className="border-warning-200 bg-warning-50/40">
                  <CardHeader title="Points d'attention" icon={<AlertTriangle className="w-5 h-5 text-warning-600" />} />
                  <ul className="space-y-2">
                    {latest.warnings.map((w, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-warning-800 text-sm">
                        <AlertTriangle className="w-4 h-4 text-warning-500 shrink-0 mt-0.5" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
