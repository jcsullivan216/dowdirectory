import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Building2, Users, Star, Diamond, Circle, User } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { Card } from '../common/Card';
import { PositionBadge, ServiceBadge, StatusBadge } from '../common/Badge';
import { cn } from '../../utils/cn';
import type { Service, Person, Organization } from '../../types';

const SERVICES: Service[] = [
  'Army', 'Navy', 'Air Force', 'Space Force', 'Marines',
  'OSD', 'SOCOM', 'MDA', 'DLA', 'DISA', 'DTRA', 'DARPA',
  'DCMA', 'DHA', 'NGA', 'NSA', 'DIA'
];

function ServiceSelector({
  selected,
  onChange,
  serviceCounts,
}: {
  selected: Service;
  onChange: (service: Service) => void;
  serviceCounts: Record<string, number>;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4 p-4 bg-slate-50 rounded-lg">
      {SERVICES.filter(s => serviceCounts[s] > 0).map((service) => (
        <button
          key={service}
          onClick={() => onChange(service)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            selected === service
              ? 'bg-slate-700 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
          )}
        >
          {service}
          <span className="ml-1.5 text-xs opacity-70">
            ({serviceCounts[service] || 0})
          </span>
        </button>
      ))}
    </div>
  );
}

interface OrgTreeNodeProps {
  org: Organization;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  isSelected: boolean;
  level: number;
}

function OrgTreeNode({ org, isExpanded, onToggle, onSelect, isSelected, level }: OrgTreeNodeProps) {
  const hasChildren = org.children && org.children.length > 0;
  const personnelCount = org.personnel?.length || 0;

  const getIcon = () => {
    switch (org.type) {
      case 'PAE': return <Star className="w-4 h-4 text-blue-500" />;
      case 'CPE': case 'PEO': return <Diamond className="w-4 h-4 text-amber-500" />;
      case 'PM': return <Circle className="w-4 h-4 text-pink-500" />;
      default: return <Building2 className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors',
          isSelected ? 'bg-slate-200' : 'hover:bg-slate-100'
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={onSelect}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={cn(
            'p-0.5 rounded hover:bg-slate-200 transition-colors',
            !hasChildren && 'invisible'
          )}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </button>
        {getIcon()}
        <span className="flex-1 truncate text-sm font-medium text-slate-700">
          {org.abbreviation || org.name}
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <Users className="w-3 h-3" />
          {personnelCount}
        </span>
      </div>
      {isExpanded && org.children && org.children.map((child) => (
        <OrgTreeNode
          key={child.id}
          org={child}
          isExpanded={false}
          onToggle={() => {}}
          onSelect={() => {}}
          isSelected={false}
          level={level + 1}
        />
      ))}
    </div>
  );
}

function OrgDetailPanel({ org }: { org: Organization | null }) {
  if (!org) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <div className="text-center">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select an organization to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3 mb-2">
          {org.type && <PositionBadge type={org.type} />}
          <ServiceBadge service={org.service} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{org.name}</h2>
        {org.abbreviation && org.abbreviation !== org.name && (
          <p className="text-slate-500 font-mono">{org.abbreviation}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-slate-900">{org.personnel?.length || 0}</div>
          <div className="text-sm text-slate-500">Personnel</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-slate-900">{org.children?.length || 0}</div>
          <div className="text-sm text-slate-500">Sub-Orgs</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-slate-900">{org.type || '-'}</div>
          <div className="text-sm text-slate-500">Type</div>
        </Card>
      </div>

      {/* Personnel List */}
      {org.personnel && org.personnel.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">
            Personnel ({org.personnel.length})
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-auto">
            {org.personnel.slice(0, 50).map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
            {org.personnel.length > 50 && (
              <p className="text-sm text-slate-500 text-center py-2">
                + {org.personnel.length - 50} more...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PersonCard({ person }: { person: Person }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
        <User className="w-5 h-5 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900 truncate">
            {person.rank_title && <span className="text-slate-500">{person.rank_title} </span>}
            {person.name}
          </span>
          <StatusBadge status={person.status} />
        </div>
        <div className="text-sm text-slate-500 truncate">{person.position || 'Unknown Position'}</div>
      </div>
      <PositionBadge type={person.position_type} />
    </div>
  );
}

export function OrgExplorer() {
  const { people, stats, isLoading } = useData();
  const [selectedService, setSelectedService] = useState<Service>('Army');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  // Build org tree for selected service
  const serviceOrgs = useMemo(() => {
    const orgMap = new Map<string, Organization>();

    // Group people by organization
    people
      .filter((p) => p.service_agency === selectedService)
      .forEach((person) => {
        const orgKey = person.organization_name || person.parent_organization || 'Unassigned';

        if (!orgMap.has(orgKey)) {
          orgMap.set(orgKey, {
            id: `${selectedService}-${orgKey}`,
            name: orgKey,
            abbreviation: person.organization_abbreviation || '',
            type: person.organization_type || '',
            service: selectedService,
            children: [],
            personnel: [],
          });
        }

        orgMap.get(orgKey)!.personnel.push(person);
      });

    // Sort organizations by type priority (PAE > CPE > PEO > PM > Other)
    const typePriority: Record<string, number> = { PAE: 0, CPE: 1, PEO: 2, PM: 3 };
    const sortedOrgs = Array.from(orgMap.values()).sort((a, b) => {
      const priorityA = typePriority[a.type] ?? 99;
      const priorityB = typePriority[b.type] ?? 99;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return a.name.localeCompare(b.name);
    });

    return sortedOrgs;
  }, [people, selectedService]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-500">Loading organizations...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Organization Explorer</h2>

      <ServiceSelector
        selected={selectedService}
        onChange={setSelectedService}
        serviceCounts={stats?.byService || {}}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Org Tree */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50">
            <h3 className="font-semibold text-slate-700">
              {selectedService} Organizations
            </h3>
            <p className="text-sm text-slate-500">
              {serviceOrgs.length} organizations
            </p>
          </div>
          <div className="p-2 max-h-[600px] overflow-auto">
            {serviceOrgs.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No organizations found</p>
            ) : (
              serviceOrgs.map((org) => (
                <OrgTreeNode
                  key={org.id}
                  org={org}
                  isExpanded={expandedNodes.has(org.id)}
                  onToggle={() => toggleNode(org.id)}
                  onSelect={() => setSelectedOrg(org)}
                  isSelected={selectedOrg?.id === org.id}
                  level={0}
                />
              ))
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6">
          <OrgDetailPanel org={selectedOrg} />
        </div>
      </div>
    </div>
  );
}
