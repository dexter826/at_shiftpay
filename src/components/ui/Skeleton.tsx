import React from 'react';
import { motion } from 'framer-motion';
import { useThemeStyles } from '../../hooks/useThemeStyles';

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
    const { skeletonBgClass, shimmerClass } = useThemeStyles();

    // Nền cơ bản
    const baseClasses = `relative overflow-hidden ${skeletonBgClass}`;

    // Hiệu ứng shimmer theo theme
    const shimmerGradient = shimmerClass;

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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        >
            <motion.div 
                className={`absolute inset-0 bg-gradient-to-r ${shimmerGradient}`}
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear'
                }}
            />
        </motion.div>
    );
};
