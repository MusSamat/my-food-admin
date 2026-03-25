import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    timeout: 15000,
});

// Inject token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('admin_token');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

// ─── Auth ───
export const login = (data) => api.post('/admin/auth/login', data);
export const getMe = () => api.get('/admin/auth/me');

// ─── Categories ───
export const getCategories = () => api.get('/admin/categories');
export const createCategory = (data) => api.post('/admin/categories', data);
export const updateCategory = (id, data) => api.put(`/admin/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/admin/categories/${id}`);

// ─── Items ───
export const getItems = (params) => api.get('/admin/items', { params });
export const createItem = (formData) => api.post('/admin/items', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
});
export const updateItem = (id, formData) => api.put(`/admin/items/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
});
export const deleteItem = (id) => api.delete(`/admin/items/${id}`);

// ─── Orders ───
export const getOrders = (params) => api.get('/admin/orders', { params });
export const getOrder = (id) => api.get(`/admin/orders/${id}`);
export const updateOrderStatus = (id, status) => api.patch(`/admin/orders/${id}/status`, { status });

// ─── Offices ───
export const getOffices = () => api.get('/admin/offices');
export const createOffice = (data) => api.post('/admin/offices', data);
export const updateOffice = (id, data) => api.put(`/admin/offices/${id}`, data);
export const deleteOffice = (id) => api.delete(`/admin/offices/${id}`);

// ─── Promos ───
export const getPromos = () => api.get('/admin/promos');
export const createPromo = (data) => api.post('/admin/promos', data);
export const updatePromo = (id, data) => api.put(`/admin/promos/${id}`, data);
export const deletePromo = (id) => api.delete(`/admin/promos/${id}`);

// ─── Print ───
// ─── Print (token в URL для открытия в новой вкладке) ───
const getToken = () => localStorage.getItem('admin_token') || '';
export const getKitchenReceipt = (id) => `/api/admin/orders/${id}/receipt/kitchen?token=${getToken()}`;
export const getClientReceipt = (id) => `/api/admin/orders/${id}/receipt/client?token=${getToken()}`;
export const getReceiptPDF = (id) => `/api/admin/orders/${id}/receipt/pdf?token=${getToken()}`;export const printKitchen = (id) => api.post(`/admin/orders/${id}/print/kitchen`);
export const printClient = (id) => api.post(`/admin/orders/${id}/print/client`);
export const printTest = () => api.post('/admin/printer/test');

// ─── Printer Settings ───
export const getPrinterSettings = () => api.get('/admin/settings/printer');
export const savePrinterSettings = (data) => api.put('/admin/settings/printer', data);

// ─── Stats ───
export const getStats = () => api.get('/admin/stats');

//users
export const getUsers = (params) => api.get('/admin/users', { params });
export const getUserDetail = (id) => api.get(`/admin/users/${id}`);

export default api;