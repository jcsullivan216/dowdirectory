import { useState, useEffect, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import type { Person, SearchResult } from '../types';

const fuseOptions = {
  keys: [
    { name: 'name', weight: 2 },
    { name: 'position', weight: 1.5 },
    { name: 'organization_name', weight: 1.5 },
    { name: 'organization_abbreviation', weight: 1.2 },
    { name: 'mission_area', weight: 1 },
    { name: 'key_programs', weight: 1 },
    { name: 'location', weight: 0.8 },
    { name: 'service_agency', weight: 0.8 },
  ],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2,
};

export function useSearch(data: Person[]) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fuse = useMemo(() => new Fuse(data, fuseOptions), [data]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timeoutId = setTimeout(() => {
      const searchResults = fuse.search(query, { limit: 50 });
      setResults(searchResults as SearchResult[]);
      setIsSearching(false);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [query, fuse]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    clearSearch,
  };
}

export function useFilteredData(
  data: Person[],
  filters: {
    services?: string[];
    positionTypes?: string[];
    statuses?: string[];
    missionAreas?: string[];
    locations?: string[];
  }
) {
  return useMemo(() => {
    let filtered = [...data];

    if (filters.services && filters.services.length > 0) {
      filtered = filtered.filter((p) => filters.services!.includes(p.service_agency));
    }

    if (filters.positionTypes && filters.positionTypes.length > 0) {
      filtered = filtered.filter((p) => filters.positionTypes!.includes(p.position_type));
    }

    if (filters.statuses && filters.statuses.length > 0) {
      filtered = filtered.filter((p) => filters.statuses!.includes(p.status));
    }

    if (filters.missionAreas && filters.missionAreas.length > 0) {
      filtered = filtered.filter((p) => {
        const areas = p.mission_area.split(',').map((a) => a.trim());
        return filters.missionAreas!.some((area) => areas.includes(area));
      });
    }

    if (filters.locations && filters.locations.length > 0) {
      filtered = filtered.filter((p) => filters.locations!.includes(p.location));
    }

    return filtered;
  }, [data, filters]);
}
