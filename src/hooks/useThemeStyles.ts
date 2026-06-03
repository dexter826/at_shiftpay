import { useThemeStore } from '../stores';

export const useThemeStyles = () => {
    const { theme, toggleTheme } = useThemeStore();

    return {
        theme,
        toggleTheme,
        bgClass: 'bg-[var(--bg-primary)]',
        cardBgClass: 'bg-[var(--bg-card)]',
        borderClass: 'border-[var(--border-color)]',
        divideClass: 'divide-[var(--border-color)]',
        textPrimaryClass: 'text-[var(--text-primary)]',
        textSecondaryClass: 'text-[var(--text-secondary)]',
        textMutedClass: 'text-[var(--text-muted)]',
        inputBgClass: 'bg-[var(--bg-secondary)]',
        inputBorderClass: 'border-[var(--border-color)]',
        hoverBgClass: 'hover:bg-[var(--border-color)] transition-colors duration-200',
        highlightBgClass: 'bg-[var(--border-color)]',
        skeletonBgClass: 'bg-[var(--border-color)]',
        shimmerClass: theme === 'dark'
            ? 'from-transparent via-white/[0.04] to-transparent'
            : 'from-transparent via-black/[0.04] to-transparent',
    };
};
