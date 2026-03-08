import { useNavigate } from 'react-router-dom';
import { Plus, Clock, Receipt, Briefcase, DollarSign, AlertTriangle, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatRelativeTime, calculateSubtotal } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const navigate = useNavigate();
  const { jobs, invoices, payments, timeEntries, activities, settings } = useStore();

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEntries = timeEntries.filter(e => new Date(e.date) >= weekStart);
  const weekHours = weekEntries.reduce((s, e) => s + e.hours, 0);
  const activeJobs = jobs.filter(j => j.status === 'in-progress' || j.status === 'scheduled').length;

  const outstandingInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'partially-paid' || i.status === 'overdue');
  const outstandingTotal = outstandingInvoices.reduce((sum, inv) => {
    const invTotal = calculateSubtotal(inv.lineItems) * (1 + inv.taxRate / 100);
    const paid = payments.filter(p => p.invoiceId === inv.id).reduce((s, p) => s + p.amount, 0);
    return sum + (invTotal - paid);
  }, 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;

  const weekPayments = payments.filter(p => new Date(p.date) >= weekStart);
  const weekEarned = weekPayments.reduce((s, p) => s + p.amount, 0);

  const statCards = [
    { label: 'Hours This Week', value: `${weekHours.toFixed(1)}h`, icon: Clock, color: 'text-primary' },
    { label: 'Active Jobs', value: String(activeJobs), icon: Briefcase, color: 'text-primary' },
    { label: 'Earned This Week', value: formatCurrency(weekEarned), icon: DollarSign, color: 'text-success' },
  ];

  return (
    <div className="pb-24">
      <PageHeader title={settings.businessName} subtitle="Dashboard" />
      <div className="px-4 max-w-lg mx-auto space-y-6 pt-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="bg-card rounded-xl p-3 border border-border">
              <s.icon className={`w-5 h-5 ${s.color} mb-1`} />
              <p className="text-lg font-display font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Outstanding */}
        {outstandingTotal > 0 && (
          <button
            onClick={() => navigate('/invoices')}
            className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-3 tap-target"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${overdueCount > 0 ? 'bg-destructive/20' : 'bg-primary/20'}`}>
              <AlertTriangle className={`w-5 h-5 ${overdueCount > 0 ? 'text-destructive' : 'text-primary'}`} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">Outstanding Invoices</p>
              <p className="text-xs text-muted-foreground">{outstandingInvoices.length} invoice{outstandingInvoices.length !== 1 ? 's' : ''}{overdueCount > 0 ? ` · ${overdueCount} overdue` : ''}</p>
            </div>
            <p className="text-lg font-display font-bold text-primary">{formatCurrency(outstandingTotal)}</p>
          </button>
        )}

        {/* Quick Actions */}
        <div className="space-y-2">
          <h2 className="text-sm font-display font-bold uppercase tracking-wider text-muted-foreground">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            <Button variant="secondary" className="flex-col h-auto py-4 gap-1 tap-target" onClick={() => navigate('/estimates/new')}>
              <Plus className="w-5 h-5 text-primary" />
              <span className="text-[11px]">Estimate</span>
            </Button>
            <Button variant="secondary" className="flex-col h-auto py-4 gap-1 tap-target" onClick={() => navigate('/jobs')}>
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-[11px]">Log Time</span>
            </Button>
            <Button variant="secondary" className="flex-col h-auto py-4 gap-1 tap-target" onClick={() => navigate('/jobs')}>
              <Receipt className="w-5 h-5 text-primary" />
              <span className="text-[11px]">Expense</span>
            </Button>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-2">
          <h2 className="text-sm font-display font-bold uppercase tracking-wider text-muted-foreground">Recent Activity</h2>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No activity yet. Start by adding a client!</p>
          ) : (
            <div className="space-y-1">
              {activities.slice(0, 10).map((a) => (
                <div key={a.id} className="bg-card rounded-lg px-3 py-2.5 border border-border flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{a.description}</p>
                    <p className="text-[10px] text-muted-foreground">{formatRelativeTime(a.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
