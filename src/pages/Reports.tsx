import { useState } from 'react';
import { BarChart3, Download, TrendingUp, Users, Briefcase } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Reports() {
  const { payments, expenses, clients, jobs, invoices, timeEntries } = useStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Monthly
  const monthPayments = payments.filter(p => {
    const d = new Date(p.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const monthRevenue = monthPayments.reduce((s, p) => s + p.amount, 0);

  const monthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const monthExpenseTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const monthProfit = monthRevenue - monthExpenseTotal;

  // YTD
  const ytdPayments = payments.filter(p => new Date(p.date).getFullYear() === year);
  const ytdRevenue = ytdPayments.reduce((s, p) => s + p.amount, 0);
  const ytdExpenses = expenses.filter(e => new Date(e.date).getFullYear() === year);
  const ytdExpenseTotal = ytdExpenses.reduce((s, e) => s + e.amount, 0);
  const ytdProfit = ytdRevenue - ytdExpenseTotal;

  // Top clients
  const clientRevenue = clients.map(c => {
    const clientInvoices = invoices.filter(i => i.clientId === c.id);
    const revenue = payments.filter(p => clientInvoices.some(i => i.id === p.invoiceId)).reduce((s, p) => s + p.amount, 0);
    return { name: c.name, revenue };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Job profitability
  const jobProfits = jobs.filter(j => j.status === 'completed').map(j => {
    const hours = timeEntries.filter(t => t.jobId === j.id).reduce((s, t) => s + t.hours, 0);
    const revenue = hours * j.hourlyRate;
    const cost = expenses.filter(e => e.jobId === j.id).reduce((s, e) => s + e.amount, 0);
    return { description: j.description, revenue, cost, profit: revenue - cost };
  }).sort((a, b) => b.profit - a.profit);

  const exportCsv = () => {
    const rows = [
      ['Type', 'Date', 'Description', 'Amount'],
      ...payments.filter(p => new Date(p.date).getFullYear() === year).map(p => ['Revenue', p.date, p.method, p.amount.toFixed(2)]),
      ...expenses.filter(e => new Date(e.date).getFullYear() === year).map(e => ['Expense', e.date, `${e.category}: ${e.description}`, (-e.amount).toFixed(2)]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `handyman-pro-${year}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <div className="pb-24">
      <PageHeader title="Reports" />
      <div className="px-4 max-w-lg mx-auto space-y-6 pt-4">
        {/* Month Selector */}
        <div className="flex gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="tap-target flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>{months.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="tap-target w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {/* Monthly Summary */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> {months[month]} {year}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div><p className="text-xs text-muted-foreground">Revenue</p><p className="text-lg font-display font-bold text-success">{formatCurrency(monthRevenue)}</p></div>
            <div><p className="text-xs text-muted-foreground">Expenses</p><p className="text-lg font-display font-bold text-destructive">{formatCurrency(monthExpenseTotal)}</p></div>
            <div><p className="text-xs text-muted-foreground">Profit</p><p className={`text-lg font-display font-bold ${monthProfit >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(monthProfit)}</p></div>
          </div>
        </div>

        {/* YTD */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-muted-foreground">Year to Date — {year}</h3>
          <div className="grid grid-cols-3 gap-3">
            <div><p className="text-xs text-muted-foreground">Revenue</p><p className="text-lg font-display font-bold text-success">{formatCurrency(ytdRevenue)}</p></div>
            <div><p className="text-xs text-muted-foreground">Expenses</p><p className="text-lg font-display font-bold text-destructive">{formatCurrency(ytdExpenseTotal)}</p></div>
            <div><p className="text-xs text-muted-foreground">Profit</p><p className={`text-lg font-display font-bold ${ytdProfit >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(ytdProfit)}</p></div>
          </div>
        </div>

        {/* Top Clients */}
        {clientRevenue.length > 0 && clientRevenue[0].revenue > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" /> Top Clients</h3>
            {clientRevenue.filter(c => c.revenue > 0).map((c, i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-3 flex items-center justify-between">
                <span className="text-sm font-medium">{c.name}</span>
                <span className="text-sm font-semibold text-primary">{formatCurrency(c.revenue)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Job Profitability */}
        {jobProfits.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Briefcase className="w-4 h-4" /> Job Profitability</h3>
            {jobProfits.map((j, i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-3">
                <p className="text-sm font-medium truncate">{j.description}</p>
                <div className="flex gap-4 text-xs mt-1">
                  <span className="text-success">Rev: {formatCurrency(j.revenue)}</span>
                  <span className="text-destructive">Cost: {formatCurrency(j.cost)}</span>
                  <span className={j.profit >= 0 ? 'text-success' : 'text-destructive'}>Net: {formatCurrency(j.profit)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Export */}
        <Button variant="secondary" className="w-full tap-target" onClick={exportCsv}>
          <Download className="w-4 h-4 mr-1" /> Export {year} CSV
        </Button>
      </div>
    </div>
  );
}
