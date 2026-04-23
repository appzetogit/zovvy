const normalizeId = (value) => String(value ?? '').trim();

const findVariantMatch = (products = [], packId) => {
    const targetId = normalizeId(packId);
    if (!targetId) return null;

    for (const product of products) {
        const variant = (product.variants || []).find((entry) => {
            const variantId = normalizeId(entry?.id || entry?._id);
            return variantId === targetId;
        });

        if (variant) {
            return { product, variant };
        }
    }

    return null;
};

const findProductMatch = (products = [], packId) => {
    const targetId = normalizeId(packId);
    if (!targetId) return null;

    return products.find((product) => {
        const candidates = [product?.id, product?._id, product?.slug].map(normalizeId);
        return candidates.includes(targetId);
    }) || null;
};

export const enrichCartItem = (item, products = []) => {
    const sourcePackId = item?.packId ?? item?.id;
    const variantMatch = findVariantMatch(products, sourcePackId);

    if (variantMatch) {
        const { product, variant } = variantMatch;
        return {
            ...item,
            id: variant.id || variant._id || sourcePackId,
            packId: sourcePackId,
            name: product.name,
            weight: variant.weight || [variant.quantity, variant.unit].filter(Boolean).join(''),
            quantity: variant.quantity,
            unit: variant.unit,
            length: variant.length,
            breadth: variant.breadth,
            height: variant.height,
            price: Number(variant.price) || 0,
            mrp: Number(variant.mrp) || Number(variant.price) || 0,
            image: product.image,
            category: product.category,
            subcategory: product.subcategory,
            productId: product.id || product._id,
            slug: product.slug,
            stock: Number(variant.stock) || 0
        };
    }

    const productMatch = findProductMatch(products, sourcePackId);

    if (productMatch) {
        return {
            ...item,
            id: productMatch.id || productMatch._id || sourcePackId,
            packId: sourcePackId,
            name: productMatch.name,
            price: Number(productMatch.price) || 0,
            mrp: Number(productMatch.mrp || productMatch.price) || 0,
            image: productMatch.image,
            category: productMatch.category,
            subcategory: productMatch.subcategory,
            productId: productMatch.id || productMatch._id,
            slug: productMatch.slug,
            stock: Number(productMatch.stock?.quantity || productMatch.stock) || 0
        };
    }

    return null;
};

export const enrichCartItems = (items = [], products = []) =>
    items.map((item) => enrichCartItem(item, products)).filter(Boolean);
