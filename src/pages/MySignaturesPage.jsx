import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CategoryCard from '../components/CategoryCard';
import SignaturePad from '../components/SignaturePad';
import CategoryModal from '../components/CategoryModal';
import SignatureListModal from '../components/SignatureListModal';
import { Plus, Briefcase, User, PenTool, LayoutGrid } from 'lucide-react';

const MySignaturesPage = () => {
    const navigate = useNavigate();
    const [signatures, setSignatures] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('my-signatures');

    // Modals state
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [viewingCategory, setViewingCategory] = useState(null); // { name: string, signatures: [] }

    // Selection state
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                // Fetch signatures
                const { data: sigs } = await supabase
                    .from('signatures')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (sigs) setSignatures(sigs);

                // Fetch categories
                const { data: cats } = await supabase
                    .from('signature_categories')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: true });

                const generalCategory = {
                    id: 'General',
                    name: 'General',
                    description: 'All your signatures in one place.',
                    icon: 'LayoutGrid'
                };

                if (cats) {
                    setCategories([generalCategory, ...cats]);
                } else {
                    setCategories([generalCategory]);
                }
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getSignaturesByCategory = (catName) => {
        // Default catch-all is 'General'
        const normalizedSigCat = (sCat) => sCat || 'General';

        return signatures.filter(s => {
            const sCat = normalizedSigCat(s.category);
            // Match exact name or if the category is the target catch-all
            return sCat === catName || (catName === 'General' && !s.category);
        });
    };

    const handleSaveSignature = () => {
        fetchData();
        setShowSignaturePad(false);
    };

    const handleDeleteCategory = async (cat) => {
        if (cat.id && cat.id.length < 30) {
            alert("Cannot delete default categories.");
            return;
        }

        if (!confirm(`Delete category "${cat.name}"? Signatures will remain but lose this category.`)) return;

        const { error } = await supabase.from('signature_categories').delete().eq('id', cat.id);
        if (error) {
            console.error('Error deleting category:', error);
            alert('Failed to delete category');
        } else {
            fetchData();
        }
    };

    // Deleting a signature from the list modal
    const handleDeleteSignature = async (id) => {
        if (!confirm("Are you sure you want to delete this signature?")) return;

        const { error } = await supabase.from('signatures').delete().eq('id', id);
        if (!error) {
            const newSigs = signatures.filter(s => s.id !== id);
            setSignatures(newSigs);
            // Update viewingCategory if open
            if (viewingCategory) {
                const updatedCatSigs = getSignaturesByCategory(viewingCategory.name).filter(s => s.id !== id);
                setViewingCategory({ ...viewingCategory, signatures: updatedCatSigs });
            }
        }
    };

    const handleTabChange = (tabId) => {
        // Fix for sidebar navigation: redirect to dashboard if non-tool tab clicked
        if (['all', 'pending', 'signed'].includes(tabId)) {
            navigate('/dashboard');
        } else {
            setActiveTab(tabId);
        }
    };

    const getIcon = (iconName) => {
        switch (iconName) {
            case 'Briefcase': return <Briefcase size={24} />;
            case 'User': return <User size={24} />;
            case 'PenTool': return <PenTool size={24} />;
            default: return <LayoutGrid size={24} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans text-[#1A1A1A] leading-relaxed overflow-x-hidden">
            <Header title="My Signatures" />

            <div className="max-w-[1400px] mx-auto py-12 px-8 animate-[fadeIn_0.8s_ease-out_0.2s_backwards]">
                <div className="grid grid-cols-[280px_1fr] gap-8 mt-8 max-lg:grid-cols-1">
                    <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

                    <main className="animate-[slideLeft_0.6s_ease-out_0.4s_backwards]">
                        <div className="flex justify-between items-center mb-10 max-md:flex-col max-md:items-start max-md:gap-4">
                            <h1 className="text-3xl font-bold font-['Calistoga'] tracking-wide">My Signatures</h1>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setEditingCategory(null); setShowCategoryModal(true); }}
                                    className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-5 py-3 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2"
                                >
                                    <Plus size={20} />
                                    Add Category
                                </button>
                                <button
                                    onClick={() => setShowSignaturePad(true)}
                                    className="bg-[#F9A602] hover:bg-[#e09602] text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                                >
                                    <Plus size={20} />
                                    Create New Signature
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-[fadeIn_0.5s_ease-out_forwards]">
                                {categories.map((cat, idx) => {
                                    const isCustom = cat.id && cat.id.length > 30;
                                    const catName = cat.name;
                                    const catSignatures = getSignaturesByCategory(cat.name);

                                    const preview = catSignatures.length > 0 ? catSignatures[0].signature_url : null;
                                    const prevName = catSignatures.length > 0 ? (catSignatures[0].first_name ? `${catSignatures[0].first_name} ${catSignatures[0].last_name || ''}` : '') : null;

                                    return (
                                        <CategoryCard
                                            key={cat.id || idx}
                                            title={cat.name}
                                            description={cat.description}
                                            icon={getIcon(cat.icon)}
                                            signatureCount={catSignatures.length}
                                            previewUrl={preview}
                                            previewName={prevName}
                                            onAddNew={() => {
                                                const simpleName = cat.name.split(' / ')[0];
                                                setSelectedCategory(simpleName);
                                                setShowSignaturePad(true);
                                            }}
                                            onViewAll={() => {
                                                // Open view all modal
                                                setViewingCategory({ name: cat.name, signatures: catSignatures });
                                            }}
                                            onEdit={isCustom ? () => {
                                                setEditingCategory(cat);
                                                setShowCategoryModal(true);
                                            } : null}
                                            onDelete={isCustom ? () => handleDeleteCategory(cat) : null}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {showSignaturePad && (
                <SignaturePad
                    onSave={handleSaveSignature}
                    onCancel={() => setShowSignaturePad(false)}
                    userId={userId}
                    initialCategory={selectedCategory === 'all' ? 'Personal' : selectedCategory}
                    categories={categories}
                />
            )}

            <CategoryModal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                onSave={fetchData}
                editingCategory={editingCategory}
                userId={userId}
            />

            {viewingCategory && (
                <SignatureListModal
                    isOpen={!!viewingCategory}
                    onClose={() => setViewingCategory(null)}
                    categoryName={viewingCategory.name}
                    signatures={viewingCategory.signatures}
                    onDelete={handleDeleteSignature}
                />
            )}
        </div>
    );
};

export default MySignaturesPage;
