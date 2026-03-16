import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Truck,
    Wallet,
    ShieldCheck,
    Trophy,
    Gift,
    Clock,
    Star,
    Heart,
    Zap,
    CheckCircle2,
    Edit2
} from 'lucide-react';
import toast from 'react-hot-toast';

// Available icons for selection
const ICON_OPTIONS = {
    Truck,
    Wallet,
    ShieldCheck,
    Trophy,
    Gift,
    Clock,
    Star,
    Heart,
    Zap,
    CheckCircle2
};

import { useTrustSignals, useAddTrustSignal, useUpdateTrustSignal, useDeleteTrustSignal } from '../../../hooks/useContent';

const WhyChooseUsPage = () => {
    const navigate = useNavigate();
    const { data: features = [], isLoading: loading } = useTrustSignals();
    const addSignalMutation = useAddTrustSignal();
    const updateSignalMutation = useUpdateTrustSignal();
    const deleteSignalMutation = useDeleteTrustSignal();

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(null); // { id, icon, topText, bottomText }

    const normalizedFeatures = features.map((feature, index) => ({
        ...feature,
        featureId: feature._id || feature.id || `trust-signal-${index}`
    }));
    const activeFeatures = normalizedFeatures.filter((feature) => feature.isActive !== false);

    const handleAddFeature = () => {
        if (activeFeatures.length >= 4) {
            toast.error('Only 4 features can be shown. Delete one first to add another.');
            return;
        }

        setEditForm({
            icon: 'Star',
            topText: '',
            bottomText: '',
            order: normalizedFeatures.length,
            isActive: true
        });
        setIsEditing(true);
    };

    const handleEdit = (feature) => {
        setEditForm({ ...feature });
        setIsEditing(true);
    };

    const handleSaveForm = async () => {
        const topText = editForm?.topText?.trim();
        const bottomText = editForm?.bottomText?.trim();

        if (!topText || !bottomText) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            if (editForm._id || editForm.id) {
                await updateSignalMutation.mutateAsync({
                    id: editForm._id || editForm.id,
                    data: {
                        ...editForm,
                        topText,
                        bottomText
                    }
                });
            } else {
                await addSignalMutation.mutateAsync({
                    ...editForm,
                    topText,
                    bottomText
                });
            }
            setIsEditing(false);
            setEditForm(null);
        } catch (error) { }
    };

    const handleDelete = async () => {
        const id = editForm?._id || editForm?.id;
        if (!id) {
            setIsEditing(false);
            setEditForm(null);
            return;
        }

        try {
            await deleteSignalMutation.mutateAsync(id);
            setIsEditing(false);
            setEditForm(null);
        } catch (error) { }
    };

    return (
        <div className="space-y-8 font-['Inter'] pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white text-footerBg rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-all group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-[#1a1a1a] uppercase tracking-tight">Why Choose Us</h1>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-[0.2em]">Manage trust signals on homepage</p>
                    </div>
                </div>

                <button
                    onClick={handleAddFeature}
                    className="inline-flex items-center justify-center gap-3 self-start md:self-auto px-6 py-4 rounded-2xl bg-primary text-white font-black text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus size={18} strokeWidth={3} />
                    <span>Add Feature</span>
                </button>
            </div>

            {/* Live Preview Section */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 overflow-hidden">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Live Preview</h3>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wide">Desktop View</span>
                </div>

                {/* The Preview Component replicating the dark blue bar */}
                <div className="w-full bg-[#0F172A] rounded-2xl p-8 shadow-xl">
                    <div className="flex flex-wrap items-center justify-center divide-x divide-gray-700/50">
                        {activeFeatures.slice(0, 4).map((feature) => {
                            const IconComponent = ICON_OPTIONS[feature.icon] || Star;
                            return (
                                <div key={feature.featureId} className="flex-1 min-w-[200px] px-6 py-4 flex flex-col items-center text-center gap-3 group cursor-default">
                                    <div className="relative">
                                        <IconComponent size={32} className="text-white stroke-1" />
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0F172A]"></span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{feature.topText}</span>
                                        <span className="text-sm font-black text-white tracking-wide">{feature.bottomText}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Editor / List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {normalizedFeatures.slice(0, 4).map((feature) => {
                    const IconComponent = ICON_OPTIONS[feature.icon] || Star;
                    return (
                        <div key={feature.featureId} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group relative">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(feature)}
                                    className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg transition-all"
                                >
                                    <Edit2 size={16} />
                                </button>
                            </div>

                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                                    <IconComponent size={32} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{feature.topText}</p>
                                    <h3 className="text-sm font-black text-gray-900">{feature.bottomText}</h3>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Edit Modal / Form Overlay */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-6">
                            {editForm?._id || editForm?.id ? 'Edit Feature' : 'Add New Feature'}
                        </h2>

                        <div className="space-y-4">
                            {/* Icon Selection */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Select Icon</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {Object.keys(ICON_OPTIONS).map((iconName) => {
                                        const Icon = ICON_OPTIONS[iconName];
                                        return (
                                            <button
                                                key={iconName}
                                                onClick={() => setEditForm(prev => ({ ...prev, icon: iconName }))}
                                                className={`p-3 rounded-xl flex items-center justify-center transition-all ${editForm.icon === iconName
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                                                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                                    }`}
                                            >
                                                <Icon size={20} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Text Inputs */}
                            <div className="space-y-4 pt-2">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Top Text (Small)</label>
                                    <input
                                        type="text"
                                        value={editForm.topText}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, topText: e.target.value.toUpperCase() }))}
                                        placeholder="E.G. FREE SHIPPING ON"
                                        className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary rounded-xl px-4 py-3 font-bold text-sm outline-none transition-all placeholder:text-gray-300"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Bottom Text (Bold)</label>
                                    <input
                                        type="text"
                                        value={editForm.bottomText}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, bottomText: e.target.value }))}
                                        placeholder="E.g. Orders Above ₹1499"
                                        className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary rounded-xl px-4 py-3 font-black text-sm outline-none transition-all placeholder:text-gray-300"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            {(editForm?._id || editForm?.id) && (
                                <button
                                    onClick={handleDelete}
                                    className="py-3 px-4 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all"
                                    title="Delete feature"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditForm(null);
                                }}
                                className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveForm}
                                disabled={addSignalMutation.isPending || updateSignalMutation.isPending}
                                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primaryDeep shadow-lg shadow-primary/20 transition-all text-sm"
                            >
                                {addSignalMutation.isPending || updateSignalMutation.isPending
                                    ? 'Saving...'
                                    : editForm?._id || editForm?.id
                                        ? 'Save Changes'
                                        : 'Add Feature'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhyChooseUsPage;
