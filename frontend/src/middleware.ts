// frontend/src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Маршруты, которые требуют аутентификации
const protectedRoutes = [
    '/dashboard',
    '/game',
    '/characters',
    '/sessions',
    '/profile',
    '/settings'
]

// Маршруты, доступные только неаутентифицированным пользователям
const authRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password'
]

// Публичные маршруты
const publicRoutes = [
    '/',
    '/about',
    '/help',
    '/privacy',
    '/terms',
    '/contact'
]

function isProtectedRoute(pathname: string): boolean {
    return protectedRoutes.some(route => pathname.startsWith(route))
}

function isAuthRoute(pathname: string): boolean {
    return authRoutes.some(route => pathname.startsWith(route))
}

function isPublicRoute(pathname: string): boolean {
    return publicRoutes.includes(pathname) ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.includes('.')
}

function hasValidToken(request: NextRequest): boolean {
    // Проверяем токен в cookies
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
        // Также проверяем localStorage через заголовки (если есть)
        const authHeader = request.headers.get('authorization')
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return true
        }
        return false
    }

    // Простая проверка формата токена (не полная валидация)
    try {
        const parts = token.split('.')
        return parts.length === 3 // JWT должен иметь 3 части
    } catch {
        return false
    }
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const isAuthenticated = hasValidToken(request)

    // Логирование для отладки (только в разработке)
    if (process.env.NODE_ENV === 'development') {
        console.log(`Middleware: ${pathname}, Auth: ${isAuthenticated}`)
    }

    // Разрешаем публичные маршруты
    if (isPublicRoute(pathname)) {
        return NextResponse.next()
    }

    // Если пользователь аутентифицирован и пытается попасть на auth страницы
    if (isAuthenticated && isAuthRoute(pathname)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Если пользователь не аутентифицирован и пытается попасть на защищенные страницы
    if (!isAuthenticated && isProtectedRoute(pathname)) {
        const loginUrl = new URL('/auth/login', request.url)
        // Сохраняем URL для редиректа после входа
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Редирект с корневой страницы
    if (pathname === '/') {
        if (isAuthenticated) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        } else {
            return NextResponse.redirect(new URL('/auth/login', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Применяем middleware ко всем маршрутам кроме:
         * - api routes
         * - _next/static (статические файлы)
         * - _next/image (оптимизированные изображения)
         * - favicon.ico
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}