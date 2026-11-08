import { type ReactNode } from 'react';
import { AlertTriangle, Inbox, RefreshCw, SearchX } from 'lucide-react';

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin ${className}`}
    />
  );
}

export function LoadingState({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
      <Spinner className="w-7 h-7" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        {icon ?? <Inbox className="w-7 h-7" />}
      </div>
      <h3 className="font-semibold text-navy-900">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-error-50 flex items-center justify-center text-error-500 mb-4">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h3 className="font-semibold text-navy-900">Une erreur est survenue</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <RefreshCw className="w-4 h-4" /> Réessayer
        </button>
      )}
    </div>
  );
}

export function NoResults({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={<SearchX className="w-7 h-7" />}
      title="Aucun résultat"
      description={
        query
          ? `Aucune offre ne correspond à « ${query} ». Essayez d'élargir vos critères.`
          : "Aucune offre ne correspond à vos filtres. Essayez d'élargir vos critères."
      }
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="skeleton h-11 w-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3.5 w-2/3" />
          <div className="skeleton h-3 w-1/3" />
        </div>
        <div className="skeleton h-10 w-10 rounded-full" />
      </div>
      <div className="skeleton h-3 w-full mb-2" />
      <div className="skeleton h-3 w-4/5 mb-4" />
      <div className="flex gap-2">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}
