import { useState } from 'react';
import { Plus, Trash2, Package, Edit2, Check, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatCurrency, generateId } from '@/lib/utils';
import { toast } from 'sonner';

export default function Settings() {
  const { settings, updateSettings, materialsLibrary, addMaterial, updateMaterial, deleteMaterial } = useStore();

  const [businessName, setBusinessName] = useState(settings.businessName);
  const [businessPhone, setBusinessPhone] = useState(settings.businessPhone);
  const [businessEmail, setBusinessEmail] = useState(settings.businessEmail);
  const [businessAddress, setBusinessAddress] = useState(settings.businessAddress);
  const [defaultHourlyRate, setDefaultHourlyRate] = useState(settings.defaultHourlyRate);
  const [defaultTaxRate, setDefaultTaxRate] = useState(settings.defaultTaxRate);
  const [defaultMaterialMarkup, setDefaultMaterialMarkup] = useState(settings.defaultMaterialMarkup);
  const [defaultContingencyRate, setDefaultContingencyRate] = useState(settings.defaultContingencyRate);
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState(settings.defaultPaymentTerms);
  const [estimateValidityDays, setEstimateValidityDays] = useState(settings.estimateValidityDays);

  // Materials library
  const [newMatName, setNewMatName] = useState('');
  const [newMatPrice, setNewMatPrice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // Bulk add
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);

  const handleSaveSettings = () => {
    updateSettings({
      businessName, businessPhone, businessEmail, businessAddress,
      defaultHourlyRate, defaultTaxRate, defaultMaterialMarkup,
      defaultContingencyRate, defaultPaymentTerms, estimateValidityDays,
    });
    toast.success('Settings saved');
  };

  const handleAddMaterial = () => {
    if (!newMatName.trim()) return;
    addMaterial({ id: generateId(), name: newMatName.trim(), lastUsedPrice: Number(newMatPrice) || 0, updatedAt: new Date().toISOString() });
    setNewMatName('');
    setNewMatPrice('');
    toast.success('Material added');
  };

  const handleBulkAdd = () => {
    const lines = bulkText.split('\n').filter(l => l.trim());
    let count = 0;
    lines.forEach(line => {
      const parts = line.split(',').map(s => s.trim());
      if (parts[0]) {
        addMaterial({ id: generateId(), name: parts[0], lastUsedPrice: Number(parts[1]) || 0, updatedAt: new Date().toISOString() });
        count++;
      }
    });
    setBulkText('');
    setShowBulk(false);
    toast.success(`${count} materials added`);
  };

  const startEdit = (m: typeof materialsLibrary[0]) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditPrice(String(m.lastUsedPrice));
  };

  const saveEdit = () => {
    if (!editingId) return;
    const mat = materialsLibrary.find(m => m.id === editingId);
    if (mat) {
      updateMaterial({ ...mat, name: editName, lastUsedPrice: Number(editPrice) || 0, updatedAt: new Date().toISOString() });
    }
    setEditingId(null);
    toast.success('Material updated');
  };

  return (
    <div className="pb-24">
      <PageHeader title="Settings" back />
      <div className="px-4 max-w-lg mx-auto space-y-6 pt-4">
        {/* Business Info */}
        <div className="space-y-3">
          <h2 className="font-display font-bold text-base">Business Info</h2>
          <div className="space-y-2">
            <Label>Business Name</Label>
            <Input value={businessName} onChange={e => setBusinessName(e.target.value)} className="tap-target" />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={businessPhone} onChange={e => setBusinessPhone(e.target.value)} className="tap-target" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={businessEmail} onChange={e => setBusinessEmail(e.target.value)} className="tap-target" />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} className="tap-target" />
          </div>
        </div>

        {/* Defaults */}
        <div className="space-y-3">
          <h2 className="font-display font-bold text-base">Defaults</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Hourly Rate ($)</Label>
              <Input type="number" value={defaultHourlyRate} onChange={e => setDefaultHourlyRate(Number(e.target.value))} className="tap-target" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tax Rate (%)</Label>
              <Input type="number" value={defaultTaxRate} onChange={e => setDefaultTaxRate(Number(e.target.value))} className="tap-target" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Material Markup (%)</Label>
              <Input type="number" value={defaultMaterialMarkup} onChange={e => setDefaultMaterialMarkup(Number(e.target.value))} className="tap-target" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Contingency (%)</Label>
              <Input type="number" value={defaultContingencyRate} onChange={e => setDefaultContingencyRate(Number(e.target.value))} className="tap-target" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Estimate Validity (days)</Label>
              <Input type="number" value={estimateValidityDays} onChange={e => setEstimateValidityDays(Number(e.target.value))} className="tap-target" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Default Payment Terms</Label>
            <textarea
              value={defaultPaymentTerms}
              onChange={e => setDefaultPaymentTerms(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div>

        <Button onClick={handleSaveSettings} className="w-full tap-target text-base font-semibold">
          Save Settings
        </Button>

        {/* Materials Library */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> My Materials
            </h2>
            <span className="text-xs text-muted-foreground">{materialsLibrary.length} items</span>
          </div>

          {/* Add single */}
          <div className="flex gap-2">
            <Input placeholder="Material name" value={newMatName} onChange={e => setNewMatName(e.target.value)} className="flex-1 tap-target" />
            <Input placeholder="Price" type="number" value={newMatPrice} onChange={e => setNewMatPrice(e.target.value)} className="w-24 tap-target" />
            <Button size="icon" onClick={handleAddMaterial} className="tap-target shrink-0"><Plus className="w-4 h-4" /></Button>
          </div>

          {/* Bulk add toggle */}
          <Button variant="ghost" size="sm" onClick={() => setShowBulk(!showBulk)} className="text-xs">
            {showBulk ? 'Cancel bulk add' : 'Bulk add materials'}
          </Button>
          {showBulk && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">One per line: Name, Price</p>
              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                rows={5}
                placeholder={"2x4 Lumber, 5.99\nDrywall Sheet, 12.50\nPaint Gallon, 35.00"}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <Button variant="secondary" onClick={handleBulkAdd} className="w-full tap-target">Add All</Button>
            </div>
          )}

          {/* Material list */}
          <div className="space-y-1">
            {materialsLibrary.map(m => (
              <div key={m.id} className="flex items-center justify-between bg-card rounded-lg border border-border px-3 py-2">
                {editingId === m.id ? (
                  <>
                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 h-8 text-sm mr-2" />
                    <Input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-20 h-8 text-sm mr-2" />
                    <button onClick={saveEdit} className="p-1"><Check className="w-4 h-4 text-success" /></button>
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
              <p className="text-sm text-muted-foreground text-center py-4">No materials saved yet. They'll be auto-saved when you create estimates.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
