import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import CategoriesPage from './pages/CategoriesPage';
import ItemsPage from './pages/ItemsPage';
import OfficesPage from './pages/OfficesPage';
import PromosPage from './pages/PromosPage';
import PrinterPage from './pages/PrinterPage';
import { Spinner } from './components/ui';
import UsersPage from "./pages/UsersPage";
import SettingsPage from './pages/SettingsPage';
import BranchesPage from './pages/BranchesPage';
import AdminsPage from './pages/AdminsPage';

const ProtectedRoute = ({ children }) => {
    const { token } = useAuthStore();
    if (!token) return <Navigate to="/login" replace />;
    return children;
};

const App = () => {
    const { token, checkAuth } = useAuthStore();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (token) {
            checkAuth().finally(() => setChecking(false));
        } else {
            setChecking(false);
        }
    }, []);

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    return (
        <BrowserRouter basename="/admin">
            <Routes>
                <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />

                <Route path="/" element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }>
                    <Route index element={<DashboardPage />} />
                    <Route path="orders" element={<OrdersPage />} />
                    <Route path="categories" element={<CategoriesPage />} />
                    <Route path="items" element={<ItemsPage />} />
                    <Route path="offices" element={<OfficesPage />} />
                    <Route path="promos" element={<PromosPage />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="branches" element={<BranchesPage />} />
                    <Route path="admins" element={<AdminsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="printer" element={<PrinterPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;