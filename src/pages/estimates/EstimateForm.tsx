import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateId, formatCurrency, calculateSubtotal, calculateTotal } from '@/lib/utils';
import type { LineItem, EstimateStatus } from '@/types';
import { toast } from 'sonner';

export default function EstimateForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { clients, estimates, addEstimate, updateEstimate, settings } = useStore();
  const existing = id && id !== 'new' ? estimates.find(e => e.id === id) : null;

  const [clientId, setClientId] = useState(existing?.clientId || '');
  const [lineItems, setLineItems] = useState<LineItem[]>(existing?.lineItems || [{ id: generateId(), description: '', quantity: 1, unitPrice: 0 }]);
  const [taxRate, setTaxRate] = useState(existing?.taxRate ?? settings.defaultTaxRate);
  const [notes, setNotes] = useState(existing?.notes || '');
  const [terms, setTerms] = useState(existing?.terms || '');
  const [status, setStatus] = useState<EstimateStatus>(existing?.status || 'draft');

  const addLineItem = () => setLineItems([...lineItems, { id: generateId(), description: '', quantity: 1, unitPrice: 0 }]);
  const removeLineItem = (itemId: string) => setLineItems(lineItems.filter(i => i.id !== itemId));
  const updateLineItem = (itemId: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(i => i.id === itemId ? { ...i, [field]: value } : i));
  };

  const subtotal = calculateSubtotal(lineItems);
  const total = calculateTotal(lineItems, taxRate);

  const handleSave = () => {
    if (!clientId) { toast.error('Select a client'); return; }
    if (lineItems.every(i => !i.description.trim())) { toast.error('Add at least one line item'); return; }

    const estimate = {
      id: existing?.id || generateId(),
      clientId,
      lineItems: lineItems.filter(i => i.description.trim()),
      taxRate,
      notes,
      terms,
      status,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      updateEstimate(estimate);
      toast.success('Estimate updated');
    } else {
      addEstimate(estimate);
      toast.success('Estimate created');
    }
    navigate(-1);
  };

  return (
    <div className="pb-24">
      <PageHeader title={existing ? 'Edit Estimate' : 'New Estimate'} back />
      <div className="px-4 max-w-lg mx-auto space-y-4 pt-4">
        <div className="space-y-2">
          <Label>Client *</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="tap-target"><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>
              {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {clients.length === 0 && <p className="text-xs text-muted-foreground">Add a client first</p>}
        </div>

        {existing && (
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as EstimateStatus)}>
              <SelectTrigger className="tap-target"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
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
                {lineItems.length > 1 && (
                  <button onClick={() => removeLineItem(item.id)} className="tap-target p-1"><Trash2 className="w-4 h-4 text-destructive" /></button>
                )}
              </div>
              <Input placeholder="Description" value={item.description} onChange={(e) => updateLineItem(item.id, 'description', e.target.value)} className="tap-target" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-muted-foreground">Qty</span>
                  <Input type="number" min={1} value={item.quantity} onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))} className="tap-target" />
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

        {/* Tax */}
        <div className="space-y-2">
          <Label>Tax Rate (%)</Label>
          <Input type="number" min={0} step={0.1} value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} className="tap-target" />
        </div>

        {/* Totals */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-2">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span>Tax ({taxRate}%)</span><span>{formatCurrency(subtotal * taxRate / 100)}</span></div>
          <div className="flex justify-between text-lg font-display font-bold border-t border-border pt-2"><span>Total</span><span className="text-primary">{formatCurrency(total)}</span></div>
        </div>

        {/* Notes / Terms */}
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes for the client..." rows={3} />
        </div>
        <div className="space-y-2">
          <Label>Terms</Label>
          <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Payment terms, warranty..." rows={3} />
        </div>

        <Button onClick={handleSave} className="w-full tap-target text-base font-semibold">
          {existing ? 'Save Changes' : 'Create Estimate'}
        </Button>
      </div>
    </div>
  );
}
