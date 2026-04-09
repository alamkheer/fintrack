import { useState, useEffect } from 'react';
import { version } from '../../package.json';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { useExpenses } from '../contexts/ExpenseContext';
import { useToast } from '../contexts/ToastContext';
import { initDB } from '../services/db';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../utils/currency';

export default function Settings() {
  const { settings, updateSetting, isLoading } = useSettings();
  const { recurringTemplates, deleteTemplate, updateTemplate } = useExpenses();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [quota, setQuota] = useState<{ used: string, max: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(est => {
        if (est.usage && est.quota) {
          setQuota({
            used: (est.usage / 1024 / 1024).toFixed(2),
            max: (est.quota / 1024 / 1024).toFixed(0)
          });
        }
      });
    }
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const db = await initDB();
      const exportData: Record<string, unknown> = {};
      const stores = Array.from(db.objectStoreNames);
      
      for (const store of stores) {
        exportData[store] = await db.getAll(store);
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fintrack-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ type: 'success', title: 'Export Successful' });
    } catch (e) {
      toast({ type: 'error', title: 'Export Failed', message: (e as Error).message });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Importing data will MERGE with existing data. Highly recommend making an Export backup first. Continue?')) {
      e.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const db = await initDB();

      for (const storeName of Object.keys(parsed)) {
        if (!db.objectStoreNames.contains(storeName)) continue;
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        for (const item of parsed[storeName]) {
          await store.put(item);
        }
        await tx.done;
      }
      
      toast({ type: 'success', title: 'Import Successful', message: 'Please refresh the page to see changes.' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      toast({ type: 'error', title: 'Import Corrupted', message: 'Invalid JSON backup file provided.' });
    } finally {
      e.target.value = '';
    }
  };

  const clearAllData = async () => {
    if (!window.prompt('WARNING: Type "DELETE" to permanently erase all local budgets, wallets, and transactions. You cannot undo this.')?.includes('DELETE')) {
      return;
    }

    try {
      if (indexedDB.databases) {
        const dbs = await indexedDB.databases();
        for (const dbInfo of dbs) {
          if (dbInfo.name) indexedDB.deleteDatabase(dbInfo.name);
        }
      } else {
        indexedDB.deleteDatabase('fintrack_db');
      }
      toast({ type: 'success', title: 'Erase Successful', message: 'Erased. Reloading...' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      toast({ type: 'error', title: 'Database Locked', message: 'Unable to erase local database.' });
    }
  };

  if (isLoading) return null;

  return (
    <div className="max-w-6xl mx-auto py-4 md:py-8 space-y-12">
      <header>
        <h1 className="text-4xl font-display font-bold text-on-surface">Settings</h1>
        <p className="mt-2 text-on-surface-variant">Preferences and Workspace Management</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Preferences */}
        <div className="lg:col-span-2 space-y-12">
          
          <section className="space-y-6">
            <h2 className="text-xl font-bold font-display text-on-surface flex items-center gap-2">
              <span>⚙️</span> General Preferences
            </h2>
            <Card className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select 
                label="Currency Display"
                value={settings.defaultCurrency}
                onChange={e => updateSetting('defaultCurrency', e.target.value)}
              >
                <option value="GBP">British Pound (£)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="INR">Indian Rupee (₹)</option>
                <option value="JPY">Japanese Yen (¥)</option>
              </Select>

              <Select 
                label="Interface Theme"
                value={settings.theme || 'system'}
                onChange={e => updateSetting('theme', e.target.value as 'light' | 'dark' | 'system')}
              >
                <option value="system">System Default</option>
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
        </Select>
            </Card>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-bold font-display text-on-surface flex items-center gap-2">
              <span>🏷️</span> Classification
            </h2>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-on-surface">Categories</h3>
                  <p className="text-sm text-on-surface-variant">Manage icons, colors, and custom transaction types.</p>
                </div>
                <Button variant="secondary" onClick={() => navigate('/settings/categories')}>
                  Manage Categories
                </Button>
              </div>
            </Card>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-display text-on-surface flex items-center gap-2">
                <span>🔁</span> Recurring Transactions
              </h2>
              <span className="text-xs font-bold px-2 py-1 bg-brand/10 text-brand rounded-lg">
                {recurringTemplates.length} Active
              </span>
            </div>
            
            <Card className="divide-y divide-outline/5 overflow-hidden">
              {recurringTemplates.length === 0 ? (
                <div className="p-12 text-center text-on-surface-variant italic">
                  No recurring payments scheduled.
                </div>
              ) : (
                recurringTemplates.filter(t => !t.syncMeta.deletedAt).map(template => (
                  <div key={template.id} className="p-5 flex items-center justify-between group hover:bg-surface-container-low transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-xl">
                        {template.templateData.type === 'income' ? '💰' : '💳'}
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">{template.name}</p>
                        <p className="text-xs text-on-surface-variant uppercase tracking-widest font-mono">
                          {template.frequency} • Next: {new Date(template.nextDueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-on-surface mr-4">
                        {formatCurrency(template.templateData.amount || 0, settings.defaultCurrency || 'GBP')}
                      </span>
                      <button 
                        onClick={() => updateTemplate(template.id, { isActive: !template.isActive })}
                        className={`text-xs font-bold px-2 py-1 rounded transition-colors ${template.isActive ? 'text-brand bg-brand/5 hover:bg-brand/10' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                        aria-label={template.isActive ? "Pause template" : "Resume template"}
                      >
                        {template.isActive ? 'Active' : 'Paused'}
                      </button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 text-error"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </Card>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-bold font-display text-on-surface flex items-center gap-2">
              <span>⌨️</span> Keyboard Legend
            </h2>
            <Card className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { keys: ['Shift', 'D'], desc: 'Go to Dashboard' },
                  { keys: ['Shift', 'A'], desc: 'Open Analytics' },
                  { keys: ['Shift', 'W'], desc: 'View Wallets' },
                  { keys: ['Shift', 'B'], desc: 'Budget Status' },
                  { keys: ['Shift', 'E'], desc: 'Add Transaction' },
                  { keys: ['Shift', 'S'], desc: 'Open Settings' },
                  { keys: ['Esc'], desc: 'Close any Drawer' },
                  { keys: ['?'], desc: 'Show this menu' },
                ].map((shortcut, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {shortcut.keys.map(k => (
                        <kbd key={k} className="px-1.5 py-0.5 rounded border border-outline/30 bg-surface-container-high text-[10px] font-mono font-bold shadow-sm">
                          {k}
                        </kbd>
                      ))}
                    </div>
                    <span className="text-xs text-on-surface-variant font-medium">{shortcut.desc}</span>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </div>

        {/* Right Column: Data & System */}
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-xl font-bold font-display text-on-surface">System Status</h2>
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-outline/10 pb-4">
                <div>
                  <h4 className="font-bold text-on-surface">Storage Quota</h4>
                  <p className="text-sm text-on-surface-variant">Browser DB footprint</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-brand">{quota ? `${quota.used} MB` : '...'}</span>
                  {quota && <p className="text-[10px] text-on-surface-variant uppercase font-bold">/ {quota.max} MB MAX</p>}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-on-surface">Workspace Tools</h4>
                <div className="grid grid-cols-1 gap-3">
                  <Button variant="secondary" fullWidth onClick={handleExport} disabled={isExporting}>
                    {isExporting ? 'Exporting...' : '📦 Export JSON Backup'}
                  </Button>
                  
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={handleImport}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="secondary" fullWidth className="pointer-events-none">
                      📥 Import JSON Backup
                    </Button>
                  </div>

                  <hr className="border-outline/5 my-2" />

                  <Button variant="ghost" fullWidth className="text-error hover:bg-error/5" onClick={clearAllData}>
                    🗑️ Erase Local Workspace
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          <Card className="p-4 bg-surface-container-high/30 border-dashed border-outline/20">
            <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant/50 text-center">
              FinTrack v{version}-Stable <br/> Built for Precision
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
