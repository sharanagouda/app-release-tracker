import React from 'react';
import { Tag, Calendar, FileCode, HardDrive, Upload, ShieldCheck, Activity } from 'lucide-react';
import { DeploymentHistoryItem } from '../../services/api/interfaces';

interface LatestDeploymentProps {
  deployment: DeploymentHistoryItem | null;
  darkMode: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTimestamp(ts: string): { date: string; time: string } {
  // uploadTime is a Unix timestamp in milliseconds (as a string)
  const d = new Date(Number(ts));
  return {
    date: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }),
  };
}

export const LatestDeployment: React.FC<LatestDeploymentProps> = ({ deployment, darkMode }) => {
  if (!deployment) {
    return (
      <div className={`rounded-lg border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No deployments found for this configuration.
        </p>
      </div>
    );
  }

  const { date, time } = formatTimestamp(deployment.uploadTime);

  const statusColor = deployment.isDisabled
    ? (darkMode ? 'text-red-400' : 'text-red-600')
    : (darkMode ? 'text-green-400' : 'text-green-600');

  const statusText = deployment.isDisabled ? 'Disabled' : 'Active';

  const rows = [
    { icon: Tag, label: 'Label', value: deployment.label },
    { icon: Calendar, label: 'Date', value: `${date}\n${time}` },
    { icon: FileCode, label: 'Version', value: deployment.appVersion },
    { icon: HardDrive, label: 'Size', value: formatBytes(deployment.size) },
    { icon: Upload, label: 'Release', value: deployment.releaseMethod },
    { icon: ShieldCheck, label: 'Mandatory', value: deployment.isMandatory ? 'Yes' : 'No' },
    { icon: Activity, label: 'Status', value: statusText, className: statusColor },
  ];

  return (
    <div className={`rounded-lg border p-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="space-y-3">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-start gap-3">
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <span className={`text-xs font-medium uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {row.label}
                </span>
                <p className={`text-sm font-semibold whitespace-pre-line ${row.className || (darkMode ? 'text-gray-100' : 'text-gray-900')}`}>
                  {row.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
