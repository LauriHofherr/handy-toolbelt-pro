import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Client, Estimate, Job, Invoice, Payment,
  TimeEntry, Expense, ActivityItem, AppSettings,
} from '@/types';

interface AppState {
  clients: Client[];
  estimates: Estimate[];
  jobs: Job[];
  invoices: Invoice[];
  payments: Payment[];
  timeEntries: TimeEntry[];
  expenses: Expense[];
  activities: ActivityItem[];
  settings: AppSettings;
  activeTimer: { jobId: string; startedAt: string } | null;

  // Clients
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;

  // Estimates
  addEstimate: (estimate: Estimate) => void;
  updateEstimate: (estimate: Estimate) => void;
  deleteEstimate: (id: string) => void;

  // Jobs
  addJob: (job: Job) => void;
  updateJob: (job: Job) => void;
  deleteJob: (id: string) => void;

  // Time
  addTimeEntry: (entry: TimeEntry) => void;
  updateTimeEntry: (entry: TimeEntry) => void;
  deleteTimeEntry: (id: string) => void;
  startTimer: (jobId: string) => void;
  stopTimer: () => TimeEntry | null;

  // Expenses
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;

  // Invoices
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;

  // Payments
  addPayment: (payment: Payment) => void;

  // Activities
  addActivity: (activity: ActivityItem) => void;

  // Settings
  updateSettings: (settings: Partial<AppSettings>) => void;
}

const generateId = () => crypto.randomUUID();

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      clients: [],
      estimates: [],
      jobs: [],
      invoices: [],
      payments: [],
      timeEntries: [],
      expenses: [],
      activities: [],
      activeTimer: null,
      settings: {
        defaultTaxRate: 8.5,
        defaultHourlyRate: 75,
        businessName: 'HandyMan Pro',
        businessPhone: '',
        businessEmail: '',
        businessAddress: '',
      },

      addClient: (client) => {
        set((s) => ({ clients: [...s.clients, client] }));
        get().addActivity({ id: generateId(), type: 'client', description: `Added client: ${client.name}`, timestamp: new Date().toISOString() });
      },
      updateClient: (client) => set((s) => ({ clients: s.clients.map((c) => c.id === client.id ? client : c) })),
      deleteClient: (id) => set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),

      addEstimate: (estimate) => {
        set((s) => ({ estimates: [...s.estimates, estimate] }));
        const client = get().clients.find(c => c.id === estimate.clientId);
        get().addActivity({ id: generateId(), type: 'estimate', description: `Created estimate for ${client?.name || 'client'}`, timestamp: new Date().toISOString(), relatedId: estimate.id });
      },
      updateEstimate: (estimate) => set((s) => ({ estimates: s.estimates.map((e) => e.id === estimate.id ? estimate : e) })),
      deleteEstimate: (id) => set((s) => ({ estimates: s.estimates.filter((e) => e.id !== id) })),

      addJob: (job) => {
        set((s) => ({ jobs: [...s.jobs, job] }));
        const client = get().clients.find(c => c.id === job.clientId);
        get().addActivity({ id: generateId(), type: 'job', description: `New job for ${client?.name || 'client'}`, timestamp: new Date().toISOString(), relatedId: job.id });
      },
      updateJob: (job) => set((s) => ({ jobs: s.jobs.map((j) => j.id === job.id ? job : j) })),
      deleteJob: (id) => set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) })),

      addTimeEntry: (entry) => {
        set((s) => ({ timeEntries: [...s.timeEntries, entry] }));
        get().addActivity({ id: generateId(), type: 'time', description: `Logged ${entry.hours.toFixed(1)}h`, timestamp: new Date().toISOString(), relatedId: entry.jobId });
      },
      updateTimeEntry: (entry) => set((s) => ({ timeEntries: s.timeEntries.map((t) => t.id === entry.id ? entry : t) })),
      deleteTimeEntry: (id) => set((s) => ({ timeEntries: s.timeEntries.filter((t) => t.id !== id) })),

      startTimer: (jobId) => set({ activeTimer: { jobId, startedAt: new Date().toISOString() } }),
      stopTimer: () => {
        const timer = get().activeTimer;
        if (!timer) return null;
        const start = new Date(timer.startedAt);
        const hours = (Date.now() - start.getTime()) / 3600000;
        const entry: TimeEntry = {
          id: generateId(),
          jobId: timer.jobId,
          date: new Date().toISOString().split('T')[0],
          hours: Math.round(hours * 100) / 100,
          notes: 'Timer session',
          startTime: timer.startedAt,
          endTime: new Date().toISOString(),
        };
        get().addTimeEntry(entry);
        set({ activeTimer: null });
        return entry;
      },

      addExpense: (expense) => {
        set((s) => ({ expenses: [...s.expenses, expense] }));
        get().addActivity({ id: generateId(), type: 'expense', description: `$${expense.amount.toFixed(2)} ${expense.category}`, timestamp: new Date().toISOString(), relatedId: expense.jobId });
      },
      updateExpense: (expense) => set((s) => ({ expenses: s.expenses.map((e) => e.id === expense.id ? expense : e) })),
      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      addInvoice: (invoice) => {
        set((s) => ({ invoices: [...s.invoices, invoice] }));
        const client = get().clients.find(c => c.id === invoice.clientId);
        get().addActivity({ id: generateId(), type: 'invoice', description: `Invoice created for ${client?.name || 'client'}`, timestamp: new Date().toISOString(), relatedId: invoice.id });
      },
      updateInvoice: (invoice) => set((s) => ({ invoices: s.invoices.map((i) => i.id === invoice.id ? invoice : i) })),
      deleteInvoice: (id) => set((s) => ({ invoices: s.invoices.filter((i) => i.id !== id) })),

      addPayment: (payment) => {
        set((s) => ({ payments: [...s.payments, payment] }));
        get().addActivity({ id: generateId(), type: 'payment', description: `Payment of $${payment.amount.toFixed(2)} received`, timestamp: new Date().toISOString(), relatedId: payment.invoiceId });
      },

      addActivity: (activity) => set((s) => ({ activities: [activity, ...s.activities].slice(0, 100) })),

      updateSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),
    }),
    {
      name: 'handyman-pro-storage',
    }
  )
);
