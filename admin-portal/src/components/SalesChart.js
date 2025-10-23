'use client';

import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Static demo data for the chart
const data = [
  { date: 'Oct 1', sales: 23000 },
  { date: 'Oct 4', sales: 45000 },
  { date: 'Oct 7', sales: 30000 },
  { date: 'Oct 10', sales: 50000 },
  { date: 'Oct 13', sales: 40000 },
  { date: 'Oct 16', sales: 65000 },
  { date: 'Oct 19', sales: 72000 },
  { date: 'Oct 21', sales: 98000 },
];

export function SalesChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value / 1000}k`}
            />
            <Tooltip
              formatter={(value) => [
                `₹${value.toLocaleString('en-IN')}`,
                'Sales',
              ]}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="hsl(var(--primary))" // Uses your shadcn theme color
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}