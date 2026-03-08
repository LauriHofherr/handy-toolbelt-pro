import { useNavigate, useParams } from 'react-router-dom';
import { Edit, FileDown, MessageSquare, Mail, Link2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
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

  const hasNewFormat = (estimate.laborItems?.length || 0) > 0 || (estimate.materialItems?.length || 0) > 0;

  const laborSubtotal = (estimate.laborItems || []).reduce((s, i) => s + i.hours * i.rate, 0);
  const materialsRaw = (estimate.materialItems || []).reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const markup = estimate.materialMarkup || 0;
  const materialsWithMarkup = materialsRaw * (1 + markup / 100);
  const subtotal = laborSubtotal + materialsWithMarkup;
  const contingencyAmt = estimate.contingencyEnabled ? subtotal * ((estimate.contingencyRate || 0) / 100) : 0;
  const preTax = subtotal + contingencyAmt;
  const taxAmt = preTax * (estimate.taxRate / 100);
  const grandTotal = preTax + taxAmt;

  const handleSend = (method: 'sms' | 'email') => {
    const total = hasNewFormat ? grandTotal : 0;
    const jobDesc = estimate.scopeOfWork || 'your project';

    if (method === 'sms' && client?.phone) {
      const body = `Hi ${client.name}, here's my estimate for ${jobDesc}. Total: ${formatCurrency(total)}. Reply to accept or call me with questions.`;
      window.open(`sms:${client.phone}?body=${encodeURIComponent(body)}`);
    } else if (method === 'email' && client?.email) {
      const subject = `Estimate for ${jobDesc} – ${settings.businessName}`;
      const body = `Hi ${client.name},\n\nPlease find the attached estimate for ${jobDesc}.\n\nTotal: ${formatCurrency(total)}\n\nPlease review and let me know if you have any questions.\n\nBest regards,\n${settings.businessName}`;
      window.open(`mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
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

  const handleCopyLink = () => {
    const url = `${window.location.origin}/estimates/${estimate.id}/approve`;
    navigator.clipboard.writeText(url);
    toast.success('Approval link copied to clipboard');
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

        {estimate.scopeOfWork && (
          <div className="bg-card rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground mb-1">Scope of Work</p>
            <p className="text-sm whitespace-pre-wrap">{estimate.scopeOfWork}</p>
          </div>
        )}

        {hasNewFormat ? (
          <>
            {/* Labor items */}
            {(estimate.laborItems?.length || 0) > 0 && (
              <div className="bg-card rounded-xl border border-border divide-y divide-border">
                <div className="p-3">
                  <p className="text-xs font-display font-bold text-primary">Labor</p>
                </div>
                {estimate.laborItems!.map(item => (
                  <div key={item.id} className="p-3 flex justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{item.hours}h × {formatCurrency(item.rate)}/hr</p>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(item.hours * item.rate)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Material items */}
            {(estimate.materialItems?.length || 0) > 0 && (
              <div className="bg-card rounded-xl border border-border divide-y divide-border">
                <div className="p-3">
                  <p className="text-xs font-display font-bold text-primary">Materials & Supplies</p>
                </div>
                {estimate.materialItems!.map(item => (
                  <div key={item.id} className="p-3 flex justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} × {formatCurrency(item.unitCost)}</p>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(item.quantity * item.unitCost)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            <div className="bg-card rounded-xl border border-border p-3 space-y-1">
              <div className="flex justify-between text-sm"><span>Labor</span><span>{formatCurrency(laborSubtotal)}</span></div>
              <div className="flex justify-between text-sm"><span>Materials</span><span>{formatCurrency(materialsRaw)}</span></div>
              {markup > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>Markup ({markup}%)</span><span>+{formatCurrency(materialsRaw * markup / 100)}</span></div>}
              {estimate.contingencyEnabled && <div className="flex justify-between text-xs text-muted-foreground"><span>Contingency ({estimate.contingencyRate}%)</span><span>+{formatCurrency(contingencyAmt)}</span></div>}
              <div className="flex justify-between text-sm"><span>Tax ({estimate.taxRate}%)</span><span>{formatCurrency(taxAmt)}</span></div>
              <div className="flex justify-between text-lg font-display font-bold pt-1 border-t border-border"><span>Total</span><span className="text-primary">{formatCurrency(grandTotal)}</span></div>
            </div>
          </>
        ) : (
          /* Legacy line items */
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
              <div className="flex justify-between text-lg font-display font-bold pt-1 border-t border-border"><span>Total</span><span className="text-primary">{formatCurrency(grandTotal)}</span></div>
            </div>
          </div>
        )}

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
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" className="tap-target" onClick={handlePdf}>
            <FileDown className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button variant="secondary" className="tap-target" onClick={handleCopyLink}>
            <Link2 className="w-4 h-4 mr-1" /> Copy Link
          </Button>
        </div>
        {estimate.status === 'accepted' && (
          <Button className="w-full tap-target text-base font-semibold" onClick={handleConvert}>
            Convert to Job
          </Button>
        )}
      </div>
    </div>
  );
}
