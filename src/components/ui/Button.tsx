import React from 'react';


type ButtonVariant = 'primary' | 'danger' | 'secondary' | 'outline' | 'success';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    fullWidth?: boolean;
    variant?: ButtonVariant;
}

const variants = {
    primary: {
        back: "from-[#8e6d1b] via-[#ecb52d] to-[#8e6d1b]",
        front: "from-[#d9a016] via-[#ecb52d] to-[#f5d173]",
        text: "text-white"
    },
    danger: {
        back: "from-red-900 via-red-700 to-red-900",
        front: "from-red-600 via-red-500 to-red-400",
        text: "text-white"
    },
    secondary: {
        back: "from-slate-700 via-slate-600 to-slate-700",
        front: "from-slate-600 via-slate-500 to-slate-400",
        text: "text-white"
    },
    success: {
        back: "from-green-700 via-green-600 to-green-700",
        front: "from-green-600 via-green-500 to-green-400",
        text: "text-white"
    },
    outline: {
        // For outline, we might want a different approach, but for now let's make it a subtle gray 3D button
        back: "from-slate-300 via-slate-200 to-slate-300",
        front: "from-slate-100 via-white to-slate-50",
        text: "text-slate-700"
    }
};

const Button: React.FC<ButtonProps> = ({
    children,
    className = '',
    fullWidth = false,
    variant = 'primary',
    ...props
}) => {
    const variantStyles = variants[variant];

    return (
        <button
            className={`relative group border-none bg-transparent p-0 outline-none cursor-pointer font-medium text-sm ${fullWidth ? 'w-full' : ''} ${className}`}
            {...props}
        >
            <span className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-25 rounded-lg transform translate-y-0.5 transition duration-[600ms] ease-[cubic-bezier(0.3,0.7,0.4,1)] group-hover:translate-y-1 group-hover:duration-[250ms] group-active:translate-y-px" />
            <span className={`absolute top-0 left-0 w-full h-full rounded-lg bg-gradient-to-r ${variantStyles.back}`} />
            <div className={`relative flex items-center justify-center py-2.5 px-4 text-sm ${variantStyles.text} rounded-lg transform -translate-y-1 bg-gradient-to-r ${variantStyles.front} gap-2 transition duration-[600ms] ease-[cubic-bezier(0.3,0.7,0.4,1)] group-hover:-translate-y-1.5 group-hover:duration-[250ms] group-active:-translate-y-0.5 brightness-100 group-hover:brightness-110 ${fullWidth ? 'w-full' : ''}`}>
                {children}
            </div>
        </button>
    );
}

export default Button;
