import { GlobalSearch } from '../search/GlobalSearch';
import type { Person } from '../../types';

interface HeaderProps {
  onPersonSelect?: (person: Person) => void;
}

export function Header({ onPersonSelect }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      <div className="flex-1 max-w-2xl">
        <GlobalSearch onSelect={onPersonSelect} />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500">v35 • 2025</span>
      </div>
    </header>
  );
}
