import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className={`relative w-full ${widths[size]} bg-white rounded-2xl shadow-2xl animate-scale-in max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-navy-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-navy-900 hover:bg-slate-100 rounded-lg p-1.5 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto scrollbar-thin">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
