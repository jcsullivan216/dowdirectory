import { BarChart3, Users, Building2, Search, Home } from 'lucide-react';
import { cn } from '../../utils/cn';

export type View = 'dashboard' | 'search' | 'people' | 'orgs' | 'settings';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const navItems: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'people', label: 'People', icon: Users },
  { id: 'orgs', label: 'Organizations', icon: Building2 },
  { id: 'settings', label: 'Analytics', icon: BarChart3 },
];

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight">DoW Directory</h1>
        <p className="text-sm text-slate-400 mt-1">Intelligence Platform</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                onClick={() => onViewChange(id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  currentView === id
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                )}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="px-4 py-3 bg-slate-800/50 rounded-lg">
          <p className="text-xs text-slate-400">DoW Directory 2025 v35</p>
          <p className="text-xs text-slate-500 mt-1">Defense Intelligence Tool</p>
        </div>
      </div>
    </aside>
  );
}
