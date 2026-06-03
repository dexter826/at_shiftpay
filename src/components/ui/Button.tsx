import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'danger' | 'secondary' | 'outline' | 'success' | 'warning';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children?: React.ReactNode;
    icon?: React.ReactNode;
    fullWidth?: boolean;
    variant?: ButtonVariant;
    loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-white hover:brightness-110',
    danger: 'bg-red-600 text-white hover:bg-red-500',
    secondary: 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] hover:brightness-110',
    outline: 'bg-transparent text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]',
    success: 'bg-emerald-600 text-white hover:bg-emerald-500',
    warning: 'bg-orange-500 text-white hover:bg-orange-400',
};

const Button: React.FC<ButtonProps> = ({
    children,
    icon,
    className = '',
    fullWidth = false,
    variant = 'primary',
    disabled,
    loading = false,
    ...props
}) => {
    return (
        <button
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${fullWidth ? 'w-full' : ''} ${variantStyles[variant]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <Loader2 size={18} className="animate-spin" />
            ) : (
                <>
                    {icon}
                    {children}
                </>
            )}
        </button>
    );
};

export default Button;
