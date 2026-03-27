import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    // Если это конфиг для админки, оставьте base: '/admin/', если для mini-app — удалите эту строку
    base: '/admin/',
    server: {
        port: 3001,
        host: true, // Слушать все локальные адреса
        strictPort: true,
        allowedHosts: [
            'explicitly-grande-definition-laugh.trycloudflare.com', // Конкретно этот адрес
            '.trycloudflare.com' // И вообще все поддомены trycloudflare.com на будущее
        ],
        hmr: {
            clientPort: 443, // Обязательно для работы через HTTPS туннель
        },
        proxy: {
            '/api': 'http://localhost:4000',
            '/uploads': 'http://localhost:4000',
        },
    },
});