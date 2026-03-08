import { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Trash2, Package, Edit2, Check, X, ChevronDown, Upload, Download, AlertTriangle, Search, GripVertical, Building2, DollarSign, CreditCard, FileText, Bell, Database } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatCurrency, generateId } from '@/lib/utils';
import { toast } from 'sonner';
import type { AppSettings } from '@/types';

/* ─── Accordion Section Wrapper ─── */
function Section({
  id, title, icon: Icon, open, onToggle, dirty, children, alwaysOpen,
}: {
  id: string; title: string; icon: React.ElementType; open: boolean;
  onToggle: () => void; dirty?: boolean; children: React.ReactNode; alwaysOpen?: boolean;
}) {
  if (alwaysOpen) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 bg-secondary/40">
          <Icon className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold text-sm flex-1">{title}</h2>
        </div>
        <div className="px-4 py-4">{children}</div>
      </div>
    );
  }
  return (
    <Collapsible open={open} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center gap-3 w-full rounded-xl border border-border bg-card px-4 py-3 tap-target text-left transition-colors hover:bg-secondary/30">
        <Icon className="w-5 h-5 text-primary" />
        <span className="font-display font-bold text-sm flex-1">{title}</span>
        {dirty && <span className="w-2 h-2 rounded-full bg-warning shrink-0" />}
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="rounded-b-xl border border-t-0 border-border bg-card px-4 py-4 -mt-2 pt-6">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ─── Main ─── */
export default function Settings() {
  const store = useStore();
  const { settings, updateSettings, materialsLibrary, addMaterial, updateMaterial, deleteMaterial } = store;

  // First-launch banner
  const [showWelcome, setShowWelcome] = useState(() => !settings.businessName || settings.businessName === 'HandyMan Pro');

  // Accordion: only one open
  const [openSection, setOpenSection] = useState<string>(showWelcome ? 'business' : '');
  const toggle = (id: string) => setOpenSection(prev => (prev === id ? '' : id));

  /* ═══ SECTION 1: Business Profile ═══ */
  const [bp, setBp] = useState({
    businessName: settings.businessName,
    ownerName: settings.ownerName,
    businessPhone: settings.businessPhone,
    businessEmail: settings.businessEmail,
    businessAddress: settings.businessAddress,
    licenseNumber: settings.licenseNumber,
    businessLogo: settings.businessLogo,
  });
  const bpDirty = useMemo(() =>
    bp.businessName !== settings.businessName || bp.ownerName !== settings.ownerName ||
    bp.businessPhone !== settings.businessPhone || bp.businessEmail !== settings.businessEmail ||
    bp.businessAddress !== settings.businessAddress || bp.licenseNumber !== settings.licenseNumber ||
    bp.businessLogo !== settings.businessLogo,
    [bp, settings]);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2 MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setBp(p => ({ ...p, businessLogo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  /* ═══ SECTION 2: Financials ═══ */
  const [fin, setFin] = useState({
    defaultHourlyRate: settings.defaultHourlyRate,
    overtimeRate: settings.overtimeRate,
    defaultMaterialMarkup: settings.defaultMaterialMarkup,
    defaultTaxRate: settings.defaultTaxRate,
    defaultContingencyRate: settings.defaultContingencyRate,
    estimateValidityDays: settings.estimateValidityDays,
  });
  const finDirty = useMemo(() =>
    Object.keys(fin).some(k => (fin as any)[k] !== (settings as any)[k]), [fin, settings]);

  /* ═══ SECTION 3: Payment ═══ */
  const [pay, setPay] = useState({
    paymentMethodOrder: [...settings.paymentMethodOrder],
    zelleContact: settings.zelleContact,
    venmoHandle: settings.venmoHandle,
    defaultPaymentDueTerms: settings.defaultPaymentDueTerms,
    paymentInstructions: settings.paymentInstructions,
  });
  const payDirty = useMemo(() =>
    pay.zelleContact !== settings.zelleContact || pay.venmoHandle !== settings.venmoHandle ||
    pay.defaultPaymentDueTerms !== settings.defaultPaymentDueTerms ||
    pay.paymentInstructions !== settings.paymentInstructions ||
    JSON.stringify(pay.paymentMethodOrder) !== JSON.stringify(settings.paymentMethodOrder),
    [pay, settings]);

  const movePayMethod = (idx: number, dir: -1 | 1) => {
    const arr = [...pay.paymentMethodOrder];
    const ni = idx + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
    setPay(p => ({ ...p, paymentMethodOrder: arr }));
  };

  /* ═══ SECTION 4: Document Defaults ═══ */
  const [doc, setDoc] = useState({
    estimateBoilerplate: settings.estimateBoilerplate,
    invoiceBoilerplate: settings.invoiceBoilerplate,
    termsAndConditions: settings.termsAndConditions,
    showSignatureLine: settings.showSignatureLine,
    fromName: settings.fromName,
  });
  const docDirty = useMemo(() =>
    doc.estimateBoilerplate !== settings.estimateBoilerplate ||
    doc.invoiceBoilerplate !== settings.invoiceBoilerplate ||
    doc.termsAndConditions !== settings.termsAndConditions ||
    doc.showSignatureLine !== settings.showSignatureLine ||
    doc.fromName !== settings.fromName,
    [doc, settings]);

  /* ═══ SECTION 5: Notifications ═══ */
  const [notif, setNotif] = useState({
    reminderSchedule: [...settings.reminderSchedule],
    overdueBadgeThreshold: settings.overdueBadgeThreshold,
    reminderMessageTemplate: settings.reminderMessageTemplate,
  });
  const notifDirty = useMemo(() =>
    JSON.stringify(notif.reminderSchedule) !== JSON.stringify(settings.reminderSchedule) ||
    notif.overdueBadgeThreshold !== settings.overdueBadgeThreshold ||
    notif.reminderMessageTemplate !== settings.reminderMessageTemplate,
    [notif, settings]);

  const toggleReminder = (val: string) =>
    setNotif(p => ({
      ...p,
      reminderSchedule: p.reminderSchedule.includes(val)
        ? p.reminderSchedule.filter(v => v !== val)
        : [...p.reminderSchedule, val],
    }));

  /* ═══ SECTION 6: Materials Library ═══ */
  const [matSearch, setMatSearch] = useState('');
  const [newMatName, setNewMatName] = useState('');
  const [newMatPrice, setNewMatPrice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);

  const filteredMats = useMemo(() => {
    if (!matSearch) return materialsLibrary;
    const q = matSearch.toLowerCase();
    return materialsLibrary.filter(m => m.name.toLowerCase().includes(q));
  }, [materialsLibrary, matSearch]);

  /* ═══ SECTION 7: Data & Backup ═══ */
  const [confirmDelete, setConfirmDelete] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  /* ─── Save helpers ─── */
  const save = (partial: Partial<AppSettings>) => {
    updateSettings(partial);
    toast.success('Saved!');
  };

  const handleExportJSON = () => {
    const data = JSON.stringify(useStore.getState(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `handyman-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Backup downloaded');
  };

  const handleExportCSV = () => {
    const { invoices, payments, clients } = useStore.getState();
    const rows = [['Invoice ID', 'Client', 'Status', 'Created', 'Due Date', 'Payments Total']];
    invoices.forEach(inv => {
      const client = clients.find(c => c.id === inv.clientId);
      const paid = payments.filter(p => p.invoiceId === inv.id).reduce((s, p) => s + p.amount, 0);
      rows.push([inv.id.slice(0, 8), client?.name || '', inv.status, inv.createdAt.slice(0, 10), inv.dueDate.slice(0, 10), paid.toFixed(2)]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `financials-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data.state) {
          // zustand persist wrapper
          const s = data.state;
          if (s.clients) useStore.setState({ clients: s.clients });
          if (s.estimates) useStore.setState({ estimates: s.estimates });
          if (s.jobs) useStore.setState({ jobs: s.jobs });
          if (s.invoices) useStore.setState({ invoices: s.invoices });
          if (s.payments) useStore.setState({ payments: s.payments });
          if (s.timeEntries) useStore.setState({ timeEntries: s.timeEntries });
          if (s.expenses) useStore.setState({ expenses: s.expenses });
          if (s.settings) useStore.setState({ settings: s.settings });
          if (s.materialsLibrary) useStore.setState({ materialsLibrary: s.materialsLibrary });
        } else {
          // raw state
          useStore.setState(data);
        }
        toast.success('Data imported successfully');
      } catch {
        toast.error('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (confirmDelete !== 'DELETE') { toast.error('Type DELETE to confirm'); return; }
    localStorage.removeItem('handyman-pro-storage');
    window.location.reload();
  };

  /* ─── Materials helpers ─── */
  const handleAddMaterial = () => {
    if (!newMatName.trim()) return;
    addMaterial({ id: generateId(), name: newMatName.trim(), lastUsedPrice: Number(newMatPrice) || 0, updatedAt: new Date().toISOString() });
    setNewMatName(''); setNewMatPrice('');
    toast.success('Material added');
  };

  const handleBulkAdd = () => {
    const lines = bulkText.split('\n').filter(l => l.trim());
    let count = 0;
    lines.forEach(line => {
      const parts = line.split(',').map(s => s.trim());
      if (parts[0]) {
        const price = Number(parts[1]?.replace('$', '')) || 0;
        addMaterial({ id: generateId(), name: parts[0], lastUsedPrice: price, updatedAt: new Date().toISOString() });
        count++;
      }
    });
    setBulkText(''); setShowBulk(false);
    toast.success(`${count} materials added`);
  };

  const startEdit = (m: typeof materialsLibrary[0]) => {
    setEditingId(m.id); setEditName(m.name); setEditPrice(String(m.lastUsedPrice));
  };

  const saveEdit = () => {
    if (!editingId) return;
    const mat = materialsLibrary.find(m => m.id === editingId);
    if (mat) updateMaterial({ ...mat, name: editName, lastUsedPrice: Number(editPrice) || 0, updatedAt: new Date().toISOString() });
    setEditingId(null);
    toast.success('Material updated');
  };

  /* ─── Render ─── */
  return (
    <div className="pb-24">
      <PageHeader title="Settings" />
      <div className="px-4 max-w-lg mx-auto space-y-3 pt-4">

        {/* Welcome banner */}
        {showWelcome && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 flex items-start gap-3">
            <Building2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Welcome! Fill in your business details to get started.</p>
              <p className="text-xs text-muted-foreground mt-0.5">Your info will appear on every estimate and invoice you generate.</p>
            </div>
            <button onClick={() => setShowWelcome(false)} className="p-1 text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* ── S1: Business Profile ── */}
        <Section id="business" title="Business Profile" icon={Building2} open={openSection === 'business'} onToggle={() => toggle('business')} dirty={bpDirty}>
          <div className="space-y-3">
            {bp.businessLogo && (
              <img src={bp.businessLogo} alt="Logo" className="w-[120px] h-auto rounded-lg border border-border" />
            )}
            <div>
              <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} className="gap-2">
                <Upload className="w-4 h-4" /> {bp.businessLogo ? 'Change Logo' : 'Upload Logo'}
              </Button>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              {bp.businessLogo && (
                <Button variant="ghost" size="sm" className="ml-2 text-destructive" onClick={() => setBp(p => ({ ...p, businessLogo: '' }))}>Remove</Button>
              )}
            </div>
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input value={bp.businessName} onChange={e => setBp(p => ({ ...p, businessName: e.target.value }))} className="tap-target" />
            </div>
            <div className="space-y-2">
              <Label>Owner Name</Label>
              <Input value={bp.ownerName} onChange={e => setBp(p => ({ ...p, ownerName: e.target.value }))} className="tap-target" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input type="tel" value={bp.businessPhone} onChange={e => setBp(p => ({ ...p, businessPhone: e.target.value }))} className="tap-target" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={bp.businessEmail} onChange={e => setBp(p => ({ ...p, businessEmail: e.target.value }))} className="tap-target" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea value={bp.businessAddress} onChange={e => setBp(p => ({ ...p, businessAddress: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>License # (optional)</Label>
              <Input value={bp.licenseNumber} onChange={e => setBp(p => ({ ...p, licenseNumber: e.target.value }))} className="tap-target" />
            </div>
            <Button onClick={() => { save(bp); }} className="w-full tap-target font-semibold">Save Business Profile</Button>
          </div>
        </Section>

        {/* ── S2: Financials ── */}
        <Section id="financials" title="Financials & Rates" icon={DollarSign} open={openSection === 'financials'} onToggle={() => toggle('financials')} dirty={finDirty}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Hourly Rate ($)</Label>
                <Input type="number" value={fin.defaultHourlyRate} onChange={e => setFin(p => ({ ...p, defaultHourlyRate: Number(e.target.value) }))} className="tap-target" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Overtime Rate ($)</Label>
                <Input type="number" value={fin.overtimeRate} onChange={e => setFin(p => ({ ...p, overtimeRate: Number(e.target.value) }))} className="tap-target" placeholder="Optional" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Materials Markup (%)</Label>
                <Input type="number" value={fin.defaultMaterialMarkup} onChange={e => setFin(p => ({ ...p, defaultMaterialMarkup: Number(e.target.value) }))} className="tap-target" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tax Rate (%)</Label>
                <Input type="number" value={fin.defaultTaxRate} onChange={e => setFin(p => ({ ...p, defaultTaxRate: Number(e.target.value) }))} className="tap-target" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Contingency (%)</Label>
                <Input type="number" value={fin.defaultContingencyRate} onChange={e => setFin(p => ({ ...p, defaultContingencyRate: Number(e.target.value) }))} className="tap-target" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Estimate Validity (days)</Label>
                <Input type="number" value={fin.estimateValidityDays} onChange={e => setFin(p => ({ ...p, estimateValidityDays: Number(e.target.value) }))} className="tap-target" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">These are defaults — you can override them on any individual estimate or invoice.</p>
            <Button onClick={() => save(fin)} className="w-full tap-target font-semibold">Save Financials</Button>
          </div>
        </Section>

        {/* ── S3: Payment ── */}
        <Section id="payment" title="Payment Settings" icon={CreditCard} open={openSection === 'payment'} onToggle={() => toggle('payment')} dirty={payDirty}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Preferred Payment Methods (drag to reorder)</Label>
              <div className="space-y-1">
                {pay.paymentMethodOrder.map((method, idx) => (
                  <div key={method} className="flex items-center gap-2 bg-secondary/40 rounded-lg px-3 py-2">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => movePayMethod(idx, -1)} disabled={idx === 0} className="text-muted-foreground disabled:opacity-20"><ChevronDown className="w-3 h-3 rotate-180" /></button>
                      <button onClick={() => movePayMethod(idx, 1)} disabled={idx === pay.paymentMethodOrder.length - 1} className="text-muted-foreground disabled:opacity-20"><ChevronDown className="w-3 h-3" /></button>
                    </div>
                    <span className="text-sm font-medium capitalize flex-1">{method}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Zelle Contact (email or phone)</Label>
              <Input value={pay.zelleContact} onChange={e => setPay(p => ({ ...p, zelleContact: e.target.value }))} className="tap-target" />
            </div>
            <div className="space-y-2">
              <Label>Venmo Handle</Label>
              <Input value={pay.venmoHandle} onChange={e => setPay(p => ({ ...p, venmoHandle: e.target.value }))} placeholder="@yourhandle" className="tap-target" />
            </div>
            <div className="space-y-2">
              <Label>Default Payment Due Terms</Label>
              <Select value={pay.defaultPaymentDueTerms} onValueChange={v => setPay(p => ({ ...p, defaultPaymentDueTerms: v }))}>
                <SelectTrigger className="tap-target"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="due-on-receipt">Due on Receipt</SelectItem>
                  <SelectItem value="net-7">Net 7</SelectItem>
                  <SelectItem value="net-15">Net 15</SelectItem>
                  <SelectItem value="net-30">Net 30</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Instructions</Label>
              <Textarea value={pay.paymentInstructions} onChange={e => setPay(p => ({ ...p, paymentInstructions: e.target.value }))} rows={3} placeholder="Shown at the bottom of every invoice" />
            </div>
            <Button onClick={() => save(pay)} className="w-full tap-target font-semibold">Save Payment Settings</Button>
          </div>
        </Section>

        {/* ── S4: Document Defaults ── */}
        <Section id="documents" title="Document Defaults" icon={FileText} open={openSection === 'documents'} onToggle={() => toggle('documents')} dirty={docDirty}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Estimate Boilerplate</Label>
              <Textarea value={doc.estimateBoilerplate} onChange={e => setDoc(p => ({ ...p, estimateBoilerplate: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Invoice Boilerplate</Label>
              <Textarea value={doc.invoiceBoilerplate} onChange={e => setDoc(p => ({ ...p, invoiceBoilerplate: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Terms & Conditions</Label>
              <Textarea value={doc.termsAndConditions} onChange={e => setDoc(p => ({ ...p, termsAndConditions: e.target.value }))} rows={5} placeholder="Legal block shown at the bottom of proposal PDFs" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Signature Line on Estimates</Label>
              <Switch checked={doc.showSignatureLine} onCheckedChange={v => setDoc(p => ({ ...p, showSignatureLine: v }))} />
            </div>
            <div className="space-y-2">
              <Label>"From" Name on Documents</Label>
              <Input value={doc.fromName} onChange={e => setDoc(p => ({ ...p, fromName: e.target.value }))} placeholder={settings.businessName || 'Defaults to Business Name'} className="tap-target" />
            </div>
            <Button onClick={() => save(doc)} className="w-full tap-target font-semibold">Save Document Defaults</Button>
          </div>
        </Section>

        {/* ── S5: Notifications ── */}
        <Section id="notifications" title="Notifications & Reminders" icon={Bell} open={openSection === 'notifications'} onToggle={() => toggle('notifications')} dirty={notifDirty}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Invoice Reminder Schedule</Label>
              {[
                { val: '3-before', label: '3 days before due date' },
                { val: 'on-due', label: 'On the due date' },
                { val: '3-after', label: '3 days after due date' },
                { val: '7-after', label: '7 days after due date' },
              ].map(opt => (
                <label key={opt.val} className="flex items-center gap-3 tap-target cursor-pointer">
                  <Checkbox
                    checked={notif.reminderSchedule.includes(opt.val)}
                    onCheckedChange={() => toggleReminder(opt.val)}
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Overdue Badge Threshold (days)</Label>
              <Input type="number" value={notif.overdueBadgeThreshold} onChange={e => setNotif(p => ({ ...p, overdueBadgeThreshold: Number(e.target.value) }))} className="tap-target w-24" />
            </div>
            <div className="space-y-2">
              <Label>Reminder Message Template</Label>
              <Textarea value={notif.reminderMessageTemplate} onChange={e => setNotif(p => ({ ...p, reminderMessageTemplate: e.target.value }))} rows={3} />
              <p className="text-xs text-muted-foreground">Use [Client Name], [Invoice #], [Amount], [Date] as placeholders.</p>
            </div>
            <Button onClick={() => save(notif)} className="w-full tap-target font-semibold">Save Notifications</Button>
          </div>
        </Section>

        {/* ── S6: Materials Library (always open) ── */}
        <Section id="materials" title={`My Materials (${materialsLibrary.length})`} icon={Package} open alwaysOpen onToggle={() => {}}>
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={matSearch} onChange={e => setMatSearch(e.target.value)} placeholder="Search materials…" className="pl-9 tap-target" />
            </div>

            {/* Add single */}
            <div className="flex gap-2">
              <Input placeholder="Material name" value={newMatName} onChange={e => setNewMatName(e.target.value)} className="flex-1 tap-target" />
              <Input placeholder="Price" type="number" value={newMatPrice} onChange={e => setNewMatPrice(e.target.value)} className="w-24 tap-target" />
              <Button size="icon" onClick={handleAddMaterial} className="tap-target shrink-0"><Plus className="w-4 h-4" /></Button>
            </div>

            {/* Bulk toggle */}
            <Button variant="ghost" size="sm" onClick={() => setShowBulk(!showBulk)} className="text-xs">
              {showBulk ? 'Cancel bulk add' : 'Bulk add materials'}
            </Button>
            {showBulk && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">One per line: Item Name, $Price</p>
                <Textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={5} placeholder={"2x4 Lumber, $5.99\nDrywall Sheet, $12.50\nPaint Gallon, $35.00"} />
                <Button variant="secondary" onClick={handleBulkAdd} className="w-full tap-target">Add All</Button>
              </div>
            )}

            {/* List */}
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {filteredMats.map(m => (
                <div key={m.id} className="flex items-center justify-between bg-secondary/30 rounded-lg border border-border px-3 py-2">
                  {editingId === m.id ? (
                    <>
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 h-8 text-sm mr-2" />
                      <Input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-20 h-8 text-sm mr-2" />
                      <button onClick={saveEdit} className="p-1"><Check className="w-4 h-4 text-green-500" /></button>
                      <button onClick={() => setEditingId(null)} className="p-1"><X className="w-4 h-4 text-muted-foreground" /></button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">{m.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{formatCurrency(m.lastUsedPrice)}</span>
                        <button onClick={() => startEdit(m)} className="p-1"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        <button onClick={() => { deleteMaterial(m.id); toast.success('Deleted'); }} className="p-1"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {materialsLibrary.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No materials saved yet. They auto-save when you create estimates.</p>
              )}
              {materialsLibrary.length > 0 && filteredMats.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No materials match your search.</p>
              )}
            </div>
          </div>
        </Section>

        {/* ── S7: Data & Backup (always open) ── */}
        <Section id="data" title="Data & Backup" icon={Database} open alwaysOpen onToggle={() => {}}>
          <div className="space-y-3">
            <Button variant="outline" onClick={handleExportJSON} className="w-full tap-target gap-2">
              <Download className="w-4 h-4" /> Export All Data (JSON)
            </Button>
            <Button variant="outline" onClick={handleExportCSV} className="w-full tap-target gap-2">
              <Download className="w-4 h-4" /> Export Financial Summary (CSV)
            </Button>
            <Button variant="outline" onClick={() => importRef.current?.click()} className="w-full tap-target gap-2">
              <Upload className="w-4 h-4" /> Import Data from Backup
            </Button>
            <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportJSON} />

            <div className="border-t border-border pt-3 mt-3 space-y-2">
              <p className="text-xs text-destructive font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Danger Zone
              </p>
              <p className="text-xs text-muted-foreground">Type <strong>DELETE</strong> to confirm. This cannot be undone.</p>
              <div className="flex gap-2">
                <Input value={confirmDelete} onChange={e => setConfirmDelete(e.target.value)} placeholder='Type "DELETE"' className="flex-1 tap-target" />
                <Button variant="destructive" onClick={handleClearAll} disabled={confirmDelete !== 'DELETE'} className="tap-target">
                  Clear All Data
                </Button>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
