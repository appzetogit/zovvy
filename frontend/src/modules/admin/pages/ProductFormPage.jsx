import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/apiUrl';
import {

    ArrowLeft,
    Save,
    Plus,
    Trash2,
    ImageIcon,
    Tag as TagIcon,
    Package,
    Info,
    ChevronRight,
    Search,
    Star
} from 'lucide-react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import BlotFormatter from 'quill-blot-formatter';
import { useProducts, useProduct, useAddProduct, useUpdateProduct, useCategories, useSubCategories, useUploadImage } from '../../../hooks/useProducts';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Register BlotFormatter
if (typeof window !== 'undefined' && Quill) {
    Quill.register('modules/blotFormatter', BlotFormatter);
}

const API_URL = API_BASE_URL;

// Predefined Options for Dropdowns
const NUTRITION_LABELS = [
    'Energy (kcal)',
    'Protein (g)',
    'Added Sugar (g)',
    'Total Fat (g)',
    'Dietary Fibre',
    'Saturated Fatty Acid (g)',
    'Trans Fatty Acid (g)',
    'Calcium as Ca',
    'Potassium as K',
    'Sodium as Na',
    'Iron as Fe',
    'Vitamin D (Ergocalciferol)',
    'Carbohydrate',
    'Total Sugar as inverted sugar',
    'Cholesterol'
];
const SPECIFICATION_LABELS = ['Origin', 'Shelf Life', 'Ingredients', 'Storage Instructions', 'Allergen Info', 'FSSAI License', 'Manufacturer', 'Country of Manufacture'];
const FAQ_QUESTIONS = [
    'How should I store this product?',
    'What is the shelf life?',
    'Is this product gluten-free?',
    'Does it contain any preservatives?',
    'Is it suitable for vegans?',
    'Where is this sourced from?',
    'How to use this product?'
];
const BENEFIT_TITLES = [
    'Rich in Antioxidants', 'Heart Healthy', 'Boosts Immunity', 'High Protein', 'Rich in Fiber', 'Good for Digestion', 'Weight Management', 'Energy Booster', 'Skin Health', 'Bone Health'
];

const UNIT_OPTIONS = ['g', 'kg'];

const stripHtml = (value = '') => String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const toTrimmedString = (value) => String(value ?? '').trim();

const isPositiveNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) && num > 0;
};

const isNonNegativeNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) && num >= 0;
};

const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== '';

const getLegacyVariantSku = (product, variant, index) => {
    const brandCode = (product?.brand || 'SKU')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 3)
        .toUpperCase() || 'SKU';
    const sizeCode = (
        variant?.quantity && variant?.unit
            ? `${variant.quantity}${variant.unit}`
            : variant?.weight || 'VAR'
    )
        .replace(/\s+/g, '')
        .toUpperCase();

    return `${brandCode}-${sizeCode}-${index + 1}`;
};

const normalizeVariantForForm = (product, variant, index) => {
    const quantity = variant.quantity || variant.weight?.match(/^\d*\.?\d+/)?.[0] || '';
    const unit = variant.unit || variant.weight?.match(/[a-zA-Z]+$/)?.[0] || 'g';

    return {
        ...variant,
        id: variant.id || variant._id || `${Date.now()}-${index}`,
        sku: variant.sku || getLegacyVariantSku(product, { ...variant, quantity, unit }, index),
        quantity,
        unit,
        length: variant.length ?? '',
        breadth: variant.breadth ?? '',
        height: variant.height ?? '',
    };
};

const sanitizeStructuredItems = (items = [], requiredKeys = []) =>
    (Array.isArray(items) ? items : [])
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const sanitized = Object.fromEntries(
                Object.entries(item).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
            );
            const hasValue = requiredKeys.some((key) => toTrimmedString(sanitized[key]));
            return hasValue ? sanitized : null;
        })
        .filter(Boolean);

const validateProductForm = (formData) => {
    const errors = {};
    const trimmedName = toTrimmedString(formData.name);
    const trimmedBrand = toTrimmedString(formData.brand);
    const plainDescription = stripHtml(formData.description);
    const variants = Array.isArray(formData.variants) ? formData.variants : [];
    const variantErrors = [];

    if (!trimmedName) {
        errors.name = 'Product name is required.';
    }

    if (!trimmedBrand) {
        errors.brand = 'Brand name is required.';
    }

    if (!formData.category) {
        errors.category = 'Parent category is required.';
    }

    if (!plainDescription) {
        errors.description = 'Product description is required.';
    }

    if (!toTrimmedString(formData.image)) {
        errors.image = 'Primary product image is required.';
    }

    if (!variants.length) {
        errors.variants = 'At least one variant is required.';
    }

    variants.forEach((variant, index) => {
        const currentErrors = {};

        if (!isPositiveNumber(variant.quantity)) {
            currentErrors.quantity = 'Enter a valid quantity.';
        }

        if (!UNIT_OPTIONS.includes(variant.unit)) {
            currentErrors.unit = 'Select a valid unit.';
        }

        if (!isPositiveNumber(variant.mrp)) {
            currentErrors.mrp = 'MRP must be greater than 0.';
        }

        if (!isPositiveNumber(variant.price)) {
            currentErrors.price = 'Selling price must be greater than 0.';
        }

        if (isPositiveNumber(variant.mrp) && isPositiveNumber(variant.price) && Number(variant.price) > Number(variant.mrp)) {
            currentErrors.price = 'Selling price cannot exceed MRP.';
        }

        if (!isNonNegativeNumber(variant.stock)) {
            currentErrors.stock = 'Stock cannot be negative.';
        }

        const providedDimensions = ['length', 'breadth', 'height'].filter((key) => hasValue(variant[key]));
        if (providedDimensions.length > 0 && providedDimensions.length < 3) {
            const message = 'Fill all dimensions or leave them blank.';
            currentErrors.length = message;
            currentErrors.breadth = message;
            currentErrors.height = message;
        } else {
            ['length', 'breadth', 'height'].forEach((key) => {
                if (hasValue(variant[key]) && !isPositiveNumber(variant[key])) {
                    currentErrors[key] = 'Must be greater than 0.';
                }
            });
        }

        if (Object.keys(currentErrors).length) {
            variantErrors[index] = currentErrors;
        }
    });

    if (variantErrors.length) {
        errors.variantRows = variantErrors;
    }

    return errors;
};

const buildProductPayload = (formData, { isEdit, id }) => {
    const trimmedName = toTrimmedString(formData.name);
    const trimmedBrand = toTrimmedString(formData.brand);
    const cleanedVariants = (Array.isArray(formData.variants) ? formData.variants : []).map((variant, index) => {
        const quantity = toTrimmedString(variant.quantity);
        const unit = toTrimmedString(variant.unit || 'g');
        return {
            ...variant,
            id: variant.id || `${Date.now()}-${index}`,
            sku: toTrimmedString(variant.sku) || getLegacyVariantSku({ brand: trimmedBrand }, { ...variant, quantity, unit }, index),
            quantity,
            unit,
            weight: quantity && unit ? `${quantity}${unit}` : toTrimmedString(variant.weight),
            length: hasValue(variant.length) ? Number(variant.length) : undefined,
            breadth: hasValue(variant.breadth) ? Number(variant.breadth) : undefined,
            height: hasValue(variant.height) ? Number(variant.height) : undefined,
            mrp: Number(variant.mrp),
            price: Number(variant.price),
            stock: Number(variant.stock),
            unitPrice: toTrimmedString(variant.unitPrice),
        };
    });

    return {
        ...formData,
        id: isEdit ? id : `prod_${Date.now()}`,
        name: trimmedName,
        brand: trimmedBrand,
        image: toTrimmedString(formData.image),
        category: toTrimmedString(formData.category),
        subcategory: toTrimmedString(formData.subcategory),
        tag: toTrimmedString(formData.tag),
        description: formData.description,
        rating: Number(formData.rating) || 0,
        images: (Array.isArray(formData.images) ? formData.images : []).map((img) => toTrimmedString(img)).filter(Boolean),
        variants: cleanedVariants,
        benefits: sanitizeStructuredItems(formData.benefits, ['title', 'description']),
        specifications: sanitizeStructuredItems(formData.specifications, ['label', 'value']),
        faqs: sanitizeStructuredItems(formData.faqs, ['q', 'a']),
        nutrition: sanitizeStructuredItems(formData.nutrition, ['label', 'per100g', 'perServe']),
        seoTitle: toTrimmedString(formData.seoTitle),
        seoDescription: toTrimmedString(formData.seoDescription),
        seoImage: toTrimmedString(formData.seoImage),
        updatedAt: Date.now()
    };
};

const SuggestionInput = ({ value, onChange, placeholder, options }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative w-full group/combo z-10 focus-within:z-[120]">
            <input
                type="text"
                value={value}
                onChange={onChange}
                onFocus={() => setShow(true)}
                onBlur={() => setTimeout(() => setShow(false), 200)}
                placeholder={placeholder}
                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs font-bold text-black outline-none focus:border-black transition-all"
            />
            {show && (
                <div className="absolute top-full left-0 mt-1 w-[20rem] max-w-[32rem] bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-[130]">
                    {options.filter(o => o.toLowerCase().includes(value.toLowerCase())).map((opt, i) => (
                        <div
                            key={i}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-xs font-medium text-gray-700"
                            onMouseDown={() => onChange({ target: { value: opt } })}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ProductFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: products = [] } = useProducts();
    const { data: productToEdit } = useProduct(id);

    // Mutations
    const addProductMutation = useAddProduct();
    const updateProductMutation = useUpdateProduct();
    const uploadImageMutation = useUploadImage();
    const { data: dbCategories = [] } = useCategories();
    const { data: dbSubCategories = [] } = useSubCategories();

    // Fetch Combo Categories
    const { data: dbComboCategories = [] } = useQuery({
        queryKey: ['combo-categories'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/combo-categories`);
            return res.json();
        }
    });

    const isEdit = Boolean(id);
    const [validationErrors, setValidationErrors] = useState({});

    const [formData, setFormData] = useState({
        name: '',
        brand: 'ZOVVY',
        category: 'nuts',
        subcategory: '',
        tag: '',
        image: '',
        images: [],
        description: '',
        rating: 4.5,
        variants: [
            { id: Date.now(), sku: '', weight: '', quantity: '', unit: 'g', length: '', breadth: '', height: '', mrp: '', price: '', stock: 100, unitPrice: '' }
        ],
        benefits: [
            { title: 'Heart-Healthy', description: 'Contains healthy fats good for the heart.' }
        ],
        specifications: [
            { label: 'Origin', value: 'India' },
            { label: 'Shelf Life', value: '6 Months' }
        ],
        faqs: [
            { q: 'How to store?', a: 'Store in a cool, dry place.' }
        ],
        nutrition: [
            { label: 'Energy', per100g: '576 Kcal', perServe: '' },
            { label: 'Protein', per100g: '21g', perServe: '' },
            { label: 'Fat', per100g: '49g', perServe: '' },
            { label: 'Carbs', per100g: '22g', perServe: '' }
        ],
        contents: [], // For combo products
        seoTitle: '',
        seoDescription: '',
        seoImage: ''
    });

    useEffect(() => {
        if (isEdit && productToEdit) {
            // Normalize nutrition data
            let normalizedNutrition = productToEdit.nutrition || [];
            if (productToEdit.nutrition && !Array.isArray(productToEdit.nutrition)) {
                normalizedNutrition = Object.entries(productToEdit.nutrition).map(([key, value]) => ({
                    label: key.charAt(0).toUpperCase() + key.slice(1),
                    per100g: String(value),
                    perServe: ''
                }));
            }

            normalizedNutrition = normalizedNutrition.map((item) => ({
                label: item.label || '',
                per100g: item.per100g || item.value || '',
                perServe: item.perServe || item.dailyValue || ''
            }));

            // Normalize benefits
            let normalizedBenefits = productToEdit.benefits || [];
            if (normalizedBenefits.length > 0 && typeof normalizedBenefits[0] === 'string') {
                normalizedBenefits = normalizedBenefits.map(b => ({ title: b, description: '' }));
            }

            setFormData(prev => ({
                ...prev, // Keep defaults if db fields are missing
                ...productToEdit,
                variants: productToEdit.variants?.length
                    ? productToEdit.variants.map((variant, index) => normalizeVariantForForm(productToEdit, variant, index))
                    : prev.variants,
                nutrition: normalizedNutrition.length ? normalizedNutrition : prev.nutrition,
                specifications: productToEdit.specifications?.length ? productToEdit.specifications : prev.specifications,
                faqs: productToEdit.faqs?.length ? productToEdit.faqs : prev.faqs,
                benefits: normalizedBenefits.length ? normalizedBenefits : prev.benefits,
                images: productToEdit.images || [],
                contents: productToEdit.contents || [],
                seoTitle: productToEdit.seoTitle || '',
                seoDescription: productToEdit.seoDescription || '',
                seoImage: productToEdit.seoImage || ''
            }));
        }
    }, [isEdit, productToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValidationErrors(prev => {
            if (!prev[name]) return prev;
            const next = { ...prev };
            delete next[name];
            return next;
        });
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleVariantChange = (vId, field, value) => {
        const variantIndex = formData.variants.findIndex(v => v.id === vId);
        if (variantIndex >= 0) {
            setValidationErrors(prev => {
                if (!prev.variantRows?.[variantIndex]?.[field]) return prev;
                const next = { ...prev, variantRows: [...prev.variantRows] };
                next.variantRows[variantIndex] = { ...next.variantRows[variantIndex] };
                delete next.variantRows[variantIndex][field];
                if (Object.keys(next.variantRows[variantIndex]).length === 0) {
                    next.variantRows[variantIndex] = undefined;
                }
                if (!next.variantRows.some(Boolean)) {
                    delete next.variantRows;
                }
                return next;
            });
        }

        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map(v => {
                if (v.id !== vId) return v;

                const updatedVariant = { ...v, [field]: value };

                // Auto-update legacy 'weight' string for compatibility
                if (field === 'quantity' || field === 'unit') {
                    const q = field === 'quantity' ? value : (v.quantity || '');
                    const u = field === 'unit' ? value : (v.unit || 'g');
                    updatedVariant.weight = q && u ? `${q}${u}` : v.weight;
                }

                return updatedVariant;
            })
        }));
    };

    const addVariant = () => {
        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, { id: Date.now(), sku: '', weight: '', quantity: '', unit: 'g', length: '', breadth: '', height: '', mrp: '', price: '', stock: 0, unitPrice: '' }]
        }));
    };

    const removeVariant = (vId) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter(v => v.id !== vId)
        }));
    };

    const addItem = (field, item) => {
        setFormData(prev => ({ ...prev, [field]: [...prev[field], item] }));
    };

    const removeItem = (field, index) => {
        setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
    };

    const updateItem = (field, index, subfield, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].map((item, i) => {
                if (i !== index) return item;
                return typeof item === 'string' ? value : { ...item, [subfield]: value };
            })
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const errors = validateProductForm(formData);
        if (Object.keys(errors).length) {
            setValidationErrors(errors);
            const firstVariantError = errors.variantRows?.find(Boolean);
            const firstErrorMessage = errors.name
                || errors.brand
                || errors.category
                || errors.description
                || errors.image
                || errors.variants
                || (firstVariantError ? Object.values(firstVariantError)[0] : null)
                || 'Please fix the highlighted fields.';
            toast.error(firstErrorMessage);
            return;
        }

        const finalData = buildProductPayload(formData, { isEdit, id });

        try {
            if (isEdit) {
                await updateProductMutation.mutateAsync({ id, data: finalData });
            } else {
                await addProductMutation.mutateAsync(finalData);
            }
            navigate('/admin/products');
        } catch (error) {
            console.error('Failed to save product:', error);
            // Error toast is handled by the hook
        }
    };

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-left">
                    <button
                        onClick={() => navigate('/admin/products')}
                        className="p-3 bg-white text-footerBg rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:bg-footerBg hover:text-white transition-all group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-footerBg uppercase tracking-tight">
                            {isEdit ? 'Edit Product' : 'Add New Product'}
                        </h1>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-[0.2em]">
                            {isEdit ? `Updating ${formData.name}` : 'Configure your new premium product'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    type="button"
                    className="bg-black text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-gray-900 transition-all shadow-xl shadow-black/10"
                >
                    <Save size={18} /> Save Product
                </button>
            </div>

            <form className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Side: Basic Details */}
                <div className="lg:col-span-8 space-y-8">
                    {/* General Information */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-300 shadow-sm space-y-8">
                        <h3 className="text-lg font-black text-primary uppercase tracking-widest flex items-center gap-2">
                            <Info size={20} className="text-primary" />
                            General Information
                        </h3>

                        <div className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-black text-black uppercase tracking-widest ml-1 text-left">Product Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g., Premium Royal Cashews"
                                    className={`w-full bg-white border rounded-2xl p-4 text-sm font-bold text-black outline-none transition-all ${validationErrors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'}`}
                                />
                                {validationErrors.name && <p className="text-xs font-semibold text-red-600">{validationErrors.name}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black text-black uppercase tracking-widest ml-1 text-left">Brand Name</label>
                                    <input
                                        type="text"
                                        name="brand"
                                        value={formData.brand}
                                        onChange={handleChange}
                                        className={`w-full bg-white border rounded-2xl p-4 text-sm font-bold text-black outline-none transition-all ${validationErrors.brand ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'}`}
                                    />
                                    {validationErrors.brand && <p className="text-xs font-semibold text-red-600">{validationErrors.brand}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black text-black uppercase tracking-widest ml-1 text-left">Product Rating (0-5)</label>
                                    <div className="flex items-center gap-4 bg-white border border-gray-300 rounded-2xl p-3">
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                                                    className="focus:outline-none transition-transform hover:scale-110"
                                                >
                                                    <Star
                                                        size={20}
                                                        className={star <= Math.round(formData.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="number"
                                            name="rating"
                                            value={formData.rating}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val) && val >= 0 && val <= 5) {
                                                    setFormData(prev => ({ ...prev, rating: val }));
                                                }
                                            }}
                                            step="0.1"
                                            min="0"
                                            max="5"
                                            className="w-16 bg-gray-50 border border-gray-100 rounded-lg p-2 text-sm font-black text-center outline-none focus:bg-white focus:border-black transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 text-left">
                                <label className="text-xs font-black text-black uppercase tracking-widest ml-1">Best-Seller Tag</label>
                                <select
                                    name="tag"
                                    value={formData.tag}
                                    onChange={handleChange}
                                    className="w-full bg-white border border-gray-300 rounded-2xl p-4 text-sm font-bold text-black outline-none focus:border-black transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">None</option>
                                    <option value="PREMIUM">Premium</option>
                                    <option value="BESTSELLER">Bestseller</option>
                                    <option value="NEW LAUNCH">New Launch</option>
                                    <option value="FRESH">Fresh</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-2 text-left">
                                <label className="text-xs font-black text-black uppercase tracking-widest ml-1">Product Description</label>
                                <div className="bg-white rounded-3xl overflow-hidden border border-gray-300 focus-within:border-black transition-all">
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.description}
                                        onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                                        placeholder="Describe the product health benefits and sourcing..."
                                        className="h-64 mb-12" // mb-12 to make space for the toolbar if needed or bottom bar
                                        modules={{
                                            toolbar: [
                                                [{ 'header': [1, 2, 3, false] }],
                                                ['bold', 'italic', 'underline', 'strike'],
                                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                ['link', 'image', 'clean']
                                            ],
                                            blotFormatter: {}
                                        }}
                                    />
                                </div>
                                {validationErrors.description && <p className="text-xs font-semibold text-red-600">{validationErrors.description}</p>}
                            </div>

                            {/* Benefits Section - Moved Inside */}
                            <div className="pt-8 border-t border-gray-100 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-green-700 uppercase tracking-[0.2em] flex items-center gap-2">Health Benefits</h3>
                                    <button type="button" onClick={() => addItem('benefits', { title: '', description: '' })} className="text-[10px] font-black text-primary uppercase">+ Add Benefit</button>
                                </div>
                                <div className="p-4 border border-gray-300 rounded-2xl bg-gray-50/50 space-y-4">
                                    {formData.benefits?.map((benefit, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <div className="w-1/3 relative">
                                                <input
                                                    list={`benefit-options-${idx}`}
                                                    placeholder="Title (e.g. Rich in Vitamin E)"
                                                    value={benefit.title}
                                                    onChange={(e) => updateItem('benefits', idx, 'title', e.target.value)}
                                                    className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs font-bold text-green-600 outline-none focus:border-black transition-all"
                                                />
                                                <datalist id={`benefit-options-${idx}`}>
                                                    {BENEFIT_TITLES.map((opt, i) => <option key={i} value={opt} />)}
                                                </datalist>
                                            </div>
                                            <input
                                                placeholder="Description (e.g. Almonds are among the world's best sources...)"
                                                value={benefit.description}
                                                onChange={(e) => updateItem('benefits', idx, 'description', e.target.value)}
                                                className="flex-1 bg-white border border-gray-300 rounded-xl p-3 text-xs font-bold text-black outline-none focus:border-black transition-all"
                                            />
                                            <button type="button" onClick={() => removeItem('benefits', idx)} className="text-red-400 hover:text-red-600 self-center">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pack Contents Section - Moved Inside */}

                            {/* FAQ Section - Moved Inside */}
                            <div className="pt-8 border-t border-gray-100 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-green-700 uppercase tracking-[0.2em]">Product FAQs</h3>
                                    <button type="button" onClick={() => addItem('faqs', { q: '', a: '' })} className="text-[10px] font-black text-primary uppercase">+ Add Q&A</button>
                                </div>
                                <div className="p-4 border border-gray-300 rounded-2xl bg-gray-50/50 space-y-4">
                                    {formData.faqs.map((faq, idx) => (
                                        <div key={idx} className="space-y-2 relative">
                                            <button type="button" onClick={() => removeItem('faqs', idx)} className="absolute top-0 right-0 z-10 text-red-400"><Trash2 size={16} /></button>
                                            <div className="relative mb-2 pr-6">
                                                <input
                                                    list={`faq-options-${idx}`}
                                                    placeholder="Question"
                                                    value={faq.q}
                                                    onChange={(e) => updateItem('faqs', idx, 'q', e.target.value)}
                                                    className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs font-black text-black outline-none focus:border-black transition-all"
                                                />
                                                <datalist id={`faq-options-${idx}`}>
                                                    {FAQ_QUESTIONS.map((opt, i) => <option key={i} value={opt} />)}
                                                </datalist>
                                            </div>
                                            <textarea
                                                placeholder="Answer"
                                                value={faq.a}
                                                onChange={(e) => updateItem('faqs', idx, 'a', e.target.value)}
                                                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs font-semibold text-black outline-none focus:border-black transition-all"
                                                rows="2"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Nutrition */}
                    <div className="relative overflow-visible bg-white p-8 rounded-[2.5rem] border border-gray-300 shadow-sm space-y-6 text-left z-30">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-green-700 uppercase tracking-widest flex items-center gap-2">
                                Nutrition
                            </h3>
                            <button
                                type="button"
                                onClick={() => addItem('nutrition', { label: '', per100g: '', perServe: '' })}
                                className="text-[10px] font-black text-primary uppercase"
                            >
                                + Add
                            </button>
                        </div>

                        <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 px-1 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            <span>Nutritional Information (Approx)</span>
                            <span>Per 100g</span>
                            <span>% Daily Value / Per Serve</span>
                            <span></span>
                        </div>

                        <div className="space-y-3">
                            {Array.isArray(formData.nutrition) && formData.nutrition.map((nut, idx) => (
                                <div key={idx} className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 items-center relative z-10 focus-within:z-[110]">
                                    <div className="relative">
                                        <SuggestionInput
                                            value={nut.label}
                                            onChange={(e) => updateItem('nutrition', idx, 'label', e.target.value)}
                                            placeholder="Nutrient"
                                            options={NUTRITION_LABELS}
                                        />
                                    </div>
                                    <input
                                        placeholder="Per 100g"
                                        value={nut.per100g || ''}
                                        onChange={(e) => updateItem('nutrition', idx, 'per100g', e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs font-bold text-black outline-none focus:border-black transition-all"
                                    />
                                    <input
                                        placeholder="Per serve / %DV"
                                        value={nut.perServe || ''}
                                        onChange={(e) => updateItem('nutrition', idx, 'perServe', e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs font-bold text-black outline-none focus:border-black transition-all"
                                    />
                                    <button type="button" onClick={() => removeItem('nutrition', idx)} className="text-red-400 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {(!Array.isArray(formData.nutrition) || formData.nutrition.length === 0) && (
                                <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">No data</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pricing & Variants */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-300 shadow-sm space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                <Package size={20} className="text-primary" />
                                Pricing & Variants
                            </h3>
                            <button
                                type="button"
                                onClick={addVariant}
                                className="text-[10px] font-black text-footerBg uppercase tracking-widest flex items-center gap-1 hover:underline"
                            >
                                <Plus size={14} strokeWidth={3} /> Add Variant
                            </button>
                        </div>

                        {/* Table Header */}
                        <div className="grid grid-cols-16 gap-4 px-4 mb-2">
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1 text-left">SKU Code</label>
                            </div>
                            <div className="col-span-3">
                                <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1 text-left">Quantity / Unit</label>
                            </div>
                            <div className="col-span-5">
                                <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1 text-left">Dimensions (cm)</label>
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1 text-left">MRP (₹)</label>
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1 text-left">Selling (₹)</label>
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1 text-left">Stock (Qty)</label>
                            </div>
                            <div className="col-span-1"></div>
                        </div>

                        <div className="space-y-3">
                            {formData.variants.map((variant, index) => (
                                <div key={variant.id} className="p-4 rounded-3xl bg-gray-50 border border-gray-100 grid grid-cols-16 gap-4 items-start group">
                                    <div className="col-span-16 xl:col-span-2">
                                        <input
                                            type="text"
                                            value={variant.sku}
                                            onChange={(e) => handleVariantChange(variant.id, 'sku', e.target.value)}
                                            placeholder="e.g. ALM-R-250"
                                            className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs font-bold text-black outline-none focus:border-black transition-all"
                                        />
                                    </div>
                                    <div className="col-span-16 xl:col-span-3">
                                        <div className={`flex items-center bg-white border rounded-xl transition-all ${validationErrors.variantRows?.[index]?.quantity || validationErrors.variantRows?.[index]?.unit ? 'border-red-500 focus-within:border-red-500' : 'border-gray-300 focus-within:border-black'}`}>
                                            <input
                                                type="number"
                                                value={variant.quantity || ''}
                                            onChange={(e) => handleVariantChange(variant.id, 'quantity', e.target.value)}
                                            placeholder="250"
                                            className="w-full bg-transparent p-3 text-xs font-bold text-black outline-none"
                                            />
                                            <div className="w-px h-6 bg-gray-200"></div>
                                            <select
                                                value={variant.unit || 'g'}
                                                onChange={(e) => handleVariantChange(variant.id, 'unit', e.target.value)}
                                                className="bg-transparent px-4 py-3 text-xs font-bold text-black outline-none cursor-pointer hover:bg-gray-50 rounded-r-xl"
                                            >
                                                {UNIT_OPTIONS.map(unit => (
                                                    <option key={unit} value={unit}>{unit}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {(validationErrors.variantRows?.[index]?.quantity || validationErrors.variantRows?.[index]?.unit) && (
                                            <p className="mt-1 text-xs font-semibold text-red-600">
                                                {validationErrors.variantRows?.[index]?.quantity || validationErrors.variantRows?.[index]?.unit}
                                            </p>
                                        )}
                                    </div>
                                    <div className="col-span-16 xl:col-span-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={variant.length ?? ''}
                                                onChange={(e) => handleVariantChange(variant.id, 'length', e.target.value)}
                                                placeholder="Length"
                                                className={`w-full bg-white border rounded-xl px-4 py-3.5 text-sm font-bold text-black outline-none transition-all ${validationErrors.variantRows?.[index]?.length ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'}`}
                                            />
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={variant.breadth ?? ''}
                                                onChange={(e) => handleVariantChange(variant.id, 'breadth', e.target.value)}
                                                placeholder="Breadth"
                                                className={`w-full bg-white border rounded-xl px-4 py-3.5 text-sm font-bold text-black outline-none transition-all ${validationErrors.variantRows?.[index]?.breadth ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'}`}
                                            />
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={variant.height ?? ''}
                                                onChange={(e) => handleVariantChange(variant.id, 'height', e.target.value)}
                                                placeholder="Height"
                                                className={`w-full bg-white border rounded-xl px-4 py-3.5 text-sm font-bold text-black outline-none transition-all ${validationErrors.variantRows?.[index]?.height ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'}`}
                                            />
                                        </div>
                                        {(validationErrors.variantRows?.[index]?.length || validationErrors.variantRows?.[index]?.breadth || validationErrors.variantRows?.[index]?.height) && (
                                            <p className="mt-1 text-xs font-semibold text-red-600">
                                                {validationErrors.variantRows?.[index]?.length || validationErrors.variantRows?.[index]?.breadth || validationErrors.variantRows?.[index]?.height}
                                            </p>
                                        )}
                                    </div>
                                    <div className="col-span-8 sm:col-span-5 xl:col-span-2">
                                        <input
                                            type="number"
                                            value={variant.mrp}
                                            onChange={(e) => handleVariantChange(variant.id, 'mrp', e.target.value)}
                                            className={`w-full bg-white border rounded-xl p-3 text-xs font-bold text-black outline-none transition-all ${validationErrors.variantRows?.[index]?.mrp ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'}`}
                                        />
                                        {validationErrors.variantRows?.[index]?.mrp && <p className="mt-1 text-xs font-semibold text-red-600">{validationErrors.variantRows[index].mrp}</p>}
                                    </div>
                                    <div className="col-span-8 sm:col-span-5 xl:col-span-2">
                                        <input
                                            type="number"
                                            value={variant.price}
                                            onChange={(e) => handleVariantChange(variant.id, 'price', e.target.value)}
                                            className={`w-full bg-white border rounded-xl p-3 text-xs font-bold text-black outline-none transition-all ${validationErrors.variantRows?.[index]?.price ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'}`}
                                        />
                                        {validationErrors.variantRows?.[index]?.price && <p className="mt-1 text-xs font-semibold text-red-600">{validationErrors.variantRows[index].price}</p>}
                                    </div>
                                    <div className="col-span-8 sm:col-span-5 xl:col-span-2">
                                        <input
                                            type="number"
                                            value={variant.stock}
                                            onChange={(e) => handleVariantChange(variant.id, 'stock', e.target.value)}
                                            className={`w-full bg-white border rounded-xl p-3 text-xs font-bold text-black outline-none transition-all ${validationErrors.variantRows?.[index]?.stock ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'}`}
                                        />
                                        {validationErrors.variantRows?.[index]?.stock && <p className="mt-1 text-xs font-semibold text-red-600">{validationErrors.variantRows[index].stock}</p>}
                                    </div>
                                    <div className="col-span-16 xl:col-span-1 text-center xl:self-center">
                                        <button
                                            type="button"
                                            onClick={() => removeVariant(variant.id)}
                                            className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                                            disabled={formData.variants.length === 1}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {validationErrors.variants && <p className="text-xs font-semibold text-red-600">{validationErrors.variants}</p>}
                            {validationErrors.variantRows?.some(Boolean) && !validationErrors.variants && (
                                <p className="text-xs font-semibold text-red-600">Please correct the invalid variant values.</p>
                            )}
                        </div>
                    </div>

                </div>

                {/* Right Side: Media & Classification */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Media */}
                    <div className="relative overflow-visible bg-white p-8 rounded-[2.5rem] border border-gray-300 shadow-sm space-y-6 text-left z-20">
                        <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                            <ImageIcon size={18} className="text-primary" />
                            Product Image
                        </h3>

                        <div className="aspect-square bg-gray-50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-6 relative group overflow-hidden">
                            {uploadImageMutation.isPending && (
                                <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center space-y-3">
                                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Uploading...</p>
                                </div>
                            )}
                            {formData.image ? (
                                <>
                                    <img src={formData.image} alt="Preview" className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-footerBg/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                            className="bg-white text-red-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-all group/label">
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*,.avif"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const res = await uploadImageMutation.mutateAsync(file);
                                                if (res?.url) {
                                                    setFormData(prev => ({ ...prev, image: res.url }));
                                                }
                                            }
                                        }}
                                    />
                                    <div className="text-center space-y-2">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-300 mx-auto shadow-sm group-hover/label:scale-110 transition-transform">
                                            <ImageIcon size={24} />
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Click to Upload</p>
                                        <p className="text-[8px] text-gray-300">Max size 5MB</p>
                                    </div>
                                </label>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1 text-left">Internal Image Path / URL</label>
                            <input
                                type="text"
                                name="image"
                                value={formData.image}
                                onChange={handleChange}
                                placeholder="Auto-fills on upload or paste path..."
                                className={`w-full bg-white border rounded-2xl p-4 text-xs font-bold text-black outline-none transition-all ${validationErrors.image ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'}`}
                            />
                            {validationErrors.image && <p className="text-xs font-semibold text-red-600">{validationErrors.image}</p>}
                        </div>

                        <div className="pt-6 border-t border-gray-200">
                            <h3 className="text-[10px] font-black text-green-700 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Search size={14} className="text-green-700" />
                                Product Gallery
                            </h3>

                            <div className="grid grid-cols-3 gap-3">
                                {formData.images?.map((img, idx) => (
                                    <div key={idx} className="aspect-square bg-gray-50 rounded-2xl border border-gray-100 relative group overflow-hidden">
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeItem('images', idx)}
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}

                                <label className="aspect-square bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-all group/gallery">
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        multiple
                                        onChange={async (e) => {
                                            const files = Array.from(e.target.files || []);
                                            for (const file of files) {
                                                const res = await uploadImageMutation.mutateAsync(file);
                                                if (res?.url) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        images: [...(prev.images || []), res.url]
                                                    }));
                                                }
                                            }
                                        }}
                                    />
                                    <Plus size={16} className="text-gray-300 group-hover/gallery:text-primary transition-colors" />
                                    <span className="text-[8px] font-black text-gray-400 uppercase mt-1">Add</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Taxonomy */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-300 shadow-sm space-y-6 text-left">
                        <h3 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2">
                            <TagIcon size={18} className="text-black" />
                            Classification
                        </h3>

                        <div className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1 text-left">Parent Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className={`w-full bg-white border rounded-2xl p-4 text-xs font-bold text-black outline-none transition-all cursor-pointer ${validationErrors.category ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'}`}
                                >
                                    <option value="">Select Category</option>
                                    {dbCategories.filter(c => c.status === 'Active').map(cat => (
                                        <option key={cat.id || cat._id} value={cat.slug}>{cat.name}</option>
                                    ))}
                                    {/* Always show Combos & Packs option */}
                                    {!dbCategories.some(c => c.slug === 'combos-packs' && c.status === 'Active') && (
                                        <option value="combos-packs">Combos & Packs</option>
                                    )}
                                </select>
                                {validationErrors.category && <p className="text-xs font-semibold text-red-600">{validationErrors.category}</p>}
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1 text-left">Sub-Category</label>
                                <select
                                    name="subcategory"
                                    value={formData.subcategory}
                                    onChange={handleChange}
                                    className="w-full bg-white border border-gray-300 rounded-2xl p-4 text-xs font-bold text-black outline-none focus:border-black transition-all cursor-pointer"
                                >
                                    <option value="">None (Optional)</option>
                                    {/* Show regular subcategories for non-combo categories */}
                                    {formData.category !== 'combos-packs' && dbSubCategories
                                        .filter(sub => {
                                            const parentId = sub.parent?._id || sub.parent;
                                            const parentSlug = dbCategories.find(c => String(c._id || c.id) === String(parentId))?.slug;
                                            return parentSlug === formData.category && sub.status === 'Active';
                                        })
                                        .map(sub => (
                                            <option key={sub.id || sub._id} value={sub.name}>{sub.name}</option>
                                        ))
                                    }
                                    {/* Show combo categories when Combos & Packs is selected */}
                                    {formData.category === 'combos-packs' && dbComboCategories
                                        .filter(combo => combo.status === 'Active')
                                        .map(combo => (
                                            <option key={combo.id || combo._id} value={combo.name}>{combo.name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Specifications */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-300 shadow-sm space-y-6 text-left">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-purple-700 uppercase tracking-widest flex items-center gap-2">
                                Specifications
                            </h3>
                            <button type="button" onClick={() => addItem('specifications', { label: '', value: '' })} className="text-[10px] font-black text-primary uppercase">+ Add</button>
                        </div>
                        <div className="space-y-3">
                            {Array.isArray(formData.specifications) && formData.specifications.map((spec, idx) => (
                                <div key={idx} className="flex gap-2 items-center relative z-10 focus-within:z-[110]">
                                    <div className="w-1/3 relative">
                                        <SuggestionInput 
                                            value={spec.label}
                                            onChange={(e) => updateItem('specifications', idx, 'label', e.target.value)}
                                            placeholder="Label"
                                            options={SPECIFICATION_LABELS}
                                        />
                                    </div>
                                    <input
                                        placeholder="Value (e.g. India)"
                                        value={spec.value}
                                        onChange={(e) => updateItem('specifications', idx, 'value', e.target.value)}
                                        className="flex-1 bg-white border border-gray-300 rounded-xl p-3 text-xs font-bold text-black outline-none focus:border-black transition-all"
                                    />
                                    <button type="button" onClick={() => removeItem('specifications', idx)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                </div>
                            ))}
                            {(!Array.isArray(formData.specifications) || formData.specifications.length === 0) && (
                                <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">No specifications added</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </form>
        </div>
    );
};

export default ProductFormPage;
