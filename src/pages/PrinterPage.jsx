import React, { useEffect, useState } from 'react';
import { Printer, Wifi, Usb, Monitor, TestTube2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPrinterSettings, savePrinterSettings, printTest } from '../services/api';
import { Spinner } from '../components/ui';

const CONNECTION_OPTIONS = [
    { value: 'browser', label: 'Браузер (без принтера)', icon: Monitor, desc: 'Чеки открываются в новой вкладке для печати через Ctrl+P' },
    { value: 'lan', label: 'Сеть (LAN)', icon: Wifi, desc: 'Термопринтер подключён по сети (Ethernet/WiFi)' },
    { value: 'usb', label: 'USB', icon: Usb, desc: 'Термопринтер подключён через USB (требуется серверный доступ)' },
];

const PrinterPage = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    useEffect(() => {
        getPrinterSettings()
            .then(({ data }) => setSettings(data.data || {
                connection_type: 'browser', ip_address: '', port: 9100,
                paper_width: '80mm', auto_print_kitchen: false, auto_print_client: false,
            }))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data } = await savePrinterSettings(settings);
            setSettings(data.data);
            toast.success('Настройки сохранены');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            await printTest();
            setTestResult({ success: true, message: 'Тестовый чек отправлен на принтер' });
        } catch (err) {
            setTestResult({ success: false, message: err.response?.data?.message || 'Принтер недоступен' });
        } finally {
            setTesting(false);
        }
    };

    const update = (field, value) => setSettings(s => ({ ...s, [field]: value }));

    if (loading) return <Spinner />;
    if (!settings) return null;

    const isNetworkPrinter = settings.connection_type === 'lan';

    return (
        <div className="max-w-2xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Настройки принтера</h1>
                <p className="text-sm text-slate-400 mt-1">Печать кухонных и клиентских чеков</p>
            </div>

            {/* Connection Type */}
            <div className="card p-6 mb-6">
                <h3 className="font-semibold text-slate-700 mb-4">Тип подключения</h3>
                <div className="space-y-3">
                    {CONNECTION_OPTIONS.map(({ value, label, icon: Icon, desc }) => (
                        <label key={value}
                            className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                settings.connection_type === value
                                    ? 'border-brand-500 bg-brand-50/50'
                                    : 'border-slate-100 hover:border-slate-200 bg-white'
                            }`}
                        >
                            <input
                                type="radio"
                                name="connection_type"
                                value={value}
                                checked={settings.connection_type === value}
                                onChange={() => update('connection_type', value)}
                                className="mt-1 w-4 h-4 text-brand-500 focus:ring-brand-500"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <Icon size={16} className={settings.connection_type === value ? 'text-brand-500' : 'text-slate-400'} />
                                    <span className="font-medium text-slate-700">{label}</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{desc}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Network Settings */}
            {isNetworkPrinter && (
                <div className="card p-6 mb-6">
                    <h3 className="font-semibold text-slate-700 mb-4">Сетевые параметры</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">IP-адрес принтера</label>
                            <input className="input font-mono" value={settings.ip_address || ''}
                                onChange={(e) => update('ip_address', e.target.value)}
                                placeholder="192.168.1.100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Порт</label>
                            <input className="input font-mono" type="number" value={settings.port || 9100}
                                onChange={(e) => update('port', parseInt(e.target.value) || 9100)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Paper & Auto-print */}
            <div className="card p-6 mb-6">
                <h3 className="font-semibold text-slate-700 mb-4">Параметры печати</h3>

                <div className="mb-5">
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Ширина бумаги</label>
                    <div className="flex rounded-xl border border-slate-200 overflow-hidden w-fit">
                        {['80mm', '58mm'].map(w => (
                            <button key={w} type="button"
                                onClick={() => update('paper_width', w)}
                                className={`px-6 py-2.5 text-sm font-medium transition-colors ${
                                    settings.paper_width === w ? 'bg-brand-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {w}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer">
                        <div>
                            <p className="font-medium text-slate-700 text-sm">Автопечать кухонного чека</p>
                            <p className="text-xs text-slate-400 mt-0.5">Автоматически печатать при оплате заказа</p>
                        </div>
                        <div className="relative">
                            <input type="checkbox" checked={settings.auto_print_kitchen}
                                onChange={(e) => update('auto_print_kitchen', e.target.checked)}
                                className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-300 peer-checked:bg-brand-500 rounded-full transition-colors" />
                            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                        </div>
                    </label>

                    <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer">
                        <div>
                            <p className="font-medium text-slate-700 text-sm">Автопечать клиентского чека</p>
                            <p className="text-xs text-slate-400 mt-0.5">Автоматически печатать при оплате заказа</p>
                        </div>
                        <div className="relative">
                            <input type="checkbox" checked={settings.auto_print_client}
                                onChange={(e) => update('auto_print_client', e.target.checked)}
                                className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-300 peer-checked:bg-brand-500 rounded-full transition-colors" />
                            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                        </div>
                    </label>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button onClick={handleSave} className="btn-primary text-sm" disabled={saving}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                    Сохранить настройки
                </button>

                {settings.connection_type !== 'browser' && (
                    <button onClick={handleTest} className="btn-secondary text-sm" disabled={testing}>
                        {testing ? <Loader2 size={16} className="animate-spin" /> : <TestTube2 size={16} />}
                        Тестовая печать
                    </button>
                )}
            </div>

            {/* Test Result */}
            {testResult && (
                <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${
                    testResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                    {testResult.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span className="text-sm font-medium">{testResult.message}</span>
                </div>
            )}
        </div>
    );
};

export default PrinterPage;
