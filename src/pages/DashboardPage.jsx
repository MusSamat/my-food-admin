import React, { useEffect, useState } from 'react';
import { ShoppingBag, TrendingUp, DollarSign, Clock, Flame } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getStats } from '../services/api';
import { StatCard, Spinner } from '../components/ui';

const COLORS = ['#FF6B00', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

const DashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getStats().then(({ data }) => setStats(data.data)).finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner />;
    if (!stats) return null;

    const formatPrice = (n) => n?.toLocaleString('ru-RU') || '0';

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Дашборд</h1>
                <p className="text-sm text-slate-400 mt-1">Обзор за последние 30 дней</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Заказы сегодня" value={stats.today.orders} sub={`${formatPrice(stats.today.revenue)} сом`} icon={ShoppingBag} color="brand" />
                <StatCard label="За неделю" value={stats.week.orders} sub={`${formatPrice(stats.week.revenue)} сом`} icon={TrendingUp} color="blue" />
                <StatCard label="Средний чек" value={`${formatPrice(stats.avg_check)} сом`} icon={DollarSign} color="green" />
                <StatCard label="Активные заказы" value={stats.active_orders} icon={Clock} color="violet" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Orders Chart */}
                <div className="lg:col-span-2 card p-6">
                    <h3 className="font-semibold text-slate-700 mb-4">Заказы по дням</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={stats.daily_orders}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                            <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} fontSize={12} stroke="#94A3B8" />
                            <YAxis fontSize={12} stroke="#94A3B8" />
                            <Tooltip formatter={(v) => [`${v}`, 'Заказов']} labelFormatter={(d) => new Date(d).toLocaleDateString('ru-RU')} />
                            <Bar dataKey="count" fill="#FF6B00" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Category Pie */}
                <div className="card p-6">
                    <h3 className="font-semibold text-slate-700 mb-4">По категориям</h3>
                    {stats.by_category?.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={stats.by_category} dataKey="total_qty" nameKey="category" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                                        {stats.by_category.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 mt-2">
                                {stats.by_category.slice(0, 5).map((c, i) => (
                                    <div key={c.category} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                                            <span className="text-slate-600">{c.category}</span>
                                        </div>
                                        <span className="font-medium text-slate-800">{c.total_qty}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-slate-400 text-center py-8">Нет данных</p>
                    )}
                </div>
            </div>

            {/* Top Items */}
            <div className="card p-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                    <Flame size={18} className="text-brand-500" />
                    <h3 className="font-semibold text-slate-700">Топ-10 блюд</h3>
                </div>
                {stats.top_items?.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-slate-400 text-xs uppercase border-b border-slate-100">
                                    <th className="text-left py-3 px-2">#</th>
                                    <th className="text-left py-3 px-2">Блюдо</th>
                                    <th className="text-right py-3 px-2">Кол-во</th>
                                    <th className="text-right py-3 px-2">Сумма</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.top_items.map((item, i) => (
                                    <tr key={item.item_name} className="border-b border-slate-50 last:border-0">
                                        <td className="py-2.5 px-2 text-slate-400">{i + 1}</td>
                                        <td className="py-2.5 px-2 font-medium text-slate-700">{item.item_name}</td>
                                        <td className="py-2.5 px-2 text-right text-slate-600">{item.total_qty}</td>
                                        <td className="py-2.5 px-2 text-right font-medium text-slate-800">{formatPrice(parseInt(item.total_sum))} сом</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 text-center py-4">Нет данных</p>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
