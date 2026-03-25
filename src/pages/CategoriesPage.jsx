import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/api';
import { Modal, ConfirmDialog, Spinner, EmptyState } from '../components/ui';

const EMPTY = { name_ru: '', name_kg: '', icon: '', sort_order: 0, is_active: true };

const CategoriesPage = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetch = () => getCategories().then(({ data }) => setCategories(data.data)).finally(() => setLoading(false));
    useEffect(() => { fetch(); }, []);

    const openCreate = () => { setEditing(null); setForm(EMPTY); setFormOpen(true); };
    const openEdit = (cat) => { setEditing(cat); setForm({ name_ru: cat.name_ru, name_kg: cat.name_kg || '', icon: cat.icon || '', sort_order: cat.sort_order, is_active: cat.is_active }); setFormOpen(true); };

    const handleSave = async () => {
        if (!form.name_ru.trim()) return toast.error('Введите название (RU)');
        setSaving(true);
        try {
            if (editing) {
                await updateCategory(editing.id, form);
                toast.success('Категория обновлена');
            } else {
                await createCategory(form);
                toast.success('Категория создана');
            }
            setFormOpen(false);
            fetch();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Ошибка');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteCategory(deleteId);
            toast.success('Удалено');
            setDeleteId(null);
            fetch();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Ошибка удаления');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Категории</h1>
                    <p className="text-sm text-slate-400 mt-1">{categories.length} категорий</p>
                </div>
                <button onClick={openCreate} className="btn-primary text-sm">
                    <Plus size={16} /> Добавить
                </button>
            </div>

            {loading ? <Spinner /> : categories.length === 0 ? (
                <EmptyState title="Нет категорий" description="Создайте первую категорию для меню" />
            ) : (
                <div className="card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50/80 text-xs uppercase text-slate-400 border-b border-slate-100">
                                <th className="w-12 px-4 py-3"></th>
                                <th className="text-left px-4 py-3">Иконка</th>
                                <th className="text-left px-4 py-3">Название (RU)</th>
                                <th className="text-left px-4 py-3">Название (KG)</th>
                                <th className="text-center px-4 py-3">Порядок</th>
                                <th className="text-center px-4 py-3">Статус</th>
                                <th className="text-right px-4 py-3">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat) => (
                                <tr key={cat.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 text-slate-300"><GripVertical size={16} /></td>
                                    <td className="px-4 py-3 text-xl">{cat.icon || '📁'}</td>
                                    <td className="px-4 py-3 font-medium text-slate-700">{cat.name_ru}</td>
                                    <td className="px-4 py-3 text-slate-500">{cat.name_kg || '—'}</td>
                                    <td className="px-4 py-3 text-center font-mono text-slate-400">{cat.sort_order}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`badge ${cat.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {cat.is_active ? 'Активна' : 'Скрыта'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => openEdit(cat)} className="btn-ghost text-xs"><Pencil size={14} /></button>
                                            <button onClick={() => setDeleteId(cat.id)} className="btn-ghost text-xs text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Form Modal */}
            <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Редактировать категорию' : 'Новая категория'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">Название (RU) *</label>
                        <input className="input" value={form.name_ru} onChange={(e) => setForm(f => ({ ...f, name_ru: e.target.value }))} placeholder="Суши" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">Название (KG)</label>
                        <input className="input" value={form.name_kg} onChange={(e) => setForm(f => ({ ...f, name_kg: e.target.value }))} placeholder="Суши" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Иконка (emoji)</label>
                            <input className="input" value={form.icon} onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🍣" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Порядок</label>
                            <input className="input" type="number" value={form.sort_order} onChange={(e) => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
                        </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500" />
                        <span className="text-sm text-slate-600">Активна (видна в меню)</span>
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
                message="Все блюда этой категории будут удалены. Продолжить?" loading={deleting} />
        </div>
    );
};

export default CategoriesPage;
