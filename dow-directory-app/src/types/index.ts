export type Service =
  | 'Army'
  | 'Navy'
  | 'Air Force'
  | 'Space Force'
  | 'Marines'
  | 'OSD'
  | 'SOCOM'
  | 'MDA'
  | 'DLA'
  | 'DISA'
  | 'DTRA'
  | 'DARPA'
  | 'DCMA'
  | 'DHA'
  | 'NGA'
  | 'NSA'
  | 'DIA'
  | 'Unknown';

export type PositionType =
  | 'PAE'
  | 'CPE'
  | 'PEO'
  | 'PM'
  | 'DPM'
  | 'PdM'
  | 'PjM'
  | 'ASA'
  | 'USD'
  | 'Director'
  | 'Chief'
  | 'Commander'
  | 'Staff'
  | 'Other';

export type Status =
  | 'Confirmed'
  | 'Acting'
  | 'PTDO'
  | 'Nominated'
  | 'Designated'
  | 'Interim'
  | 'Vacant';

export interface Person {
  id: string;
  name: string;
  rank_title: string;
  position: string;
  position_type: PositionType;
  status: Status;
  service_agency: Service;
  organization_type: string;
  organization_name: string;
  organization_abbreviation: string;
  parent_organization: string;
  portfolio: string;
  email: string;
  phone: string;
  location: string;
  building: string;
  mission_area: string;
  key_programs: string;
  page_number: number;
  section: string;
  last_updated: string;
  notes: string;
}

export interface Organization {
  id: string;
  name: string;
  abbreviation: string;
  type: string;
  service: Service;
  parent?: string;
  children: Organization[];
  personnel: Person[];
}

export interface Relationship {
  child_entity: string;
  child_type: string;
  parent_entity: string;
  parent_type: string;
  relationship_type: string;
}

export interface SearchResult {
  item: Person;
  score?: number;
  refIndex?: number;
}

export interface FilterState {
  services: Service[];
  positionTypes: PositionType[];
  statuses: Status[];
  missionAreas: string[];
  locations: string[];
  searchQuery: string;
}

export interface DataStats {
  totalRecords: number;
  totalRelationships: number;
  byService: Record<string, number>;
  byPositionType: Record<string, number>;
  byStatus: Record<string, number>;
  byMissionArea: Record<string, number>;
  fieldsPopulated: Record<string, { count: number; percentage: number }>;
}
