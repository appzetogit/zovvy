const toTrimmedString = (value) => String(value ?? '').trim();

export const getLegacyVariantSku = (product, variant, index = 0) => {
    const brandCode = (product?.brand || 'SKU')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 3)
        .toUpperCase() || 'SKU';
    const sizeCode = (
        variant?.quantity && variant?.unit
            ? `${variant.quantity}${variant.unit}`
            : variant?.weight || variant?.name || 'VAR'
    )
        .replace(/\s+/g, '')
        .toUpperCase();

    return `${brandCode}-${sizeCode}-${index + 1}`;
};

export const getVariantDisplaySku = (product, variant, index = 0) => {
    const variantSku = toTrimmedString(variant?.sku);
    if (variantSku) return variantSku;

    const productSku = toTrimmedString(product?.sku);
    if (productSku) return productSku;

    if (variant) return getLegacyVariantSku(product, variant, index);

    return toTrimmedString(product?._id || product?.id) || '-';
};

export const getPrimaryProductSku = (product) => {
    const productSku = toTrimmedString(product?.sku);
    if (productSku) return productSku;

    const firstVariant = Array.isArray(product?.variants) ? product.variants[0] : null;
    if (firstVariant) {
        return getVariantDisplaySku(product, firstVariant, 0);
    }

    return toTrimmedString(product?._id || product?.id) || '-';
};

export const productMatchesSkuSearch = (product, rawSearch) => {
    const normalizedSearch = toTrimmedString(rawSearch).toLowerCase();
    if (!normalizedSearch) return false;

    if (toTrimmedString(product?.sku).toLowerCase().includes(normalizedSearch)) {
        return true;
    }

    return (Array.isArray(product?.variants) ? product.variants : []).some((variant, index) =>
        getVariantDisplaySku(product, variant, index).toLowerCase().includes(normalizedSearch)
    );
};

export const getOrderItemSku = (item, index = 0) => {
    const directSku = toTrimmedString(item?.sku);
    if (directSku) return directSku;

    return toTrimmedString(item?.id || item?._id) || `ITEM-${index + 1}`;
};
