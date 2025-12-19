import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rectangular' | 'circular';
    width?: string | number;
    height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'text',
    width,
    height
}) => {
    const { theme } = useTheme();

    // Base background with relative positioning and overflow hidden
    const baseClasses = `relative overflow-hidden ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`;

    // Shimmer element overlay with gradient
    // Adjust gradient based on theme: slightly lighter for dark mode, slightly lighter (white) for light mode
    const shimmerGradient = theme === 'dark'
        ? 'from-transparent via-slate-600/30 to-transparent'
        : 'from-transparent via-white/50 to-transparent';

    const variantClasses = {
        text: 'rounded',
        rectangular: 'rounded-lg',
        circular: 'rounded-full',
    };

    const style = {
        width: width,
        height: height,
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        >
            <div className={`absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r ${shimmerGradient}`} />
        </div>
    );
};
