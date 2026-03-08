import { useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Wrench, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { generateId, formatCurrency } from '@/lib/utils';
import type { LaborItem, MaterialItem, EstimateStatus } from '@/types';
import { toast } from 'sonner';

export default function EstimateForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { clients, estimates, addEstimate, updateEstimate, settings, materialsLibrary } = useStore();
  const existing = id && id !== 'new' ? estimates.find(e => e.id === id) : null;

  const preClientId = searchParams.get('clientId') || '';

  const [clientId, setClientId] = useState(existing?.clientId || preClientId || '');
  const [scopeOfWork, setScopeOfWork] = useState(existing?.scopeOfWork || '');
  const [laborItems, setLaborItems] = useState<LaborItem[]>(
    existing?.laborItems || [{ id: generateId(), description: '', hours: 1, rate: settings.defaultHourlyRate }]
  );
  const [materialItems, setMaterialItems] = useState<MaterialItem[]>(
    existing?.materialItems || [{ id: generateId(), name: '', quantity: 1, unitCost: 0 }]
  );
  const [taxRate, setTaxRate] = useState(existing?.taxRate ?? settings.defaultTaxRate);
  const [materialMarkup, setMaterialMarkup] = useState(existing?.materialMarkup ?? settings.defaultMaterialMarkup);
  const [contingencyEnabled, setContingencyEnabled] = useState(existing?.contingencyEnabled ?? false);
  const [contingencyRate, setContingencyRate] = useState(existing?.contingencyRate ?? settings.defaultContingencyRate);
  const [notes, setNotes] = useState(existing?.notes || '');
  const [terms, setTerms] = useState(existing?.terms || settings.defaultPaymentTerms);
  const [status, setStatus] = useState<EstimateStatus>(existing?.status || 'draft');
  const [laborOpen, setLaborOpen] = useState(true);
  const [materialsOpen, setMaterialsOpen] = useState(true);

  // Autocomplete state
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number | null>(null);

  const laborSubtotal = useMemo(() => laborItems.reduce((s, i) => s + i.hours * i.rate, 0), [laborItems]);
  const materialsRaw = useMemo(() => materialItems.reduce((s, i) => s + i.quantity * i.unitCost, 0), [materialItems]);
  const materialsWithMarkup = materialsRaw * (1 + materialMarkup / 100);
  const subtotal = laborSubtotal + materialsWithMarkup;
  const contingencyAmount = contingencyEnabled ? subtotal * (contingencyRate / 100) : 0;
  const preTotal = subtotal + contingencyAmount;
  const taxAmount = preTotal * (taxRate / 100);
  const grandTotal = preTotal + taxAmount;

  // Labor helpers
  const addLaborItem = () => setLaborItems([...laborItems, { id: generateId(), description: '', hours: 1, rate: settings.defaultHourlyRate }]);
  const removeLaborItem = (itemId: string) => setLaborItems(laborItems.filter(i => i.id !== itemId));
  const updateLaborItem = (itemId: string, field: keyof LaborItem, value: string | number) =>
    setLaborItems(laborItems.map(i => i.id === itemId ? { ...i, [field]: value } : i));

  // Material helpers
  const addMaterialItem = () => setMaterialItems([...materialItems, { id: generateId(), name: '', quantity: 1, unitCost: 0 }]);
  const removeMaterialItem = (itemId: string) => setMaterialItems(materialItems.filter(i => i.id !== itemId));
  const updateMaterialItem = (itemId: string, field: keyof MaterialItem, value: string | number) => {
    setMaterialItems(materialItems.map(i => i.id === itemId ? { ...i, [field]: value } : i));
  };

  const getSuggestions = (query: string) => {
    if (!query.trim()) return [];
    return materialsLibrary.filter(m => m.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  };

  const selectSuggestion = (itemId: string, entry: typeof materialsLibrary[0]) => {
    setMaterialItems(materialItems.map(i => i.id === itemId ? { ...i, name: entry.name, unitCost: entry.lastUsedPrice } : i));
    setActiveSuggestionIdx(null);
  };

  const handleSave = () => {
    if (!clientId) { toast.error('Select a client'); return; }
    const validLabor = laborItems.filter(i => i.description.trim());
    const validMaterials = materialItems.filter(i => i.name.trim());
    if (validLabor.length === 0 && validMaterials.length === 0) {
      toast.error('Add at least one labor or material item');
      return;
    }

    // Build legacy lineItems for backward compat
    const lineItems = [
      ...validLabor.map(l => ({ id: l.id, description: `Labor: ${l.description}`, quantity: l.hours, unitPrice: l.rate })),
      ...validMaterials.map(m => ({ id: m.id, description: m.name, quantity: m.quantity, unitPrice: m.unitCost * (1 + materialMarkup / 100) })),
    ];

    const estimate = {
      id: existing?.id || generateId(),
      clientId,
      lineItems,
      laborItems: validLabor,
      materialItems: validMaterials,
      scopeOfWork,
      taxRate,
      materialMarkup,
      contingencyEnabled,
      contingencyRate,
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
        {/* Client */}
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

        {/* Scope of Work */}
        <div className="space-y-2">
          <Label>Scope of Work</Label>
          <Textarea value={scopeOfWork} onChange={(e) => setScopeOfWork(e.target.value)} placeholder="Describe the project scope..." rows={3} />
        </div>

        {/* LABOR SECTION */}
        <Collapsible open={laborOpen} onOpenChange={setLaborOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full bg-card rounded-lg border border-border p-3 tap-target">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" />
                <span className="font-display font-bold text-sm">Labor</span>
                <span className="text-xs text-muted-foreground">({formatCurrency(laborSubtotal)})</span>
              </div>
              {laborOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {laborItems.map((item, idx) => (
              <div key={item.id} className="bg-card rounded-lg p-3 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Labor #{idx + 1}</span>
                  {laborItems.length > 1 && (
                    <button onClick={() => removeLaborItem(item.id)} className="tap-target p-1"><Trash2 className="w-4 h-4 text-destructive" /></button>
                  )}
                </div>
                <Input placeholder="e.g. Demo, Install, Paint" value={item.description} onChange={(e) => updateLaborItem(item.id, 'description', e.target.value)} className="tap-target" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Hours</span>
                    <Input type="number" min={0.25} step={0.25} value={item.hours} onChange={(e) => updateLaborItem(item.id, 'hours', Number(e.target.value))} className="tap-target" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">$/hr</span>
                    <Input type="number" min={0} value={item.rate} onChange={(e) => updateLaborItem(item.id, 'rate', Number(e.target.value))} className="tap-target" />
                  </div>
                </div>
                <p className="text-right text-sm font-semibold">{formatCurrency(item.hours * item.rate)}</p>
              </div>
            ))}
            <Button variant="secondary" className="w-full tap-target" onClick={addLaborItem}><Plus className="w-4 h-4 mr-1" /> Add Labor</Button>
          </CollapsibleContent>
        </Collapsible>

        {/* MATERIALS SECTION */}
        <Collapsible open={materialsOpen} onOpenChange={setMaterialsOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full bg-card rounded-lg border border-border p-3 tap-target">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <span className="font-display font-bold text-sm">Materials</span>
                <span className="text-xs text-muted-foreground">({formatCurrency(materialsRaw)})</span>
              </div>
              {materialsOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {materialItems.map((item, idx) => {
              const suggestions = activeSuggestionIdx === idx ? getSuggestions(item.name) : [];
              return (
                <div key={item.id} className="bg-card rounded-lg p-3 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Material #{idx + 1}</span>
                    {materialItems.length > 1 && (
                      <button onClick={() => removeMaterialItem(item.id)} className="tap-target p-1"><Trash2 className="w-4 h-4 text-destructive" /></button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => {
                        updateMaterialItem(item.id, 'name', e.target.value);
                        setActiveSuggestionIdx(idx);
                      }}
                      onFocus={() => setActiveSuggestionIdx(idx)}
                      onBlur={() => setTimeout(() => setActiveSuggestionIdx(null), 200)}
                      className="tap-target"
                    />
                    {suggestions.length > 0 && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                        {suggestions.map(s => (
                          <button
                            key={s.id}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent/20 flex justify-between"
                            onMouseDown={() => selectSuggestion(item.id, s)}
                          >
                            <span>{s.name}</span>
                            <span className="text-muted-foreground">{formatCurrency(s.lastUsedPrice)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Qty</span>
                      <Input type="number" min={1} value={item.quantity} onChange={(e) => updateMaterialItem(item.id, 'quantity', Number(e.target.value))} className="tap-target" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Unit Cost</span>
                      <Input type="number" min={0} step={0.01} value={item.unitCost} onChange={(e) => updateMaterialItem(item.id, 'unitCost', Number(e.target.value))} className="tap-target" />
                    </div>
                  </div>
                  <p className="text-right text-sm font-semibold">{formatCurrency(item.quantity * item.unitCost)}</p>
                </div>
              );
            })}
            <Button variant="secondary" className="w-full tap-target" onClick={addMaterialItem}><Plus className="w-4 h-4 mr-1" /> Add Material</Button>
          </CollapsibleContent>
        </Collapsible>

        {/* ESTIMATE SUMMARY */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-2">
          <h3 className="font-display font-bold text-sm mb-2">Estimate Summary</h3>
          <div className="flex justify-between text-sm"><span>Labor Subtotal</span><span>{formatCurrency(laborSubtotal)}</span></div>
          <div className="flex justify-between text-sm"><span>Materials Subtotal</span><span>{formatCurrency(materialsRaw)}</span></div>
          {materialMarkup > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground"><span>Materials Markup ({materialMarkup}%)</span><span>+{formatCurrency(materialsRaw * materialMarkup / 100)}</span></div>
          )}
          {contingencyEnabled && (
            <div className="flex justify-between text-sm text-muted-foreground"><span>Project Contingency ({contingencyRate}%)</span><span>+{formatCurrency(contingencyAmount)}</span></div>
          )}
          <div className="flex justify-between text-sm"><span>Tax ({taxRate}%)</span><span>{formatCurrency(taxAmount)}</span></div>
          <div className="flex justify-between text-lg font-display font-bold border-t border-border pt-2">
            <span>Grand Total</span><span className="text-primary">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {/* Configurable rates */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Tax Rate (%)</Label>
            <Input type="number" min={0} step={0.1} value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} className="tap-target" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Material Markup (%)</Label>
            <Input type="number" min={0} step={1} value={materialMarkup} onChange={(e) => setMaterialMarkup(Number(e.target.value))} className="tap-target" />
          </div>
        </div>

        {/* Contingency toggle */}
        <div className="flex items-center justify-between bg-card rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">Project Contingency</p>
            <p className="text-xs text-muted-foreground">Buffer for unknowns</p>
          </div>
          <div className="flex items-center gap-2">
            {contingencyEnabled && (
              <Input
                type="number" min={1} max={50} value={contingencyRate}
                onChange={(e) => setContingencyRate(Number(e.target.value))}
                className="w-16 h-8 text-xs text-right"
              />
            )}
            {contingencyEnabled && <span className="text-xs text-muted-foreground">%</span>}
            <Switch checked={contingencyEnabled} onCheckedChange={setContingencyEnabled} />
          </div>
        </div>

        {/* Notes / Terms */}
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes for the client..." rows={3} />
        </div>
        <div className="space-y-2">
          <Label>Payment Terms</Label>
          <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Payment terms, warranty..." rows={3} />
        </div>

        <Button onClick={handleSave} className="w-full tap-target text-base font-semibold">
          {existing ? 'Save Changes' : 'Create Estimate'}
        </Button>
      </div>
    </div>
  );
}
