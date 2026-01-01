import { useTheme } from '../contexts/ThemeContext';

export const useThemeStyles = () => {
    const { theme, toggleTheme } = useTheme();

    return {
        theme,
        toggleTheme,
        // Backgrounds
        bgClass: theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50',
        cardBgClass: theme === 'dark' ? 'bg-slate-900' : 'bg-white',

        // Borders
        borderClass: theme === 'dark' ? 'border-slate-800' : 'border-slate-200',
        divideClass: theme === 'dark' ? 'divide-slate-800' : 'divide-slate-200',

        // Text
        textPrimaryClass: theme === 'dark' ? 'text-slate-100' : 'text-slate-800',
        textSecondaryClass: theme === 'dark' ? 'text-slate-200' : 'text-slate-700',
        textMutedClass: theme === 'dark' ? 'text-slate-400' : 'text-slate-500',

        // Inputs specifically often need different contrast
        inputBgClass: theme === 'dark' ? 'bg-slate-800' : 'bg-white',
        inputBorderClass: theme === 'dark' ? 'border-slate-700' : 'border-slate-300',

        // Interactive
        hoverBgClass: theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100',

        // Highlighted backgrounds (for sub-cards or sections)
        highlightBgClass: theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100',

        // Skeleton
        skeletonBgClass: theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200',
        shimmerClass: theme === 'dark' 
            ? 'from-transparent via-slate-700/40 to-transparent' 
            : 'from-transparent via-white/60 to-transparent',
    };
};
