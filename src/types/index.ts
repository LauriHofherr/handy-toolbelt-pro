export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface LaborItem {
  id: string;
  description: string;
  hours: number;
  rate: number;
}

export interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
}

export interface MaterialLibraryEntry {
  id: string;
  name: string;
  lastUsedPrice: number;
  updatedAt: string;
}

export type EstimateStatus = 'draft' | 'sent' | 'accepted' | 'declined';

export interface Estimate {
  id: string;
  clientId: string;
  lineItems: LineItem[];
  laborItems?: LaborItem[];
  materialItems?: MaterialItem[];
  scopeOfWork?: string;
  taxRate: number;
  materialMarkup?: number;
  contingencyEnabled?: boolean;
  contingencyRate?: number;
  notes: string;
  terms: string;
  status: EstimateStatus;
  createdAt: string;
  updatedAt: string;
}

export type JobStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export interface TimeEntry {
  id: string;
  jobId: string;
  date: string;
  hours: number;
  notes: string;
  startTime?: string;
  endTime?: string;
}

export type ExpenseCategory = 'Materials' | 'Tools' | 'Fuel' | 'Subcontractor' | 'Other';

export interface Expense {
  id: string;
  jobId: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  receiptPhoto?: string;
}

export interface Job {
  id: string;
  clientId: string;
  estimateId?: string;
  description: string;
  scheduledDate: string;
  status: JobStatus;
  hourlyRate: number;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'partially-paid' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  jobId: string;
  clientId: string;
  lineItems: LineItem[];
  timeEntries: string[];
  expenses: string[];
  hourlyRate: number;
  taxRate: number;
  notes: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
}

export type PaymentMethod = 'cash' | 'check' | 'venmo' | 'zelle' | 'card';

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  notes: string;
}

export interface ActivityItem {
  id: string;
  type: 'estimate' | 'job' | 'invoice' | 'payment' | 'client' | 'expense' | 'time';
  description: string;
  timestamp: string;
  relatedId?: string;
}

export interface AppSettings {
  defaultTaxRate: number;
  defaultHourlyRate: number;
  defaultMaterialMarkup: number;
  defaultContingencyRate: number;
  defaultPaymentTerms: string;
  estimateValidityDays: number;
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
}
