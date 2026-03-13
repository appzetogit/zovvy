import React from 'react';

const LoadingSpinner = ({ size = 'h-10 w-10', className = '', label = 'Loading...' }) => {
    return (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <div className={`animate-spin rounded-full border-4 border-primary/20 border-t-primary ${size}`} />
            {label ? <p className="text-sm text-textSecondary">{label}</p> : null}
        </div>
    );
};

export default LoadingSpinner;
