// frontend/src/hooks/use-auth.ts
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

export function useAuth() {
    const authStore = useAuthStore()

    return {
        user: authStore.user,
        isAuthenticated: authStore.isAuthenticated,
        isLoading: authStore.isLoading,
        error: authStore.error,
        login: authStore.login,
        register: authStore.register,
        logout: authStore.logout,
        checkAuth: authStore.checkAuth,
        clearError: authStore.clearError
    }
}

export function useRequireAuth(redirectTo: string = '/auth/login') {
    const { isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push(redirectTo)
        }
    }, [isAuthenticated, isLoading, router, redirectTo])

    return {
        isAuthenticated,
        isLoading
    }
}

export function useRedirectIfAuthenticated(redirectTo: string = '/dashboard') {
    const { isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push(redirectTo)
        }
    }, [isAuthenticated, isLoading, router, redirectTo])

    return {
        isAuthenticated,
        isLoading
    }
}

// Хук для проверки ролей пользователя (для будущего расширения)
export function usePermissions() {
    const { user } = useAuth()

    // TODO: Реализовать систему ролей
    const hasRole = (role: string) => {
        // Пока все пользователи имеют роль 'player'
        return role === 'player'
    }

    const canCreateSession = () => hasRole('player')
    const canJoinSession = () => hasRole('player')
    const canCreateCharacter = () => hasRole('player')

    return {
        hasRole,
        canCreateSession,
        canJoinSession,
        canCreateCharacter
    }
}

// Хук для работы с состоянием входа
export function useLoginState() {
    const { login, isLoading, error, clearError } = useAuth()

    const handleLogin = async (credentials: { email: string; password: string }) => {
        try {
            clearError()
            await login(credentials)
            return { success: true }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Ошибка при входе'
            }
        }
    }

    return {
        handleLogin,
        isLoading,
        error,
        clearError
    }
}

// Хук для работы с состоянием регистрации
export function useRegisterState() {
    const { register, isLoading, error, clearError } = useAuth()

    const handleRegister = async (credentials: {
        email: string
        username: string
        password: string
    }) => {
        try {
            clearError()
            await register(credentials)
            return { success: true }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Ошибка при регистрации'
            }
        }
    }

    return {
        handleRegister,
        isLoading,
        error,
        clearError
    }
}

// Хук для работы с токеном аутентификации
export function useAuthToken() {
    const { token } = useAuthStore()

    const getAuthHeaders = () => {
        if (!token) return {}

        return {
            'Authorization': `Bearer ${token}`
        }
    }

    const isTokenValid = () => {
        if (!token) return false

        try {
            // Простая проверка формата JWT
            const parts = token.split('.')
            if (parts.length !== 3) return false

            // Проверяем срок действия токена
            const payload = JSON.parse(atob(parts[1]))
            const now = Date.now() / 1000

            return payload.exp > now
        } catch {
            return false
        }
    }

    return {
        token,
        getAuthHeaders,
        isTokenValid
    }
}

// Хук для автоматического обновления токена
export function useTokenRefresh() {
    const { token, checkAuth } = useAuth()
    const { isTokenValid } = useAuthToken()

    useEffect(() => {
        if (!token || !isTokenValid()) {
            return
        }

        // Обновляем токен за 5 минут до истечения
        const payload = JSON.parse(atob(token.split('.')[1]))
        const expirationTime = payload.exp * 1000
        const refreshTime = expirationTime - (5 * 60 * 1000) // 5 минут
        const timeUntilRefresh = refreshTime - Date.now()

        if (timeUntilRefresh > 0) {
            const timer = setTimeout(() => {
                checkAuth() // Проверяем и обновляем токен
            }, timeUntilRefresh)

            return () => clearTimeout(timer)
        }
    }, [token, checkAuth, isTokenValid])
}

// Хук для отслеживания последней активности
export function useActivityTracking() {
    const { isAuthenticated, logout } = useAuth()

    useEffect(() => {
        if (!isAuthenticated) return

        let lastActivity = Date.now()
        const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 минут

        const updateActivity = () => {
            lastActivity = Date.now()
        }

        const checkActivity = () => {
            const now = Date.now()
            if (now - lastActivity > INACTIVITY_TIMEOUT) {
                logout()
            }
        }

        // Отслеживаем активность пользователя
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
        events.forEach(event => {
            document.addEventListener(event, updateActivity, true)
        })

        // Проверяем активность каждую минуту
        const activityTimer = setInterval(checkActivity, 60 * 1000)

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, updateActivity, true)
            })
            clearInterval(activityTimer)
        }
    }, [isAuthenticated, logout])
}