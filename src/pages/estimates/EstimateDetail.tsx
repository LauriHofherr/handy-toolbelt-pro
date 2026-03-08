import { useNavigate, useParams } from 'react-router-dom';
import { Edit, Send, FileDown, MessageSquare, Mail } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate, calculateSubtotal, calculateTotal } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generateEstimatePdf } from '@/lib/pdf';

export default function EstimateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { estimates, clients, updateEstimate, settings } = useStore();
  const estimate = estimates.find(e => e.id === id);
  const client = estimate ? clients.find(c => c.id === estimate.clientId) : null;

  if (!estimate) return <div className="p-8 text-center text-muted-foreground">Estimate not found</div>;

  const subtotal = calculateSubtotal(estimate.lineItems);
  const total = calculateTotal(estimate.lineItems, estimate.taxRate);

  const handleSend = (method: 'sms' | 'email') => {
    const body = `Hi ${client?.name}, here's your estimate for ${formatCurrency(total)} from ${settings.businessName}. Please review and let me know!`;
    if (method === 'sms' && client?.phone) {
      window.open(`sms:${client.phone}?body=${encodeURIComponent(body)}`);
    } else if (method === 'email' && client?.email) {
      window.open(`mailto:${client.email}?subject=${encodeURIComponent(`Estimate from ${settings.businessName}`)}&body=${encodeURIComponent(body)}`);
    } else {
      toast.error(`No ${method === 'sms' ? 'phone' : 'email'} on file`);
      return;
    }
    updateEstimate({ ...estimate, status: 'sent', updatedAt: new Date().toISOString() });
    toast.success('Estimate marked as sent');
  };

  const handlePdf = () => {
    generateEstimatePdf(estimate, client, settings);
    toast.success('PDF downloaded');
  };

  const handleConvert = () => {
    navigate(`/jobs/new?estimateId=${estimate.id}&clientId=${estimate.clientId}`);
  };

  return (
    <div className="pb-24">
      <PageHeader
        title="Estimate"
        subtitle={client?.name}
        back
        actions={
          <Button size="icon" variant="ghost" onClick={() => navigate(`/estimates/${id}/edit`)}>
            <Edit className="w-5 h-5" />
          </Button>
        }
      />
      <div className="px-4 max-w-lg mx-auto space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <StatusBadge status={estimate.status} />
          <span className="text-xs text-muted-foreground">{formatDate(estimate.createdAt)}</span>
        </div>

        {/* Line Items */}
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {estimate.lineItems.map(item => (
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
            <div className="flex justify-between text-sm"><span>Tax ({estimate.taxRate}%)</span><span>{formatCurrency(subtotal * estimate.taxRate / 100)}</span></div>
            <div className="flex justify-between text-lg font-display font-bold pt-1 border-t border-border"><span>Total</span><span className="text-primary">{formatCurrency(total)}</span></div>
          </div>
        </div>

        {estimate.notes && (
          <div className="bg-card rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground mb-1">Notes</p>
            <p className="text-sm">{estimate.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" className="tap-target" onClick={() => handleSend('sms')}>
            <MessageSquare className="w-4 h-4 mr-1" /> SMS
          </Button>
          <Button variant="secondary" className="tap-target" onClick={() => handleSend('email')}>
            <Mail className="w-4 h-4 mr-1" /> Email
          </Button>
        </div>
        <Button variant="secondary" className="w-full tap-target" onClick={handlePdf}>
          <FileDown className="w-4 h-4 mr-1" /> Download PDF
        </Button>
        {estimate.status === 'accepted' && (
          <Button className="w-full tap-target text-base font-semibold" onClick={handleConvert}>
            Convert to Job
          </Button>
        )}
      </div>
    </div>
  );
}
