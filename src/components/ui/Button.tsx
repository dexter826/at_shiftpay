import React, { useRef } from 'react';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { Loader2 } from 'lucide-react';
import { AnimatedIconHandle } from './icons/types';


type ButtonVariant = 'primary' | 'danger' | 'secondary' | 'outline' | 'success' | 'warning';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children?: React.ReactNode;
    icon?: React.ReactNode;
    fullWidth?: boolean;
    variant?: ButtonVariant;
    loading?: boolean;
}

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
    const { theme } = useThemeStyles();
    const iconRef = useRef<AnimatedIconHandle>(null);

    const variants = {
        primary: {
            back: "from-[#8e6d1b] via-primary to-[#8e6d1b]",
            front: "from-[#d9a016] via-primary to-[#f5d173]",
            text: "text-white"
        },
        danger: {
            back: "from-red-900 via-red-700 to-red-900",
            front: "from-red-600 via-red-500 to-red-400",
            text: "text-white"
        },
        secondary: {
            back: theme === 'dark' ? "from-slate-800 via-slate-700 to-slate-800" : "from-slate-700 via-slate-600 to-slate-700",
            front: theme === 'dark' ? "from-slate-700 via-slate-600 to-slate-500" : "from-slate-600 via-slate-500 to-slate-400",
            text: "text-white"
        },
        success: {
            back: "from-green-700 via-green-600 to-green-700",
            front: "from-green-600 via-green-500 to-green-400",
            text: "text-white"
        },
        outline: {
            back: theme === 'dark' ? "from-slate-700 via-slate-800 to-slate-700" : "from-slate-300 via-slate-200 to-slate-300",
            front: theme === 'dark' ? "from-slate-800 via-slate-900 to-slate-800" : "from-slate-100 via-white to-slate-50",
            text: theme === 'dark' ? "text-slate-300" : "text-slate-700"
        },
        warning: {
            back: "from-orange-700 via-orange-600 to-orange-700",
            front: "from-orange-500 via-orange-400 to-orange-300",
            text: "text-white"
        }
    };

    const variantStyles = variants[variant];

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
        iconRef.current?.startAnimation?.();
        props.onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
        iconRef.current?.stopAnimation?.();
        props.onMouseLeave?.(e);
    };

    return (
        <button
            className={`relative group border-none bg-transparent p-0 outline-none font-medium text-sm min-h-[44px] ${fullWidth ? 'w-full' : ''} ${disabled || loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className}`}
            disabled={disabled || loading}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...props}
        >
            <span className={`absolute top-0 left-0 w-full h-full bg-black bg-opacity-25 rounded-lg transform translate-y-0.5 transition duration-[600ms] ease-[cubic-bezier(0.3,0.7,0.4,1)] ${disabled || loading ? '' : 'group-hover:translate-y-1 group-hover:duration-[250ms] group-active:translate-y-px'}`} />
            <span className={`absolute top-0 left-0 w-full h-full rounded-lg bg-gradient-to-r ${variantStyles.back}`} />
            <div className={`relative flex items-center justify-center py-2.5 px-4 text-sm ${variantStyles.text} rounded-lg transform -translate-y-1 bg-gradient-to-r ${variantStyles.front} gap-2 transition duration-[600ms] ease-[cubic-bezier(0.3,0.7,0.4,1)] ${disabled || loading ? '' : 'group-hover:-translate-y-1.5 group-hover:duration-[250ms] group-active:-translate-y-0.5 brightness-100 group-hover:brightness-110'} ${fullWidth ? 'w-full' : ''}`}>
                {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <>
                        {icon && React.isValidElement(icon) 
                            ? React.cloneElement(icon as React.ReactElement, { ref: iconRef } as any)
                            : icon}
                        {children}
                    </>
                )}
            </div>
        </button>
    );
}

export default Button;
