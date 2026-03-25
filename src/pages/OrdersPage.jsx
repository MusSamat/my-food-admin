import React, {useEffect, useState, useCallback, useRef} from 'react';
import {Eye, ChefHat, Receipt, Download, Loader2, Search, CalendarDays, X} from 'lucide-react';
import toast from 'react-hot-toast';
import {clsx} from 'clsx';
import {
    getOrders,
    getOrder,
    updateOrderStatus,
    getKitchenReceipt,
    getClientReceipt,
    getReceiptPDF,
    printKitchen,
    printClient
} from '../services/api';
import {Modal, StatusBadge, Spinner, EmptyState} from '../components/ui';


// ─── Sound notification hook ───
const useOrderSound = (orders) => {
    const [lastCount, setLastCount] = useState(null);
    const audioRef = useRef(null);

    useEffect(() => {
        // Create audio element once
        if (!audioRef.current) {
            audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Mi4eBdW9qaXJ9gYKAfXl3dXZ5fH5/f39+fn19fn5/f4B/f39+fX1+fn+AgH9/f359fX5+f4CAf39/fn19fn5/gIB/f39+fX19fn+AgH9/f359fX1+f4CAf39/fn59fX5/gIB/f39+fX19fn+AgH9/f359fX5+f3+Af39/fn19fX5/gIB/f39+fX19fn+AgH9/fn59fX1+f4CAf39/fn19fX5/gICAf39+fX19fn+AgIB/f39+fn5+f3+AgH9/f35+fn5+f4CAf39/fn5+fn5/gIB/f39+fn5+fn+AgH9/f35+fn5/f4CAf39/fn5+fn5/gIB/f4B+fn5+f3+AgH9/f35+fn5+f4CAgH9/fn5+fn5/f4CAf39/fn5+fn+AgIB/f39+fn5+f3+AgH9/f35+fn5/gICAgH9/fn5+fn5/f4CAf39/fn5+fn+AgIB/f39+fn5+f4CAgH9/f35+fn5/f4CAgH9/fn5+fn5/gICAgH9/fn5+fn9/gICAf39+fn5+fn+AgIB/f39+fn5+f4CAgH9/f35+fn5/gICAgH9/fn5+fn5/f4CAgH9/fn5+fn9/gICAgH9+fn5+fn+AgICAfn5+fn5+f3+AgIB/f35+fn5/f4CAgH9/f35+fn5/gICAgH9/fn5+fn5/gICAgH9/fn5+fn9/gICAf39+fn5+f3+AgIB/f39+fn5+f4CAgIB/fn5+fn5/f4CAgH9/fn5+fn5/gICAgH9/fn5+fn9/gICAf39+fn5+f3+AgICAf39+fn5+f4CAgIB/fn5+fn5/f4CAgH9/fn5+fn5/gICAgH9/fn5+fn9/gICAgH9+fn5+fn+AgICAfn5+fn5+f3+AgIB/f35+fn5/f4CAgH9/fn5+fn5/gICAgH9/fn5+fn+AgICAfn5+fn5+f3+AgICAf39+fn5+f4CAgIB/fn5+fn5/f4CAgH9/fn5+fn5/gICAgH9/fn5+fn+AgICAf39+fn5/f4CAgIB/fn5+fn5+f4CAgH9/fn5+fn9/gICAgH9+fn5+fn+AgICAfn5+fn5+f3+AgIB/f35+fn5/gICAgH9/fn5+fn5/gICAgH9/fn5+fn+AgICAfn5+fn5+f3+AgICAf39+fn5/f4CAgIB/fn5+fn5/gICAgH9/fn5+fn5/gICAgH9/fn5+fn+AgICAf39+fn5+f4CAgIB/fn5+fn5/gICAgH9/fn5+fn9/gICAgH9+fn5+fn+AgICAf39+fn5/f4CAgIB/fn5+fn5+f4CAgH9/fn5+fn9/gICAgH9+fn5+fn+AgICAf39+fn5+f4CAgIB/fn5+fn5/gICAgH9/fn5+fn5/gICAgH9/fn5+fn+AgICAf39+fn5/f4CAgIB/fn5+fn5/gICAgH9/fn5+fn5/gICAgH9/fn5+fn+AgICAf39+fn5/f4CA');
        }
    }, []);

    // Check for new orders on each poll
    useEffect(() => {
        if (lastCount === null) {
            setLastCount(orders.length);
            return;
        }
        if (orders.length > lastCount) {
            // New order arrived — play sound + browser notification
            try {
                audioRef.current?.play().catch(() => {});
            } catch {}

            // Browser notification
            if (Notification.permission === 'granted') {
                new Notification('Новый заказ!', {
                    body: `Заказ #${orders[0]?.id} — ${orders[0]?.name}`,
                    icon: '/favicon.ico',
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
        setLastCount(orders.length);
    }, [orders]);
};

const STATUS_FLOW = ['paid', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'];

const STATUS_LABELS = {
    pending_payment: 'Ожидает оплаты',
    paid: 'Оплачен',
    preparing: 'Готовится',
    ready: 'Готов',
    delivering: 'В пути',
    delivered: 'Доставлен',
    cancelled: 'Отменён',
};

const ROW_STYLES = {
    pending_payment: 'bg-amber-50/60 border-l-4 border-l-amber-400',
    paid: 'bg-amber-50/80 border-l-4 border-l-amber-500',
    preparing: 'bg-blue-50/60 border-l-4 border-l-blue-400',
    ready: 'bg-violet-50/70 border-l-4 border-l-violet-500',
    delivering: 'bg-orange-50/60 border-l-4 border-l-orange-400',
    delivered: 'border-l-4 border-l-emerald-300',
    cancelled: 'bg-slate-50/50 border-l-4 border-l-slate-300 opacity-60',
};

// ─── Date presets ───
const getToday = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
};

const getDatePreset = (preset) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const from = new Date();
    from.setHours(0, 0, 0, 0);

    switch (preset) {
        case 'today':
            return {date_from: from.toISOString(), date_to: today.toISOString()};
        case 'yesterday': {
            const y = new Date(from);
            y.setDate(y.getDate() - 1);
            const yEnd = new Date(y);
            yEnd.setHours(23, 59, 59, 999);
            return {date_from: y.toISOString(), date_to: yEnd.toISOString()};
        }
        case 'week':
            from.setDate(from.getDate() - 7);
            return {date_from: from.toISOString(), date_to: today.toISOString()};
        case 'month':
            from.setDate(from.getDate() - 30);
            return {date_from: from.toISOString(), date_to: today.toISOString()};
        default:
            return {};
    }
};

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '', type: '', page: 1, limit: 20,
        date_from: '', date_to: '', search: '',
    });
    const [pagination, setPagination] = useState({});
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [activePreset, setActivePreset] = useState('');

    const buildParams = useCallback(() => {
        const params = {page: filters.page, limit: filters.limit};
        if (filters.status) params.status = filters.status;
        if (filters.type) params.type = filters.type;
        if (filters.date_from) params.date_from = filters.date_from;
        if (filters.date_to) params.date_to = filters.date_to;
        if (filters.search) params.search = filters.search;
        return params;
    }, [filters]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const {data} = await getOrders(buildParams());
            setOrders(data.data);
            setPagination(data.pagination);
        } finally {
            setLoading(false);
        }
    }, [buildParams]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // ─── Auto-refresh every 10s ───
    useEffect(() => {
        const interval = setInterval(() => {
            getOrders(buildParams()).then(({data}) => {
                setOrders(data.data);
                setPagination(data.pagination);
            }).catch(() => {
            });
        }, 10000);
        return () => clearInterval(interval);
    }, [buildParams]);

    const updateFilter = (field, value) => {
        setFilters(f => ({...f, [field]: value, page: 1}));
    };

    const applyPreset = (preset) => {
        const dates = getDatePreset(preset);
        setActivePreset(preset);
        setFilters(f => ({...f, ...dates, page: 1}));
    };

    const clearDateFilter = () => {
        setActivePreset('');
        setFilters(f => ({...f, date_from: '', date_to: '', page: 1}));
    };

    const openDetail = async (id) => {
        setDetailLoading(true);
        try {
            const {data} = await getOrder(id);
            setSelectedOrder(data.data);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleStatusChange = async (orderId, status) => {
        try {
            await updateOrderStatus(orderId, status);
            toast.success(`Статус → ${STATUS_LABELS[status] || status}`);
            fetchOrders();
            if (selectedOrder?.id === orderId) openDetail(orderId);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Ошибка');
        }
    };

    const handlePrint = async (orderId, type) => {
        try {
            if (type === 'kitchen') await printKitchen(orderId);
            else await printClient(orderId);
            toast.success('Отправлено на принтер');
        } catch {
            const url = type === 'kitchen' ? getKitchenReceipt(orderId) : getClientReceipt(orderId);
            window.open(url, '_blank');
        }
    };

    const formatDate = (d) => new Date(d).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const formatPrice = (n) => n?.toLocaleString('ru-RU') || '0';

    const activeCount = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
    const hasDateFilter = filters.date_from || filters.date_to;

    useOrderSound(orders);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Заказы</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        {pagination.total || 0} всего
                        {activeCount > 0 && (
                            <span
                                className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-xs font-semibold">
                                {activeCount} активных
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* ─── Filters ─── */}
            <div className="card p-4 mb-4 space-y-3">
                {/* Row 1: Search + Status + Type */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input
                            className="input pl-10 h-10"
                            placeholder="Поиск по #, имени, телефону..."
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                        />
                    </div>
                    <select className="input w-44 h-10" value={filters.status}
                            onChange={(e) => updateFilter('status', e.target.value)}>
                        <option value="">Все статусы</option>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                        ))}
                    </select>
                    <select className="input w-40 h-10" value={filters.type}
                            onChange={(e) => updateFilter('type', e.target.value)}>
                        <option value="">Все типы</option>
                        <option value="delivery">Доставка</option>
                        <option value="pickup">Самовывоз</option>
                    </select>
                </div>

                {/* Row 2: Date presets + Custom range */}
                <div className="flex flex-wrap items-center gap-2">
                    <CalendarDays size={16} className="text-slate-400"/>
                    {[
                        {key: 'today', label: 'Сегодня'},
                        {key: 'yesterday', label: 'Вчера'},
                        {key: 'week', label: 'Неделя'},
                        {key: 'month', label: 'Месяц'},
                    ].map(p => (
                        <button key={p.key}
                                onClick={() => applyPreset(p.key)}
                                className={clsx(
                                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                    activePreset === p.key
                                        ? 'bg-brand-500 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                )}
                        >
                            {p.label}
                        </button>
                    ))}

                    <div className="flex items-center gap-1.5 ml-2">
                        <input type="date" className="input h-8 w-36 text-xs px-2"
                               value={filters.date_from ? filters.date_from.split('T')[0] : ''}
                               onChange={(e) => {
                                   setActivePreset('');
                                   updateFilter('date_from', e.target.value ? new Date(e.target.value).toISOString() : '');
                               }}
                        />
                        <span className="text-slate-400 text-xs">—</span>
                        <input type="date" className="input h-8 w-36 text-xs px-2"
                               value={filters.date_to ? filters.date_to.split('T')[0] : ''}
                               onChange={(e) => {
                                   setActivePreset('');
                                   const d = new Date(e.target.value);
                                   d.setHours(23, 59, 59, 999);
                                   updateFilter('date_to', e.target.value ? d.toISOString() : '');
                               }}
                        />
                    </div>

                    {hasDateFilter && (
                        <button onClick={clearDateFilter}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                            <X size={14} className="text-slate-400"/>
                        </button>
                    )}
                </div>
            </div>

            {/* ─── Table ─── */}
            {loading ? <Spinner/> : orders.length === 0 ? (
                <EmptyState title="Нет заказов" description="Попробуйте изменить фильтры"/>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="bg-slate-50/80 text-xs uppercase text-slate-400 border-b border-slate-100">
                                <th className="text-left px-5 py-3">#</th>
                                <th className="text-left px-5 py-3">Клиент</th>
                                <th className="text-left px-5 py-3">Тип</th>
                                <th className="text-left px-5 py-3">Статус</th>
                                <th className="text-left px-5 py-3">Позиции</th>
                                <th className="text-right px-5 py-3">Сумма</th>
                                <th className="text-left px-5 py-3">Дата</th>
                                <th className="text-right px-5 py-3"></th>
                            </tr>
                            </thead>
                            <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}
                                    className={clsx(
                                        'transition-colors cursor-pointer hover:brightness-95',
                                        ROW_STYLES[order.status] || ''
                                    )}
                                    onClick={() => openDetail(order.id)}
                                >
                                    <td className="px-5 py-3.5 font-mono font-bold text-slate-700">#{order.id}</td>
                                    <td className="px-5 py-3.5">
                                        <p className={clsx('font-medium text-slate-700', order.status === 'cancelled' && 'line-through')}>{order.name}</p>
                                        <p className="text-xs text-slate-400">{order.phone}</p>
                                    </td>
                                    <td className="px-5 py-3.5">
                                            <span className="text-xs font-medium text-slate-500">
                                                {order.type === 'delivery' ? '🚚 Доставка' : '🏢 Самовывоз'}
                                            </span>
                                    </td>
                                    <td className="px-5 py-3.5"><StatusBadge status={order.status}/></td>
                                    <td className="px-5 py-3.5 text-xs text-slate-500 max-w-[200px]">
                                            <span className="line-clamp-1">
                                                {order.items?.map(i => `${i.quantity}× ${i.item_name}`).join(', ')}
                                            </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right font-bold text-slate-800">{formatPrice(order.total)} сом</td>
                                    <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{formatDate(order.created_at)}</td>
                                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => openDetail(order.id)} className="btn-ghost text-xs">
                                            <Eye size={14}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                            <span className="text-xs text-slate-400">
                                Стр. {pagination.page} из {pagination.totalPages} ({pagination.total} записей)
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    className="btn-ghost text-xs"
                                    disabled={pagination.page <= 1}
                                    onClick={() => setFilters(f => ({...f, page: 1}))}
                                >
                                    Первая
                                </button>
                                <button
                                    className="btn-ghost text-xs"
                                    disabled={pagination.page <= 1}
                                    onClick={() => setFilters(f => ({...f, page: f.page - 1}))}
                                >
                                    ← Назад
                                </button>

                                {/* Page numbers */}
                                {Array.from({length: Math.min(5, pagination.totalPages)}, (_, i) => {
                                    let pageNum;
                                    if (pagination.totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (pagination.page <= 3) {
                                        pageNum = i + 1;
                                    } else if (pagination.page >= pagination.totalPages - 2) {
                                        pageNum = pagination.totalPages - 4 + i;
                                    } else {
                                        pageNum = pagination.page - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setFilters(f => ({...f, page: pageNum}))}
                                            className={clsx(
                                                'w-8 h-8 rounded-lg text-xs font-medium transition-all',
                                                pagination.page === pageNum
                                                    ? 'bg-brand-500 text-white'
                                                    : 'text-slate-600 hover:bg-slate-100'
                                            )}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                <button
                                    className="btn-ghost text-xs"
                                    disabled={pagination.page >= pagination.totalPages}
                                    onClick={() => setFilters(f => ({...f, page: f.page + 1}))}
                                >
                                    Далее →
                                </button>
                                <button
                                    className="btn-ghost text-xs"
                                    disabled={pagination.page >= pagination.totalPages}
                                    onClick={() => setFilters(f => ({...f, page: pagination.totalPages}))}
                                >
                                    Последняя
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Order Detail Modal ─── */}
            <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Заказ #${selectedOrder?.id}`}
                   wide>
                {detailLoading ? <Spinner/> : selectedOrder && (
                    <div className="space-y-5">
                        {/* Status + Actions */}
                        <div className="flex flex-wrap items-center gap-3">


                            <div
                                className="flex items-center justify-between w-full p-4 bg-white border-b border-slate-100">
                                {/* Левая часть: Основной статус заказа */}
                                <div className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            Статус заказа
        </span>
                                    <StatusBadge status={selectedOrder.status}/>
                                </div>

                                {/* Правая часть: Статус оплаты */}
                                <div className="flex flex-col items-end gap-1">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            Оплата
        </span>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={selectedOrder.payment_status}/>
                                    </div>
                                </div>
                            </div>


                            {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                                <select
                                    className="input w-48 h-9 text-sm"
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value) handleStatusChange(selectedOrder.id, e.target.value);
                                    }}
                                >
                                    <option value="">Сменить статус...</option>
                                    {STATUS_FLOW.filter(s => s !== selectedOrder.status).map(s => (
                                        <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Print Buttons */}
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => handlePrint(selectedOrder.id, 'kitchen')}
                                    className="btn-ghost text-xs border border-slate-200">
                                <ChefHat size={14}/> Печать (кухня)
                            </button>
                            <button onClick={() => handlePrint(selectedOrder.id, 'client')}
                                    className="btn-ghost text-xs border border-slate-200">
                                <Receipt size={14}/> Печать (чек)
                            </button>
                            <a href={getReceiptPDF(selectedOrder.id)} target="_blank" rel="noreferrer"
                               className="btn-ghost text-xs border border-slate-200">
                                <Download size={14}/> PDF
                            </a>
                        </div>

                        {/* Items */}
                        <div className="bg-slate-50 rounded-xl p-4">
                            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3">Позиции</h4>
                            {selectedOrder.items?.map((item, i) => (
                                <div key={i} className="flex justify-between py-1.5 text-sm">
                                    <span className="text-slate-700">{item.quantity}× {item.item_name}</span>
                                    <span
                                        className="font-medium text-slate-800">{formatPrice(item.quantity * item.price)} сом</span>
                                </div>
                            ))}
                            <div className="border-t border-slate-200 mt-3 pt-3 space-y-1">
                                <div className="flex justify-between text-sm"><span
                                    className="text-slate-500">Сумма</span><span>{formatPrice(selectedOrder.subtotal)} сом</span>
                                </div>
                                {selectedOrder.discount > 0 && <div className="flex justify-between text-sm"><span
                                    className="text-slate-500">Скидка{selectedOrder.promo_code ? ` (${selectedOrder.promo_code})` : ''}</span><span
                                    className="text-emerald-600">-{formatPrice(selectedOrder.discount)} сом</span>
                                </div>}
                                {selectedOrder.delivery_fee > 0 && <div className="flex justify-between text-sm"><span
                                    className="text-slate-500">Доставка</span><span>{formatPrice(selectedOrder.delivery_fee)} сом</span>
                                </div>}
                                <div className="flex justify-between text-base font-bold pt-1">
                                    <span>Итого</span><span>{formatPrice(selectedOrder.total)} сом</span></div>
                            </div>
                        </div>

                        {/* Client Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-slate-400 text-xs">Имя</span><p
                                className="font-medium">{selectedOrder.name}</p></div>
                            <div><span className="text-slate-400 text-xs">Телефон</span><p
                                className="font-medium">{selectedOrder.phone}</p></div>
                            <div><span className="text-slate-400 text-xs">Тип</span><p
                                className="font-medium">{selectedOrder.type === 'delivery' ? 'Доставка' : 'Самовывоз'}</p>
                            </div>
                            {selectedOrder.address && <div><span className="text-slate-400 text-xs">Адрес</span><p
                                className="font-medium">{selectedOrder.address}{selectedOrder.apartment ? `, кв. ${selectedOrder.apartment}` : ''}{selectedOrder.floor ? `, ${selectedOrder.floor} эт.` : ''}</p>
                            </div>}
                            {selectedOrder.office_name && <div><span className="text-slate-400 text-xs">Офис</span><p
                                className="font-medium">{selectedOrder.office_name}</p></div>}
                            {selectedOrder.comment &&
                                <div className="col-span-2"><span className="text-slate-400 text-xs">Комментарий</span>
                                    <p className="font-medium">{selectedOrder.comment}</p></div>}
                        </div>

                        {/* Status History */}
                        {selectedOrder.status_history?.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">История</h4>
                                <div className="space-y-1.5">
                                    {selectedOrder.status_history.map((h, i) => (
                                        <div key={i} className="flex items-center gap-3 text-xs">
                                            <span className="text-slate-400 w-32">{formatDate(h.changed_at)}</span>
                                            <StatusBadge status={h.status}/>
                                            <span className="text-slate-400">{h.changed_by}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default OrdersPage;