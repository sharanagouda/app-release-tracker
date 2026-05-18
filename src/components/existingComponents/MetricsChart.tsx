'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Release } from '@/src/lib/types';

interface MetricsChartProps {
  releases: Release[];
}

export default function MetricsChart({ releases }: MetricsChartProps) {
  const data = releases
    .slice(0, 5)
    .reverse()
    .map((release) => ({
      name: release.label,
      Active: release.metrics.active,
      Downloaded: release.metrics.downloaded,
      Failed: release.metrics.failed,
    }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
      <h3 className="text-base md:text-lg font-semibold text-gray-900">Release Metrics</h3>
      <div className="mt-6 w-full overflow-hidden">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              stroke="#6b7280" 
              fontSize={12}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={12}
              tick={{ fill: '#6b7280' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Bar dataKey="Active" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Downloaded" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

