import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Person, Relationship, Organization, Service, DataStats } from '../types';
import { loadPeopleData, loadRelationships, buildOrgTree, calculateStats } from '../utils/dataLoader';

interface DataContextType {
  people: Person[];
  relationships: Relationship[];
  orgTree: Map<Service, Organization[]>;
  stats: DataStats | null;
  isLoading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [orgTree, setOrgTree] = useState<Map<Service, Organization[]>>(new Map());
  const [stats, setStats] = useState<DataStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [peopleData, relationshipsData] = await Promise.all([
          loadPeopleData(),
          loadRelationships(),
        ]);

        setPeople(peopleData);
        setRelationships(relationshipsData);
        setOrgTree(buildOrgTree(peopleData));
        setStats(calculateStats(peopleData));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <DataContext.Provider value={{ people, relationships, orgTree, stats, isLoading, error }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
