import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, Send, FileDown, MessageSquare, Mail, DollarSign } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate, calculateSubtotal, calculateTotal, generateId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PaymentMethod } from '@/types';
import { generateInvoicePdf } from '@/lib/pdf';
import { toast } from 'sonner';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useStore();
  const { invoices, clients, payments, settings, addPayment, updateInvoice } = store;

  const invoice = invoices.find(i => i.id === id);
  const client = invoice ? clients.find(c => c.id === invoice.clientId) : null;

  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payNotes, setPayNotes] = useState('');

  if (!invoice) return <div className="p-8 text-center text-muted-foreground">Invoice not found</div>;

  const total = calculateTotal(invoice.lineItems, invoice.taxRate);
  const subtotal = calculateSubtotal(invoice.lineItems);
  const invoicePayments = payments.filter(p => p.invoiceId === id);
  const totalPaid = invoicePayments.reduce((s, p) => s + p.amount, 0);
  const balance = total - totalPaid;

  const handleSend = (method: 'sms' | 'email') => {
    const body = `Hi ${client?.name}, your invoice for ${formatCurrency(total)} from ${settings.businessName} is ready. Balance due: ${formatCurrency(balance)}.`;
    if (method === 'sms' && client?.phone) {
      window.open(`sms:${client.phone}?body=${encodeURIComponent(body)}`);
    } else if (method === 'email' && client?.email) {
      window.open(`mailto:${client.email}?subject=${encodeURIComponent(`Invoice from ${settings.businessName}`)}&body=${encodeURIComponent(body)}`);
    } else {
      toast.error(`No ${method === 'sms' ? 'phone' : 'email'} on file`); return;
    }
    if (invoice.status === 'draft') {
      updateInvoice({ ...invoice, status: 'sent', updatedAt: new Date().toISOString() });
    }
    toast.success('Invoice marked as sent');
  };

  const handlePdf = () => {
    generateInvoicePdf(invoice, client, settings, totalPaid);
    toast.success('PDF downloaded');
  };

  const handlePayment = () => {
    if (!payAmount || Number(payAmount) <= 0) { toast.error('Enter a valid amount'); return; }
    const amt = Number(payAmount);
    addPayment({ id: generateId(), invoiceId: id!, amount: amt, method: payMethod, date: new Date().toISOString().split('T')[0], notes: payNotes });

    const newPaid = totalPaid + amt;
    const newStatus = newPaid >= total ? 'paid' : 'partially-paid';
    updateInvoice({ ...invoice, status: newStatus, updatedAt: new Date().toISOString() });

    setPayAmount(''); setPayNotes(''); setShowPayForm(false);
    toast.success(`Payment of ${formatCurrency(amt)} recorded`);
  };

  return (
    <div className="pb-24">
      <PageHeader
        title="Invoice"
        subtitle={client?.name}
        back
        actions={<Button size="icon" variant="ghost" onClick={() => navigate(`/invoices/${id}/edit`)}><Edit className="w-5 h-5" /></Button>}
      />
      <div className="px-4 max-w-lg mx-auto space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <StatusBadge status={invoice.status} />
          <span className="text-xs text-muted-foreground">Due {formatDate(invoice.dueDate)}</span>
        </div>

        {/* Line Items */}
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {invoice.lineItems.map(item => (
            <div key={item.id} className="p-3 flex justify-between">
              <div>
                <p className="text-sm font-medium">{item.description}</p>
                <p className="text-xs text-muted-foreground">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
              </div>
              <p className="text-sm font-semibold">{formatCurrency(item.quantity * item.unitPrice)}</p>
            </div>
          ))}
          <div className="p-3 space-y-1">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span>Tax ({invoice.taxRate}%)</span><span>{formatCurrency(subtotal * invoice.taxRate / 100)}</span></div>
            <div className="flex justify-between text-sm font-semibold border-t border-border pt-1"><span>Total</span><span>{formatCurrency(total)}</span></div>
            {totalPaid > 0 && <div className="flex justify-between text-sm text-success"><span>Paid</span><span>-{formatCurrency(totalPaid)}</span></div>}
            <div className="flex justify-between text-lg font-display font-bold border-t border-border pt-2">
              <span>Balance Due</span>
              <span className={balance > 0 ? 'text-primary' : 'text-success'}>{formatCurrency(Math.max(0, balance))}</span>
            </div>
          </div>
        </div>

        {/* Send */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" className="tap-target" onClick={() => handleSend('sms')}><MessageSquare className="w-4 h-4 mr-1" /> SMS</Button>
          <Button variant="secondary" className="tap-target" onClick={() => handleSend('email')}><Mail className="w-4 h-4 mr-1" /> Email</Button>
        </div>
        <Button variant="secondary" className="w-full tap-target" onClick={handlePdf}><FileDown className="w-4 h-4 mr-1" /> Download PDF</Button>

        {/* Record Payment */}
        {balance > 0 && (
          <>
            <Button className="w-full tap-target text-base font-semibold" onClick={() => setShowPayForm(!showPayForm)}>
              <DollarSign className="w-5 h-5 mr-1" /> Record Payment
            </Button>
            {showPayForm && (
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input type="number" min={0} step={0.01} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder={balance.toFixed(2)} className="tap-target" />
                </div>
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select value={payMethod} onValueChange={(v) => setPayMethod(v as PaymentMethod)}>
                    <SelectTrigger className="tap-target"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['cash', 'check', 'venmo', 'zelle', 'card'] as PaymentMethod[]).map(m => (
                        <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Optional" className="tap-target" />
                </div>
                <Button onClick={handlePayment} className="w-full tap-target">Submit Payment</Button>
              </div>
            )}
          </>
        )}

        {/* Payment History */}
        {invoicePayments.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-muted-foreground">Payment History</h3>
            {invoicePayments.map(p => (
              <div key={p.id} className="bg-card rounded-lg border border-border p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{formatCurrency(p.amount)}</p>
                  <p className="text-xs text-muted-foreground">{p.method} · {formatDate(p.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
