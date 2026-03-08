import { useNavigate } from 'react-router-dom';
import { Plus, FileText, ChevronRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate, calculateTotal } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function InvoiceList() {
  const navigate = useNavigate();
  const { invoices, clients, payments } = useStore();

  const sorted = [...invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="pb-24">
      <PageHeader
        title="Invoices"
        actions={<Button size="icon" className="tap-target" onClick={() => navigate('/invoices/new')}><Plus className="w-5 h-5" /></Button>}
      />
      <div className="px-4 max-w-lg mx-auto space-y-2 pt-4">
        {sorted.length === 0 ? (
          <EmptyState icon={FileText} title="No invoices" description="Generate an invoice from a completed job" />
        ) : sorted.map(inv => {
          const client = clients.find(c => c.id === inv.clientId);
          const total = calculateTotal(inv.lineItems, inv.taxRate);
          const paid = payments.filter(p => p.invoiceId === inv.id).reduce((s, p) => s + p.amount, 0);
          return (
            <button key={inv.id} onClick={() => navigate(`/invoices/${inv.id}`)} className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-3 tap-target text-left">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{client?.name || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">{formatDate(inv.createdAt)} · {formatCurrency(total - paid)} due</p>
              </div>
              <StatusBadge status={inv.status} />
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
