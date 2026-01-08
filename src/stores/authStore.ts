import { create } from 'zustand';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface SavedUser {
    email: string;
    displayName: string;
    photoURL?: string;
}

interface AuthState {
    user: User | null;
    savedUser: SavedUser | null;
    loading: boolean;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    saveUserInfo: (user: SavedUser) => void;
    clearSavedUserInfo: () => void;
    logout: () => Promise<void>;
    init: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    savedUser: null,
    loading: true,
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
    saveUserInfo: (userInfo) => {
        localStorage.setItem('saved_user_info', JSON.stringify(userInfo));
        set({ savedUser: userInfo });
    },
    clearSavedUserInfo: () => {
        localStorage.removeItem('saved_user_info');
        set({ savedUser: null });
    },
    logout: async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error', error);
        }
    },
    init: () => {
        const saved = localStorage.getItem('saved_user_info');
        if (saved) {
            set({ savedUser: JSON.parse(saved) });
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            set({ user, loading: false });
        });
        return unsubscribe;
    }
}));
