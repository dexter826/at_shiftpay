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

        // Text
        textPrimaryClass: theme === 'dark' ? 'text-slate-100' : 'text-slate-800',
        textSecondaryClass: theme === 'dark' ? 'text-slate-200' : 'text-slate-700',
        textMutedClass: theme === 'dark' ? 'text-slate-400' : 'text-slate-500',

        // Inputs specifically often need different contrast
        inputBgClass: theme === 'dark' ? 'bg-slate-800' : 'bg-white',
        inputBorderClass: theme === 'dark' ? 'border-slate-700' : 'border-slate-300',

        // Interactive
        hoverBgClass: theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100',
    };
};
