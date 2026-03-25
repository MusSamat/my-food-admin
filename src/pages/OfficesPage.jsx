import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, MapPin, Phone, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { getOffices, createOffice, updateOffice, deleteOffice } from '../services/api';
import { Modal, ConfirmDialog, Spinner, EmptyState } from '../components/ui';

const EMPTY = { name: '', address: '', phone: '', working_hours: '', is_active: true };

const OfficesPage = () => {
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const fetch = () => getOffices().then(({ data }) => setOffices(data.data)).finally(() => setLoading(false));
    useEffect(() => { fetch(); }, []);

    const openCreate = () => { setEditing(null); setForm(EMPTY); setFormOpen(true); };
    const openEdit = (o) => { setEditing(o); setForm({ name: o.name, address: o.address, phone: o.phone || '', working_hours: o.working_hours || '', is_active: o.is_active }); setFormOpen(true); };

    const handleSave = async () => {
        if (!form.name.trim() || !form.address.trim()) return toast.error('Заполните название и адрес');
        setSaving(true);
        try {
            if (editing) { await updateOffice(editing.id, form); toast.success('Обновлено'); }
            else { await createOffice(form); toast.success('Создано'); }
            setFormOpen(false); fetch();
        } catch (err) { toast.error(err.response?.data?.message || 'Ошибка'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        try { await deleteOffice(deleteId); toast.success('Удалено'); setDeleteId(null); fetch(); }
        catch (err) { toast.error(err.response?.data?.message || 'Ошибка'); }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Офисы / Филиалы</h1>
                    <p className="text-sm text-slate-400 mt-1">Точки самовывоза</p>
                </div>
                <button onClick={openCreate} className="btn-primary text-sm"><Plus size={16} /> Добавить</button>
            </div>

            {loading ? <Spinner /> : offices.length === 0 ? (
                <EmptyState title="Нет офисов" description="Добавьте точку для самовывоза" />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {offices.map((o) => (
                        <div key={o.id} className="card p-5">
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="font-semibold text-slate-800">{o.name}</h3>
                                <span className={`badge ${o.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {o.is_active ? 'Активен' : 'Скрыт'}
                                </span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-slate-500"><MapPin size={14} />{o.address}</div>
                                {o.phone && <div className="flex items-center gap-2 text-slate-500"><Phone size={14} />{o.phone}</div>}
                                {o.working_hours && <div className="flex items-center gap-2 text-slate-500"><Clock size={14} />{o.working_hours}</div>}
                            </div>
                            <div className="flex justify-end gap-1 mt-4">
                                <button onClick={() => openEdit(o)} className="btn-ghost text-xs"><Pencil size={14} /> Изменить</button>
                                <button onClick={() => setDeleteId(o.id)} className="btn-ghost text-xs text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Редактировать офис' : 'Новый офис'}>
                <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Название *</label>
                        <input className="input" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Главный офис" /></div>
                    <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Адрес *</label>
                        <input className="input" value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} placeholder="ул. Ибраимова, 115" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Телефон</label>
                            <input className="input" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+996 555 123 456" /></div>
                        <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Время работы</label>
                            <input className="input" value={form.working_hours} onChange={(e) => setForm(f => ({ ...f, working_hours: e.target.value }))} placeholder="10:00 - 23:00" /></div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500" />
                        <span className="text-sm text-slate-600">Активен</span>
                    </label>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setFormOpen(false)} className="btn-secondary text-sm">Отмена</button>
                        <button onClick={handleSave} className="btn-primary text-sm" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
                    </div>
                </div>
            </Modal>
            <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} message="Офис будет удалён. Продолжить?" />
        </div>
    );
};

export default OfficesPage;
