import React, { useEffect, useState } from 'react';
import { Store, Globe, Phone, Mail, MessageCircle, FileText, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Spinner } from '../components/ui';

const SettingsPage = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get('/admin/settings').then(({ data }) => setSettings(data.data))
            .catch(() => setSettings({ restaurant_name: 'Food Delivery', currency: 'сом' }))
            .finally(() => setLoading(false));
    }, []);

    const update = (field, value) => setSettings(s => ({ ...s, [field]: value }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data } = await api.put('/admin/settings', settings);
            setSettings(data.data);
            toast.success('Настройки сохранены');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Ошибка');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Spinner />;
    if (!settings) return null;

    return (
        <div className="max-w-2xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Настройки ресторана</h1>
                <p className="text-sm text-slate-400 mt-1">Глобальные настройки бренда и контакты</p>
            </div>

            {/* Brand */}
            <div className="card p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Store size={18} className="text-slate-500" />
                    <h3 className="font-semibold text-slate-700">Бренд</h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">Название ресторана</label>
                        <input className="input" value={settings.restaurant_name || ''} onChange={(e) => update('restaurant_name', e.target.value)}
                               placeholder="Food Delivery" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">URL логотипа</label>
                        <input className="input" value={settings.logo_url || ''} onChange={(e) => update('logo_url', e.target.value)}
                               placeholder="https://example.com/logo.png" />
                        {settings.logo_url && (
                            <div className="mt-2 p-3 bg-slate-50 rounded-xl flex items-center gap-3">
                                <img src={settings.logo_url} alt="Logo" className="w-12 h-12 rounded-xl object-cover" onError={(e) => e.target.style.display = 'none'} />
                                <span className="text-xs text-slate-400">Превью логотипа</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Currency */}
            <div className="card p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Globe size={18} className="text-slate-500" />
                    <h3 className="font-semibold text-slate-700">Валюта</h3>
                </div>
                <div className="flex gap-2">
                    {['сом'].map(c => (
                        <button key={c} onClick={() => update('currency', c)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${settings.currency === c ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Contacts */}
            <div className="card p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Phone size={18} className="text-slate-500" />
                    <h3 className="font-semibold text-slate-700">Контакты</h3>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Телефон</label>
                            <input className="input" value={settings.contact_phone || ''} onChange={(e) => update('contact_phone', e.target.value)}
                                   placeholder="+996 555 123 456" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
                            <input className="input" value={settings.contact_email || ''} onChange={(e) => update('contact_email', e.target.value)}
                                   placeholder="info@food.kg" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">Telegram канал</label>
                        <input className="input" value={settings.telegram_channel || ''} onChange={(e) => update('telegram_channel', e.target.value)}
                               placeholder="@food_delivery_kg" />
                    </div>
                </div>
            </div>

            {/* About */}
            <div className="card p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <FileText size={18} className="text-slate-500" />
                    <h3 className="font-semibold text-slate-700">О ресторане</h3>
                </div>
                <textarea className="input h-28 py-3 resize-none" value={settings.about_text || ''} onChange={(e) => update('about_text', e.target.value)}
                          placeholder="Короткое описание для клиентов..." />
                <p className="text-xs text-slate-400 mt-2">Отображается в Mini App</p>
            </div>

            <button onClick={handleSave} className="btn-primary text-sm" disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Сохранить настройки
            </button>
        </div>
    );
};

export default SettingsPage;