import React, { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, ImagePlus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getItems, getCategories, createItem, updateItem, deleteItem } from '../services/api';
import { Modal, ConfirmDialog, StatusBadge, Spinner, EmptyState } from '../components/ui';

const EMPTY = { name_ru: '', name_kg: '', description_ru: '', description_kg: '', ingredients: '', price: '', category_id: '', status: 'available', is_popular: false, sort_order: 0 };

const ItemsPage = () => {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ category_id: '', status: '' });
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const fileRef = useRef();

    const fetch = async () => {
        setLoading(true);
        const params = {};
        if (filters.category_id) params.category_id = filters.category_id;
        if (filters.status) params.status = filters.status;
        const [itemsRes, catsRes] = await Promise.all([getItems(params), getCategories()]);
        setItems(itemsRes.data.data);
        setCategories(catsRes.data.data);
        setLoading(false);
    };

    useEffect(() => { fetch(); }, [filters.category_id, filters.status]);

    const openCreate = () => { setEditing(null); setForm(EMPTY); setImageFile(null); setImagePreview(null); setFormOpen(true); };
    const openEdit = (item) => {
        setEditing(item);
        setForm({
            name_ru: item.name_ru, name_kg: item.name_kg || '', description_ru: item.description_ru || '',
            description_kg: item.description_kg || '', ingredients: item.ingredients || '',
            price: item.price, category_id: item.category_id, status: item.status,
            is_popular: item.is_popular, sort_order: item.sort_order,
        });
        setImageFile(null);
        setImagePreview(item.image_url || null);
        setFormOpen(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        if (!form.name_ru.trim()) return toast.error('Введите название');
        if (!form.price) return toast.error('Укажите цену');
        if (!form.category_id) return toast.error('Выберите категорию');

        setSaving(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null) fd.append(k, v); });
            if (imageFile) fd.append('image', imageFile);

            if (editing) {
                await updateItem(editing.id, fd);
                toast.success('Блюдо обновлено');
            } else {
                await createItem(fd);
                toast.success('Блюдо создано');
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
        try {
            await deleteItem(deleteId);
            toast.success('Удалено');
            setDeleteId(null);
            fetch();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Ошибка');
        }
    };

    const formatPrice = (n) => n?.toLocaleString('ru-RU') || '0';

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Блюда</h1>
                    <p className="text-sm text-slate-400 mt-1">{items.length} позиций</p>
                </div>
                <button onClick={openCreate} className="btn-primary text-sm"><Plus size={16} /> Добавить</button>
            </div>

            {/* Filters */}
            <div className="card p-4 mb-6 flex flex-wrap gap-3">
                <select className="input w-48" value={filters.category_id} onChange={(e) => setFilters(f => ({ ...f, category_id: e.target.value }))}>
                    <option value="">Все категории</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name_ru}</option>)}
                </select>
                <select className="input w-44" value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}>
                    <option value="">Все статусы</option>
                    <option value="available">В наличии</option>
                    <option value="coming_soon">Скоро</option>
                    <option value="out_of_stock">Нет в наличии</option>
                    <option value="hidden">Скрыто</option>
                </select>
            </div>

            {/* Grid */}
            {loading ? <Spinner /> : items.length === 0 ? (
                <EmptyState title="Нет блюд" description="Добавьте первое блюдо в меню" />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {items.map((item) => (
                        <div key={item.id} className="card p-4 flex gap-4">
                            <div className="w-20 h-20 rounded-xl bg-slate-100 shrink-0 overflow-hidden">
                                {item.image_url ? (
                                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl">🍽</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-semibold text-slate-800 truncate">{item.name_ru}</h3>
                                    <StatusBadge status={item.status} />
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5 truncate">{item.category_name || ''}</p>
                                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.ingredients || item.description_ru || ''}</p>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="font-bold text-brand-500">{formatPrice(item.price)} сом</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEdit(item)} className="btn-ghost text-xs"><Pencil size={13} /></button>
                                        <button onClick={() => setDeleteId(item.id)} className="btn-ghost text-xs text-red-500 hover:bg-red-50"><Trash2 size={13} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Form Modal */}
            <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Редактировать блюдо' : 'Новое блюдо'} wide>
                <div className="space-y-4">
                    {/* Image */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">Фото</label>
                        <div className="flex items-center gap-4">
                            <div
                                onClick={() => fileRef.current?.click()}
                                className="w-24 h-24 rounded-xl bg-slate-100 border-2 border-dashed border-slate-200 hover:border-brand-400 flex items-center justify-center cursor-pointer overflow-hidden transition-colors"
                            >
                                {imagePreview ? (
                                    <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <ImagePlus size={24} className="text-slate-400" />
                                )}
                            </div>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            <p className="text-xs text-slate-400">JPEG, PNG, WebP до 5MB<br />Рекомендуемый: 800×800px</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Название (RU) *</label>
                            <input className="input" value={form.name_ru} onChange={(e) => setForm(f => ({ ...f, name_ru: e.target.value }))} placeholder="Филадельфия" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Название (KG)</label>
                            <input className="input" value={form.name_kg} onChange={(e) => setForm(f => ({ ...f, name_kg: e.target.value }))} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">Описание (RU)</label>
                        <textarea className="input h-20 py-2" value={form.description_ru} onChange={(e) => setForm(f => ({ ...f, description_ru: e.target.value }))} placeholder="Классический ролл с лососем..." />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">Ингредиенты</label>
                        <input className="input" value={form.ingredients} onChange={(e) => setForm(f => ({ ...f, ingredients: e.target.value }))} placeholder="лосось, сливочный сыр, рис, нори" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Цена (сом) *</label>
                            <input className="input" type="number" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} placeholder="545" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Категория *</label>
                            <select className="input" value={form.category_id} onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value }))}>
                                <option value="">Выберите</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name_ru}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Статус</label>
                            <select className="input" value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}>
                                <option value="available">В наличии</option>
                                <option value="coming_soon">Скоро</option>
                                <option value="out_of_stock">Нет в наличии</option>
                                <option value="hidden">Скрыто</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Порядок</label>
                            <input className="input" type="number" value={form.sort_order} onChange={(e) => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.is_popular} onChange={(e) => setForm(f => ({ ...f, is_popular: e.target.checked }))}
                                    className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500" />
                                <span className="text-sm text-slate-600">Популярное блюдо</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setFormOpen(false)} className="btn-secondary text-sm">Отмена</button>
                        <button onClick={handleSave} className="btn-primary text-sm" disabled={saving}>
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} message="Блюдо будет удалено из меню. Продолжить?" />
        </div>
    );
};

export default ItemsPage;
