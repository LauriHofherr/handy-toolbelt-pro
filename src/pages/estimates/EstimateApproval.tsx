import { useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDate, calculateSubtotal, calculateTotal } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function EstimateApproval() {
  const { id } = useParams();
  const { estimates, clients, settings, updateEstimate } = useStore();
  const estimate = estimates.find(e => e.id === id);
  const client = estimate ? clients.find(c => c.id === estimate.clientId) : null;
  const [responded, setResponded] = useState(false);

  if (!estimate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Wrench className="w-12 h-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-display font-bold">Estimate Not Found</h1>
          <p className="text-sm text-muted-foreground">This estimate may have been removed or the link is invalid.</p>
        </div>
      </div>
    );
  }

  const subtotal = calculateSubtotal(estimate.lineItems);
  const total = calculateTotal(estimate.lineItems, estimate.taxRate);
  const alreadyResponded = estimate.status === 'accepted' || estimate.status === 'declined';

  const handleRespond = (action: 'accepted' | 'declined') => {
    updateEstimate({ ...estimate, status: action, updatedAt: new Date().toISOString() });
    setResponded(true);
    toast.success(action === 'accepted' ? 'Estimate accepted!' : 'Estimate declined.');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-lg mx-auto text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Wrench className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-lg text-primary">{settings.businessName}</span>
          </div>
          {settings.businessPhone && <p className="text-xs text-muted-foreground">{settings.businessPhone}</p>}
          {settings.businessEmail && <p className="text-xs text-muted-foreground">{settings.businessEmail}</p>}
        </div>
      </header>

      <div className="px-4 max-w-lg mx-auto py-6 space-y-4">
        {/* Title & Status */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Estimate</h1>
            {client && <p className="text-sm text-muted-foreground">Prepared for {client.name}</p>}
          </div>
          <StatusBadge status={estimate.status} />
        </div>

        <p className="text-xs text-muted-foreground">{formatDate(estimate.createdAt)}</p>

        {/* Line Items */}
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {estimate.lineItems.map(item => (
            <div key={item.id} className="p-4 flex justify-between">
              <div>
                <p className="text-sm font-medium">{item.description}</p>
                <p className="text-xs text-muted-foreground">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
              </div>
              <p className="text-sm font-semibold">{formatCurrency(item.quantity * item.unitPrice)}</p>
            </div>
          ))}
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span>Tax ({estimate.taxRate}%)</span><span>{formatCurrency(subtotal * estimate.taxRate / 100)}</span></div>
            <div className="flex justify-between text-xl font-display font-bold pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {estimate.notes && (
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Notes</p>
            <p className="text-sm">{estimate.notes}</p>
          </div>
        )}

        {estimate.terms && (
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Terms & Conditions</p>
            <p className="text-sm">{estimate.terms}</p>
          </div>
        )}

        {/* Action Buttons */}
        {alreadyResponded || responded ? (
          <div className="bg-card rounded-xl border border-border p-6 text-center space-y-2">
            {(estimate.status === 'accepted' || responded) && estimate.status === 'accepted' ? (
              <>
                <CheckCircle className="w-10 h-10 text-success mx-auto" />
                <p className="font-display font-bold text-lg">Estimate Accepted</p>
                <p className="text-sm text-muted-foreground">Thank you! We'll be in touch to schedule the work.</p>
              </>
            ) : (
              <>
                <XCircle className="w-10 h-10 text-destructive mx-auto" />
                <p className="font-display font-bold text-lg">Estimate Declined</p>
                <p className="text-sm text-muted-foreground">No worries. Feel free to reach out if you change your mind.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              className="tap-target text-base font-semibold border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => handleRespond('declined')}
            >
              <XCircle className="w-5 h-5 mr-1" /> Decline
            </Button>
            <Button
              className="tap-target text-base font-semibold"
              onClick={() => handleRespond('accepted')}
            >
              <CheckCircle className="w-5 h-5 mr-1" /> Accept
            </Button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          Powered by {settings.businessName}
        </p>
      </div>
    </div>
  );
}
