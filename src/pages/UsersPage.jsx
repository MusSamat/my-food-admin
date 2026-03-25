import React, { useEffect, useState, useCallback } from 'react';
import { Users, Eye, Search, ShoppingBag, Phone as PhoneIcon, MapPin } from 'lucide-react';
import { getUsers, getUserDetail } from '../services/api';
import { Modal, StatusBadge, Spinner, EmptyState } from '../components/ui';

const formatDate = (d) => d ? new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const formatPrice = (n) => n?.toLocaleString('ru-RU') || '0';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [selectedUser, setSelectedUser] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (search.trim().length >= 2) params.search = search;
            const { data } = await getUsers(params);
            setUsers(data.data);
            setPagination(data.pagination);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => { setPage(1); fetchUsers(); }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const openDetail = async (id) => {
        setDetailLoading(true);
        try {
            const { data } = await getUserDetail(id);
            setSelectedUser(data.data);
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Пользователи</h1>
                    <p className="text-sm text-slate-400 mt-1">{pagination.total || 0} всего</p>
                </div>
            </div>

            {/* Search */}
            <div className="card p-4 mb-6">
                <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        className="input pl-10"
                        placeholder="Поиск по имени, телефону, username, Telegram ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            {loading ? <Spinner /> : users.length === 0 ? (
                <EmptyState icon={Users} title="Нет пользователей" description="Пользователи появятся после первого заказа" />
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="bg-slate-50/80 text-xs uppercase text-slate-400 border-b border-slate-100">
                                <th className="text-left px-5 py-3">Пользователь</th>
                                <th className="text-left px-5 py-3">Telegram</th>
                                <th className="text-left px-5 py-3">Телефон</th>
                                <th className="text-center px-5 py-3">Заказов</th>
                                <th className="text-right px-5 py-3">Потрачено</th>
                                <th className="text-left px-5 py-3">Последний заказ</th>
                                <th className="text-right px-5 py-3"></th>
                            </tr>
                            </thead>
                            <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <p className="font-medium text-slate-700">{u.first_name || ''} {u.last_name || ''}</p>
                                    </td>
                                    <td className="px-5 py-3.5">
                                            <span className="text-xs font-mono text-slate-500">
                                                {u.username ? `@${u.username}` : `ID: ${u.telegram_id}`}
                                            </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-600">{u.phone || '—'}</td>
                                    <td className="px-5 py-3.5 text-center">
                                        <span className="font-semibold text-slate-700">{u.order_count}</span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right font-medium text-slate-800">
                                        {formatPrice(u.total_spent)} сом
                                    </td>
                                    <td className="px-5 py-3.5 text-xs text-slate-500">{formatDate(u.last_order_at)}</td>
                                    <td className="px-5 py-3.5 text-right">
                                        <button onClick={() => openDetail(u.id)} className="btn-ghost text-xs">
                                            <Eye size={14} /> Детали
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
                            <span className="text-xs text-slate-400">Стр. {pagination.page} из {pagination.totalPages}</span>
                            <div className="flex gap-2">
                                <button className="btn-ghost text-xs" disabled={page <= 1}
                                        onClick={() => setPage(p => p - 1)}>Назад</button>
                                <button className="btn-ghost text-xs" disabled={page >= pagination.totalPages}
                                        onClick={() => setPage(p => p + 1)}>Далее</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* User Detail Modal */}
            <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="Пользователь" wide>
                {detailLoading ? <Spinner /> : selectedUser && (
                    <div className="space-y-5">
                        {/* Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-400 text-xs">Имя</span>
                                <p className="font-medium">{selectedUser.first_name || ''} {selectedUser.last_name || ''}</p>
                            </div>
                            <div>
                                <span className="text-slate-400 text-xs">Telegram</span>
                                <p className="font-medium font-mono">
                                    {selectedUser.username ? `@${selectedUser.username}` : ''} ({selectedUser.telegram_id})
                                </p>
                            </div>
                            {selectedUser.phone && (
                                <div>
                                    <span className="text-slate-400 text-xs">Телефон</span>
                                    <p className="font-medium flex items-center gap-1"><PhoneIcon size={13} />{selectedUser.phone}</p>
                                </div>
                            )}
                            {selectedUser.birthday && (
                                <div>
                                    <span className="text-slate-400 text-xs">День рождения</span>
                                    <p className="font-medium">{selectedUser.birthday}</p>
                                </div>
                            )}
                            {selectedUser.saved_address && (
                                <div className="col-span-2">
                                    <span className="text-slate-400 text-xs">Сохранённый адрес</span>
                                    <p className="font-medium flex items-center gap-1"><MapPin size={13} />{selectedUser.saved_address}</p>
                                </div>
                            )}
                            <div>
                                <span className="text-slate-400 text-xs">Зарегистрирован</span>
                                <p className="font-medium">{formatDate(selectedUser.created_at)}</p>
                            </div>
                        </div>

                        {/* Orders */}
                        {selectedUser.orders?.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3">
                                    Заказы ({selectedUser.orders.length})
                                </h4>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {selectedUser.orders.map(order => (
                                        <div key={order.id} className="bg-slate-50 rounded-xl p-3 text-sm">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-mono font-medium text-slate-700">#{order.id}</span>
                                                <StatusBadge status={order.status} />
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-slate-500">
                                                <span>{formatDate(order.created_at)}</span>
                                                <span className="font-semibold text-slate-800">{formatPrice(order.total)} сом</span>
                                            </div>
                                            <div className="mt-1.5 text-xs text-slate-400">
                                                {order.items?.map((item, i) => (
                                                    <span key={i}>{i > 0 ? ', ' : ''}{item.quantity}× {item.item_name}</span>
                                                ))}
                                            </div>
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

export default UsersPage;