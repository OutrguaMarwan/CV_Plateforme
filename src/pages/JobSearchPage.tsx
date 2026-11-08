import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X, Wifi, Briefcase, MapPin } from 'lucide-react';
import type { Job } from '@/types';
import { jobsApi } from '@/services/api';
import { DashboardLayout, PageHeader } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { JobCard, JobCardSkeleton } from '@/components/jobs/JobCard';
import { LoadingState, ErrorState, NoResults } from '@/components/ui/States';

const types = ['all', 'stage', 'emploi', 'alternance', 'freelance'] as const;
const typeLabels: Record<string, string> = {
  all: 'Tous types',
  stage: 'Stage',
  emploi: 'Emploi',
  alternance: 'Alternance',
  freelance: 'Freelance',
};

export function JobSearchPage() {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('all');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minMatch, setMinMatch] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await jobsApi.list();
      setAllJobs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les offres.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return allJobs.filter((j) => {
      if (search) {
        const q = search.toLowerCase();
        if (!j.title.toLowerCase().includes(q) && !j.company.toLowerCase().includes(q) && !j.location.toLowerCase().includes(q)) return false;
      }
      if (type !== 'all' && j.type !== type) return false;
      if (remoteOnly && !j.remote) return false;
      if (j.matchScore < minMatch) return false;
      return true;
    });
  }, [allJobs, search, type, remoteOnly, minMatch]);

  const activeFilterCount = (type !== 'all' ? 1 : 0) + (remoteOnly ? 1 : 0) + (minMatch > 0 ? 1 : 0);

  return (
    <DashboardLayout>
      <PageHeader
        title="Recherche d'offres"
        subtitle={`${filtered.length} offre${filtered.length > 1 ? 's' : ''} trouvée${filtered.length > 1 ? 's' : ''}`}
      />

      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre, entreprise ou ville…"
            className="w-full pl-11 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-900">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
            filtersOpen || activeFilterCount > 0
              ? 'bg-brand-50 border-brand-200 text-brand-700'
              : 'bg-white border-slate-200 text-navy-800 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" /> Filtres
          {activeFilterCount > 0 && (
            <span className="bg-brand-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {filtersOpen && (
        <Card className="mb-5 animate-fade-in" padding="md">
          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <label className="text-sm font-medium text-navy-800">Type de contrat</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {types.map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                      type === t
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {typeLabels[t]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-navy-800">Télétravail</label>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <button
                  onClick={() => setRemoteOnly((v) => !v)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${remoteOnly ? 'bg-brand-600' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${remoteOnly ? 'translate-x-4' : ''}`} />
                </button>
                <span className="text-sm text-slate-600 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" /> Télétravail uniquement
                </span>
              </label>
            </div>
            <div>
              <label className="text-sm font-medium text-navy-800">
                Score minimum : <span className="text-brand-600 font-semibold">{minMatch}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={minMatch}
                onChange={(e) => setMinMatch(Number(e.target.value))}
                className="w-full mt-3 accent-brand-600"
              />
            </div>
          </div>
          {activeFilterCount > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => { setType('all'); setRemoteOnly(false); setMinMatch(0); }}
                className="text-sm text-slate-500 hover:text-navy-900 font-medium"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <Card><NoResults query={search} /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((j) => <JobCard key={j.id} job={j} />)}
        </div>
      )}
    </DashboardLayout>
  );
}
