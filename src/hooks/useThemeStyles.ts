import { useThemeStore } from '../stores';

export const useThemeStyles = () => {
    const { theme, toggleTheme } = useThemeStore();

    const transitionClasses = 'transition-colors duration-300';
    return {
        theme,
        toggleTheme,
        // Nền
        bgClass: `${transitionClasses} ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`,
        cardBgClass: `${transitionClasses} ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`,

        // Viền
        borderClass: `${transitionClasses} ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`,
        divideClass: `${transitionClasses} ${theme === 'dark' ? 'divide-slate-800' : 'divide-slate-200'}`,

        // Chữ
        textPrimaryClass: `${transitionClasses} ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`,
        textSecondaryClass: `${transitionClasses} ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`,
        textMutedClass: `${transitionClasses} ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`,

        // Input
        inputBgClass: `${transitionClasses} ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`,
        inputBorderClass: `${transitionClasses} ${theme === 'dark' ? 'border-slate-700' : 'border-slate-300'}`,

        // Tương tác
        hoverBgClass: `transition-all duration-200 ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`,

        // Nền nổi bật
        highlightBgClass: `${transitionClasses} ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`,

        // Skeleton
        skeletonBgClass: `${transitionClasses} ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`,
        shimmerClass: theme === 'dark'
            ? 'from-transparent via-slate-700/40 to-transparent'
            : 'from-transparent via-white/60 to-transparent',
    };
};
