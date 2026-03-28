import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, MapPin, Clock, Truck, Coffee, Building2, Check } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { getBranches, createBranch, updateBranch, deleteBranch,
    getBranchOffices, createBranchOffice, deleteBranchOffice,
    getBranchCategories, saveBranchCategories, getBranchOverrides, saveBranchOverrides } from '../services/api';
import { Modal, ConfirmDialog, Spinner, EmptyState } from '../components/ui';

const EMPTY = {
    name: '', address: '', phone: '', lat: '', lng: '',
    working_hours_from: '10:00', working_hours_to: '23:00', is_24h: false,
    is_open: true, delivery_fee: 150, min_order_amount: 0,
    morning_mode_enabled: false, morning_hours_from: '07:00', morning_hours_to: '10:00',
    sort_order: 0,
};

const BranchesPage = () => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Office addresses modal
    const [officesModal, setOfficesModal] = useState(null); // branch id
    const [offices, setOffices] = useState([]);
    const [newOffice, setNewOffice] = useState({ name: '', address: '' });

    // Categories modal
    const [catsModal, setCatsModal] = useState(null); // branch id
    const [categories, setCategories] = useState([]);
    const [linkedCats, setLinkedCats] = useState(new Set());

    // Item overrides modal
    const [overridesModal, setOverridesModal] = useState(null); // branch id
    const [overrideItems, setOverrideItems] = useState([]);
    const [savingOverrides, setSavingOverrides] = useState(false);

    const fetch = () => getBranches().then(({ data }) => setBranches(data.data)).finally(() => setLoading(false));
    useEffect(() => { fetch(); }, []);

    const openCreate = () => { setEditing(null); setForm(EMPTY); setFormOpen(true); };
    const openEdit = (b) => {
        setEditing(b);
        setForm({
            name: b.name, address: b.address, phone: b.phone || '',
            lat: b.lat || '', lng: b.lng || '',
            working_hours_from: b.working_hours_from, working_hours_to: b.working_hours_to,
            is_24h: b.is_24h, is_open: b.is_open,
            delivery_fee: b.delivery_fee, min_order_amount: b.min_order_amount,
            morning_mode_enabled: b.morning_mode_enabled,
            morning_hours_from: b.morning_hours_from || '07:00',
            morning_hours_to: b.morning_hours_to || '10:00',
            sort_order: b.sort_order,
        });
        setFormOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.address.trim()) return toast.error('Название и адрес обязательны');
        setSaving(true);
        try {
            const payload = {
                ...form,
                delivery_fee: parseInt(form.delivery_fee) || 0,
                min_order_amount: parseInt(form.min_order_amount) || 0,
                lat: form.lat ? parseFloat(form.lat) : null,
                lng: form.lng ? parseFloat(form.lng) : null,
                morning_hours_from: form.morning_mode_enabled ? form.morning_hours_from : '07:00',
                morning_hours_to: form.morning_mode_enabled ? form.morning_hours_to : '10:00',
            };
            if (editing) {
                await updateBranch(editing.id, payload);
                toast.success('Филиал обновлён');
            } else {
                await createBranch(payload);
                toast.success('Филиал создан');
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
            await deleteBranch(deleteId);
            toast.success('Удалено');
            setDeleteId(null);
            fetch();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Ошибка');
        }
    };

    // Office addresses
    const openOffices = async (branchId) => {
        setOfficesModal(branchId);
        const { data } = await getBranchOffices(branchId);
        setOffices(data.data);
        setNewOffice({ name: '', address: '' });
    };

    const addOffice = async () => {
        if (!newOffice.name || !newOffice.address) return;
        await createBranchOffice(officesModal, newOffice);
        const { data } = await getBranchOffices(officesModal);
        setOffices(data.data);
        setNewOffice({ name: '', address: '' });
        toast.success('Добавлено');
    };

    const removeOffice = async (id) => {
        await deleteBranchOffice(id);
        setOffices(offices.filter(o => o.id !== id));
        toast.success('Удалено');
    };

    // Categories
    const openCategories = async (branchId) => {
        setCatsModal(branchId);
        const { data } = await getBranchCategories(branchId);
        setCategories(data.data);
        setLinkedCats(new Set(data.data.filter(c => c.is_linked).map(c => c.id)));
    };

    const toggleCat = (catId) => {
        setLinkedCats(prev => {
            const next = new Set(prev);
            if (next.has(catId)) next.delete(catId); else next.add(catId);
            return next;
        });
    };

    const saveCategories = async () => {
        await saveBranchCategories(catsModal, Array.from(linkedCats));
        toast.success('Категории сохранены');
        setCatsModal(null);
    };

    const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

    const openOverrides = async (branchId) => {
        setOverridesModal(branchId);
        const { data } = await getBranchOverrides(branchId);
        setOverrideItems(data.data);
    };

    const updateOverride = (itemId, field, value) => {
        setOverrideItems(prev => prev.map(item =>
            item.item_id === itemId ? { ...item, [`override_${field}`]: value === '' ? null : value } : item
        ));
    };

    const handleSaveOverrides = async () => {
        setSavingOverrides(true);
        try {
            const overrides = overrideItems
                .filter(i => i.override_price !== undefined || i.override_status !== undefined)
                .map(i => ({
                    item_id: i.item_id,
                    price: i.override_price ? parseInt(i.override_price) : null,
                    status: i.override_status || null,
                }));
            await saveBranchOverrides(overridesModal, overrides);
            toast.success('Сохранено');
            setOverridesModal(null);
        } catch (err) { toast.error(err.response?.data?.message || 'Ошибка'); }
        finally { setSavingOverrides(false); }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Филиалы</h1>
                    <p className="text-sm text-slate-400 mt-1">{branches.length} филиалов</p>
                </div>
                <button onClick={openCreate} className="btn-primary text-sm"><Plus size={16} /> Добавить</button>
            </div>

            {loading ? <Spinner /> : branches.length === 0 ? (
                <EmptyState icon={Building2} title="Нет филиалов" description="Создайте первый филиал" />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {branches.map(b => (
                        <div key={b.id} className="card p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-slate-800 text-lg">{b.name}</h3>
                                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><MapPin size={14} />{b.address}</p>
                                </div>
                                <span className={`badge ${b.is_open ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                                    {b.is_open ? 'Открыт' : 'Закрыт'}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-4">
                                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                                    <Clock size={12} /> {b.is_24h ? '24/7' : `${b.working_hours_from}—${b.working_hours_to}`}
                                </span>
                                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                                    <Truck size={12} /> {b.delivery_fee} сом
                                </span>
                                {b.morning_mode_enabled && (
                                    <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg">
                                        <Coffee size={12} /> Утренний режим
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => openEdit(b)} className="btn-ghost text-xs"><Pencil size={13} /> Изменить</button>
                                <button onClick={() => openOffices(b.id)} className="btn-ghost text-xs"><Building2 size={13} /> Офисы</button>
                                <button onClick={() => openCategories(b.id)} className="btn-ghost text-xs"><Check size={13} /> Категории</button>
                                <button onClick={() => openOverrides(b.id)} className="btn-ghost text-xs"><Pencil size={13} /> Блюда</button>
                                <button onClick={() => setDeleteId(b.id)} className="btn-ghost text-xs text-red-500 hover:bg-red-50"><Trash2 size={13} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Branch Form Modal */}
            <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Редактировать филиал' : 'Новый филиал'} wide>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Название *</label>
                            <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Филиал Центр" /></div>
                        <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Телефон</label>
                            <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+996 555 123 456" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Адрес *</label>
                        <input className="input" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="г. Бишкек, ул. Токтогула 89" /></div>

                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Доставка (сом)</label>
                            <input className="input" type="number" value={form.delivery_fee} onChange={(e) => update('delivery_fee', e.target.value)} /></div>
                        <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Мин. заказ (сом)</label>
                            <input className="input" type="number" value={form.min_order_amount} onChange={(e) => update('min_order_amount', e.target.value)} /></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Открытие</label>
                            <select className="input" value={form.working_hours_from} onChange={(e) => update('working_hours_from', e.target.value)} disabled={form.is_24h}>
                                {Array.from({ length: 24 }, (_, h) => [`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`]).flat().map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select></div>
                        <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Закрытие</label>
                            <select className="input" value={form.working_hours_to} onChange={(e) => update('working_hours_to', e.target.value)} disabled={form.is_24h}>
                                {Array.from({ length: 24 }, (_, h) => [`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`]).flat().map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select></div>
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.is_24h} onChange={(e) => update('is_24h', e.target.checked)}
                                   className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500" />
                            <span className="text-sm text-slate-600">Круглосуточно (24/7)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.is_open} onChange={(e) => update('is_open', e.target.checked)}
                                   className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500" />
                            <span className="text-sm text-slate-600">Филиал открыт</span>
                        </label>


                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.morning_mode_enabled} onChange={(e) => update('morning_mode_enabled', e.target.checked)}
                                   className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500" />
                            <span className="text-sm text-slate-600">Утренний режим (бесплатная доставка, только офисы)</span>
                        </label>

                        {form.morning_mode_enabled && (
                            <div className="ml-6 p-4 bg-amber-50 rounded-xl space-y-3">
                                <p className="text-xs text-amber-700 font-medium">Часы утреннего режима</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <label className="block text-xs text-amber-600 mb-1">С</label>
                                        <select className="input h-9 text-sm" value={form.morning_hours_from || '07:00'}
                                                onChange={(e) => update('morning_hours_from', e.target.value)}>
                                            {Array.from({ length: 24 }, (_, h) => [`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`]).flat().map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <span className="text-amber-400 mt-5">—</span>
                                    <div className="flex-1">
                                        <label className="block text-xs text-amber-600 mb-1">До</label>
                                        <select className="input h-9 text-sm" value={form.morning_hours_to || '10:00'}
                                                onChange={(e) => update('morning_hours_to', e.target.value)}>
                                            {Array.from({ length: 24 }, (_, h) => [`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`]).flat().map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <p className="text-[11px] text-amber-500">В это время: доставка бесплатная, адрес только из списка офисов</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setFormOpen(false)} className="btn-secondary text-sm">Отмена</button>
                        <button onClick={handleSave} className="btn-primary text-sm" disabled={saving}>
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Office Addresses Modal */}
            <Modal isOpen={!!officesModal} onClose={() => setOfficesModal(null)} title="Офисные адреса (утренний режим)">
                <div className="space-y-3">
                    {offices.map(o => (
                        <div key={o.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                            <div>
                                <p className="font-medium text-sm text-slate-700">{o.name}</p>
                                <p className="text-xs text-slate-400">{o.address}</p>
                            </div>
                            <button onClick={() => removeOffice(o.id)} className="btn-ghost text-xs text-red-500"><Trash2 size={14} /></button>
                        </div>
                    ))}
                    <div className="border-t border-slate-100 pt-3 space-y-2">
                        <input className="input text-sm" placeholder="Название (напр. Офис IT Park)" value={newOffice.name}
                               onChange={(e) => setNewOffice(n => ({ ...n, name: e.target.value }))} />
                        <input className="input text-sm" placeholder="Адрес" value={newOffice.address}
                               onChange={(e) => setNewOffice(n => ({ ...n, address: e.target.value }))} />
                        <button onClick={addOffice} className="btn-primary text-sm w-full"><Plus size={14} /> Добавить офис</button>
                    </div>
                </div>
            </Modal>

            {/* Categories Link Modal */}
            <Modal isOpen={!!catsModal} onClose={() => setCatsModal(null)} title="Категории филиала">
                <div className="space-y-2 mb-4">
                    {categories.map(c => (
                        <label key={c.id} className={clsx(
                            'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors',
                            linkedCats.has(c.id) ? 'bg-brand-50 border border-brand-200' : 'bg-slate-50 border border-transparent'
                        )}>
                            <input type="checkbox" checked={linkedCats.has(c.id)} onChange={() => toggleCat(c.id)}
                                   className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500" />
                            <span className="text-sm font-medium text-slate-700">{c.icon} {c.name_ru}</span>
                        </label>
                    ))}
                </div>
                <button onClick={saveCategories} className="btn-primary text-sm w-full">Сохранить привязки</button>
            </Modal>



            {/* Item Overrides Modal */}
            <Modal isOpen={!!overridesModal} onClose={() => setOverridesModal(null)} title="Блюда филиала (оверрайды)" wide>
                <p className="text-xs text-slate-400 mb-4">Пустые поля = базовые значения. Заполните чтобы изменить цену или статус для этого филиала.</p>
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {overrideItems.map(item => (
                        <div key={item.item_id} className={clsx(
                            'flex items-center gap-3 p-3 rounded-xl text-sm',
                            (item.override_price || item.override_status) ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'
                        )}>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-700 truncate">{item.name_ru}</p>
                                <p className="text-xs text-slate-400">{item.category_name} · Базовая: {item.base_price} сом · {item.base_status}</p>
                            </div>
                            <input className="input w-24 h-8 text-xs text-center" type="number" placeholder={item.base_price}
                                   value={item.override_price ?? ''} onChange={(e) => updateOverride(item.item_id, 'price', e.target.value)} />
                            <select className="input w-32 h-8 text-xs"
                                    value={item.override_status || ''} onChange={(e) => updateOverride(item.item_id, 'status', e.target.value)}>
                                <option value="">Базовый</option>
                                <option value="available">Доступно</option>
                                <option value="out_of_stock">Нет в наличии</option>
                                <option value="hidden">Скрыто</option>
                            </select>
                        </div>
                    ))}
                </div>
                <button onClick={handleSaveOverrides} className="btn-primary text-sm w-full mt-4" disabled={savingOverrides}>
                    {savingOverrides ? 'Сохранение...' : 'Сохранить оверрайды'}
                </button>
            </Modal>


            <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
                           message="Все заказы и офисные адреса этого филиала будут удалены. Продолжить?" />
        </div>
    );
};

export default BranchesPage;