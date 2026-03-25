import { create } from 'zustand';
import { login as loginApi, getMe } from '../services/api';

const useAuthStore = create((set) => ({
    admin: null,
    token: localStorage.getItem('admin_token') || null,
    loading: false,

    login: async (username, password) => {
        set({ loading: true });
        try {
            const { data } = await loginApi({ username, password });
            const { token, admin } = data.data;
            localStorage.setItem('admin_token', token);
            set({ token, admin, loading: false });
            return true;
        } catch (err) {
            set({ loading: false });
            throw err;
        }
    },

    checkAuth: async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return false;
        try {
            const { data } = await getMe();
            set({ admin: data.data, token });
            return true;
        } catch {
            localStorage.removeItem('admin_token');
            set({ admin: null, token: null });
            return false;
        }
    },

    logout: () => {
        localStorage.removeItem('admin_token');
        set({ admin: null, token: null });
    },
}));

export default useAuthStore;
