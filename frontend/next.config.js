// frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        appDir: true,
    },

    // Оптимизация изображений
    images: {
        domains: [
            'localhost',
            '127.0.0.1'
        ],
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },

    // Переменные окружения
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
        NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
    },

    // Webpack конфигурация
    webpack: (config, { isServer }) => {
        // Исправление для Socket.IO в браузере
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            }
        }

        return config
    },

    // Настройки для разработки
    reactStrictMode: true,
    swcMinify: true,

    // Настройки TypeScript
    typescript: {
        ignoreBuildErrors: false,
    },

    // ESLint настройки
    eslint: {
        ignoreDuringBuilds: false,
    },

    // Настройки для PWA (если нужно)
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin',
                    },
                ],
            },
        ]
    },

    // Редиректы
    async redirects() {
        return [
            {
                source: '/',
                destination: '/dashboard',
                permanent: false,
            },
        ]
    },
}

module.exports = nextConfig