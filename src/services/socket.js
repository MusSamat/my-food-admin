import { io } from 'socket.io-client';

let socket = null;

export const getAdminSocket = () => {
    if (!socket) {
        socket = io(window.location.origin, {
            path: '/ws',
            transports: ['websocket', 'polling'],
        });
    }
    return socket;
};

export const joinAdmin = (branchId) => {
    const s = getAdminSocket();
    s.emit('join:admin', branchId || null);
};

export const onNewOrder = (callback) => {
    const s = getAdminSocket();
    s.on('order:new', callback);
    return () => s.off('order:new', callback);
};

export const onOrderUpdated = (callback) => {
    const s = getAdminSocket();
    s.on('order:updated', callback);
    return () => s.off('order:updated', callback);
};