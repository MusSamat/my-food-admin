import React, { useEffect, useState } from 'react';
import { Clock, DollarSign, ShoppingBag, Power, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Spinner } from '../components/ui';
import {clsx} from "clsx";

const SettingsPage = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get('/admin/settings').then(({ data }) => setSettings(data.data))
            .catch(() => setSettings({ delivery_fee: 150, min_order_amount: 0, working_hours_from: '10:00', working_hours_to: '23:00', is_open: true }))
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
                <p className="text-sm text-slate-400 mt-1">Доставка, минимальный заказ, время работы</p>
            </div>

            <div className="card p-6 mb-6">
                <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${settings.is_open ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                            <Power size={20} />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-700">Ресторан {settings.is_open ? 'открыт' : 'закрыт'}</p>
                            <p className="text-xs text-slate-400">Когда закрыт — заказы и добавление в корзину заблокированы</p>
                        </div>
                    </div>
                    <div className="relative">
                        <input type="checkbox" checked={settings.is_open} onChange={(e) => update('is_open', e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-300 peer-checked:bg-emerald-500 rounded-full transition-colors" />
                        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                    </div>
                </label>
            </div>

            <div className="card p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Clock size={18} className="text-slate-500" />
                        <h3 className="font-semibold text-slate-700">Время работы</h3>
                    </div>
                    <button
                        onClick={() => {
                            update('working_hours_from', '00:00');
                            update('working_hours_to', '23:59');
                        }}
                        className={clsx(
                            'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                            settings.working_hours_from === '00:00' && settings.working_hours_to === '23:59'
                                ? 'bg-brand-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        )}
                    >
                        24/7
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">Открытие</label>
                        <select className="input" value={settings.working_hours_from} onChange={(e) => update('working_hours_from', e.target.value)}>
                            {Array.from({ length: 24 }, (_, h) => [`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`]).flat().map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <span className="text-slate-400 mt-6">—</span>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">Закрытие</label>
                        <select className="input" value={settings.working_hours_to} onChange={(e) => update('working_hours_to', e.target.value)}>
                            {Array.from({ length: 24 }, (_, h) => [`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`]).flat().map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                    {settings.working_hours_from === '00:00' && settings.working_hours_to === '23:59'
                        ? 'Режим 24/7 — ресторан открыт круглосуточно'
                        : 'Формат 24 часа. Например: 10:00 — 23:00'}
                </p>
            </div>

            <div className="card p-6 mb-6">
                <div className="flex items-center gap-2 mb-4"><DollarSign size={18} className="text-slate-500" /><h3 className="font-semibold text-slate-700">Стоимость доставки</h3></div>
                <div className="relative">
                    <input type="number" className="input pr-16" value={settings.delivery_fee} onChange={(e) => update('delivery_fee', parseInt(e.target.value) || 0)} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">сом</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">0 = бесплатная доставка</p>
            </div>

            <div className="card p-6 mb-6">
                <div className="flex items-center gap-2 mb-4"><ShoppingBag size={18} className="text-slate-500" /><h3 className="font-semibold text-slate-700">Минимальный заказ</h3></div>
                <div className="relative">
                    <input type="number" className="input pr-16" value={settings.min_order_amount} onChange={(e) => update('min_order_amount', parseInt(e.target.value) || 0)} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">сом</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">0 = без ограничения</p>
            </div>

            <button onClick={handleSave} className="btn-primary text-sm" disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Сохранить настройки
            </button>
        </div>
    );
};

export default SettingsPage;