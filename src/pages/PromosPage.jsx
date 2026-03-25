import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Ticket, Percent, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPromos, createPromo, updatePromo, deletePromo } from '../services/api';
import { Modal, ConfirmDialog, Spinner, EmptyState } from '../components/ui';

const EMPTY = { code: '', type: 'percent', value: '', min_order: '', max_uses: '', valid_from: '', valid_to: '', is_active: true };

const formatDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—';
const formatPrice = (n) => n?.toLocaleString('ru-RU') || '0';

const PromosPage = () => {
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const fetch = () => getPromos().then(({ data }) => setPromos(data.data)).finally(() => setLoading(false));
    useEffect(() => { fetch(); }, []);

    const openCreate = () => { setEditing(null); setForm(EMPTY); setFormOpen(true); };
    const openEdit = (p) => {
        setEditing(p);
        setForm({
            code: p.code, type: p.type, value: p.value, min_order: p.min_order || '',
            max_uses: p.max_uses || '', is_active: p.is_active,
            valid_from: p.valid_from ? p.valid_from.slice(0, 16) : '',
            valid_to: p.valid_to ? p.valid_to.slice(0, 16) : '',
        });
        setFormOpen(true);
    };

    const handleSave = async () => {
        if (!form.code.trim()) return toast.error('Введите код');
        if (!form.value) return toast.error('Укажите значение скидки');
        setSaving(true);
        try {
            const payload = {
                ...form,
                value: parseInt(form.value),
                min_order: form.min_order ? parseInt(form.min_order) : 0,
                max_uses: form.max_uses ? parseInt(form.max_uses) : null,
                valid_from: form.valid_from || null,
                valid_to: form.valid_to || null,
            };
            if (editing) { await updatePromo(editing.id, payload); toast.success('Обновлено'); }
            else { await createPromo(payload); toast.success('Создано'); }
            setFormOpen(false); fetch();
        } catch (err) { toast.error(err.response?.data?.message || 'Ошибка'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        try { await deletePromo(deleteId); toast.success('Удалено'); setDeleteId(null); fetch(); }
        catch (err) { toast.error(err.response?.data?.message || 'Ошибка'); }
    };

    const isExpired = (p) => p.valid_to && new Date(p.valid_to) < new Date();
    const isExhausted = (p) => p.max_uses && p.used_count >= p.max_uses;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Промокоды</h1>
                    <p className="text-sm text-slate-400 mt-1">{promos.length} промокодов</p>
                </div>
                <button onClick={openCreate} className="btn-primary text-sm"><Plus size={16} /> Добавить</button>
            </div>

            {loading ? <Spinner /> : promos.length === 0 ? (
                <EmptyState icon={Ticket} title="Нет промокодов" description="Создайте первый промокод для клиентов" />
            ) : (
                <div className="card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50/80 text-xs uppercase text-slate-400 border-b border-slate-100">
                                <th className="text-left px-5 py-3">Код</th>
                                <th className="text-left px-5 py-3">Скидка</th>
                                <th className="text-left px-5 py-3">Мин. заказ</th>
                                <th className="text-center px-5 py-3">Использовано</th>
                                <th className="text-left px-5 py-3">Период</th>
                                <th className="text-center px-5 py-3">Статус</th>
                                <th className="text-right px-5 py-3">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {promos.map((p) => (
                                <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{p.code}</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="flex items-center gap-1 font-semibold">
                                            {p.type === 'percent' ? <Percent size={14} className="text-violet-500" /> : <DollarSign size={14} className="text-emerald-500" />}
                                            {p.value}{p.type === 'percent' ? '%' : ' сом'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-500">{p.min_order ? `${formatPrice(p.min_order)} сом` : '—'}</td>
                                    <td className="px-5 py-3.5 text-center">
                                        <span className="font-mono">{p.used_count}</span>
                                        {p.max_uses && <span className="text-slate-400"> / {p.max_uses}</span>}
                                    </td>
                                    <td className="px-5 py-3.5 text-xs text-slate-500">
                                        {formatDate(p.valid_from)} — {formatDate(p.valid_to)}
                                    </td>
                                    <td className="px-5 py-3.5 text-center">
                                        {!p.is_active ? (
                                            <span className="badge bg-slate-100 text-slate-500">Выключен</span>
                                        ) : isExpired(p) ? (
                                            <span className="badge bg-red-50 text-red-600">Истёк</span>
                                        ) : isExhausted(p) ? (
                                            <span className="badge bg-amber-50 text-amber-600">Исчерпан</span>
                                        ) : (
                                            <span className="badge bg-emerald-50 text-emerald-700">Активен</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => openEdit(p)} className="btn-ghost text-xs"><Pencil size={14} /></button>
                                            <button onClick={() => setDeleteId(p.id)} className="btn-ghost text-xs text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Form Modal */}
            <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Редактировать промокод' : 'Новый промокод'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">Код *</label>
                        <input className="input font-mono uppercase" value={form.code}
                            onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="WELCOME15" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Тип скидки</label>
                            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, type: 'percent' }))}
                                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${form.type === 'percent' ? 'bg-brand-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                >
                                    Процент %
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, type: 'fixed' }))}
                                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${form.type === 'fixed' ? 'bg-brand-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                >
                                    Фикс. сумма
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">
                                Значение * {form.type === 'percent' ? '(%)' : '(сом)'}
                            </label>
                            <input className="input" type="number" value={form.value}
                                onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))}
                                placeholder={form.type === 'percent' ? '15' : '200'} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Мин. заказ (сом)</label>
                            <input className="input" type="number" value={form.min_order}
                                onChange={(e) => setForm(f => ({ ...f, min_order: e.target.value }))} placeholder="500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Макс. использований</label>
                            <input className="input" type="number" value={form.max_uses}
                                onChange={(e) => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="100 (пусто = безлимит)" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Действует с</label>
                            <input className="input" type="datetime-local" value={form.valid_from}
                                onChange={(e) => setForm(f => ({ ...f, valid_from: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Действует до</label>
                            <input className="input" type="datetime-local" value={form.valid_to}
                                onChange={(e) => setForm(f => ({ ...f, valid_to: e.target.value }))} />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.is_active}
                            onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
                            className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500" />
                        <span className="text-sm text-slate-600">Активен</span>
                    </label>

                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setFormOpen(false)} className="btn-secondary text-sm">Отмена</button>
                        <button onClick={handleSave} className="btn-primary text-sm" disabled={saving}>
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
                message="Промокод будет удалён. Продолжить?" />
        </div>
    );
};

export default PromosPage;
