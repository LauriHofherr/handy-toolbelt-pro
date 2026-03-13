import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Phone, Mail, MapPin, Edit, Briefcase, FileText, DollarSign, Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { DeleteClientDialog } from '@/components/DeleteClientDialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clients, jobs, estimates, invoices, payments, deleteClient } = useStore();
  const client = clients.find(c => c.id === id);
  const [showDelete, setShowDelete] = useState(false);

  if (!client) return <div className="p-8 text-center text-muted-foreground">Client not found</div>;

  const clientJobs = jobs.filter(j => j.clientId === id);
  const clientEstimates = estimates.filter(e => e.clientId === id);
  const clientInvoices = invoices.filter(i => i.clientId === id);
  const clientPayments = payments.filter(p => clientInvoices.some(i => i.id === p.invoiceId));
  const totalPaid = clientPayments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="pb-24">
      <PageHeader
        title={client.name}
        back
        actions={
          <Button size="icon" variant="ghost" onClick={() => navigate(`/clients/${id}/edit`)}>
            <Edit className="w-5 h-5" />
          </Button>
        }
      />
      <div className="px-4 max-w-lg mx-auto space-y-6 pt-4">
        {/* Contact */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          {client.phone && (
            <a href={`tel:${client.phone}`} className="flex items-center gap-3 tap-target">
              <Phone className="w-4 h-4 text-primary" />
              <span className="text-sm">{client.phone}</span>
            </a>
          )}
          {client.email && (
            <a href={`mailto:${client.email}`} className="flex items-center gap-3 tap-target">
              <Mail className="w-4 h-4 text-primary" />
              <span className="text-sm">{client.email}</span>
            </a>
          )}
          {client.address && (
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm">{client.address}</span>
            </div>
          )}
        </div>

        {/* Revenue Summary */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Total Revenue</span>
          </div>
          <p className="text-2xl font-display font-bold text-primary">{formatCurrency(totalPaid)}</p>
        </div>

        {/* Jobs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-display font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Jobs ({clientJobs.length})
            </h2>
            <Button size="sm" variant="outline" onClick={() => navigate(`/jobs/new?clientId=${id}`)}>
              <Plus className="w-4 h-4 mr-1" /> New Job
            </Button>
          </div>
          {clientJobs.map(job => (
            <button key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="w-full bg-card rounded-lg p-3 border border-border flex items-center justify-between tap-target">
              <div className="text-left">
                <p className="text-sm font-medium truncate">{job.description}</p>
                <p className="text-xs text-muted-foreground">{formatDate(job.scheduledDate)}</p>
              </div>
              <StatusBadge status={job.status} />
            </button>
          ))}
        </div>

        {/* Estimates */}
        <div className="space-y-2">
          <h2 className="text-sm font-display font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" /> Estimates ({clientEstimates.length})
          </h2>
          {clientEstimates.map(est => (
            <button key={est.id} onClick={() => navigate(`/estimates/${est.id}`)} className="w-full bg-card rounded-lg p-3 border border-border flex items-center justify-between tap-target">
              <div className="text-left">
                <p className="text-sm font-medium">Estimate</p>
                <p className="text-xs text-muted-foreground">{formatDate(est.createdAt)}</p>
              </div>
              <StatusBadge status={est.status} />
            </button>
          ))}
        </div>

        {/* Invoices */}
        <div className="space-y-2">
          <h2 className="text-sm font-display font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" /> Invoices ({clientInvoices.length})
          </h2>
          {clientInvoices.map(inv => (
            <button key={inv.id} onClick={() => navigate(`/invoices/${inv.id}`)} className="w-full bg-card rounded-lg p-3 border border-border flex items-center justify-between tap-target">
              <div className="text-left">
                <p className="text-sm font-medium">Invoice</p>
                <p className="text-xs text-muted-foreground">{formatDate(inv.createdAt)}</p>
              </div>
              <StatusBadge status={inv.status} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
