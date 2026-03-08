import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { generateId } from '@/lib/utils';
import { toast } from 'sonner';

export default function ClientForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { clients, addClient, updateClient } = useStore();
  const existing = id ? clients.find(c => c.id === id) : null;

  const [name, setName] = useState(existing?.name || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [email, setEmail] = useState(existing?.email || '');
  const [address, setAddress] = useState(existing?.address || '');

  const handleSave = () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    const client = {
      id: existing?.id || generateId(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    if (existing) {
      updateClient(client);
      toast.success('Client updated');
    } else {
      addClient(client);
      toast.success('Client added');
    }
    navigate(-1);
  };

  return (
    <div className="pb-24">
      <PageHeader title={existing ? 'Edit Client' : 'New Client'} back />
      <div className="px-4 max-w-lg mx-auto space-y-4 pt-4">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" className="tap-target" />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" type="tel" className="tap-target" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" type="email" className="tap-target" />
        </div>
        <div className="space-y-2">
          <Label>Address</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" className="tap-target" />
        </div>
        <Button onClick={handleSave} className="w-full tap-target text-base font-semibold">
          {existing ? 'Save Changes' : 'Add Client'}
        </Button>
      </div>
    </div>
  );
}
