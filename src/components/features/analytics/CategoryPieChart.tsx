import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../../utils/currency';
import { Card } from '../../ui/Card';

interface CategoryPieChartProps {
  data: { name: string; value: number; color: string; icon: string }[];
  currency: string;
}

export function CategoryPieChart({ data, currency }: CategoryPieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0) {
    return (
      <Card className="p-6 h-80 flex items-center justify-center border-dashed border-2 bg-transparent shadow-none">
        <p className="text-on-surface-variant font-medium">No expenses for this period.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold font-display text-on-surface mb-6">Spending by Category</h2>
      
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="w-48 h-48 sm:w-64 sm:h-64 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => formatCurrency(Number(value), currency)}
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 w-full space-y-3">
          {data.map((item, i) => {
            const pct = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-on-surface font-medium">{item.icon} {item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-on-surface-variant text-sm w-12 text-right">
                    {pct.toFixed(1)}%
                  </span>
                  <span className="font-mono font-bold text-on-surface w-24 text-right">
                    {formatCurrency(item.value, currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
