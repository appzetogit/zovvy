import Product from '../models/Product.js';

const UNIT_OPTIONS = ['g', 'kg'];

const toTrimmedString = (value) => String(value ?? '').trim();

const stripHtml = (value = '') => String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const isPositiveNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) && num > 0;
};

const isNonNegativeNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) && num >= 0;
};

const parseOptionalPositiveNumber = (value) => {
    if (value === null || value === undefined || value === '') return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : NaN;
};

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

const normalizeNutrition = (nutrition = []) => {
    if (!Array.isArray(nutrition)) return nutrition;

    return nutrition.map((item) => ({
        label: item?.label || '',
        per100g: item?.per100g || item?.value || '',
        perServe: item?.perServe || item?.dailyValue || '',
        value: item?.value || item?.per100g || ''
    }));
};

const sanitizeProductPayload = (payload = {}, { idOverride } = {}) => {
    const name = toTrimmedString(payload.name);
    const brand = toTrimmedString(payload.brand);
    const variants = (Array.isArray(payload.variants) ? payload.variants : []).map((variant, index) => {
        const quantity = toTrimmedString(variant?.quantity);
        const unit = toTrimmedString(variant?.unit || 'g');
        return {
            ...variant,
            id: variant?.id || `${Date.now()}-${index}`,
            sku: toTrimmedString(variant?.sku) || getLegacyVariantSku({ brand }, { ...variant, quantity, unit }, index),
            weight: quantity && unit ? `${quantity}${unit}` : toTrimmedString(variant?.weight),
            quantity,
            unit,
            length: parseOptionalPositiveNumber(variant?.length),
            breadth: parseOptionalPositiveNumber(variant?.breadth),
            height: parseOptionalPositiveNumber(variant?.height),
            mrp: Number(variant?.mrp),
            price: Number(variant?.price),
            stock: Number(variant?.stock),
            unitPrice: toTrimmedString(variant?.unitPrice),
        };
    });

    const productData = {
        ...payload,
        ...(idOverride ? { id: idOverride } : {}),
        name,
        brand,
        category: toTrimmedString(payload.category),
        subcategory: toTrimmedString(payload.subcategory),
        tag: toTrimmedString(payload.tag),
        image: toTrimmedString(payload.image),
        images: (Array.isArray(payload.images) ? payload.images : []).map((img) => toTrimmedString(img)).filter(Boolean),
        description: payload.description,
        rating: Number(payload.rating) || 0,
        variants,
        benefits: sanitizeStructuredItems(payload.benefits, ['title', 'description']),
        specifications: sanitizeStructuredItems(payload.specifications, ['label', 'value']),
        faqs: sanitizeStructuredItems(payload.faqs, ['q', 'a']),
        nutrition: normalizeNutrition(sanitizeStructuredItems(payload.nutrition, ['label', 'per100g', 'perServe'])),
        seoTitle: toTrimmedString(payload.seoTitle),
        seoDescription: toTrimmedString(payload.seoDescription),
        seoImage: toTrimmedString(payload.seoImage),
    };

    if (name && !productData.slug) {
        productData.slug = name.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
    }

    return productData;
};

const validateProductPayload = (productData = {}) => {
    if (!productData.name) {
        return 'Product name is required';
    }

    if (!productData.brand) {
        return 'Brand name is required';
    }

    if (!productData.category) {
        return 'Parent category is required';
    }

    if (!stripHtml(productData.description)) {
        return 'Product description is required';
    }

    if (!productData.image) {
        return 'Primary product image is required';
    }

    if (!Array.isArray(productData.variants) || productData.variants.length === 0) {
        return 'At least one variant is required';
    }

    for (const variant of productData.variants) {
        if (!isPositiveNumber(variant.quantity)) {
            return 'Each variant must have a valid quantity';
        }
        if (!UNIT_OPTIONS.includes(variant.unit)) {
            return 'Each variant must have a valid unit';
        }
        if (!isPositiveNumber(variant.mrp)) {
            return 'Each variant must have an MRP greater than 0';
        }
        if (!isPositiveNumber(variant.price)) {
            return 'Each variant must have a selling price greater than 0';
        }
        if (Number(variant.price) > Number(variant.mrp)) {
            return 'Variant selling price cannot exceed MRP';
        }
        if (!isNonNegativeNumber(variant.stock)) {
            return 'Variant stock cannot be negative';
        }

        const dimensions = ['length', 'breadth', 'height'];
        const providedDimensions = dimensions.filter((key) => variant[key] !== undefined);
        if (providedDimensions.length > 0 && providedDimensions.length < dimensions.length) {
            return 'Variant dimensions must include length, breadth, and height together';
        }
        for (const key of providedDimensions) {
            if (!isPositiveNumber(variant[key])) {
                return `Variant ${key} must be greater than 0`;
            }
        }
    }

    return null;
};

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Fetch single product by ID or Slug
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
    try {
        // Try finding by _id, then custom ID, then by slug
        let product;
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            product = await Product.findById(req.params.id);
        }
        
        if (!product) {
            product = await Product.findOne({ id: req.params.id });
        }
        
        if (!product) {
            product = await Product.findOne({ slug: req.params.id });
        }

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
    try {
        let product;
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            product = await Product.findById(req.params.id);
        }
        if (!product) {
            product = await Product.findOne({ id: req.params.id });
        }

        if (product) {
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
    try {
        const productData = sanitizeProductPayload(req.body);
        const validationError = validateProductPayload(productData);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }
        const product = new Product(productData);
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
    try {
        let product;
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            product = await Product.findById(req.params.id);
        }
        if (!product) {
            product = await Product.findOne({ id: req.params.id });
        }

        if (product) {
            // Strip fields that shouldn't be manually updated
            const { _id, __v, createdAt, ...updateData } = req.body;
            const sanitizedUpdateData = sanitizeProductPayload(updateData, { idOverride: product.id });
            const validationError = validateProductPayload(sanitizedUpdateData);
            if (validationError) {
                return res.status(400).json({ message: validationError });
            }

            Object.assign(product, sanitizedUpdateData);
            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Update product error:', error);
        res.status(400).json({ message: error.message });
    }
};
