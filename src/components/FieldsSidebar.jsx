import React, { useState } from 'react';
import { PenTool, Type, CheckSquare, Calendar, User, Hash, Briefcase, Mail, Stamp } from 'lucide-react';
import { Button } from './ui/Button';

const FieldsSidebar = ({ onAddField }) => {
    const [openCategory, setOpenCategory] = useState('all'); // 'all' or specific id

    const categories = [
        {
            id: 'signature',
            label: 'Signature Fields',
            items: [
                { type: 'signature', label: 'Signature', icon: PenTool, color: 'text-yellow-600', bg: 'bg-yellow-100' },
                { type: 'initial', label: 'Initial', icon: Type, color: 'text-yellow-600', bg: 'bg-yellow-100' },
                { type: 'stamp', label: 'Stamp', icon: Stamp, color: 'text-yellow-600', bg: 'bg-yellow-100' },
                { type: 'date', label: 'Date Signed', icon: Calendar, color: 'text-yellow-600', bg: 'bg-yellow-100' },
            ]
        },
        {
            id: 'user',
            label: 'User Info',
            items: [
                { type: 'name', label: 'Name', icon: User, color: 'text-blue-600', bg: 'bg-blue-100' },
                { type: 'email', label: 'Email', icon: Mail, color: 'text-blue-600', bg: 'bg-blue-100' },
                { type: 'company', label: 'Company', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' },
                { type: 'title', label: 'Title', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' },
            ]
        },
        {
            id: 'standard',
            label: 'Standard',
            items: [
                { type: 'text', label: 'Text', icon: Type, color: 'text-gray-600', bg: 'bg-gray-100' },
                { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, color: 'text-gray-600', bg: 'bg-gray-100' },
            ]
        }
    ];

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Flattened list for MVP simplicitly mostly, or sections */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {categories.map(cat => (
                    <div key={cat.id}>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">{cat.label}</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {cat.items.map(item => (
                                <button
                                    key={item.type}
                                    onClick={() => onAddField(item.type, item.label)}
                                    className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-[var(--template-primary)] hover:bg-gray-50 transition-all group text-left shadow-sm bg-white"
                                >
                                    <div className={`w-7 h-7 shrink-0 rounded-md ${item.bg} ${item.color} flex items-center justify-center`}>
                                        <item.icon size={14} />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900 truncate">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FieldsSidebar;
