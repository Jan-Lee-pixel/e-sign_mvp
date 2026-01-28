import React, { useState, useEffect } from 'react';
import { X, Save, Folder } from 'lucide-react';
import { supabase } from '../lib/supabase';

const CategoryModal = ({ isOpen, onClose, onSave, editingCategory = null, userId }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (editingCategory) {
                setName(editingCategory.name);
                setDescription(editingCategory.description || '');
            } else {
                setName('');
                setDescription('');
            }
        }
    }, [isOpen, editingCategory]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingCategory) {
                // Update existing
                const { error } = await supabase
                    .from('signature_categories')
                    .update({ name, description })
                    .eq('id', editingCategory.id);

                if (error) throw error;
            } else {
                // Create new
                const { error } = await supabase
                    .from('signature_categories')
                    .insert([{
                        user_id: userId,
                        name,
                        description,
                        icon: 'Folder'
                    }]);

                if (error) throw error;
            }
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Failed to save category. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {editingCategory ? 'Edit Category' : 'New Category'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Folder size={16} />
                            </div>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="pl-9 w-full rounded-lg border-gray-200 focus:border-primary focus:ring-primary text-sm"
                                placeholder="e.g. Medical, Legal"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-lg border-gray-200 focus:border-primary focus:ring-primary text-sm"
                            placeholder="What is this category for?"
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm transition-colors disabled:opacity-70"
                        >
                            <Save size={16} />
                            {loading ? 'Saving...' : 'Save Category'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryModal;
