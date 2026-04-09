import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { dbService, syncChannel } from '../services/db';
import type { AppSettings } from '../types/schema';
import { applyTheme } from '../utils/theme';

interface SettingsContextType {
  settings: Partial<AppSettings>;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Partial<AppSettings>>({
    defaultCurrency: 'GBP',
    theme: 'system',
    dateFormat: 'DD/MM/YYYY',
    firstDayOfWeek: 1,
    budgetStartDay: 1,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = async () => {
    const loaded = await dbService.getAllSettings();
    setSettings(prev => ({ ...prev, ...loaded }));
    applyTheme(loaded.theme || 'system');
    setIsLoading(false);
  };

  useEffect(() => {
    loadSettings();

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'DATA_CHANGED' && event.data.store === 'appSettings') {
        loadSettings();
      }
    };

    syncChannel.addEventListener('message', handleMessage);
    return () => syncChannel.removeEventListener('message', handleMessage);
  }, []);

  const updateSetting = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    await dbService.setSetting(key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === 'theme') applyTheme(value as 'light' | 'dark' | 'system');
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
