import {
  LayoutDashboard,
  Search,
  FileText,
  Sparkles,
  ClipboardList,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { Link, useRouter } from '@/router';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';

const navItems = [
  { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/jobs', label: 'Recherche offres', icon: Search },
  { to: '/cv', label: 'Analyse CV', icon: FileText },
  { to: '/skills', label: 'Compétences', icon: Sparkles },
  { to: '/applications', label: 'Mes candidatures', icon: ClipboardList },
  { to: '/profile', label: 'Profil & réglages', icon: Settings },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const route = useRouter();
  const { user, logout } = useAuth();

  const isActive = (to: string) =>
    route.path === to || route.path.startsWith(to + '/');

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-navy-950/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-72 shrink-0 bg-navy-900 text-navy-100 flex flex-col shadow-sidebar transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-navy-800/60">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-600/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-white text-[15px]">SkillBridge</span>
              <span className="block text-[11px] text-navy-300 -mt-0.5">AI Career</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-navy-300 hover:text-white p-1.5 rounded-lg hover:bg-navy-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          <p className="px-3 text-[11px] uppercase tracking-wider text-navy-400 font-semibold mb-2">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                    : 'text-navy-200 hover:bg-navy-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-navy-300'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-navy-800/60">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-navy-800/50">
            <Avatar name={`${user?.firstName} ${user?.lastName}`} size={38} color="brand" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-navy-300 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="text-navy-300 hover:text-error-300 hover:bg-navy-800 p-2 rounded-lg transition-colors"
              title="Se déconnecter"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
