import { useNavigate } from 'react-router-dom';
import { Plus, Briefcase, ChevronRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function JobList() {
  const navigate = useNavigate();
  const { jobs, clients } = useStore();

  const sorted = [...jobs].sort((a, b) => {
    const order = { 'in-progress': 0, scheduled: 1, completed: 2, cancelled: 3 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="pb-24">
      <PageHeader
        title="Jobs"
        actions={<Button size="icon" className="tap-target" onClick={() => navigate('/jobs/new')}><Plus className="w-5 h-5" /></Button>}
      />
      <div className="px-4 max-w-lg mx-auto space-y-2 pt-4">
        {sorted.length === 0 ? (
          <EmptyState icon={Briefcase} title="No jobs yet" description="Create a job or convert an estimate" actionLabel="New Job" onAction={() => navigate('/jobs/new')} />
        ) : sorted.map(job => {
          const client = clients.find(c => c.id === job.clientId);
          return (
            <button key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-3 tap-target text-left">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{job.description}</p>
                <p className="text-xs text-muted-foreground">{client?.name} · {formatDate(job.scheduledDate)}</p>
              </div>
              <StatusBadge status={job.status} />
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
