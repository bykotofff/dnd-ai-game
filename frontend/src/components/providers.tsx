'use client'

// frontend/src/components/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useSocket } from '@/lib/socket-client'

// Создаем QueryClient с оптимальными настройками
function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Время жизни кэша в миллисекундах (5 минут)
                staleTime: 5 * 60 * 1000,
                // Время хранения неактивных данных (10 минут)
                cacheTime: 10 * 60 * 1000,
                // Повторные запросы при ошибках
                retry: (failureCount, error: any) => {
                    // Не повторяем для 404 и 401
                    if (error?.response?.status === 404 || error?.response?.status === 401) {
                        return false
                    }
                    return failureCount < 3
                },
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
                // Рефетч при фокусе окна
                refetchOnWindowFocus: false,
                // Рефетч при переподключении
                refetchOnReconnect: true,
            },
            mutations: {
                // Повторные попытки для мутаций
                retry: 1,
                retryDelay: 1000,
            },
        },
    })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
    if (typeof window === 'undefined') {
        // Сервер: всегда создаем новый клиент
        return makeQueryClient()
    } else {
        // Браузер: используем singleton
        if (!browserQueryClient) browserQueryClient = makeQueryClient()
        return browserQueryClient
    }
}

// Компонент для автоматической проверки аутентификации
function AuthChecker() {
    const checkAuth = useAuthStore(state => state.checkAuth)
    const isAuthenticated = useAuthStore(state => state.isAuthenticated)
    const token = useAuthStore(state => state.token)
    const { connect, disconnect } = useSocket()

    useEffect(() => {
        // Проверяем аутентификацию при загрузке
        checkAuth()
    }, [checkAuth])

    useEffect(() => {
        // Подключаемся к Socket.IO если аутентифицированы
        if (isAuthenticated && token) {
            connect()
        } else {
            disconnect()
        }
    }, [isAuthenticated, token, connect, disconnect])

    return null
}

// Провайдер темы
function CustomThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
    )
}

// Главный провайдер
export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => getQueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            <CustomThemeProvider>
                <AuthChecker />
                {children}
            </CustomThemeProvider>

            {/* React Query DevTools только в разработке */}
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools
                    initialIsOpen={false}
                    position="bottom-right"
                />
            )}
        </QueryClientProvider>
    )
}

// Хук для глобального состояния загрузки
export function useGlobalLoading() {
    const authLoading = useAuthStore(state => state.isLoading)

    return {
        isLoading: authLoading,
    }
}

// Компонент лоадера для приложения
export function AppLoader() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-sm text-muted-foreground">Загрузка...</p>
            </div>
        </div>
    )
}

// HOC для защищенных страниц
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
    return function AuthenticatedComponent(props: P) {
        const isAuthenticated = useAuthStore(state => state.isAuthenticated)
        const isLoading = useAuthStore(state => state.isLoading)

        if (isLoading) {
            return <AppLoader />
        }

        if (!isAuthenticated) {
            // Перенаправляем на страницу входа
            if (typeof window !== 'undefined') {
                window.location.href = '/auth/login'
            }
            return <AppLoader />
        }

        return <Component {...props} />
    }
}

// Компонент для отображения статуса подключения
export function ConnectionStatus() {
    const connectionStatus = useSocket().connectionStatus

    if (connectionStatus === 'connected') {
        return null
    }

    const statusConfig = {
        disconnected: {
            text: 'Не подключен',
            color: 'bg-gray-500',
            icon: '⚫'
        },
        connecting: {
            text: 'Подключение...',
            color: 'bg-yellow-500',
            icon: '🟡'
        },
        error: {
            text: 'Ошибка подключения',
            color: 'bg-red-500',
            icon: '🔴'
        }
    }

    const config = statusConfig[connectionStatus] || statusConfig.disconnected

    return (
        <div className="fixed top-4 right-4 z-40 flex items-center space-x-2 rounded-md bg-card px-3 py-2 text-sm shadow-lg border">
            <span className={`h-2 w-2 rounded-full ${config.color}`}></span>
            <span className="text-card-foreground">{config.text}</span>
        </div>
    )
}

// Wrapper для страниц игры
export function GamePageWrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <ConnectionStatus />
            {children}
        </div>
    )
}