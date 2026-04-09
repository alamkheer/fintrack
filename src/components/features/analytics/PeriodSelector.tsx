export type PresetPeriod = 'current-date' | 'last-3-days' | 'this-week' | 'this-month';

const presets: { id: PresetPeriod; label: string }[] = [
  { id: 'current-date', label: 'Today' },
  { id: 'last-3-days', label: 'Last 3 Days' },
  { id: 'this-week', label: 'This Week' },
  { id: 'this-month', label: 'This Month' },
];

interface PeriodSelectorProps {
  period: PresetPeriod;
  onChange: (p: PresetPeriod) => void;
}

export function PeriodSelector({ period, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex bg-surface-container-high p-1 rounded-xl overflow-x-auto hide-scrollbar">
      {presets.map(p => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={`flex-1 min-w-[100px] text-sm font-bold px-4 py-2 rounded-lg transition-all ${period === p.id
              ? 'bg-surface shadow-sm text-brand'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface/50'
            }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDatesForPreset(preset: PresetPeriod): { startDate: string, endDate: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (preset === 'current-date') {
    const s = formatDate(today);
    return { startDate: s, endDate: s };
  }

  if (preset === 'last-3-days') {
    const start = new Date(today);
    start.setDate(today.getDate() - 2);
    return { 
      startDate: formatDate(start), 
      endDate: formatDate(today) 
    };
  }

  if (preset === 'this-week') {
    // Start of week (Monday)
    const start = new Date(today);
    const day = today.getDay(); // 0 is Sunday, 1 is Monday...
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    start.setDate(diff);
    return { 
      startDate: formatDate(start), 
      endDate: formatDate(today) 
    };
  }

  if (preset === 'this-month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate: formatDate(start), endDate: formatDate(end) };
  }

  // Default to today
  const s = formatDate(today);
  return { startDate: s, endDate: s };
}
