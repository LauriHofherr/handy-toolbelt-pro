import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateId, formatCurrency, calculateSubtotal, calculateTotal } from '@/lib/utils';
import type { LineItem, InvoiceStatus } from '@/types';
import { toast } from 'sonner';

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const store = useStore();
  const { clients, invoices, jobs, timeEntries, expenses, settings, addInvoice, updateInvoice } = store;
  const existing = id && id !== 'new' ? invoices.find(i => i.id === id) : null;

  const preJobId = searchParams.get('jobId') || '';
  const preJob = preJobId ? jobs.find(j => j.id === preJobId) : null;

  // Build initial line items from job data
  const buildLineItems = (): LineItem[] => {
    if (existing) return existing.lineItems;
    if (!preJob) return [{ id: generateId(), description: '', quantity: 1, unitPrice: 0 }];

    const items: LineItem[] = [];
    const jobTime = timeEntries.filter(t => t.jobId === preJobId);
    const totalHours = jobTime.reduce((s, t) => s + t.hours, 0);
    if (totalHours > 0) {
      items.push({ id: generateId(), description: `Labor (${totalHours.toFixed(1)} hours)`, quantity: totalHours, unitPrice: preJob.hourlyRate });
    }
    const jobExpenses = expenses.filter(e => e.jobId === preJobId);
    jobExpenses.forEach(e => {
      items.push({ id: generateId(), description: `${e.category}: ${e.description}`, quantity: 1, unitPrice: e.amount });
    });
    if (items.length === 0) items.push({ id: generateId(), description: '', quantity: 1, unitPrice: 0 });
    return items;
  };

  const [clientId, setClientId] = useState(existing?.clientId || preJob?.clientId || '');
  const [lineItems, setLineItems] = useState<LineItem[]>(buildLineItems);
  const [taxRate, setTaxRate] = useState(existing?.taxRate ?? settings.defaultTaxRate);
  const [notes, setNotes] = useState(existing?.notes || '');
  const [status, setStatus] = useState<InvoiceStatus>(existing?.status || 'draft');
  const [dueDate, setDueDate] = useState(existing?.dueDate || (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; })());

  const addLineItem = () => setLineItems([...lineItems, { id: generateId(), description: '', quantity: 1, unitPrice: 0 }]);
  const removeLineItem = (itemId: string) => setLineItems(lineItems.filter(i => i.id !== itemId));
  const updateLineItem = (itemId: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(i => i.id === itemId ? { ...i, [field]: value } : i));
  };

  const subtotal = calculateSubtotal(lineItems);
  const total = calculateTotal(lineItems, taxRate);

  const handleSave = () => {
    if (!clientId) { toast.error('Select a client'); return; }

    const invoice = {
      id: existing?.id || generateId(),
      jobId: existing?.jobId || preJobId,
      clientId,
      lineItems: lineItems.filter(i => i.description.trim()),
      timeEntries: [],
      expenses: [],
      hourlyRate: preJob?.hourlyRate || settings.defaultHourlyRate,
      taxRate,
      notes,
      status,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate,
    };

    if (existing) {
      updateInvoice(invoice);
      toast.success('Invoice updated');
    } else {
      addInvoice(invoice);
      toast.success('Invoice created');
    }
    navigate(-1);
  };

  return (
    <div className="pb-24">
      <PageHeader title={existing ? 'Edit Invoice' : 'New Invoice'} back />
      <div className="px-4 max-w-lg mx-auto space-y-4 pt-4">
        <div className="space-y-2">
          <Label>Client *</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="tap-target"><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Due Date</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="tap-target" />
        </div>

        {existing && (
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus)}>
              <SelectTrigger className="tap-target"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="partially-paid">Partially Paid</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Line Items */}
        <div className="space-y-2">
          <Label>Line Items</Label>
          {lineItems.map((item, idx) => (
            <div key={item.id} className="bg-card rounded-lg p-3 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Item {idx + 1}</span>
                {lineItems.length > 1 && <button onClick={() => removeLineItem(item.id)} className="tap-target p-1"><Trash2 className="w-4 h-4 text-destructive" /></button>}
              </div>
              <Input placeholder="Description" value={item.description} onChange={(e) => updateLineItem(item.id, 'description', e.target.value)} className="tap-target" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-muted-foreground">Qty</span>
                  <Input type="number" min={0} step={0.01} value={item.quantity} onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))} className="tap-target" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Unit Price</span>
                  <Input type="number" min={0} step={0.01} value={item.unitPrice} onChange={(e) => updateLineItem(item.id, 'unitPrice', Number(e.target.value))} className="tap-target" />
                </div>
              </div>
              <p className="text-right text-sm font-semibold">{formatCurrency(item.quantity * item.unitPrice)}</p>
            </div>
          ))}
          <Button variant="secondary" className="w-full tap-target" onClick={addLineItem}><Plus className="w-4 h-4 mr-1" /> Add Item</Button>
        </div>

        <div className="space-y-2">
          <Label>Tax Rate (%)</Label>
          <Input type="number" min={0} step={0.1} value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} className="tap-target" />
        </div>

        <div className="bg-card rounded-xl border border-border p-4 space-y-2">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span>Tax ({taxRate}%)</span><span>{formatCurrency(subtotal * taxRate / 100)}</span></div>
          <div className="flex justify-between text-lg font-display font-bold border-t border-border pt-2"><span>Total</span><span className="text-primary">{formatCurrency(total)}</span></div>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Thank you for your business!" rows={3} />
        </div>

        <Button onClick={handleSave} className="w-full tap-target text-base font-semibold">
          {existing ? 'Save Changes' : 'Create Invoice'}
        </Button>
      </div>
    </div>
  );
}
