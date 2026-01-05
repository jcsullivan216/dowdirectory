import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, Download, Filter, X, Mail, Phone, MapPin } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { useFilteredData } from '../../hooks/useSearch';
import { PositionBadge, ServiceBadge, StatusBadge } from '../common/Badge';
import { getUniqueValues } from '../../utils/dataLoader';
import { cn } from '../../utils/cn';
import type { Person } from '../../types';

const columnHelper = createColumnHelper<Person>();

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <div>
        <div className="font-medium text-slate-900">
          {info.row.original.rank_title && (
            <span className="text-slate-500 font-normal">{info.row.original.rank_title} </span>
          )}
          {info.getValue()}
        </div>
      </div>
    ),
  }),
  columnHelper.accessor('position', {
    header: 'Position',
    cell: (info) => (
      <div className="max-w-xs truncate text-slate-600" title={info.getValue()}>
        {info.getValue() || '-'}
      </div>
    ),
  }),
  columnHelper.accessor('position_type', {
    header: 'Type',
    cell: (info) => <PositionBadge type={info.getValue()} />,
  }),
  columnHelper.accessor('service_agency', {
    header: 'Service',
    cell: (info) => <ServiceBadge service={info.getValue()} />,
  }),
  columnHelper.accessor('organization_name', {
    header: 'Organization',
    cell: (info) => (
      <div className="max-w-xs truncate text-slate-600" title={info.getValue()}>
        {info.getValue() || info.row.original.parent_organization || '-'}
      </div>
    ),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor('location', {
    header: 'Location',
    cell: (info) => (
      <div className="flex items-center gap-1 text-slate-500 text-sm">
        {info.getValue() && <MapPin className="w-3 h-3" />}
        <span className="truncate max-w-[120px]">{info.getValue() || '-'}</span>
      </div>
    ),
  }),
  columnHelper.accessor('email', {
    header: 'Contact',
    cell: (info) => (
      <div className="flex items-center gap-2">
        {info.getValue() && (
          <a
            href={`mailto:${info.getValue()}`}
            className="text-blue-600 hover:text-blue-800"
            title={info.getValue()}
          >
            <Mail className="w-4 h-4" />
          </a>
        )}
        {info.row.original.phone && (
          <a
            href={`tel:${info.row.original.phone}`}
            className="text-green-600 hover:text-green-800"
            title={info.row.original.phone}
          >
            <Phone className="w-4 h-4" />
          </a>
        )}
        {!info.getValue() && !info.row.original.phone && (
          <span className="text-slate-300">-</span>
        )}
      </div>
    ),
  }),
];

interface FilterPanelProps {
  people: Person[];
  filters: {
    services: string[];
    positionTypes: string[];
    statuses: string[];
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    services: string[];
    positionTypes: string[];
    statuses: string[];
  }>>;
  onClose: () => void;
}

function FilterPanel({ people, filters, setFilters, onClose }: FilterPanelProps) {
  const services = getUniqueValues(people, 'service_agency');
  const positionTypes = getUniqueValues(people, 'position_type');
  const statuses = getUniqueValues(people, 'status');

  const toggleFilter = (
    category: 'services' | 'positionTypes' | 'statuses',
    value: string
  ) => {
    setFilters((prev) => {
      const current = prev[category];
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter((v) => v !== value) };
      }
      return { ...prev, [category]: [...current, value] };
    });
  };

  const clearFilters = () => {
    setFilters({ services: [], positionTypes: [], statuses: [] });
  };

  const hasFilters = filters.services.length > 0 || filters.positionTypes.length > 0 || filters.statuses.length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Filters</h3>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Clear all
            </button>
          )}
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FilterSection
          title="Service/Agency"
          options={services}
          selected={filters.services}
          onToggle={(value) => toggleFilter('services', value)}
        />
        <FilterSection
          title="Position Type"
          options={positionTypes}
          selected={filters.positionTypes}
          onToggle={(value) => toggleFilter('positionTypes', value)}
        />
        <FilterSection
          title="Status"
          options={statuses}
          selected={filters.statuses}
          onToggle={(value) => toggleFilter('statuses', value)}
        />
      </div>
    </div>
  );
}

function FilterSection({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <h4 className="text-sm font-medium text-slate-700 mb-2">{title}</h4>
      <div className="space-y-1 max-h-48 overflow-auto">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
              className="rounded border-slate-300 text-slate-600 focus:ring-slate-500"
            />
            <span className="text-sm text-slate-600">{option || 'Unknown'}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function PeopleDirectory() {
  const { people, isLoading } = useData();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    services: [] as string[],
    positionTypes: [] as string[],
    statuses: [] as string[],
  });

  const filteredData = useFilteredData(people, {
    services: filters.services,
    positionTypes: filters.positionTypes,
    statuses: filters.statuses,
  });

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 50 },
    },
  });

  const exportToCSV = () => {
    const rows = filteredData.map((p) => [
      p.name,
      p.rank_title,
      p.position,
      p.position_type,
      p.service_agency,
      p.organization_name,
      p.status,
      p.email,
      p.phone,
      p.location,
    ]);

    const header = ['Name', 'Rank', 'Position', 'Type', 'Service', 'Organization', 'Status', 'Email', 'Phone', 'Location'];
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell || ''}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dow_directory_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-500">Loading directory...</div>
      </div>
    );
  }

  const hasActiveFilters = filters.services.length > 0 || filters.positionTypes.length > 0 || filters.statuses.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">People Directory</h2>
          <p className="text-sm text-slate-500">
            {filteredData.length.toLocaleString()} of {people.length.toLocaleString()} records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors',
              hasActiveFilters
                ? 'border-slate-400 bg-slate-100 text-slate-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-slate-600 text-white rounded-full text-xs">
                {filters.services.length + filters.positionTypes.length + filters.statuses.length}
              </span>
            )}
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <FilterPanel
          people={people}
          filters={filters}
          setFilters={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() && (
                          header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={cn(
                    'hover:bg-slate-50 transition-colors',
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="text-sm text-slate-500">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              filteredData.length
            )}{' '}
            of {filteredData.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
