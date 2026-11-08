import { Menu, Bell, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/70">
      <div className="flex items-center gap-3 px-4 sm:px-6 h-16">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-slate-600 hover:text-navy-900 hover:bg-slate-100 p-2 rounded-lg transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative hidden sm:block flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une offre, une compétence…"
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 border border-transparent rounded-xl focus:bg-white focus:border-brand-300 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
          />
        </div>

        <div className="flex-1 sm:flex-none" />

        <button className="relative text-slate-500 hover:text-navy-900 hover:bg-slate-100 p-2 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <Avatar name={`${user?.firstName} ${user?.lastName}`} size={36} color="brand" />
          <div className="hidden md:block leading-tight">
            <p className="text-sm font-medium text-navy-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-500">{user?.headline?.split('—')[0]}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
