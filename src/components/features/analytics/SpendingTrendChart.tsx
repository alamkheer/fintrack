import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../../utils/currency';
import { Card } from '../../ui/Card';

interface SpendingTrendChartProps {
  data: { date: string; expense: number; income: number }[];
  currency: string;
  variant?: 'full' | 'mini';
}

export function SpendingTrendChart({ data, currency, variant = 'full' }: SpendingTrendChartProps) {
  const isMini = variant === 'mini';

  if (data.length === 0) {
    const emptyContent = <p className="text-on-surface-variant font-medium">No trend data available.</p>;
    if (isMini) return <div className="h-full flex items-center justify-center italic opacity-50 text-xs">{emptyContent}</div>;
    
    return (
      <Card className="p-6 h-80 flex items-center justify-center border-dashed border-2 bg-transparent shadow-none">
        {emptyContent}
      </Card>
    );
  }

  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
  };

  const formatMoneyAxis = (val: number) => {
    if (val === 0) return '0';
    return (val / 100).toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const content = (
    <div className={isMini ? 'h-full w-full' : 'h-72 w-full'}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={isMini ? { top: 10, right: 10, left: -20, bottom: 0 } : { top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-outline)" strokeOpacity={0.2} />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatShortDate} 
            axisLine={false}
            tickLine={false}
            tick={isMini ? false : { fontSize: 12, fill: 'var(--color-on-surface-variant)' }}
            dy={10}
            hide={isMini}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'var(--color-on-surface-variant)' }}
            tickFormatter={formatMoneyAxis}
            width={isMini ? 40 : 50}
            hide={isMini}
          />
          <Tooltip 
            formatter={(value: any) => formatCurrency(Number(value), currency)}
            labelFormatter={(label: any) => formatShortDate(String(label))}
            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
          />
          <Line 
            type="monotone" 
            dataKey="expense" 
            name="Expenses"
            stroke="#e11d48" 
            strokeWidth={isMini ? 2 : 3}
            dot={isMini ? false : { r: 4, strokeWidth: 2, fill: 'var(--color-surface)' }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="income" 
            name="Income"
            stroke="#16a34a" 
            strokeWidth={isMini ? 2 : 3}
            dot={isMini ? false : { r: 4, strokeWidth: 2, fill: 'var(--color-surface)' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  if (isMini) return content;

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold font-display text-on-surface mb-6">Cashflow Trend</h2>
      {content}
    </Card>
  );
}
