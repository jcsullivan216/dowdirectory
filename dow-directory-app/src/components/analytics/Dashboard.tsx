import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, Building2, GitBranch, Database, Mail, Phone, MapPin, Briefcase } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';

const COLORS = [
  '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1',
  '#f97316', '#fb923c', '#fdba74', '#fed7aa',
];

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className="p-3 bg-slate-100 rounded-lg">
          <Icon className="w-6 h-6 text-slate-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
}

function FieldCompletenessCard({ fieldsPopulated }: { fieldsPopulated: Record<string, { count: number; percentage: number }> }) {
  const fields = [
    { key: 'name', label: 'Name', icon: Users },
    { key: 'rank_title', label: 'Rank/Title', icon: Briefcase },
    { key: 'position', label: 'Position', icon: Briefcase },
    { key: 'email', label: 'Email', icon: Mail },
    { key: 'phone', label: 'Phone', icon: Phone },
    { key: 'location', label: 'Location', icon: MapPin },
    { key: 'organization_name', label: 'Organization', icon: Building2 },
    { key: 'mission_area', label: 'Mission Area', icon: GitBranch },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Quality</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {fields.map(({ key, label, icon: Icon }) => {
            const data = fieldsPopulated[key];
            if (!data) return null;
            return (
              <div key={key} className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">{label}</span>
                    <span className="text-slate-900 font-medium">{data.percentage}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-600 rounded-full transition-all duration-500"
                      style={{ width: `${data.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { stats, isLoading } = useData();

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-500">Loading analytics...</div>
      </div>
    );
  }

  // Prepare chart data
  const serviceData = Object.entries(stats.byService)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const positionData = Object.entries(stats.byPositionType)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const statusData = Object.entries(stats.byStatus)
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0);

  const missionAreaData = Object.entries(stats.byMissionArea)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Analytics Dashboard</h2>
        <p className="text-sm text-slate-500">Directory statistics and insights</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Records"
          value={stats.totalRecords}
          subtitle="Personnel in directory"
          icon={Users}
        />
        <StatCard
          title="Services/Agencies"
          value={Object.keys(stats.byService).length}
          subtitle="Unique organizations"
          icon={Building2}
        />
        <StatCard
          title="Position Types"
          value={Object.keys(stats.byPositionType).length}
          subtitle="PAE, CPE, PM, etc."
          icon={GitBranch}
        />
        <StatCard
          title="Mission Areas"
          value={Object.keys(stats.byMissionArea).length}
          subtitle="Technology domains"
          icon={Database}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Records by Service/Agency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#334155" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Position Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Position Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={positionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {positionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusData.map(({ name, value }) => {
                const percentage = Math.round((value / stats.totalRecords) * 100);
                const colors: Record<string, string> = {
                  Confirmed: 'bg-green-500',
                  Acting: 'bg-yellow-500',
                  PTDO: 'bg-orange-500',
                  Nominated: 'bg-blue-500',
                  Vacant: 'bg-red-500',
                };
                return (
                  <div key={name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{name}</span>
                      <span className="text-slate-900 font-medium">{value.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors[name] || 'bg-slate-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Mission Areas */}
        <Card>
          <CardHeader>
            <CardTitle>Top Mission Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {missionAreaData.map(({ name, value }, index) => (
                <div
                  key={name}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-medium flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-sm text-slate-700">{name}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">{value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Quality */}
        <FieldCompletenessCard fieldsPopulated={stats.fieldsPopulated} />
      </div>

      {/* Footer Stats */}
      <div className="bg-slate-50 rounded-lg p-4 text-center">
        <p className="text-sm text-slate-500">
          Data from DoW Directory {stats.totalRecords > 0 && '2025 v35'} •
          Last processed: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
