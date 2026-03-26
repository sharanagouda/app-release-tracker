import React from 'react';
import { ToggleLeft, ToggleRight, Shield } from 'lucide-react';

interface SettingsProps {
    sidebarSettings: {
        showAppRelease: boolean;
        showReleaseNotes: boolean;
        showWiki: boolean;
    };
    onUpdateSettings: (key: string, value: boolean) => void;
    darkMode: boolean;
    isAdminMode: boolean;
    onToggleAdminMode: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
    sidebarSettings,
    onUpdateSettings,
    darkMode,
    isAdminMode,
    onToggleAdminMode,
}) => {
    const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
        <button onClick={onChange} className={`transition-colors ${checked ? 'text-blue-600' : 'text-gray-400'}`}>
            {checked ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
        </button>
    );

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Settings
            </h2>

            <div className="space-y-6">
                {/* Sidebar Settings */}
                <div className={`rounded-xl border p-6 ${darkMode ? 'bg-[#111827] border-[#1E293B]' : 'bg-white border-gray-200'
                    }`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Sidebar Navigation
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                    App Release
                                </p>
                                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                    Show App Release in sidebar
                                </p>
                            </div>
                            <Toggle
                                checked={sidebarSettings.showAppRelease}
                                onChange={() => onUpdateSettings('showAppRelease', !sidebarSettings.showAppRelease)}
                            />
                        </div>

                        <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} />

                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                    Release Notes
                                </p>
                                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                    Show Release Notes in sidebar
                                </p>
                            </div>
                            <Toggle
                                checked={sidebarSettings.showReleaseNotes}
                                onChange={() => onUpdateSettings('showReleaseNotes', !sidebarSettings.showReleaseNotes)}
                            />
                        </div>

                        <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} />

                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                    Wiki
                                </p>
                                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                    Show Wiki in sidebar
                                </p>
                            </div>
                            <Toggle
                                checked={sidebarSettings.showWiki}
                                onChange={() => onUpdateSettings('showWiki', !sidebarSettings.showWiki)}
                            />
                        </div>
                    </div>
                </div>

                {/* Admin Settings */}
                <div className={`rounded-xl border p-6 ${darkMode ? 'bg-[#111827] border-[#1E293B]' : 'bg-white border-gray-200'
                    }`}>
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Admin Controls
                        </h3>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                Admin Mode
                            </p>
                            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                Enable admin privileges (for testing)
                            </p>
                        </div>
                        <Toggle
                            checked={isAdminMode}
                            onChange={onToggleAdminMode}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
