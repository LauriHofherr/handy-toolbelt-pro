import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateId } from '@/lib/utils';
import type { JobStatus } from '@/types';
import { toast } from 'sonner';

export default function JobForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { clients, jobs, estimates, addJob, updateJob, updateEstimate, settings } = useStore();
  const existing = id && id !== 'new' ? jobs.find(j => j.id === id) : null;

  const preClientId = searchParams.get('clientId') || '';
  const preEstimateId = searchParams.get('estimateId') || '';
  const preEstimate = preEstimateId ? estimates.find(e => e.id === preEstimateId) : null;

  const [clientId, setClientId] = useState(existing?.clientId || preClientId);
  const [description, setDescription] = useState(existing?.description || (preEstimate ? `Job from estimate` : ''));
  const [scheduledDate, setScheduledDate] = useState(existing?.scheduledDate || new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<JobStatus>(existing?.status || 'scheduled');
  const [hourlyRate, setHourlyRate] = useState(existing?.hourlyRate ?? settings.defaultHourlyRate);

  const handleSave = () => {
    if (!clientId) { toast.error('Select a client'); return; }
    if (!description.trim()) { toast.error('Description is required'); return; }

    const job = {
      id: existing?.id || generateId(),
      clientId,
      estimateId: existing?.estimateId || preEstimateId || undefined,
      description: description.trim(),
      scheduledDate,
      status,
      hourlyRate,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      updateJob(job);
      toast.success('Job updated');
    } else {
      addJob(job);
      if (preEstimate) {
        updateEstimate({ ...preEstimate, status: 'accepted', updatedAt: new Date().toISOString() });
      }
      toast.success('Job created');
    }
    navigate(-1);
  };

  return (
    <div className="pb-24">
      <PageHeader title={existing ? 'Edit Job' : 'New Job'} back />
      <div className="px-4 max-w-lg mx-auto space-y-4 pt-4">
        <div className="space-y-2">
          <Label>Client *</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="tap-target"><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Description *</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Kitchen remodel, deck repair..." className="tap-target" rows={3} />
        </div>
        <div className="space-y-2">
          <Label>Scheduled Date</Label>
          <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="tap-target" />
        </div>
        <div className="space-y-2">
          <Label>Hourly Rate ($)</Label>
          <Input type="number" min={0} value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} className="tap-target" />
        </div>
        {existing && (
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as JobStatus)}>
              <SelectTrigger className="tap-target"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <Button onClick={handleSave} className="w-full tap-target text-base font-semibold">
          {existing ? 'Save Changes' : 'Create Job'}
        </Button>
      </div>
    </div>
  );
}
