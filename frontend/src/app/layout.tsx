// frontend/src/app/layout.tsx
import { Inter, Cinzel } from 'next/font/google'
import { Metadata } from 'next'
import { Providers } from '@/components/providers'
import { Toaster } from 'react-hot-toast'
import '@/styles/globals.css'

const inter = Inter({
    subsets: ['latin', 'cyrillic'],
    variable: '--font-inter',
    display: 'swap',
})

const cinzel = Cinzel({
    subsets: ['latin'],
    variable: '--font-cinzel',
    display: 'swap',
})

export const metadata: Metadata = {
    title: {
        default: 'D&D AI Game',
        template: '%s | D&D AI Game'
    },
    description: 'Настольная ролевая игра D&D с ИИ мастером',
    keywords: ['D&D', 'DnD', 'ролевые игры', 'ИИ', 'настольные игры'],
    authors: [{ name: 'D&D AI Team' }],
    creator: 'D&D AI Team',
    publisher: 'D&D AI Team',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    openGraph: {
        type: 'website',
        locale: 'ru_RU',
        url: '/',
        title: 'D&D AI Game',
        description: 'Настольная ролевая игра D&D с ИИ мастером',
        siteName: 'D&D AI Game',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'D&D AI Game',
        description: 'Настольная ролевая игра D&D с ИИ мастером',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        // google: process.env.GOOGLE_VERIFICATION,
        // yandex: process.env.YANDEX_VERIFICATION,
    },
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="ru" className={`${inter.variable} ${cinzel.variable}`}>
        <head>
            <link rel="icon" href="/favicon.ico" />
            <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content="#1f2937" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="apple-mobile-web-app-title" content="D&D AI" />
            <meta name="mobile-web-app-capable" content="yes" />
        </head>
        <body className={`${inter.className} antialiased`}>
        <Providers>
            <div className="min-h-screen bg-background font-sans antialiased">
                {children}
            </div>

            {/* Toast уведомления */}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: 'hsl(var(--card))',
                        color: 'hsl(var(--card-foreground))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '14px',
                        padding: '12px 16px',
                    },
                    success: {
                        iconTheme: {
                            primary: 'hsl(var(--primary))',
                            secondary: 'white',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: 'hsl(var(--destructive))',
                            secondary: 'white',
                        },
                    },
                }}
            />
        </Providers>
        </body>
        </html>
    )
}