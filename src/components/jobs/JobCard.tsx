import { Building2, MapPin, Briefcase, Clock, Wifi, ArrowRight } from 'lucide-react';
import type { Job } from '@/types';
import { Badge, ScoreRing } from '@/components/ui/Badge';
import { CompanyLogo } from '@/components/ui/Avatar';
import { Link } from '@/router';

const typeLabels: Record<Job['type'], string> = {
  stage: 'Stage',
  emploi: 'Emploi',
  alternance: 'Alternance',
  freelance: 'Freelance',
};

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} jours`;
  return `Il y a ${Math.floor(days / 7)} sem.`;
}

export function JobCard({ job, compact }: { job: Job; compact?: boolean }) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="block group"
    >
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card p-5 transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 hover:border-slate-300 h-full flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          <CompanyLogo name={job.company} color={job.logoColor} />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-navy-900 leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">
              {job.title}
            </h3>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3.5 h-3.5" /> {job.company}
            </p>
          </div>
          <ScoreRing score={job.matchScore} size={52} />
        </div>

        {!compact && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">{job.description}</p>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          <Badge tone="brand" size="sm">
            <Briefcase className="w-3 h-3" /> {typeLabels[job.type]}
          </Badge>
          <Badge tone="neutral" size="sm">
            <MapPin className="w-3 h-3" /> {job.location}
          </Badge>
          {job.remote && (
            <Badge tone="success" size="sm">
              <Wifi className="w-3 h-3" /> Télétravail
            </Badge>
          )}
          {job.salary && (
            <Badge tone="navy" size="sm">
              {job.salary}
            </Badge>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {timeAgo(job.postedAt)}
          </span>
          <span className="text-sm font-medium text-brand-600 group-hover:text-brand-700 inline-flex items-center gap-1 transition-all group-hover:gap-2">
            Voir l'offre <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-card animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-11 w-11 rounded-xl bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-2/3 bg-slate-200 rounded" />
          <div className="h-3 w-1/3 bg-slate-200 rounded" />
        </div>
        <div className="h-12 w-12 rounded-full bg-slate-200" />
      </div>
      <div className="h-3 w-full bg-slate-200 rounded mb-2" />
      <div className="h-3 w-4/5 bg-slate-200 rounded mb-4" />
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-slate-200 rounded-full" />
        <div className="h-5 w-20 bg-slate-200 rounded-full" />
      </div>
    </div>
  );
}
