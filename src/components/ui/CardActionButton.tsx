import React from 'react';
import { useThemeStyles } from '../../hooks/useThemeStyles';

type ActionButtonVariant = 'primary' | 'danger' | 'info' | 'success' | 'warning';

interface CardActionButtonProps {
    icon: React.ReactNode;
    onClick: (e: React.MouseEvent) => void;
    variant?: ActionButtonVariant;
    title?: string;
    className?: string;
}

export const CardActionButton: React.FC<CardActionButtonProps> = ({
    icon,
    onClick,
    variant = 'primary',
    title,
    className = ''
}) => {
    const { theme } = useThemeStyles();

    const variants = {
        primary: 'bg-primary/20 text-primary hover:bg-primary hover:text-white',
        danger: 'bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white',
        info: 'bg-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white',
        success: 'bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white',
        warning: 'bg-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white'
    };

    return (
        <button
            onClick={onClick}
            title={title}
            className={`w-8 h-8 flex items-center justify-center rounded-lg backdrop-blur-xl border border-white/10 dark:border-white/5 transition-all duration-300 shadow-sm active:scale-95 ${variants[variant]} ${className}`}
        >
            {React.cloneElement(icon as React.ReactElement, { size: 16, strokeWidth: 2.5 })}
        </button>
    );
};
