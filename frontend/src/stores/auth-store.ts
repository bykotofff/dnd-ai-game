// frontend/src/stores/auth-store.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { apiClient } from '@/lib/api-client'
import { User, LoginCredentials, RegisterCredentials, AuthResponse } from '@/types'

interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
}

interface AuthActions {
    login: (credentials: LoginCredentials) => Promise<void>
    register: (credentials: RegisterCredentials) => Promise<void>
    logout: () => void
    checkAuth: () => Promise<void>
    clearError: () => void
    setLoading: (loading: boolean) => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
    devtools(
        persist(
            (set, get) => ({
                // State
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,

                // Actions
                login: async (credentials: LoginCredentials) => {
                    try {
                        set({ isLoading: true, error: null })

                        const response = await apiClient.post<AuthResponse>('/auth/login', credentials)

                        if (response.success && response.data) {
                            const { user, token } = response.data

                            // Сохраняем токен в API клиенте
                            apiClient.setToken(token)

                            set({
                                user,
                                token,
                                isAuthenticated: true,
                                isLoading: false,
                                error: null
                            })
                        } else {
                            throw new Error(response.error || 'Ошибка авторизации')
                        }
                    } catch (error: any) {
                        const errorMessage = error.response?.data?.error || error.message || 'Ошибка авторизации'
                        set({
                            isLoading: false,
                            error: errorMessage,
                            isAuthenticated: false,
                            user: null,
                            token: null
                        })
                        throw new Error(errorMessage)
                    }
                },

                register: async (credentials: RegisterCredentials) => {
                    try {
                        set({ isLoading: true, error: null })

                        const response = await apiClient.post<AuthResponse>('/auth/register', credentials)

                        if (response.success && response.data) {
                            const { user, token } = response.data

                            // Сохраняем токен в API клиенте
                            apiClient.setToken(token)

                            set({
                                user,
                                token,
                                isAuthenticated: true,
                                isLoading: false,
                                error: null
                            })
                        } else {
                            throw new Error(response.error || 'Ошибка регистрации')
                        }
                    } catch (error: any) {
                        const errorMessage = error.response?.data?.error || error.message || 'Ошибка регистрации'
                        set({
                            isLoading: false,
                            error: errorMessage,
                            isAuthenticated: false,
                            user: null,
                            token: null
                        })
                        throw new Error(errorMessage)
                    }
                },

                logout: () => {
                    // Удаляем токен из API клиента
                    apiClient.removeToken()

                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: null
                    })
                },

                checkAuth: async () => {
                    try {
                        const { token } = get()

                        if (!token) {
                            set({ isAuthenticated: false, user: null })
                            return
                        }

                        set({ isLoading: true })

                        // Устанавливаем токен в API клиенте
                        apiClient.setToken(token)

                        const response = await apiClient.get<User>('/auth/profile')

                        if (response.success && response.data) {
                            set({
                                user: response.data,
                                isAuthenticated: true,
                                isLoading: false,
                                error: null
                            })
                        } else {
                            throw new Error('Недействительный токен')
                        }
                    } catch (error: any) {
                        console.error('Auth check failed:', error)
                        // Очищаем состояние при неудачной проверке
                        apiClient.removeToken()
                        set({
                            user: null,
                            token: null,
                            isAuthenticated: false,
                            isLoading: false,
                            error: null
                        })
                    }
                },

                clearError: () => {
                    set({ error: null })
                },

                setLoading: (loading: boolean) => {
                    set({ isLoading: loading })
                }
            }),
            {
                name: 'auth-storage',
                partialize: (state) => ({
                    user: state.user,
                    token: state.token,
                    isAuthenticated: state.isAuthenticated
                }),
                onRehydrateStorage: () => {
                    return (state) => {
                        if (state?.token) {
                            apiClient.setToken(state.token)
                        }
                    }
                }
            }
        ),
        {
            name: 'auth-store'
        }
    )
)