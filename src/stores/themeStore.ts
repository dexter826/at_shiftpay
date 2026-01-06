import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface ThemeState {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: 'dark',
            toggleTheme: () => {
                const newTheme = get().theme === 'dark' ? 'light' : 'dark';
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(newTheme);
                set({ theme: newTheme });
            },
            setTheme: (theme) => {
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(theme);
                set({ theme });
            }
        }),
        {
            name: 'theme',
            onRehydrateStorage: () => (state) => {
                if (state) {
                    document.documentElement.classList.remove('light', 'dark');
                    document.documentElement.classList.add(state.theme);
                }
            }
        }
    )
);
