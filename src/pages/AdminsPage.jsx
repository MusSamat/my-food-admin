import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, UserCog, Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin, getBranches } from '../services/api';
import { Modal, ConfirmDialog, Spinner, EmptyState } from '../components/ui';

const EMPTY = { username: '', password: '', name: '', role: 'operator', branch_id: '', is_active: true };

const AdminsPage = () => {
    const [admins, setAdmins] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const fetch = () => getAdmins().then(({ data }) => setAdmins(data.data)).finally(() => setLoading(false));
    useEffect(() => { fetch(); getBranches().then(({ data }) => setBranches(data.data)).catch(() => {}); }, []);

    const openCreate = () => { setEditing(null); setForm(EMPTY); setFormOpen(true); };
    const openEdit = (a) => {
        setEditing(a);
        setForm({ username: a.username, password: '', name: a.name, role: a.role, branch_id: a.branch_id || '', is_active: a.is_active });
        setFormOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return toast.error('Введите имя');
        if (!editing && (!form.username.trim() || !form.password.trim())) return toast.error('Логин и пароль обязательны');
        if (form.role === 'operator' && !form.branch_id) return toast.error('Выберите филиал для оператора');
        setSaving(true);
        try {
            const payload = { ...form, branch_id: form.branch_id ? parseInt(form.branch_id) : null };
            if (editing && !payload.password) delete payload.password;
            if (editing) { await updateAdmin(editing.id, payload); toast.success('Обновлено'); }
            else { await createAdmin(payload); toast.success('Создан'); }
            setFormOpen(false); fetch();
        } catch (err) { toast.error(err.response?.data?.message || 'Ошибка'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        try { await deleteAdmin(deleteId); toast.success('Удалено'); setDeleteId(null); fetch(); }
        catch (err) { toast.error(err.response?.data?.message || 'Ошибка'); }
    };

    const update = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Администраторы</h1>
                    <p className="text-sm text-slate-400 mt-1">{admins.length} пользователей</p>
                </div>
                <button onClick={openCreate} className="btn-primary text-sm"><Plus size={16} /> Добавить</button>
            </div>

            {loading ? <Spinner /> : admins.length === 0 ? (
                <EmptyState icon={UserCog} title="Нет администраторов" />
            ) : (
                <div className="card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="bg-slate-50/80 text-xs uppercase text-slate-400 border-b border-slate-100">
                            <th className="text-left px-5 py-3">Пользователь</th>
                            <th className="text-left px-5 py-3">Логин</th>
                            <th className="text-left px-5 py-3">Роль</th>
                            <th className="text-left px-5 py-3">Филиал</th>
                            <th className="text-center px-5 py-3">Статус</th>
                            <th className="text-right px-5 py-3"></th>
                        </tr>
                        </thead>
                        <tbody>
                        {admins.map(a => (
                            <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                <td className="px-5 py-3.5 font-medium text-slate-700">{a.name}</td>
                                <td className="px-5 py-3.5 font-mono text-slate-500">{a.username}</td>
                                <td className="px-5 py-3.5">
                                        <span className={clsx('badge', a.role === 'superadmin' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700')}>
                                            {a.role === 'superadmin' ? '👑 Суперадмин' : '👤 Оператор'}
                                        </span>
                                </td>
                                <td className="px-5 py-3.5 text-slate-500">{a.branch_name || '—'}</td>
                                <td className="px-5 py-3.5 text-center">
                                        <span className={clsx('badge', a.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                                            {a.is_active ? 'Активен' : 'Выключен'}
                                        </span>
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button onClick={() => openEdit(a)} className="btn-ghost text-xs"><Pencil size={14} /></button>
                                        <button onClick={() => setDeleteId(a.id)} className="btn-ghost text-xs text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Form Modal */}
            <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Редактировать' : 'Новый администратор'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">Имя *</label>
                        <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Иван Иванов" />
                    </div>
                    {!editing && (
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Логин *</label>
                            <input className="input font-mono" value={form.username} onChange={(e) => update('username', e.target.value)} placeholder="operator1" />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">
                            {editing ? 'Новый пароль (оставьте пустым чтобы не менять)' : 'Пароль *'}
                        </label>
                        <input className="input font-mono" type="password" value={form.password}
                               onChange={(e) => update('password', e.target.value)} placeholder="••••••••" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">Роль</label>
                        <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                            <button type="button" onClick={() => update('role', 'operator')}
                                    className={clsx('flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors',
                                        form.role === 'operator' ? 'bg-brand-500 text-white' : 'bg-white text-slate-600')}>
                                <User size={14} /> Оператор
                            </button>
                            <button type="button" onClick={() => update('role', 'superadmin')}
                                    className={clsx('flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors',
                                        form.role === 'superadmin' ? 'bg-brand-500 text-white' : 'bg-white text-slate-600')}>
                                <Shield size={14} /> Суперадмин
                            </button>
                        </div>
                    </div>
                    {form.role === 'operator' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Филиал *</label>
                            <select className="input" value={form.branch_id} onChange={(e) => update('branch_id', e.target.value)}>
                                <option value="">Выберите филиал</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.address}</option>)}
                            </select>
                        </div>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.is_active} onChange={(e) => update('is_active', e.target.checked)}
                               className="w-4 h-4 rounded border-slate-300 text-brand-500" />
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
                           message="Удалить администратора?" />
        </div>
    );
};

export default AdminsPage;