import React from 'react';
import { Plus, Eye } from 'lucide-react';

const CategoryCard = ({
    title,
    description,
    icon,
    signatureCount = 0,
    previewUrl,
    previewName,
    onViewAll,
    onAddNew,
    onEdit,
    onDelete
}) => {
    return (
        <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${title.includes('Business') ? 'bg-green-100 text-green-700' :
                    title.includes('Personal') ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                    }`}>
                    {icon}
                </div>
                <div className="flex items-center gap-2">
                    {(onEdit || onDelete) && (
                        <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            {onEdit && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                    className="p-1.5 text-gray-400 hover:text-primary hover:bg-green-50 rounded-lg transition-colors"
                                    title="Edit Category"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Category"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            )}
                        </div>
                    )}
                    <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                        {signatureCount} Signature{signatureCount !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 text-sm mb-6 flex-grow">{description}</p>

            <div className="bg-gray-50 border border-gray-100 rounded-xl h-32 mb-6 flex items-center justify-center relative overflow-hidden group">
                {previewUrl ? (
                    <>
                        <img src={previewUrl} alt="Signature Preview" className="h-20 max-w-[80%] object-contain opacity-80" />
                        {previewName && (
                            <div className="absolute bottom-2 text-gray-400 font-handwriting text-lg pointer-events-none">
                                {previewName}
                            </div>
                        )}
                    </>
                ) : (
                    <span className="text-gray-300 italic">No signature yet</span>
                )}
            </div>

            <div className="flex gap-3 mt-auto">
                <button
                    onClick={onViewAll}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#008f33] text-white rounded-xl hover:bg-[#007a2b] transition-colors font-medium text-sm"
                >
                    <Eye size={16} />
                    View All
                </button>
                <button
                    onClick={onAddNew}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                    <Plus size={16} />
                    Add New
                </button>
            </div>


        </div>
    );
};

export default CategoryCard;
