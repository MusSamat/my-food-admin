import React, { useEffect, useState, useRef } from 'react';
import { Plus, Trash2, MapPin, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import api from '../services/api';
import { Modal, ConfirmDialog, Spinner, EmptyState } from '../components/ui';
import { MapContainer, TileLayer, Polygon, useMapEvents } from 'react-leaflet';

const BISHKEK_CENTER = [42.8746, 74.5698];
const ZONE_COLORS = ['#FF6B00', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

// ─── Draw polygon on map ───
const DrawableMap = ({ points, onAddPoint, onClear }) => {
    useMapEvents({
        click(e) {
            onAddPoint([e.latlng.lat, e.latlng.lng]);
        },
    });
    return points.length >= 3 ? <Polygon positions={points} pathOptions={{ color: '#FF6B00', weight: 2, fillOpacity: 0.2 }} /> : null;
};

const DeliveryZonesPage = () => {
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', fee: 150, min_order: 0, points: [] });
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const fetch = () => api.get('/admin/delivery-zones').then(({ data }) => setZones(data.data)).finally(() => setLoading(false));
    useEffect(() => { fetch(); }, []);

    const openCreate = () => { setEditing(null); setForm({ name: '', fee: 150, min_order: 0, points: [] }); setFormOpen(true); };
    const openEdit = (z) => {
        setEditing(z);
        setForm({ name: z.name, fee: z.fee, min_order: z.min_order || 0, points: z.polygon || [] });
        setFormOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return toast.error('Введите название зоны');
        if (form.points.length < 3) return toast.error('Нарисуйте зону на карте (минимум 3 точки)');
        setSaving(true);
        try {
            const payload = { name: form.name, fee: parseInt(form.fee) || 0, min_order: parseInt(form.min_order) || 0, polygon: form.points };
            if (editing) {
                await api.put(`/admin/delivery-zones/${editing.id}`, payload);
                toast.success('Зона обновлена');
            } else {
                await api.post('/admin/delivery-zones', payload);
                toast.success('Зона создана');
            }
            setFormOpen(false); fetch();
        } catch (err) { toast.error(err.response?.data?.message || 'Ошибка'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        try { await api.delete(`/admin/delivery-zones/${deleteId}`); toast.success('Удалено'); setDeleteId(null); fetch(); }
        catch (err) { toast.error(err.response?.data?.message || 'Ошибка'); }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Зоны доставки</h1>
                    <p className="text-sm text-slate-400 mt-1">Разная стоимость доставки по районам Бишкека</p>
                </div>
                <button onClick={openCreate} className="btn-primary text-sm"><Plus size={16} /> Добавить зону</button>
            </div>

            {/* Map overview */}
            <div className="card overflow-hidden mb-6 z-10" style={{ height: 400 }}>
                <MapContainer center={BISHKEK_CENTER} zoom={12} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                               attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>' />
                    {zones.map((z, i) => (
                        z.polygon && z.polygon.length >= 3 && (
                            <Polygon key={z.id} positions={z.polygon}
                                     pathOptions={{ color: ZONE_COLORS[i % ZONE_COLORS.length], weight: 2, fillOpacity: 0.15 }}
                                     eventHandlers={{ click: () => openEdit(z) }}>
                            </Polygon>
                        )
                    ))}
                </MapContainer>
            </div>

            {/* Zones list */}
            {loading ? <Spinner /> : zones.length === 0 ? (
                <EmptyState icon={MapPin} title="Нет зон доставки" description="Все заказы будут использовать стоимость доставки филиала" />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {zones.map((z, i) => (
                        <div key={z.id} className="card p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: ZONE_COLORS[i % ZONE_COLORS.length] }} />
                                <h3 className="font-semibold text-slate-800">{z.name}</h3>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                                <span>Доставка: {z.fee} сом</span>
                                {z.min_order > 0 && <span>Мин: {z.min_order} сом</span>}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openEdit(z)} className="btn-ghost text-xs flex-1">Изменить</button>
                                <button onClick={() => setDeleteId(z.id)} className="btn-ghost text-xs text-red-500"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Form Modal with map */}
            <Modal isOpen={formOpen} onClose={() => setFormOpen(false)}
                   title={editing ? 'Редактировать зону' : 'Новая зона доставки'} wide>
                <div className="space-y-4 z-20">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Название *</label>
                            <input className="input" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                   placeholder="Центр города" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Доставка (сом)</label>
                            <input className="input" type="number" value={form.fee}
                                   onChange={(e) => setForm(f => ({ ...f, fee: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Мин. заказ (сом)</label>
                            <input className="input" type="number" value={form.min_order}
                                   onChange={(e) => setForm(f => ({ ...f, min_order: e.target.value }))} />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-600">Нарисуйте зону на карте ({form.points.length} точек)</p>
                            <button onClick={() => setForm(f => ({ ...f, points: [] }))} className="text-xs text-red-500 font-medium">Очистить</button>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height: 350 }}>
                            <MapContainer center={BISHKEK_CENTER} zoom={12} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                           attribution='&copy; OpenStreetMap' />
                                <DrawableMap points={form.points}
                                             onAddPoint={(p) => setForm(f => ({ ...f, points: [...f.points, p] }))}
                                             onClear={() => setForm(f => ({ ...f, points: [] }))} />
                            </MapContainer>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Кликайте по карте чтобы нарисовать границы зоны</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setFormOpen(false)} className="btn-secondary text-sm">Отмена</button>
                        <button onClick={handleSave} className="btn-primary text-sm" disabled={saving}>
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
                           message="Удалить зону доставки?" />
        </div>
    );
};

export default DeliveryZonesPage;