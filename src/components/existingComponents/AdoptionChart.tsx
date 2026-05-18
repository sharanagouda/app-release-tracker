'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ReleaseMetrics } from '@/src/lib/types';

interface AdoptionChartProps {
  metrics: ReleaseMetrics;
}

export default function AdoptionChart({ metrics }: AdoptionChartProps) {
  const data = [
    { name: 'Active', value: metrics.active, color: '#10b981' },
    { name: 'Downloaded', value: metrics.downloaded - metrics.installed, color: '#3b82f6' },
    { name: 'Failed', value: metrics.failed, color: '#ef4444' },
    { name: 'Pending', value: metrics.totalDevices - metrics.downloaded, color: '#9ca3af' },
  ].filter(item => item.value > 0);

  const adoptionRate = Math.round((metrics.installed / metrics.totalDevices) * 100);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
      <h3 className="text-base md:text-lg font-semibold text-gray-900">Adoption Rate</h3>
      <div className="mt-4 flex items-center justify-center">
        <div className="relative w-[200px] h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{adoptionRate}%</p>
              <p className="text-xs text-gray-500">Adopted</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600">{item.name}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

