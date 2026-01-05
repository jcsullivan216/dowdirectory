import { useEffect, useRef, useState } from 'react';
import { Search, X, User, Building2, Command } from 'lucide-react';
import { useSearch } from '../../hooks/useSearch';
import { useData } from '../../hooks/useData';
import { PositionBadge, ServiceBadge } from '../common/Badge';
import { cn } from '../../utils/cn';
import type { Person } from '../../types';

interface GlobalSearchProps {
  onSelect?: (person: Person) => void;
}

export function GlobalSearch({ onSelect }: GlobalSearchProps) {
  const { people } = useData();
  const { query, setQuery, results, isSearching, clearSearch } = useSearch(people);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        clearSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSearch]);

  // Handle arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected && onSelect) {
          onSelect(selected.item);
          setIsOpen(false);
          clearSearch();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onSelect, clearSearch]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search people, organizations, programs..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-20 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {query && (
            <button
              onClick={() => {
                clearSearch();
                inputRef.current?.focus();
              }}
              className="p-1 hover:bg-slate-200 rounded"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-200 rounded text-xs text-slate-500 font-mono">
            <Command className="w-3 h-3" />K
          </kbd>
        </div>
      </div>

      {/* Results dropdown */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-xl max-h-[70vh] overflow-auto">
          {isSearching ? (
            <div className="p-4 text-center text-slate-500">
              <div className="animate-pulse">Searching...</div>
            </div>
          ) : results.length === 0 && query.length >= 2 ? (
            <div className="p-4 text-center text-slate-500">
              No results found for "{query}"
            </div>
          ) : (
            <div className="py-2">
              <div className="px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wide">
                People ({results.length})
              </div>
              {results.map((result, index) => (
                <SearchResultItem
                  key={result.item.id}
                  person={result.item}
                  isSelected={index === selectedIndex}
                  onClick={() => {
                    if (onSelect) onSelect(result.item);
                    setIsOpen(false);
                    clearSearch();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchResultItem({
  person,
  isSelected,
  onClick,
}: {
  person: Person;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'px-3 py-2 cursor-pointer transition-colors',
        isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900 truncate">
              {person.rank_title && <span className="text-slate-500">{person.rank_title} </span>}
              {person.name}
            </span>
            <PositionBadge type={person.position_type} />
          </div>
          <div className="text-sm text-slate-500 truncate">
            {person.position || 'Unknown Position'}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Building2 className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-400 truncate">
              {person.organization_name || person.parent_organization || person.service_agency}
            </span>
            <ServiceBadge service={person.service_agency} />
          </div>
        </div>
      </div>
    </div>
  );
}
