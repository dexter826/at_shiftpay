import React, { useRef } from 'react';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { AnimatedIconHandle } from './icons/types';

type ActionButtonVariant = 'primary' | 'danger' | 'info' | 'success' | 'warning';

interface CardActionButtonProps {
    icon: React.ReactNode;
    onClick: (e: React.MouseEvent) => void;
    variant?: ActionButtonVariant;
    title?: string;
    label?: string;
    className?: string;
    iconSize?: number;
    iconStrokeWidth?: number;
}

export const CardActionButton: React.FC<CardActionButtonProps> = ({
    icon,
    onClick,
    variant = 'primary',
    title,
    label,
    className = '',
    iconSize = 14,
    iconStrokeWidth = 2
}) => {
    const { theme } = useThemeStyles();
    const iconRef = useRef<AnimatedIconHandle>(null);

    const variants = {
        primary: 'bg-primary/80 text-white hover:bg-primary',
        danger: 'bg-red-500/80 text-white hover:bg-red-500',
        info: 'bg-blue-500/80 text-white hover:bg-blue-500',
        success: 'bg-green-500/80 text-white hover:bg-green-500',
        warning: 'bg-orange-500/80 text-white hover:bg-orange-500'
    };

    const handleMouseEnter = () => iconRef.current?.startAnimation();
    const handleMouseLeave = () => iconRef.current?.stopAnimation();

    return (
        <button
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            title={title}
            className={`h-[28px] flex-shrink-0 flex items-center justify-center gap-1.5 transition-all duration-300 rounded-xl backdrop-blur-md border border-white/10 dark:border-white/5 shadow-sm active:scale-95 text-[10px] font-bold ${variants[variant]} ${className} ${label ? 'px-3' : 'w-[28px]'}`}
        >
            {React.isValidElement(icon) 
                ? React.cloneElement(icon as React.ReactElement, { 
                    ref: iconRef,
                    size: iconSize, 
                    strokeWidth: iconStrokeWidth,
                    className: `shrink-0 ${(icon as any).props?.className || ''}`
                  } as any)
                : icon}
            {label && <span>{label}</span>}
        </button>
    );
};
