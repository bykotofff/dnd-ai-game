// next.config.js (удалить next.config.ts и использовать этот файл)
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
                dns: false,
                crypto: false,
                stream: false,
                buffer: false,
                util: false,
                url: false,
                querystring: false,
                path: false,
                os: false,
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

    // Настройки безопасности
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
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
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

    // Настройки для production
    compress: true,
    productionBrowserSourceMaps: false,

    // Настройки для анализа бандла
    ...(process.env.ANALYZE === 'true' && {
        webpack: (config, options) => {
            const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')({
                enabled: process.env.ANALYZE === 'true',
            })

            if (options.isServer === false) {
                config.plugins.push(new BundleAnalyzerPlugin())
            }

            return config
        },
    }),
}

module.exports = nextConfig