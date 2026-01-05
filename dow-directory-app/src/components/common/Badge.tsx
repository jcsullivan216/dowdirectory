import { cn } from '../../utils/cn';

interface BadgeProps {
  variant?: 'default' | 'pae' | 'cpe' | 'peo' | 'pm' | 'service' | 'status';
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: 'bg-slate-100 text-slate-700',
  pae: 'bg-blue-100 text-blue-800',
  cpe: 'bg-amber-100 text-amber-800',
  peo: 'bg-orange-100 text-orange-800',
  pm: 'bg-pink-100 text-pink-800',
  service: 'bg-slate-200 text-slate-800',
  status: 'bg-green-100 text-green-800',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function PositionBadge({ type }: { type: string }) {
  const variant = type === 'PAE' ? 'pae' : type === 'CPE' ? 'cpe' : type === 'PEO' ? 'peo' : type === 'PM' ? 'pm' : 'default';
  return <Badge variant={variant}>{type || 'Staff'}</Badge>;
}

export function ServiceBadge({ service }: { service: string }) {
  const colors: Record<string, string> = {
    Army: 'bg-olive-100 text-olive-800',
    Navy: 'bg-navy-100 text-navy-800',
    'Air Force': 'bg-sky-100 text-sky-800',
    'Space Force': 'bg-slate-800 text-white',
    Marines: 'bg-red-100 text-red-800',
    OSD: 'bg-purple-100 text-purple-800',
  };

  return (
    <Badge className={colors[service] || variantStyles.service}>
      {service}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Confirmed: 'bg-green-100 text-green-800',
    Acting: 'bg-yellow-100 text-yellow-800',
    PTDO: 'bg-orange-100 text-orange-800',
    Nominated: 'bg-blue-100 text-blue-800',
    Vacant: 'bg-red-100 text-red-800',
  };

  return (
    <Badge className={colors[status] || variantStyles.status}>
      {status}
    </Badge>
  );
}
