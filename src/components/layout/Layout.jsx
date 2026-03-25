import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, FolderOpen, ShoppingBag, Building2, Ticket,
         Printer, LogOut, ChefHat, Users} from 'lucide-react';
import { clsx } from 'clsx';
import useAuthStore from '../../stores/authStore';

const NAV = [
    { to: '/', icon: LayoutDashboard, label: 'Дашборд' },
    { to: '/orders', icon: ShoppingBag, label: 'Заказы' },
    { to: '/categories', icon: FolderOpen, label: 'Категории' },
    { to: '/items', icon: UtensilsCrossed, label: 'Блюда' },
    { to: '/offices', icon: Building2, label: 'Офисы' },
    { to: '/promos', icon: Ticket, label: 'Промокоды' },
    { to: '/users', icon: Users, label: 'Пользователи' },
    { to: '/printer', icon: Printer, label: 'Принтер' },
];

const SidebarLink = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
        end={to === '/'}
        className={({ isActive }) => clsx(
            'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            isActive
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'text-slate-400 hover:text-white hover:bg-sidebar-hover'
        )}
    >
        <Icon size={18} />
        <span>{label}</span>
    </NavLink>
);

const Layout = () => {
    const { admin, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-sidebar flex flex-col shrink-0">
                {/* Logo */}
                <div className="px-6 py-6 flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
                        <ChefHat size={20} className="text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm">Food Delivery</p>
                        <p className="text-[11px] text-slate-500">Админ-панель</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 space-y-1 mt-2">
                    {NAV.map(item => (
                        <SidebarLink key={item.to} {...item} />
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-3 px-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                            {admin?.name?.[0] || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-300 truncate">{admin?.name || 'Admin'}</p>
                            <p className="text-[11px] text-slate-500">{admin?.role}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors">
                        <LogOut size={16} />
                        Выйти
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
