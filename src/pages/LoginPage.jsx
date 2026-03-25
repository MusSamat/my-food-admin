import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(username, password);
            toast.success('Добро пожаловать!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Ошибка входа');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20">
                        <ChefHat size={28} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Админ-панель</h1>
                    <p className="text-sm text-slate-400 mt-1">Food Delivery</p>
                </div>

                <form onSubmit={handleSubmit} className="card p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">Логин</label>
                        <input
                            className="input"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="admin"
                            autoFocus
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">Пароль</label>
                        <input
                            className="input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary w-full" disabled={loading}>
                        {loading ? <Loader2 size={18} className="animate-spin" /> : 'Войти'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
