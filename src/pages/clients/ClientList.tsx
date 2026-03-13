import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Phone, ChevronRight, Users, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { DeleteClientDialog } from '@/components/DeleteClientDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ClientList() {
  const navigate = useNavigate();
  const { clients, estimates, jobs, invoices, deleteClient } = useStore();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; hasRecords: boolean } | null>(null);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="pb-24">
      <PageHeader
        title="Clients"
        actions={
          <Button size="icon" className="tap-target" onClick={() => navigate('/clients/new')}>
            <Plus className="w-5 h-5" />
          </Button>
        }
      />
      <div className="px-4 max-w-lg mx-auto space-y-3 pt-4">
        {clients.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 tap-target"
            />
          </div>
        )}

        {filtered.length === 0 && clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients yet"
            description="Add your first client to get started"
            actionLabel="Add Client"
            onAction={() => navigate('/clients/new')}
          />
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No results found</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((client) => (
              <button
                key={client.id}
                onClick={() => navigate(`/clients/${client.id}`)}
                className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-3 tap-target text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{client.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{client.name}</p>
                  {client.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {client.phone}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
