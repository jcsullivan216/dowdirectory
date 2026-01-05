import Papa from 'papaparse';
import type { Person, Relationship, Organization, Service, DataStats } from '../types';

interface RawPersonRecord {
  service_agency: string;
  organization_type: string;
  organization_name: string;
  organization_abbreviation: string;
  parent_organization: string;
  portfolio: string;
  name: string;
  rank_title: string;
  position: string;
  position_type: string;
  status: string;
  email: string;
  phone: string;
  location: string;
  building: string;
  mission_area: string;
  key_programs: string;
  page_number: string;
  section: string;
  last_updated: string;
  notes: string;
}

function generateId(name: string, org: string, position: string): string {
  const str = `${name}-${org}-${position}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return str.substring(0, 50) + '-' + Math.random().toString(36).substring(2, 8);
}

function normalizeService(service: string): Service {
  const normalized = service?.trim() || '';
  const serviceMap: Record<string, Service> = {
    'Army': 'Army',
    'Navy': 'Navy',
    'Air Force': 'Air Force',
    'Space Force': 'Space Force',
    'Marines': 'Marines',
    'OSD': 'OSD',
    'SOCOM': 'SOCOM',
    'MDA': 'MDA',
    'DLA': 'DLA',
    'DISA': 'DISA',
    'DTRA': 'DTRA',
    'DARPA': 'DARPA',
    'DCMA': 'DCMA',
    'DHA': 'DHA',
    'NGA': 'NGA',
    'NSA': 'NSA',
    'DIA': 'DIA',
  };
  return serviceMap[normalized] || 'Unknown';
}

export async function loadPeopleData(): Promise<Person[]> {
  const response = await fetch('/data/dow_directory_extracted.csv');
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse<RawPersonRecord>(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const people: Person[] = results.data
          .filter((row) => row.name && row.name.trim())
          .map((row) => ({
            id: generateId(row.name, row.organization_name, row.position),
            name: row.name?.trim() || '',
            rank_title: row.rank_title?.trim() || '',
            position: row.position?.trim() || '',
            position_type: (row.position_type?.trim() || 'Other') as Person['position_type'],
            status: (row.status?.trim() || 'Confirmed') as Person['status'],
            service_agency: normalizeService(row.service_agency),
            organization_type: row.organization_type?.trim() || '',
            organization_name: row.organization_name?.trim() || '',
            organization_abbreviation: row.organization_abbreviation?.trim() || '',
            parent_organization: row.parent_organization?.trim() || '',
            portfolio: row.portfolio?.trim() || '',
            email: row.email?.trim() || '',
            phone: row.phone?.trim() || '',
            location: row.location?.trim() || '',
            building: row.building?.trim() || '',
            mission_area: row.mission_area?.trim() || '',
            key_programs: row.key_programs?.trim() || '',
            page_number: parseInt(row.page_number, 10) || 0,
            section: row.section?.trim() || '',
            last_updated: row.last_updated?.trim() || '',
            notes: row.notes?.trim() || '',
          }));
        resolve(people);
      },
      error: (error: Error) => reject(error),
    });
  });
}

export async function loadRelationships(): Promise<Relationship[]> {
  const response = await fetch('/data/dow_directory_relationships.csv');
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse<Relationship>(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error: Error) => reject(error),
    });
  });
}

export function buildOrgTree(people: Person[]): Map<Service, Organization[]> {
  const orgMap = new Map<Service, Map<string, Organization>>();

  // Initialize service maps
  const services: Service[] = [
    'Army', 'Navy', 'Air Force', 'Space Force', 'Marines',
    'OSD', 'SOCOM', 'MDA', 'DLA', 'DISA', 'DTRA', 'DARPA',
    'DCMA', 'DHA', 'NGA', 'NSA', 'DIA', 'Unknown'
  ];

  services.forEach((service) => {
    orgMap.set(service, new Map());
  });

  // Group people by organization
  people.forEach((person) => {
    const service = person.service_agency;
    const serviceOrgs = orgMap.get(service);
    if (!serviceOrgs) return;

    const orgKey = person.organization_name || person.parent_organization || 'Unknown';

    if (!serviceOrgs.has(orgKey)) {
      serviceOrgs.set(orgKey, {
        id: generateId(orgKey, service, ''),
        name: orgKey,
        abbreviation: person.organization_abbreviation || '',
        type: person.organization_type || '',
        service,
        children: [],
        personnel: [],
      });
    }

    serviceOrgs.get(orgKey)!.personnel.push(person);
  });

  // Convert to tree structure
  const result = new Map<Service, Organization[]>();
  orgMap.forEach((orgs, service) => {
    result.set(service, Array.from(orgs.values()));
  });

  return result;
}

export function calculateStats(people: Person[]): DataStats {
  const stats: DataStats = {
    totalRecords: people.length,
    totalRelationships: 0,
    byService: {},
    byPositionType: {},
    byStatus: {},
    byMissionArea: {},
    fieldsPopulated: {},
  };

  const fieldCounts: Record<string, number> = {
    name: 0,
    rank_title: 0,
    position: 0,
    email: 0,
    phone: 0,
    location: 0,
    organization_name: 0,
    mission_area: 0,
  };

  people.forEach((person) => {
    // By service
    stats.byService[person.service_agency] = (stats.byService[person.service_agency] || 0) + 1;

    // By position type
    const posType = person.position_type || 'Other';
    stats.byPositionType[posType] = (stats.byPositionType[posType] || 0) + 1;

    // By status
    stats.byStatus[person.status] = (stats.byStatus[person.status] || 0) + 1;

    // By mission area
    if (person.mission_area) {
      person.mission_area.split(',').forEach((area) => {
        const trimmed = area.trim();
        if (trimmed) {
          stats.byMissionArea[trimmed] = (stats.byMissionArea[trimmed] || 0) + 1;
        }
      });
    }

    // Field population
    Object.keys(fieldCounts).forEach((field) => {
      if (person[field as keyof Person]) {
        fieldCounts[field]++;
      }
    });
  });

  // Calculate percentages
  Object.entries(fieldCounts).forEach(([field, count]) => {
    stats.fieldsPopulated[field] = {
      count,
      percentage: Math.round((count / people.length) * 1000) / 10,
    };
  });

  return stats;
}

export function getUniqueValues(people: Person[], field: keyof Person): string[] {
  const values = new Set<string>();
  people.forEach((person) => {
    const value = person[field];
    if (value && typeof value === 'string') {
      if (field === 'mission_area') {
        value.split(',').forEach((v) => {
          const trimmed = v.trim();
          if (trimmed) values.add(trimmed);
        });
      } else {
        values.add(value);
      }
    }
  });
  return Array.from(values).sort();
}
