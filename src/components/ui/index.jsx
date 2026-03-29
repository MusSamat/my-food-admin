import React from 'react';
import { X, AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

// ─── Modal ───
export const Modal = ({ isOpen, onClose, title, children, wide }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className={clsx(
                'relative bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto',
                wide ? 'max-w-2xl' : 'max-w-lg'
            )}>
                <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-slate-100 rounded-t-2xl z-10">
                    <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

// ─── Confirm Dialog ───
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, loading }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Подтвердите действие'}>
        <div className="flex items-start gap-3 mb-6">
            <div className="p-2 bg-amber-50 rounded-xl">
                <AlertTriangle size={20} className="text-amber-500" />
            </div>
            <p className="text-slate-600 text-sm leading-relaxed pt-1">{message}</p>
        </div>
        <div className="flex justify-end gap-3">
            <button onClick={onClose} className="btn-secondary text-sm h-10" disabled={loading}>Отмена</button>
            <button onClick={onConfirm} className="btn-danger text-sm h-10" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                Удалить
            </button>
        </div>
    </Modal>
);

// ─── Status Badge ───
const STATUS_STYLES = {
    pending_payment: 'bg-amber-50 text-amber-700 border-amber-200',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    preparing: 'bg-blue-50 text-blue-700 border-blue-200',
    ready: 'bg-violet-50 text-violet-700 border-violet-200',
    delivering: 'bg-orange-50 text-orange-700 border-orange-200',
    delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
    available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    coming_soon: 'bg-amber-50 text-amber-700 border-amber-200',
    out_of_stock: 'bg-red-50 text-red-700 border-red-200',
    hidden: 'bg-slate-50 text-slate-500 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
};

const STATUS_LABELS = {
    pending_payment: 'Ожидает оплаты',
    paid: 'Оплачен',
    preparing: 'Готовится',
    ready: 'Готов',
    delivering: 'В пути',
    delivered: 'Доставлен',
    cancelled: 'Отменён',
    available: 'В наличии',
    coming_soon: 'Скоро',
    out_of_stock: 'Нет',
    hidden: 'Скрыт',
    success: 'Оплачено',
    failed: 'Ошибка',
    pending: 'Ожидание',
};

export const StatusBadge = ({ status }) => (
    <span className={clsx('badge border', STATUS_STYLES[status] || 'bg-slate-50 text-slate-600')}>
        {STATUS_LABELS[status] || status}
    </span>
);

// ─── Empty State ───
export const EmptyState = ({ icon: Icon = Inbox, title = 'Пусто', description }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-slate-100 rounded-2xl mb-4">
            <Icon size={28} className="text-slate-400" />
        </div>
        <p className="font-semibold text-slate-700">{title}</p>
        {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
    </div>
);

// ─── Spinner ───
export const Spinner = ({ className }) => (
    <div className={clsx('flex items-center justify-center py-12', className)}>
        <Loader2 size={28} className="animate-spin text-brand-500" />
    </div>
);

// ─── Stat Card ───
export const StatCard = ({ label, value, sub, icon: Icon, color = 'brand' }) => {
    const colors = {
        brand: 'bg-brand-50 text-brand-600',
        green: 'bg-emerald-50 text-emerald-600',
        blue: 'bg-blue-50 text-blue-600',
        violet: 'bg-violet-50 text-violet-600',
    };
    return (
        <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500">{label}</span>
                <div className={clsx('p-2 rounded-xl', colors[color])}>
                    <Icon size={18} />
                </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
    );
};
