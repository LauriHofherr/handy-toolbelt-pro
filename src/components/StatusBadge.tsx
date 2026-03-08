import { cn } from '@/lib/utils';
import type { EstimateStatus, JobStatus, InvoiceStatus } from '@/types';

type StatusType = EstimateStatus | JobStatus | InvoiceStatus;

const statusStyles: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-primary/20 text-primary',
  accepted: 'bg-success/20 text-success',
  declined: 'bg-destructive/20 text-destructive',
  scheduled: 'bg-primary/20 text-primary',
  'in-progress': 'bg-primary/20 text-primary',
  completed: 'bg-success/20 text-success',
  cancelled: 'bg-muted text-muted-foreground',
  'partially-paid': 'bg-warning/20 text-warning',
  paid: 'bg-success/20 text-success',
  overdue: 'bg-destructive/20 text-destructive',
};

export function StatusBadge({ status }: { status: StatusType }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide', statusStyles[status] || 'bg-muted text-muted-foreground')}>
      {status.replace('-', ' ')}
    </span>
  );
}
