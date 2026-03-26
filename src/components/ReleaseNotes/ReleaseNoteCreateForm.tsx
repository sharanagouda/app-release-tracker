import React, { useState } from 'react';
import { ArrowLeft, Info, Settings, Users, HelpCircle } from 'lucide-react';
import { ReleaseNote, ReleaseNoteType } from '../../types/releaseNote';
import { releaseNoteConfigs } from '../../config/releaseNoteColumns';

interface ReleaseNoteCreateFormProps {
    type: ReleaseNoteType;
    onBack: () => void;
    onSave: (noteData: Omit<ReleaseNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
    darkMode: boolean;
    initialData?: ReleaseNote | null;
}

// Define form sections for each type
const formSections: Record<ReleaseNoteType, { title: string; icon: React.ReactNode; fields: string[] }[]> = {
    'Hybris Hotfix': [
        {
            title: '1. Core Info',
            icon: <Info className="w-5 h-5 text-blue-500" />,
            fields: ['hotfixDate', 'hotfixBranch', 'crNumber', 'description'],
        },
        {
            title: '2. Technical Details',
            icon: <Settings className="w-5 h-5 text-blue-500" />,
            fields: ['systemUpdate', 'codePush', 'impex', 'appSubmission', 'enableMode', 'reactNative', 'microservice', 'db'],
        },
        {
            title: '3. Stakeholders',
            icon: <Users className="w-5 h-5 text-blue-500" />,
            fields: ['hot', 'em'],
        },
        {
            title: '4. Additional Notes',
            icon: <HelpCircle className="w-5 h-5 text-blue-500" />,
            fields: ['comment'],
        },
    ],
    'BLC Hotfix': [
        {
            title: '1. Core Info',
            icon: <Info className="w-5 h-5 text-blue-500" />,
            fields: ['hotfixDate', 'hotfixBranch', 'crNumber', 'state'],
        },
        {
            title: '2. Feature & Bug Tracking',
            icon: <Settings className="w-5 h-5 text-blue-500" />,
            fields: ['featureList', 'productionBugList', 'description'],
        },
        {
            title: '3. Stakeholders',
            icon: <Users className="w-5 h-5 text-blue-500" />,
            fields: ['theme', 'scrumMaster', 'po', 'hot', 'em'],
        },
        {
            title: '4. Technical Details',
            icon: <Settings className="w-5 h-5 text-blue-500" />,
            fields: ['apiChanges', 'systemUpdate', 'codePush', 'impex', 'appSubmission', 'enableMode', 'reactNative', 'microservice', 'db'],
        },
        {
            title: '5. Additional Notes',
            icon: <HelpCircle className="w-5 h-5 text-blue-500" />,
            fields: ['comment'],
        },
    ],
    'LMD Theme Release': [
        {
            title: '1. Core Info',
            icon: <Info className="w-5 h-5 text-blue-500" />,
            fields: ['releaseDate', 'artComponents', 'ptRequired', 'walkthrough'],
        },
        {
            title: '2. Feature & Bug Tracking',
            icon: <Settings className="w-5 h-5 text-blue-500" />,
            fields: ['featureList', 'apiChanges'],
        },
        {
            title: '3. Stakeholders',
            icon: <Users className="w-5 h-5 text-blue-500" />,
            fields: ['theme', 'scrumMaster', 'po', 'hot', 'em', 'lpo'],
        },
        {
            title: '4. Platform & Systems',
            icon: <Settings className="w-5 h-5 text-blue-500" />,
            fields: [
                'stageHybris', 'systemUpdate', 'codePush', 'impex', 'appSubmission', 'enableMode',
                'reactNative', 'react', 'microservice', 'oms', 'rms', 'orpos', 'ofin', 'rpas',
                'hcm', 'plm', 'spaceManagement', 'wms', 'contentCentral', 'oracleFinancials',
                'treasuryManagement', 'rib', 'moengage', 'shukranDigital', 'shukranPay',
                'dynamicAction', 'epsilon', 'whatsapp', 'nginxGateway', 'blc', 'algolia',
                'dataManager', 'plReport', 'cowrite', 'ogloba', 'sim', 'ssm', 'sahlaStore',
                'dematic', 'sahlaWh', 'rfidSml', 'sahlaPortal', 'locus', 'gdms', 'netezza',
                'tams', 'e2open', 'wooqer', 's2p2p', 'apiGateway', 'ace', 'db', 'cab', 'reactWeb'
            ],
        },
        {
            title: '5. Additional Notes',
            icon: <HelpCircle className="w-5 h-5 text-blue-500" />,
            fields: ['comment'],
        },
    ],
};

export const ReleaseNoteCreateForm: React.FC<ReleaseNoteCreateFormProps> = ({
    type,
    onBack,
    onSave,
    darkMode,
    initialData,
}) => {
    const [formData, setFormData] = useState<Record<string, any>>(initialData || {});

    const config = releaseNoteConfigs.find((c) => c.type === type);
    const sections = formSections[type] || [];

    const getTypeLabel = () => {
        switch (type) {
            case 'Hybris Hotfix': return 'Hybris Hotfix';
            case 'BLC Hotfix': return 'BLC Hotfix';
            case 'LMD Theme Release': return 'LMD Theme';
            default: return type;
        }
    };

    const handleInputChange = (id: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            type,
            ...formData,
        });
    };

    const getColumnDef = (fieldId: string) => {
        return config?.columns.find(c => c.id === fieldId);
    };

    const getPlaceholder = (fieldId: string) => {
        switch (fieldId) {
            case 'hotfixDate':
            case 'releaseDate':
                return 'dd/mm/yyyy';
            case 'hotfixBranch':
                return 'e.g., hotfix/blc-v2.4.1';
            case 'crNumber':
                return 'CR-12345';
            case 'featureList':
                return 'List key features (e.g., [BLC-102] Implement partial checkout logic)';
            case 'productionBugList':
                return 'List bug fixes (e.g., [BUG-442] Resolve null pointer on payment callback)';
            case 'description':
                return 'Brief description of the release...';
            default:
                return '';
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium mb-4 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Releases
            </button>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">
                    Create {getTypeLabel()} Release
                </h1>
                <p className="text-gray-500 mt-1">
                    Fill in the technical and stakeholder details to generate automated release notes.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
                <div className="space-y-8">
                    {sections.map((section, sectionIdx) => (
                        <div key={sectionIdx}>
                            {/* Section Header */}
                            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#1E293B]">
                                {section.icon}
                                <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                            </div>

                            {/* Section Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                                {section.fields.map((fieldId) => {
                                    const columnDef = getColumnDef(fieldId);
                                    if (!columnDef) return null;

                                    const isFullWidth = columnDef.type === 'textarea';

                                    return (
                                        <div key={fieldId} className={isFullWidth ? 'sm:col-span-2' : ''}>
                                            <label
                                                htmlFor={fieldId}
                                                className="flex items-center gap-1 text-sm font-medium text-gray-300 mb-2"
                                            >
                                                {columnDef.label}
                                                {columnDef.required && <span className="text-red-400">*</span>}
                                                {(fieldId === 'featureList' || fieldId === 'productionBugList') && (
                                                    <HelpCircle className="w-3.5 h-3.5 text-gray-500 ml-1" />
                                                )}
                                            </label>

                                            {columnDef.type === 'textarea' ? (
                                                <textarea
                                                    id={fieldId}
                                                    required={columnDef.required}
                                                    value={formData[fieldId] || ''}
                                                    onChange={(e) => handleInputChange(fieldId, e.target.value)}
                                                    placeholder={getPlaceholder(fieldId)}
                                                    rows={4}
                                                    className="block w-full rounded-lg border border-[#2D3B4F] bg-[#1E293B] text-gray-200 placeholder-gray-500 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            ) : columnDef.type === 'select' ? (
                                                <select
                                                    id={fieldId}
                                                    required={columnDef.required}
                                                    value={formData[fieldId] || ''}
                                                    onChange={(e) => handleInputChange(fieldId, e.target.value)}
                                                    className="block w-full rounded-lg border border-[#2D3B4F] bg-[#1E293B] text-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                                                >
                                                    <option value="">Select...</option>
                                                    {columnDef.options?.map((opt) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : columnDef.type === 'date' ? (
                                                <input
                                                    type="date"
                                                    id={fieldId}
                                                    required={columnDef.required}
                                                    value={formData[fieldId] || ''}
                                                    onChange={(e) => handleInputChange(fieldId, e.target.value)}
                                                    placeholder={getPlaceholder(fieldId)}
                                                    className="block w-full rounded-lg border border-[#2D3B4F] bg-[#1E293B] text-gray-200 placeholder-gray-500 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    id={fieldId}
                                                    required={columnDef.required}
                                                    value={formData[fieldId] || ''}
                                                    onChange={(e) => handleInputChange(fieldId, e.target.value)}
                                                    placeholder={getPlaceholder(fieldId)}
                                                    className="block w-full rounded-lg border border-[#2D3B4F] bg-[#1E293B] text-gray-200 placeholder-gray-500 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-4 mt-10 pt-6 border-t border-[#1E293B]">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-6 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Create Release
                    </button>
                </div>
            </form>
        </div>
    );
};
