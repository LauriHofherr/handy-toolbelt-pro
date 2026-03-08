import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, Play, Square, Plus, Clock, Receipt, Trash2, DollarSign } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate, generateId, calculateSubtotal } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ExpenseCategory } from '@/types';
import { toast } from 'sonner';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useStore();
  const { jobs, clients, timeEntries, expenses, estimates, activeTimer } = store;

  const job = jobs.find(j => j.id === id);
  const client = job ? clients.find(c => c.id === job.clientId) : null;

  const [showTimeForm, setShowTimeForm] = useState(false);
  const [timeHours, setTimeHours] = useState('');
  const [timeNotes, setTimeNotes] = useState('');
  const [timeDate, setTimeDate] = useState(new Date().toISOString().split('T')[0]);

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('Materials');

  if (!job) return <div className="p-8 text-center text-muted-foreground">Job not found</div>;

  const jobTimeEntries = timeEntries.filter(t => t.jobId === id);
  const jobExpenses = expenses.filter(e => e.jobId === id);
  const totalHours = jobTimeEntries.reduce((s, t) => s + t.hours, 0);
  const totalTimeRevenue = totalHours * job.hourlyRate;
  const totalExpenses = jobExpenses.reduce((s, e) => s + e.amount, 0);

  const estimate = job.estimateId ? estimates.find(e => e.id === job.estimateId) : null;
  const estimatedTotal = estimate ? calculateSubtotal(estimate.lineItems) * (1 + estimate.taxRate / 100) : 0;
  const actualCost = totalExpenses;
  const actualRevenue = totalTimeRevenue;

  const isTimerRunning = activeTimer?.jobId === id;

  const handleToggleTimer = () => {
    if (isTimerRunning) {
      const entry = store.stopTimer();
      if (entry) toast.success(`Logged ${entry.hours.toFixed(2)} hours`);
    } else {
      store.startTimer(id!);
      toast.success('Timer started');
    }
  };

  const handleAddTime = () => {
    if (!timeHours || Number(timeHours) <= 0) { toast.error('Enter valid hours'); return; }
    store.addTimeEntry({ id: generateId(), jobId: id!, date: timeDate, hours: Number(timeHours), notes: timeNotes });
    setTimeHours(''); setTimeNotes(''); setShowTimeForm(false);
    toast.success('Time logged');
  };

  const handleAddExpense = () => {
    if (!expDesc.trim() || !expAmount || Number(expAmount) <= 0) { toast.error('Fill out expense details'); return; }
    store.addExpense({ id: generateId(), jobId: id!, description: expDesc.trim(), amount: Number(expAmount), category: expCategory, date: new Date().toISOString().split('T')[0] });
    setExpDesc(''); setExpAmount(''); setShowExpenseForm(false);
    toast.success('Expense added');
  };

  return (
    <div className="pb-24">
      <PageHeader
        title={job.description}
        subtitle={client?.name}
        back
        actions={<Button size="icon" variant="ghost" onClick={() => navigate(`/jobs/${id}/edit`)}><Edit className="w-5 h-5" /></Button>}
      />
      <div className="px-4 max-w-lg mx-auto space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <StatusBadge status={job.status} />
          <span className="text-xs text-muted-foreground">{formatDate(job.scheduledDate)}</span>
        </div>

        {/* Profitability */}
        {estimate && (
          <div className="bg-card rounded-xl border border-border p-4 space-y-2">
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-muted-foreground">Profitability</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-muted-foreground text-xs">Estimated</p><p className="font-semibold">{formatCurrency(estimatedTotal)}</p></div>
              <div><p className="text-muted-foreground text-xs">Revenue</p><p className="font-semibold text-success">{formatCurrency(actualRevenue)}</p></div>
              <div><p className="text-muted-foreground text-xs">Expenses</p><p className="font-semibold text-destructive">{formatCurrency(actualCost)}</p></div>
              <div><p className="text-muted-foreground text-xs">Net</p><p className="font-semibold">{formatCurrency(actualRevenue - actualCost)}</p></div>
            </div>
          </div>
        )}

        {/* Timer */}
        <div className="space-y-2">
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" /> Time ({totalHours.toFixed(1)}h · {formatCurrency(totalTimeRevenue)})
          </h3>
          <div className="flex gap-2">
            <Button
              onClick={handleToggleTimer}
              className={`flex-1 tap-target ${isTimerRunning ? 'bg-destructive hover:bg-destructive/90' : ''}`}
            >
              {isTimerRunning ? <><Square className="w-4 h-4 mr-1" /> Stop Timer</> : <><Play className="w-4 h-4 mr-1" /> Start Timer</>}
            </Button>
            <Button variant="secondary" className="tap-target" onClick={() => setShowTimeForm(!showTimeForm)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {showTimeForm && (
            <div className="bg-card rounded-lg border border-border p-3 space-y-2">
              <Input type="date" value={timeDate} onChange={(e) => setTimeDate(e.target.value)} className="tap-target" />
              <Input type="number" placeholder="Hours" value={timeHours} onChange={(e) => setTimeHours(e.target.value)} className="tap-target" min={0} step={0.25} />
              <Input placeholder="Notes (optional)" value={timeNotes} onChange={(e) => setTimeNotes(e.target.value)} className="tap-target" />
              <Button onClick={handleAddTime} className="w-full tap-target">Add Time</Button>
            </div>
          )}

          {jobTimeEntries.map(t => (
            <div key={t.id} className="bg-card rounded-lg border border-border p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t.hours.toFixed(2)}h</p>
                <p className="text-xs text-muted-foreground">{formatDate(t.date)}{t.notes ? ` · ${t.notes}` : ''}</p>
              </div>
              <button onClick={() => { store.deleteTimeEntry(t.id); toast.success('Deleted'); }} className="tap-target p-1">
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>
          ))}
        </div>

        {/* Expenses */}
        <div className="space-y-2">
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Receipt className="w-4 h-4" /> Expenses ({formatCurrency(totalExpenses)})
          </h3>
          <Button variant="secondary" className="w-full tap-target" onClick={() => setShowExpenseForm(!showExpenseForm)}>
            <Plus className="w-4 h-4 mr-1" /> Add Expense
          </Button>

          {showExpenseForm && (
            <div className="bg-card rounded-lg border border-border p-3 space-y-2">
              <Input placeholder="Description" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} className="tap-target" />
              <Input type="number" placeholder="Amount" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} className="tap-target" min={0} step={0.01} />
              <Select value={expCategory} onValueChange={(v) => setExpCategory(v as ExpenseCategory)}>
                <SelectTrigger className="tap-target"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['Materials', 'Tools', 'Fuel', 'Subcontractor', 'Other'] as ExpenseCategory[]).map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddExpense} className="w-full tap-target">Add Expense</Button>
            </div>
          )}

          {jobExpenses.map(e => (
            <div key={e.id} className="bg-card rounded-lg border border-border p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{e.description}</p>
                <p className="text-xs text-muted-foreground">{e.category} · {formatDate(e.date)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{formatCurrency(e.amount)}</span>
                <button onClick={() => { store.deleteExpense(e.id); toast.success('Deleted'); }} className="tap-target p-1">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Generate Invoice */}
        {job.status === 'completed' && (
          <Button className="w-full tap-target text-base font-semibold" onClick={() => navigate(`/invoices/new?jobId=${id}`)}>
            <DollarSign className="w-5 h-5 mr-1" /> Generate Invoice
          </Button>
        )}
      </div>
    </div>
  );
}
