/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#FFF7ED',
                    100: '#FFEDD5',
                    200: '#FED7AA',
                    300: '#FDBA74',
                    400: '#FB923C',
                    500: '#FF6B00',
                    600: '#E55F00',
                    700: '#C2410C',
                    800: '#9A3412',
                    900: '#7C2D12',
                },
                surface: '#F8FAFC',
                sidebar: '#0F172A',
                'sidebar-hover': '#1E293B',
                'sidebar-active': '#334155',
            },
            fontFamily: {
                sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
        },
    },
    plugins: [],
};
